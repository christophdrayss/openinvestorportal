// Technical files: /sitemap.xml, /robots.txt, /llms.txt (llmstxt.org format) and /llms-full.txt.
// pages(ctx, contentPages) receives every content page so the sitemap and llms.txt track what exists.
// None of these files are listed in the sitemap.
import { SITE_NAME, STATIC_EXPORT, apiPath } from "./context.mjs";
import { abs, STATUS_LABEL, CATEGORY_LABEL, DIFFICULTY_LABEL } from "./layout.mjs";

const xmlEsc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const decode = (s) =>
  String(s ?? "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const isHtml = (p) => (p.type ?? "text/html") === "text/html";
const status = (s) => STATUS_LABEL[s] ?? s ?? "Unknown";
const lcFirst = (s) => (/^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);
const md = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

const GUIDES = [
  "how-to-choose-an-investor-portal",
  "investor-portals-with-api-and-mcp",
  "automate-capital-call-notices",
  "canoe-alternatives",
  "data-rooms-compared",
  "partner-only-portal-access-explained",
];

/** Title and description of a rendered page, without the site-name suffix. */
function meta(page) {
  try {
    const html = page.render();
    const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "").replace(/\s*[|—-]\s*OpenInvestorPortal$/, "");
    const desc = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "");
    return { title, desc };
  } catch {
    return { title: "", desc: "" };
  }
}
const humanize = (slug) => slug.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

function sitemap(ctx, content) {
  const urls = content
    .filter((p) => isHtml(p) && p.sitemap !== false)
    .map(
      (p) =>
        `  <url><loc>${xmlEsc(abs(p.path))}</loc><lastmod>${xmlEsc(p.lastmod ?? ctx.latest)}</lastmod><priority>${(p.priority ?? 0.5).toFixed(1)}</priority></url>`
    );
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
}

const robots = () => `User-agent: *
Allow: /
Disallow: /mcp

Sitemap: ${abs("/sitemap.xml")}
`;

function portalLine(ctx, e) {
  const s = ctx.summaryById.get(e.id);
  const d = s?.difficulty ? ` Access difficulty ${s.difficulty} of 5.` : " Access difficulty not rated.";
  return `- [${md(e.name)}](${abs(`/portals/${e.id}`)}): ${md(e.vendor?.name)} ${lcFirst(CATEGORY_LABEL[e.category] ?? e.category)}. API ${status(
    s?.api
  ).toLowerCase()}, MCP ${status(s?.mcp).toLowerCase()}, SFTP ${status(s?.sftp).toLowerCase()}.${d}`;
}

