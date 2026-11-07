// Landing page (/) and Managed Vaults page (/vaults).
// Both pages are hand-written HTML in server/public/. This module fills their placeholder markers:
//   <!--SEO_HEAD-->   canonical, Open Graph, Twitter and JSON-LD
//   <!--NAV-->        nav bar built from NAV in layout.mjs
//   <!--REG_COUNT-->  "N portals · " in the registry kicker (index.html only)
//   <!--REG_ROWS-->   server-rendered registry rows, default order (index.html only)
//   <!--REG_DATA-->   the same rows as JSON for client-side sorting and search (index.html only)
// The row markup must stay in sync with the render() template in index.html.
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { SITE_NAME, apiPath } from "./context.mjs";
import { esc, abs, LOGO_SVG, EXT_ICON, NAV, breadcrumbLd, faqLd } from "./layout.mjs";

const decode = (s) =>
  String(s)
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();

const ldScript = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`;

const ORG_ID = abs("/#organization");
const organization = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORG_ID,
  name: SITE_NAME,
  url: abs("/"),
  logo: { "@type": "ImageObject", url: abs("/icon-512.png"), width: 512, height: 512 },
  email: "hello@openinvestorportal.org",
  description: "Open registry and peer-to-peer protocol for investor portal access.",
});
const orgRef = { "@type": "Organization", "@id": ORG_ID, name: SITE_NAME, url: abs("/") };

/** Canonical, Open Graph, Twitter and JSON-LD for a static page. Title and description are read from the HTML. */
function seoHead(html, path, jsonld) {
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? SITE_NAME;
  const desc = html.match(/<meta name="description" content="([^"]*)">/)?.[1] ?? "";
  const url = esc(abs(path));
  const img = esc(abs("/og.png"));
  return [
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${SITE_NAME}">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${desc}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${img}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${SITE_NAME}: The Unified Interface for Every Investor Portal.">`,
    `<meta property="og:locale" content="en_US">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${desc}">`,
    `<meta name="twitter:image" content="${img}">`,
    ...jsonld.map(ldScript),
  ].join("\n");
}

/** Nav bar from NAV. On the landing page, links into the landing page become in-page anchors. */
function nav({ onHome = false, active = "" } = {}) {
  const items = NAV.map(([href, label]) => {
    const h = onHome && href.startsWith("/#") ? href.slice(1) : href;
    const cur = href === active ? ' aria-current="page" style="color:var(--ink)"' : "";
    return `    <li><a href="${esc(h)}"${cur}>${esc(label)}</a></li>`;
  }).join("\n");
  return `<nav><div class="wrap">
  <a class="logo" href="/">${LOGO_SVG}${SITE_NAME}</a>
  <ul>
${items}
  </ul>
</div></nav>`;
}

// ---------- registry table (landing page) ----------
const rowPill = (v) => `<span class="pill ${esc(v)}">${esc(v)}</span>`;
const rowHtml = (p) => `<tr>
      <td><a class="pname" href="/portals/${esc(p.id)}">${
        p.logo ? `<img class="plogo" src="${esc(p.logo)}" alt="" loading="lazy">` : `<span class="plogo ph">${esc(p.name[0])}</span>`
      }${esc(p.name)}</a></td><td>${esc(p.vendor)}</td><td style="color:var(--muted)">${esc(p.category)}</td>
      <td>${rowPill(p.api)}</td><td>${rowPill(p.mcp)}</td><td>${rowPill(p.sftp)}</td><td>${
        p.difficulty ? `<span class="diff d${p.difficulty}" title="1 easy, 5 hard">${p.difficulty} / 5</span>` : `<span class="pill unknown">unrated</span>`
      }</td><td><a class="visit" href="${esc(p.website)}" target="_blank" rel="noopener noreferrer">Visit ${EXT_ICON}</a></td></tr>`;

// Same default order as the client: name ascending, case-insensitive.
const byName = (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) || a.name.localeCompare(b.name);

const VARIABLES = [
  ["Category", "Portal type: LP portal, fund administrator portal, data room, cap table, marketplace, reporting platform, other."],
  ["Vendor", "Company that builds the portal software, with website and country."],
  ["Regions", "Regions where the portal is offered."],
  ["Asset classes", "Asset classes the portal serves."],
  ["Web login access", "Web login status, SSO and MFA methods, automation friendliness."],
  ["API access status", "available, beta, partner-only, planned, none or unknown, with style, auth methods and documentation links."],
  ["MCP server status", "Whether a Model Context Protocol server exists for the portal, and who maintains it."],
  ["SFTP status", "Whether documents or data can be delivered by SFTP."],
  ["Webhooks status", "Whether the portal sends event notifications by webhook."],
  ["Email notifications status", "Whether the portal sends email alerts for new documents."],
  ["Export formats", "File formats investors can export, such as PDF, XLSX, CSV or the ILPA templates."],
  ["Capabilities", "Data exposed to investors: documents, capital calls, distributions, capital account statements, NAV and more."],
  ["Supported standards", "Standards the portal supports, such as OAuth 2 or the ILPA reporting templates."],
  ["Automation policy", "What the portal terms say about consented automated access: permitted, tolerated, prohibited or unknown."],
  ["OIPP status", "Support for the Open Investor Portal Protocol."],
  ["Verification status", "unverified, community-verified or vendor-verified."],
];

