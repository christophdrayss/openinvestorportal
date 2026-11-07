# OpenInvestorPortal

**The open registry of investor portal access.** One JSON entry per portal describing how LPs, fund administrators and their AI agents can get data out of it: web login, API, MCP server, SFTP, webhooks, email alerts, export formats, supported standards, and how to reach the vendor's developer team.

Think "caniuse" for LP portals today, and the routing layer ("OpenRouter for investor portals") tomorrow.

## Why

An LP with 30 fund positions logs into 15 different portals. Fund administrators do this for hundreds of clients. Almost none of these portals publish a public API, and there is no single place that says which ones do, what they expose, or whether an MCP server exists. The official MCP Registry covers every industry and lists only servers that someone has published. This registry fills the gap for one vertical by recording the state of access for *every* portal, including "none" and "unknown".

## Run locally

```
npm install
npm run dev      # http://localhost:4310  landing page, REST API, MCP endpoint at /mcp
npm run check    # validate entries, rebuild dist/index.json and the table below
```

Connect an MCP client to `http://localhost:4310/mcp` to query the registry with `search_portals` and `get_portal`.

## How it works

- `registry/portals/<id>.json` – one entry per portal, validated against `schema/portal.schema.json`.
- `dist/index.json` – generated summary index for tooling (built by `npm run build`).
- Every fact carries a verification level: `unverified`, `community-verified`, or `vendor-verified`.
- Vendors register or correct their own entry by pull request.
- `docs/ARCHITECTURE.md` explains the trust model: the platform brokers one handshake, then investor and portal talk peer to peer with signed requests. `spec/oipp-portal-api.yaml` is the draft of the API every portal implements. A PR from a vendor-owned domain or a DNS TXT proof upgrades the entry to `vendor-verified`.

## Registry