function llms(ctx, content) {
  const byPath = new Map(content.map((p) => [p.path, p]));
  const link = (path, fallbackTitle, fallbackDesc = "") => {
    const p = byPath.get(path);
    const m = p ? meta(p) : { title: "", desc: "" };
    const t = m.title || fallbackTitle;
    const d = m.desc || fallbackDesc;
    return `- [${md(t)}](${abs(path)})${d ? `: ${md(d)}` : ""}`;
  };
  const under = (prefix) => content.filter((p) => isHtml(p) && p.path.startsWith(prefix) && p.path !== prefix.replace(/\/$/, ""));
  const portals = [...ctx.portals].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  const categoryPages = under("/portals/category/");
  const comparePages = under("/compare/");

  return `# ${SITE_NAME}

> ${SITE_NAME} is an open registry and peer-to-peer protocol for investor portal access. The registry has one record per investor portal (${ctx.portals.length} today: LP portals, fund administrator portals, data rooms and reporting platforms) describing how limited partners, fund administrators and their AI agents can reach documents and data: web login, API, MCP server, SFTP, webhooks, export formats, terms on automation, and an access difficulty rating from 1 to 5. Data is CC0, code is MIT.

Entries are community research from public vendor documentation and are mostly unverified. Status values: available (documented and self-serve), beta, partner-only (needs a commercial agreement), planned, none (confirmed absent), unknown (not checked yet). Difficulty runs from 1 (${lcFirst(DIFFICULTY_LABEL[1])}) to 5 (${lcFirst(DIFFICULTY_LABEL[5])}). The registry is not affiliated with any listed vendor. Registry last updated ${ctx.latest}.

## Key pages

- [Home](${abs("/")}): what the registry and the protocol (OIPP) are, and the registry table
- [Investor portal registry](${abs("/portals")}): every portal with its access channels
- [Comparisons](${abs("/compare")}): side-by-side comparisons of investor portals
- [Guides](${abs("/guides")}): guides for investor operations teams and portal operators
- [Fund administrators](${abs("/administrators")}): administrators and the portals they run
- [Badges](${abs("/badge")}): embeddable registry badges for portal operators
- [Managed Portal Vaults](${abs("/vaults")}): optional paid service that holds portal keys and delivers documents

${STATIC_EXPORT ? `## JSON data (static files, CC0)

- [Portal summaries](${abs("/v1/portals.json")}): every portal with id, name, vendor, category, api, mcp, sftp, oipp, difficulty, verification, updated
- [One portal](${abs("/v1/portals/datasite.json")}): full registry entry plus known deployments, at /v1/portals/{id}.json
- [Deployments](${abs("/v1/deployments.json")}): funds and operators known to run each portal product
- [Portal entry JSON Schema](${abs("/schema/portal.schema.json")}): the schema every registry entry follows
- The filterable REST API and the MCP endpoint (tools search_portals and get_portal) run on the Node server in the source repository: npm start

` : `## JSON API

- [GET /v1/portals](${abs("/v1/portals")}): summary of every portal (id, name, vendor, category, api, mcp, sftp, oipp, difficulty, verification, updated). Filters: q, capability, region, channel (api, mcp, sftp, webhooks)
- [GET /v1/portals/{id}](${abs("/v1/portals/datasite")}): full registry entry for one portal plus known deployments, e.g. /v1/portals/datasite
- [GET /v1/deployments](${abs("/v1/deployments")}): funds and operators known to run each portal product. Filter: product
- [Portal entry JSON Schema](${abs("/schema/portal.schema.json")}): the schema every registry entry follows

## MCP

- [POST /mcp](${abs("/mcp")}): Model Context Protocol endpoint, streamable HTTP, stateless, no authentication. Tools: \`search_portals\` (query, capability, region, channel; returns portal summaries) and \`get_portal\` (id; returns the full registry entry)

`}## Guides

${GUIDES.map((g) => link(`/guides/${g}`, humanize(g))).join("\n")}
${categoryPages.length ? `\n## Portal categories\n\n${categoryPages.map((p) => link(p.path, humanize(p.path.split("/").pop()))).join("\n")}\n` : ""}${
    comparePages.length ? `\n## Comparisons\n\n${comparePages.map((p) => link(p.path, humanize(p.path.split("/").pop()))).join("\n")}\n` : ""
  }
## Portals

${portals.map((e) => portalLine(ctx, e)).join("\n")}

## Optional

