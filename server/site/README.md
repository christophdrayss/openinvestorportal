# Server-rendered site pages (SEO)

Every public HTML page except the JSON API is rendered here, from registry data, on each request.
The same page list drives the live server (`server/index.mjs` calls `handleSite`), the sitemap,
and the static export (`npm run build-site` writes `dist/site/`).

## Contract

Each page module exports `async function pages(ctx)` returning an array of:

```js
{ path: "/portals/efront",         // no trailing slash
  render: () => htmlString,        // lazy; called per request
  type: "text/html",               // default; or "image/svg+xml", "application/xml", "text/plain"
  lastmod: "2026-11-07",           // for the sitemap
  priority: 0.8,                   // for the sitemap, 0..1
  sitemap: true }                  // default true for HTML; false to leave out
```

`ctx` comes from `context.mjs`: `portals`, `byId`, `assessments`, `deployments`, `summaries`,
`summaryById`, `latest`, `hasLogo(id)`, `root`. Render HTML through `layout()` in `layout.mjs` and
reuse its helpers: `esc`, `pill`, `diffBadge`, `logoImg`, `portalLink`, `extLink`, `breadcrumbs`,
`breadcrumbLd`, `faq`, `faqLd`, `STATUS_LABEL`, `CATEGORY_LABEL`, `DIFFICULTY_LABEL`. Shared styles
live in `server/public/content.css` (`.page-head`, `.prose`, `.facts`, `.callout`, `.channels`,
`.cmp`, `.cards`, `.link-card`, `.related`, `.sources`, `.az`). Page-specific CSS goes in the
`css` option of `layout()`, kept small.

## URL map and file ownership

| Paths | File |
|---|---|
| `/`, `/vaults` | `home.mjs` (server-renders the registry table into `server/public/index.html`) |
| `/portals`, `/portals/{id}`, `/portals/category/{category}` | `portal-pages.mjs` |
| `/administrators`, `/administrators/{slug}` | `admin-pages.mjs`, `admins.mjs` (name normalisation, `adminPath()`) |
| `/compare`, `/compare/{a}-vs-{b}` | `compare-pages.mjs`, `compare-pairs.mjs` (`PAIRS`, `comparePath()`, `pairsFor()`) |
| `/guides`, `/guides/{slug}` | `guide-pages.mjs` (index), one module per guide in `guides/` |
| `/badge`, `/badge/{id}.svg` | `badge.mjs` (`badgeSnippet(entry)` for portal pages) |
| `/sitemap.xml`, `/robots.txt`, `/llms.txt` | `technical.mjs` |

Guide slugs (fixed, link to them freely):
`how-to-choose-an-investor-portal`, `investor-portals-with-api-and-mcp`,
`automate-capital-call-notices`, `canoe-alternatives`, `data-rooms-compared`,
`partner-only-portal-access-explained`.

## Editorial rules

- **Neutral and factual.** The registry only works if vendors trust it. Never "best", "top",
  "winner", rankings or scores beyond the registry's own difficulty rating. Say "compared", "options",
  "what each offers".
- **Facts come from the registry or a cited source.** Do not invent features, prices, customer counts
  or dates. If the registry says `unknown`, say unknown. Entries are community research and mostly
  unverified: say so where it matters, and invite vendors to correct their entry.
- **Never look like the vendor.** No page titled "X login", no vendor logo as a hero, no copy that
  could pass as the vendor's own page. Use "X investor portal access", "X API and document access".
  Visible note on vendor pages: not affiliated with the vendor.
- **No personal or fund figures.** Funds named in deployments are fine; amounts, NAVs, investor names
  are not.
- **Style.** Plain US English, short sentences, enterprise tone, no hype, no exclamation marks, no
  emoji. Write for two readers: an investor operations lead (LP) who wants documents programmatically,
  and a portal operator or fund manager evaluating software.
- **SEO basics per page.** One `<h1>`. Title about 50 to 60 characters and unique. Meta description
  120 to 160 characters and unique. Descriptive internal links (not "click here"). Breadcrumbs plus
  `breadcrumbLd`. Relevant schema.org JSON-LD. Real content: thin pages hurt the whole site.

## Checking your work

```sh
node scripts/render-page.mjs --list /portals     # list paths
node scripts/render-page.mjs /portals/efront     # print one page
node scripts/render-page.mjs --all /portals      # render all under a prefix, report SEO problems
```

The dev server runs with `node --watch` on http://localhost:4310 and reloads on file changes.
Do not restart it, and do not run `build-site` (it rewrites `dist/` that others may be reading).
