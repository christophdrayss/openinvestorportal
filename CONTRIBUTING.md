# Contributing

## Adding or updating a portal

1. One file per portal at `registry/portals/<id>.json`. The `id` is a lowercase slug and must equal the filename.
2. Validate locally: `npm install && npm run check`.
3. Open a PR. Describe the source of each fact (vendor docs URL, your own account, vendor email).

## Verification levels

| Level | Who sets it | Requirement |
|---|---|---|
| `unverified` | Anyone | Default for new entries. |
| `community-verified` | Maintainer | Maintainer confirmed public facts (docs URLs resolve, login URL works). Set `verified_by` and `verified_at`. |
| `vendor-verified` | Maintainer | PR author uses an email on the vendor's domain, or vendor adds a DNS TXT record `_openinvestorportal.<vendor-domain>` containing the entry `id`. Link the proof in `verification.proof`. |

## Rules

- Record what exists, not what you wish existed. Use `unknown` freely.
- No credentials, internal URLs, or non-public endpoints.
- Do not describe techniques for circumventing a portal's terms of service. `automation_friendly` records whether consented automation works, nothing more.
- Keep `notes` factual and short.

## Logos

`scripts/fetch-logos.mjs` downloads each vendor's favicon into `server/public/logos/<id>.png`. Logos are shown small, unmodified and only next to the factual registry entry, to identify the product. They are not used on marketing pages. A trademark owner who wants their logo removed or replaced opens an issue or pull request and the maintainers do it without discussion.