<!-- registry:start -->
| Portal | Category | API | MCP | SFTP | Verified |
|---|---|---|---|---|---|
| [Addepar Client Portal](registry/portals/addepar-client-portal.json) | reporting-platform | available | beta | unknown | unverified |
| [Allocate](registry/portals/allocate.json) | marketplace | unknown | partner-only | unknown | unverified |
| [Allvue Investor Portal](registry/portals/allvue-investor-portal.json) | lp-portal | partner-only | unknown | unknown | unverified |
| [Alter Domus CorPro](registry/portals/alter-domus-corpro.json) | fund-admin-portal | partner-only | unknown | unknown | unverified |
| [Alto (Alto IRA)](registry/portals/alto.json) | marketplace | partner-only | none | unknown | unverified |
| [Altvia ShareSecure](registry/portals/altvia-sharesecure.json) | lp-portal | unknown | partner-only | unknown | unverified |
| [AngelList (Venture)](registry/portals/angellist-venture.json) | lp-portal | planned | available | none | unverified |
| [Ansarada Data Room](registry/portals/ansarada.json) | data-room | unknown | partner-only | unknown | unverified |
| [Arch](registry/portals/arch.json) | reporting-platform | available | none | partner-only | unverified |
| [Backstop Client Portal](registry/portals/backstop-client-portal.json) | lp-portal | partner-only | unknown | unknown | unverified |
| [Brainloop Secure Dataroom](registry/portals/brainloop.json) | data-room | unknown | unknown | unknown | unverified |
| [bunch](registry/portals/bunch.json) | lp-portal | none | none | unknown | unverified |
| [CAIS](registry/portals/cais.json) | marketplace | partner-only | beta | unknown | unverified |
| [CapInteract LP Interact](registry/portals/capinteract-lp-interact.json) | lp-portal | unknown | unknown | unknown | unverified |
| [Carta LP Portal](registry/portals/carta.json) | lp-portal | partner-only | available | partner-only | unverified |
| [Cash Flow Portal](registry/portals/cash-flow-portal.json) | lp-portal | unknown | partner-only | unknown | unverified |
| [Chronograph LP](registry/portals/chronograph-lp.json) | reporting-platform | partner-only | available | unknown | unverified |
| [CitcoOne](registry/portals/citcoone.json) | fund-admin-portal | unknown | unknown | unknown | unverified |
| [CSC ViewPoint](registry/portals/csc-viewpoint.json) | fund-admin-portal | unknown | unknown | unknown | unverified |
| [Datasite Diligence](registry/portals/datasite.json) | data-room | available | partner-only | unknown | unverified |
| [Digify Data Room](registry/portals/digify.json) | data-room | available | unknown | unknown | unverified |
| [Dropbox DocSend Spaces (data rooms)](registry/portals/docsend.json) | data-room | unknown | beta | unknown | unverified |
| [Drooms Virtual Data Room](registry/portals/drooms.json) | data-room | unknown | unknown | unknown | unverified |
| [Dynamo Investor Portal](registry/portals/dynamo-investor-portal.json) | lp-portal | partner-only | unknown | unknown | unverified |
| [eFront Investment Café](registry/portals/efront-investment-cafe.json) | lp-portal | partner-only | unknown | unknown | unverified |
| [Finventions Investment Portal](registry/portals/finventions-investment-portal.json) | fund-admin-portal | none | none | unknown | unverified |
| [Firmex Virtual Data Room](registry/portals/firmex.json) | data-room | unknown | unknown | unknown | unverified |
| [FIS Digital Data Exchange](registry/portals/fis-digital-data-exchange.json) | lp-portal | partner-only | unknown | unknown | unverified |
| [Flow Investor Portal](registry/portals/flow.json) | lp-portal | partner-only | unknown | unknown | unverified |
| [FundPanel Investor Portal (Aduro Advisors)](registry/portals/fundpanel.json) | fund-admin-portal | unknown | unknown | unknown | unverified |
| [Fundrbird Investor Portal](registry/portals/fundrbird.json) | lp-portal | partner-only | unknown | unknown | unverified |
| [Gen II Sensr Portal](registry/portals/gen-ii-sensr-portal.json) | fund-admin-portal | unknown | unknown | unknown | unverified |
| [Goji](registry/portals/goji.json) | other | unknown | unknown | unknown | unverified |
| [iCapital](registry/portals/icapital.json) | marketplace | partner-only | none | unknown | unverified |
| [Ideals Virtual Data Room](registry/portals/ideals-vdr.json) | data-room | partner-only | available | unknown | unverified |
| [SS&C Intralinks FundCentre](registry/portals/intralinks-fundcentre.json) | lp-portal | partner-only | unknown | unknown | unverified |
| [Intralinks VDRPro](registry/portals/intralinks-vdrpro.json) | data-room | partner-only | unknown | unknown | unverified |
| [InvestorFlow Investor Portal](registry/portals/investorflow-investor-portal.json) | lp-portal | unknown | unknown | unknown | unverified |
| [IQ-EQ Cosmos](registry/portals/iq-eq-cosmos.json) | fund-admin-portal | unknown | unknown | unknown | unverified |
| [Juniper Square Investor Portal](registry/portals/juniper-square.json) | lp-portal | partner-only | beta | partner-only | unverified |
| [LIQID](registry/portals/liqid.json) | marketplace | none | none | none | unverified |
| [Moonfare](registry/portals/moonfare.json) | marketplace | partner-only | none | unknown | unverified |
| [MSCI Private i (Burgiss)](registry/portals/msci-private-i.json) | reporting-platform | partner-only | unknown | unknown | unverified |
| [NAO](registry/portals/nao.json) | marketplace | none | none | none | unverified |
| [netfiles Datenraum](registry/portals/netfiles.json) | data-room | unknown | unknown | unknown | unverified |
| [Odin](registry/portals/odin.json) | lp-portal | unknown | none | unknown | unverified |
| [Papermark](registry/portals/papermark.json) | data-room | available | available | none | unverified |
| [Privatize](registry/portals/privatize.json) | marketplace | unknown | none | unknown | unverified |
| [Quantium Investor Portal](registry/portals/quantium.json) | lp-portal | partner-only | unknown | unknown | unverified |
| [Republic](registry/portals/republic.json) | marketplace | none | none | none | unverified |
| [Roundtable](registry/portals/roundtable.json) | lp-portal | unknown | none | unknown | unverified |
| [Securitize](registry/portals/securitize.json) | marketplace | available | available | unknown | unverified |
| [SmartRoom Virtual Data Room](registry/portals/smartroom.json) | data-room | unknown | unknown | unknown | unverified |
| [S&P Global iLEVEL](registry/portals/sp-global-ilevel.json) | reporting-platform | partner-only | partner-only | unknown | unverified |
| [SS&C Investor Services Portal (GlobeOp)](registry/portals/ssc-globeop-investor-portal.json) | fund-admin-portal | unknown | unknown | unknown | unverified |
| [+SUBSCRIBE](registry/portals/subscribe.json) | marketplace | partner-only | none | unknown | unverified |
| [Sydecar](registry/portals/sydecar.json) | lp-portal | unknown | none | unknown | unverified |
| [Titanbay](registry/portals/titanbay.json) | marketplace | partner-only | none | unknown | unverified |
| [Universal Investment PowerPortal](registry/portals/universal-investment-powerportal.json) | fund-admin-portal | unknown | none | unknown | unverified |
| [Vauban (Carta Fund Administration, UK/EU)](registry/portals/vauban-carta.json) | lp-portal | partner-only | available | unknown | unverified |
| [Vistra VFunds](registry/portals/vistra-vfunds.json) | fund-admin-portal | unknown | unknown | unknown | unverified |
| [Yardi Investment Manager](registry/portals/yardi-investment-manager.json) | lp-portal | unknown | unknown | unknown | unverified |
| [Yieldstreet (Willow Wealth)](registry/portals/yieldstreet.json) | marketplace | none | none | none | unverified |
<!-- registry:end -->

Status values: `available` (documented, self-serve), `partner-only` (exists, needs an agreement), `beta`, `planned`, `none` (confirmed absent), `unknown` (nobody has checked).

## Register your portal

1. Copy `schema/example.json` to `registry/portals/<your-id>.json`.
2. Fill in what you offer. Use `unknown` rather than guessing.
3. Run `npm install && npm run check`.
4. Open a pull request. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Roadmap

1. **Registry** (now): schema, seed entries, validation, generated index.
2. **Coverage**: every portal used by DACH and European LPs, with community verification.
3. **Router**: a single MCP server that reads this registry and routes `list_documents`, `get_capital_calls`, `get_capital_account` to each portal's connector, with the LP's own credentials.
4. **Vendor program**: DNS-based vendor verification and a badge for portals with an open API or MCP server.

## License

Code: MIT. Registry data (`registry/`): CC0 1.0.
