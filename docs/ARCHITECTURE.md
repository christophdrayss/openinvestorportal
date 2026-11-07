# Architecture: one key, one API, every portal, no credential custody

## Goal

1. Every investor portal is listed in the registry (vendors are asked to join; the community fills the rest).
2. An investor registers once with OpenInvestorPortal and gets a cryptographic identity.
3. The investor links that identity to each portal account they already have.
4. From then on the investor (or their AI agent, or their fund administrator) uses **one API** to reach every linked portal.
5. OpenInvestorPortal never holds portal passwords, never holds portal tokens, and in the default mode never sees portal data.

This is OpenRouter's shape (one endpoint, one SDK, many providers) with Plaid's scope (one connector per institution) but with the opposite trust model: the platform is a **directory and standard**, not a credential vault.

## The three parties

| Party | Holds | Never holds |
|---|---|---|
| **Investor client** (CLI, SDK, local MCP server, fund-admin backend) | Investor private key, portal web credentials (only for fallback connectors, in the OS keychain) | Nothing of other investors |
| **Portal** (vendor) | Its own user accounts, the mapping `portal account -> investor public key` | Investor private key, platform credentials |
| **OpenInvestorPortal** (you) | Registry, investor public keys, link records (which investor id is linked to which portal), connector catalog, health telemetry | Passwords, OAuth tokens, private keys, portal data |

## Identity: "exchange a keypair"

Nobody exchanges a keypair. The investor generates a keypair locally and exchanges only the **public** key.

```
oip init
  -> generates Ed25519 keypair in OS keychain / HSM / KMS
  -> POST https://api.openinvestorportal.com/v1/investors { public_key }
  <- { investor_id: "oip:inv_7f3a...", key_id: "k1" }
```

Rotation: an investor can hold several keys under one `investor_id`; portals fetch the current key set from the platform's JWKS endpoint (`/v1/investors/{id}/jwks`) or pin the key they saw at link time. The platform is the key directory, which is the one trust role it has to play.

Fund administrators and family offices get one `investor_id` per legal entity they manage, each with its own key.

## Linking: the portal stays in control

The portal adds a "Connect with OpenInvestorPortal" button in its own UI, where the LP is already logged in. Flow:

```
Portal UI                         Investor client                     Platform
   |  show QR / link code  ----->       |                                 |
   |                                    |  sign(challenge) ------------>  |
   |                                    |                                 | verify, record link
   |  <----------------- webhook: link { investor_id, key, portal_account_ref }
   |  store investor_id + public key against the LP account
```

Alternative for portals without a UI budget: the portal exposes `POST /oipp/v1/links` and the LP pastes their `investor_id` into their profile; the portal verifies the key via the platform JWKS.

Properties:

- No password leaves the portal. No token is issued to the platform.
- The portal can revoke a link at any time. Revocation is pushed to the platform so the client stops routing there.
- The link is scoped: the portal decides which capabilities (documents, capital calls, statements) the link may read. Default is read-only.

## Access: one API, two routing modes

Both modes use the same request format. The investor client signs every request with its private key using **HTTP Message Signatures (RFC 9421)**: the signature covers method, target URL, date, a content digest, and a `nonce`. The portal verifies against the public key it stored at link time. This is the same idea as DPoP or AWS SigV4: a request can only come from the key holder and cannot be replayed or altered.

### Mode A: direct (default). Platform sees metadata, never data.

```
client -> platform:  GET /v1/me/links            (signed)
          <- [{ portal: "juniper-square", endpoint: "https://lp.junipersquare.com/oipp/v1", caps: [...] }, ...]
client -> portal:    GET /oipp/v1/documents?since=2026-01-01   (signed, Authorization: OIPP <investor_id>)
client -> portal 2:  ...
```

The SDK fans out, normalizes, merges. This is how Tailscale works: the coordination server knows who may talk to whom, the traffic goes point to point.

### Handshake only: how the platform leaves the data path

The platform must be needed for the handshake and not needed afterwards. Three pieces make that true:

1. **Link assertion (a certificate).** When a link is created, the platform signs a small JWT:

   ```json
   { "iss": "openinvestorportal", "sub": "oip:inv_7f3a", "aud": "juniper-square",
     "jwk": { ...investor public key... }, "scope": ["documents","capital_calls"],
     "iat": 1762500000, "exp": 1762586400, "jti": "lnk_91c2" }
   ```

   The client stores it. On every request the client sends the assertion plus its own RFC 9421 signature. The portal verifies both offline: the assertion against the platform's public key (fetched once from `/.well-known/jwks.json`, cached for days), the request signature against the key inside the assertion. No call to the platform per request.

2. **Short expiry plus a revocation list.** Assertions live 24 hours and the client renews them in the background. Revocations (investor lost a device, portal cut the link) go into a signed list the portal polls hourly. Worst case a revoked link works for one more hour, which matches how OAuth refresh tokens behave today.

3. **Client-side routing table.** `GET /v1/me/links` is called once and cached. The client talks to `endpoint` from the cached entry. If the platform is down, every existing link keeps working until its assertion expires.

Result: the platform is a certificate authority plus directory. It sees that investor X linked portal Y and when; it never sees a document, a statement or a request body.

```
  handshake (once)                         data (every day)
  client --sign challenge--> platform      client ---signed request + assertion---> portal
  platform --link webhook--> portal        portal --verify offline, return data---> client
  platform --assertion-----> client        platform: not in the path
```

**Push without a relay.** Portals want to notify LPs of new documents. Options in order of preference: (a) client polls `GET /oipp/v1/notifications?cursor=` directly, cheap and stateless; (b) the portal sends the platform a content-free ping `{ investor_id, portal, cursor }` and the platform forwards it over a WebSocket to the client, which then fetches directly. The ping carries no data, so even the relay sees nothing beyond "something changed".