function datasetLd(ctx) {
  const n = ctx.portals.length;
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": abs("/#dataset"),
    name: "Investor Portal Registry",
    alternateName: "OpenInvestorPortal registry",
    description:
      `An open registry of ${n} investor portals used in private markets: LP portals, fund administrator portals, data rooms and reporting platforms. ` +
      "One record per portal describes how limited partners, fund administrators and their AI agents can reach documents and data: web login, API, MCP server, SFTP, webhooks, " +
      "email notifications, export formats, supported standards, what the terms say about automation, and an access difficulty rating from 1 (documented self-serve API) to 5 (web login with MFA only). " +
      "Entries are community research from public vendor documentation and are mostly unverified. Vendors can correct their entry by pull request.",
    url: abs("/portals"),
    license: "https://creativecommons.org/publicdomain/zero/1.0/",
    isAccessibleForFree: true,
    inLanguage: "en",
    creator: orgRef,
    publisher: orgRef,
    dateModified: ctx.latest,
    keywords: [
      "investor portal",
      "LP portal",
      "limited partners",
      "fund administration",
      "private equity",
      "venture capital",
      "private markets",
      "virtual data room",
      "investor reporting",
      "capital calls",
      "API",
      "Model Context Protocol",
      "MCP",
      "SFTP",
      "ILPA",
    ],
    measurementTechnique: "Community research from public vendor documentation, developer portals and terms of use",
    variableMeasured: [
      ...VARIABLES.map(([name, description]) => ({ "@type": "PropertyValue", name, description })),
      {
        "@type": "PropertyValue",
        name: "Access difficulty",
        description: "How hard it is to reach documents programmatically today, 1 easy to 5 hard.",
        minValue: 1,
        maxValue: 5,
      },
    ],
    distribution: [
      {
        "@type": "DataDownload",
        name: "Registry summary, JSON API",
        encodingFormat: "application/json",
        contentUrl: abs(apiPath("/v1/portals")),
      },
      {
        "@type": "DataDownload",
        name: "JSON Schema for registry entries",
        encodingFormat: "application/schema+json",
        contentUrl: abs("/schema/portal.schema.json"),
      },
      {
        "@type": "DataDownload",
        name: "Full registry as Markdown",
        encodingFormat: "text/markdown",
        contentUrl: abs("/llms-full.txt"),
      },
    ],
  };
}

function renderHome(ctx) {
  let html = readFileSync(join(ctx.root, "server/public/index.html"), "utf8");
  const rows = [...ctx.summaries].sort(byName);
  const data = {
    portals: rows.map(({ id, name, vendor, category, api, mcp, sftp, difficulty, website, logo }) => ({
      id, name, vendor, category, api, mcp, sftp, difficulty, website, logo,
    })),
  };
  const jsonld = [
    organization(),
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": abs("/#website"),
      name: SITE_NAME,
      url: abs("/"),
      description: "Open registry and peer-to-peer protocol for investor portal access.",
      inLanguage: "en",
      publisher: orgRef,
    },
    datasetLd(ctx),
  ];
  return html
    .replace("<!--SEO_HEAD-->", () => seoHead(html, "/", jsonld))
    .replace("<!--NAV-->", () => nav({ onHome: true }))
    .replace("<!--REG_COUNT-->", () => `${rows.length} portals · `)
    .replace("<!--REG_ROWS-->", () => rows.map(rowHtml).join("") || '<tr><td colspan="8" style="color:var(--muted)">No match.</td></tr>')
    .replace("<!--REG_DATA-->", () => JSON.stringify(data).replace(/</g, "\\u003c"));
}

function renderVaults(ctx) {
  const html = readFileSync(join(ctx.root, "server/public/vaults.html"), "utf8");
  const qa = [...html.matchAll(/<details><summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p><\/details>/g)].map((m) => ({
    q: decode(m[1]),
    a: decode(m[2]),
  }));
  const desc = decode(html.match(/<meta name="description" content="([^"]*)">/)?.[1] ?? "");
  const jsonld = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": abs("/vaults#service"),
      name: "Managed Portal Vaults",
      serviceType: "Managed investor portal access and document delivery",
      description: desc,
      url: abs("/vaults"),
      provider: { ...orgRef, logo: abs("/icon-512.png") },
      audience: {
        "@type": "BusinessAudience",
        audienceType: "Family offices, fund-of-funds teams, insurers, pension funds and fund administrators",
      },
      category: "Investor operations",
    },
    faqLd(qa),
    breadcrumbLd([{ name: "Managed Vaults", path: "/vaults" }]),
  ];
  return html.replace("<!--SEO_HEAD-->", () => seoHead(html, "/vaults", jsonld)).replace("<!--NAV-->", () => nav({ active: "/vaults" }));
}

const fileDate = (ctx, name) => statSync(join(ctx.root, "server/public", name)).mtime.toISOString().slice(0, 10);

export async function pages(ctx) {
  const homeDate = [ctx.latest, fileDate(ctx, "index.html")].sort().at(-1);
  return [
    { path: "/", render: () => renderHome(ctx), priority: 1, lastmod: homeDate },
    { path: "/vaults", render: () => renderVaults(ctx), priority: 0.6, lastmod: fileDate(ctx, "vaults.html") },
  ];
}