- [Full registry as Markdown](${abs("/llms-full.txt")}): key access facts for every portal in one file
- [Sitemap](${abs("/sitemap.xml")}): every HTML page
`;
}

function channelLine(label, ch) {
  if (!ch) return `- ${label}: Unknown`;
  const extra = [];
  for (const [k, v] of Object.entries(ch)) {
    if (k === "status" || k === "notes" || v == null || v === "") continue;
    extra.push(`${k.replace(/_/g, " ")} ${Array.isArray(v) ? v.join(", ") : String(v)}`);
  }
  return `- ${label}: ${status(ch.status)}${extra.length ? ` (${extra.join("; ")})` : ""}${ch.notes ? `. ${md(ch.notes)}` : ""}`;
}

function portalFull(ctx, e) {
  const a = ctx.assessments[e.id];
  const deps = ctx.deployments.filter((d) => d.product === e.id);
  const acc = e.access ?? {};
  const L = [];
  L.push(`## ${md(e.name)}`, "");
  L.push(`- Registry id: \`${e.id}\``);
  L.push(`- Page: ${abs(`/portals/${e.id}`)}`);
  L.push(`- JSON: ${abs(apiPath(`/v1/portals/${e.id}`))}`);
  L.push(`- Vendor: ${md(e.vendor?.name)}${e.vendor?.country ? ` (${e.vendor.country})` : ""}${e.vendor?.website ? `, ${e.vendor.website}` : ""}`);
  L.push(`- Website: ${e.website}`);
  L.push(`- Category: ${CATEGORY_LABEL[e.category] ?? e.category}`);
  if (e.regions?.length) L.push(`- Regions: ${e.regions.join(", ")}`);
  if (e.asset_classes?.length) L.push(`- Asset classes: ${e.asset_classes.join(", ")}`);
  if (a?.difficulty) L.push(`- Access difficulty: ${a.difficulty} of 5, ${lcFirst(DIFFICULTY_LABEL[a.difficulty])}${a.rationale ? `. ${md(a.rationale)}` : ""}`);
  else L.push(`- Access difficulty: not rated`);
  L.push(channelLine("Web login", acc.web));
  L.push(channelLine("API", acc.api));
  L.push(channelLine("MCP server", acc.mcp));
  L.push(channelLine("SFTP", acc.sftp));
  L.push(channelLine("Webhooks", acc.webhooks));
  L.push(channelLine("Email notifications", acc.email_notifications));
  if (acc.export_formats?.length) L.push(`- Export formats: ${acc.export_formats.join(", ")}`);
  if (e.capabilities?.length) L.push(`- Capabilities: ${e.capabilities.join(", ").replace(/_/g, " ")}`);
  if (e.standards?.length) L.push(`- Standards: ${e.standards.join(", ")}`);
  if (e.terms) {
    L.push(
      `- Terms: automation policy ${e.terms.automation_policy ?? "unknown"}${e.terms.tos_url ? `, ${e.terms.tos_url}` : ""}${e.terms.notes ? `. ${md(e.terms.notes)}` : ""}`
    );
  }
  const c = e.contact ?? {};
  const contact = [c.developer_email, c.developer_portal, c.support_url].filter(Boolean);
  if (contact.length) L.push(`- Developer contact: ${contact.join(", ")}`);
  L.push(`- OIPP: ${status(e.oipp?.status ?? "unknown")}`);
  L.push(`- Verification: ${e.verification?.status ?? "unverified"}`);
  if (deps.length) L.push(`- Known deployments (${deps.length}): ${deps.map((d) => md(d.operator)).join(", ")}`);
  if (a?.sources?.length) L.push(`- Research sources: ${a.sources.join(", ")}`);
  if (e.notes) L.push(`- Notes: ${md(e.notes)}`);
  L.push(`- Updated: ${e.updated ?? "unknown"}`);
  return L.join("\n");
}

function llmsFull(ctx) {
  const portals = [...ctx.portals].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  return `# ${SITE_NAME} registry, full text

> Key access facts for all ${portals.length} investor portals in the ${SITE_NAME} registry, generated from the registry on each request. Data is CC0. Registry last updated ${ctx.latest}. JSON: ${abs(apiPath("/v1/portals"))}. Schema: ${abs("/schema/portal.schema.json")}.

Entries are community research from public vendor documentation and are mostly unverified. Status values: available (documented and self-serve), beta, partner-only (needs a commercial agreement), planned, none (confirmed absent), unknown (not checked yet). The registry is not affiliated with any listed vendor; vendors can correct their entry by pull request.

${portals.map((e) => portalFull(ctx, e)).join("\n\n")}
`;
}

export async function pages(ctx, contentPages = []) {
  return [
    { path: "/sitemap.xml", type: "application/xml", sitemap: false, render: () => sitemap(ctx, contentPages) },
    { path: "/robots.txt", type: "text/plain", sitemap: false, render: robots },
    { path: "/llms.txt", type: "text/plain", sitemap: false, render: () => llms(ctx, contentPages) },
    { path: "/llms-full.txt", type: "text/plain", sitemap: false, render: () => llmsFull(ctx) },
  ];
}