**Investor behind NAT.** Portals are public web servers, so the investor client always initiates. True peer-to-peer hole punching is not needed; "peer to peer" here means client to portal with no middlebox.

### Mode B: gateway. One URL, still no credentials.

```
client -> gateway:   GET https://api.openinvestorportal.com/v1/portals/juniper-square/documents   (signed)
gateway -> portal:   forwards the request *with the original investor signature intact*
portal:              verifies the investor signature, not the gateway
```

The gateway cannot forge requests because it has no investor key. It cannot replay because of nonce and date. If a portal wants the gateway blind to content as well, it encrypts the response body to the investor public key (JWE); the gateway then only sees ciphertext. Mode B is a paid convenience for enterprises that want one IP to allow-list and central logging. Mode A is the open default.

"All traffic goes through my platform" is therefore satisfied at the level that matters for a standard: **discovery, identity, linking, health, and the connector catalog all go through you**, and anyone building on investor portals uses your SDK and your key format. Data and credentials never do.

## The standard: OIPP (Open Investor Portal Protocol)

A small REST surface every listed portal can implement in a few weeks, mirrored one-to-one as MCP tools:

| Resource | MCP tool | Notes |
|---|---|---|
| `GET /oipp/v1/accounts` | `list_accounts` | Investor's commitments on this portal (fund, vehicle, commitment, currency) |
| `GET /oipp/v1/documents` | `list_documents` | Filter by account, type, since; returns metadata |
| `GET /oipp/v1/documents/{id}/content` | `get_document` | Binary download, signed URL or stream |
| `GET /oipp/v1/capital-calls` | `list_capital_calls` | Payload aligned with the ILPA capital call template |
| `GET /oipp/v1/distributions` | `list_distributions` | ILPA distribution template |
| `GET /oipp/v1/capital-account-statements` | `list_capital_account_statements` | ILPA reporting template fields |
| `GET /oipp/v1/notifications` | `list_notifications` | What changed since a cursor; replaces email alerts |
| `GET /oipp/.well-known/oipp` | | Discovery document: version, auth methods, capabilities, JWKS |

Draft OpenAPI in `spec/oipp-portal-api.yaml`. The registry field `oipp` records each portal's status against this spec.

## Portals that do not join: the fallback connector

Most portals today have no API. Until they join, the investor can still use the same one API through a **local fallback connector** that drives the portal's web UI with the investor's own login. This is where "safe to scrape" matters.

Rules, enforced by the connector runtime and recorded in the registry:

1. **Runs only on the investor's own machine or VPC.** The platform distributes the connector, never runs it. Portal credentials live in the OS keychain of that machine.
2. **Consent and ownership.** The connector acts for the account holder, on the account holder's data, with the account holder's credentials. It never shares sessions between investors.
3. **Terms first.** The registry carries `terms.automation_policy`. On `prohibited` the connector refuses to run and tells the user to ask the vendor to join OIPP. On `unknown` it warns.
4. **Human does MFA.** The connector never stores or relays one-time codes. It pauses and asks the user.
5. **Read-only.** No clicks that change state: no acknowledgements, no e-signatures, no profile edits.
6. **Polite.** One session, serial requests, a fixed delay between page loads, no retries on 429 or 403, a daily cap per portal. Looks like one careful user, because it is one user.
7. **Identifiable.** User agent includes `OpenInvestorPortal-Connector/<version> (+https://openinvestorportal.com/connectors)` so vendors can see it and talk to you instead of blocking.
8. **Audit log.** Every fetch is logged locally with timestamp, URL, document id. The investor can hand that log to the vendor or an auditor.
9. **No evasion.** No CAPTCHA solving, no fingerprint spoofing, no proxy rotation, no cookie import from another browser profile. If a portal blocks, the connector stops. This rule is what lets you walk into a vendor meeting.
10. **Carrot.** Every fallback connector carries a banner: "This portal has not joined OIPP yet. Ask them: <link>." Vendors who join get the API route and lose the scraper.

The registry itself is also safe to scrape: it is public JSON under CC0, served with CORS and cache headers, with no personal data in it.

## What the platform runs (control plane)

- **Registry API**: this repo, served at `api.openinvestorportal.com`. Public, cached, CC0.
- **Investor directory**: `POST /v1/investors`, JWKS per investor, key rotation and revocation.
- **Link service**: challenge/response for linking, webhooks to portals, `GET /v1/me/links` for clients.
- **Connector catalog**: signed packages for official connectors (OIPP client, fallback connectors), version pinning.
- **Health**: anonymous success/failure/latency pings from clients per portal, shown as uptime in the registry.
- **Vendor verification**: DNS TXT proof, vendor-verified badge, listing in the official MCP Registry for portals with an MCP endpoint.
- **Gateway** (Mode B, optional, paid).

What it does not run: anything that touches an LP password, token or document in plaintext.

## Pitch to a vendor (the email you send)

> We are building the open registry and standard for investor portal access. LPs and fund administrators want one API across all their portals. We would like to list you. Listing is free, you control your entry, and we mark it vendor-verified. If you implement OIPP (a small read-only REST API, about 8 endpoints, investors authenticate with their own keys, no credentials or data pass through us) your LPs get programmatic access without anyone scraping your site. Until then we list what you offer today.

## Sequence of work

1. Registry live on a domain, 50+ portals listed, vendor outreach started. (This repo.)
2. OIPP 0.1 spec frozen, reference portal implementation (a fake portal) and reference client published.
3. Investor directory and link service.
4. Local MCP server for investors that speaks OIPP to joined portals and runs fallback connectors for the rest.
5. First two vendors live. Gateway mode for enterprise.
