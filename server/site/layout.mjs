// Shared HTML layout and helpers for all generated SEO pages. Every page module renders through layout().
import { SITE_URL, SITE_NAME, STATIC_EXPORT } from "./context.mjs";

export const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// Static hosts serve folders, so page URLs end in a slash there (avoids a redirect per link).
export const abs = (path) => SITE_URL + (STATIC_EXPORT ? withSlash(path) : path);
export const withSlash = (path) => (/^\/[^#?]*[^/.#?]$/.test(path) && !/\.[a-z0-9]+$/i.test(path) ? path + "/" : path);

export const LOGO_SVG = `<svg viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M14 7.07A8 8 0 0 1 14 20.93A8 8 0 0 1 14 7.07Z" fill="#9CAF88"/><circle cx="10" cy="14" r="8" stroke="#0b1220" stroke-width="2.2"/><circle cx="18" cy="14" r="8" stroke="#0b1220" stroke-width="2.2"/></svg>`;

export const EXT_ICON = `<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4 2h6v6M10 2 3 9" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// Human labels for access statuses (schema enum). Keep wording neutral and factual.
export const STATUS_LABEL = {
  available: "Available",
  beta: "Beta",
  "partner-only": "Partner only",
  planned: "Planned",
  none: "Not offered",
  unknown: "Unknown",
};
export const CATEGORY_LABEL = {
  "lp-portal": "LP portal",
  "fund-admin-portal": "Fund administrator portal",
  "data-room": "Data room",
  "cap-table": "Cap table",
  marketplace: "Marketplace",
  "reporting-platform": "Reporting platform",
  other: "Other",
};
export const DIFFICULTY_LABEL = {
  1: "Documented self-serve API an investor can use",
  2: "Partner or client API with some friction",
  3: "Exports, SFTP or email feeds, no investor-side API",
  4: "Web login only, exports possible",
  5: "Web login only with MFA, view only",
};

export const pill = (status) =>
  `<span class="pill ${esc(status ?? "unknown")}">${esc(STATUS_LABEL[status] ?? status ?? "Unknown")}</span>`;
export const diffBadge = (d) => (d ? `<span class="diff d${d}" title="1 easy, 5 hard">${d} / 5</span>` : `<span class="pill unknown">Unrated</span>`);
export const logoImg = (ctx, entry, size = 20) =>
  ctx.hasLogo(entry.id)
    ? `<img class="plogo" src="/logos/${esc(entry.id)}.png" alt="" width="${size}" height="${size}" loading="lazy">`
    : `<span class="plogo ph">${esc(entry.name[0])}</span>`;
export const extLink = (href, text = "Visit") =>
  `<a class="visit" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(text)} ${EXT_ICON}</a>`;
export const portalLink = (ctx, entry) => `<a class="pname" href="/portals/${esc(entry.id)}">${logoImg(ctx, entry)}${esc(entry.name)}</a>`;

/** Visible breadcrumb trail. items: [{ name, path }], the last item is the current page. */
export const breadcrumbs = (items) =>
  `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a>${items
    .map((it, i) =>
      i === items.length - 1 ? ` <span>/</span> <b>${esc(it.name)}</b>` : ` <span>/</span> <a href="${esc(it.path)}">${esc(it.name)}</a>`
    )
    .join("")}</nav>`;

export const breadcrumbLd = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [{ name: "Home", path: "/" }, ...items].map((it, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: it.name,
    item: abs(it.path),
  })),
});

/** FAQ block, visible, plus matching FAQPage JSON-LD via faqLd(). qa: [{ q, a }], plain-text answers. */
export const faq = (qa) =>
  `<div class="faq">${qa.map(({ q, a }) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div>`;
export const faqLd = (qa) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: qa.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
});

export const NAV = [
  ["/#how", "How it works"],
  ["/portals", "Registry"],
  ["/compare", "Compare"],
  ["/guides", "Guides"],
  ["/administrators", "Administrators"],
  ["/vaults", "Managed Vaults"],
];

export const navHtml = (active = "") => `<nav><div class="wrap">
  <a class="logo" href="/">${LOGO_SVG}${SITE_NAME}</a>
  <ul>${NAV.map(
    ([href, label]) => `<li><a href="${href}"${active && href === active ? ' aria-current="page"' : ""}>${label}</a></li>`
  ).join("")}</ul>
</div></nav>`;

export const footerHtml = () => `<footer><div class="wrap">
  <div>${SITE_NAME} · open registry and protocol for investor portal access · code MIT, data CC0<br><span style="font-size:12.5px">Product names and logos are trademarks of their respective owners and are used only to identify the listed products. Listing does not imply endorsement or affiliation. Owners can request a correction or removal by pull request or email.</span></div>
  <div class="footlinks"><a href="/portals">Registry</a> <a href="/compare">Comparisons</a> <a href="/guides">Guides</a> <a href="/administrators">Administrators</a> <a href="/vaults">Managed Vaults</a> <a href="/llms.txt">llms.txt</a></div>
</div></footer>`;

/**
 * Full HTML document for a generated page.
 * opts:
 *   title        page title, about 60 chars; " | OpenInvestorPortal" is appended unless already present
 *   description  meta description, 120 to 160 chars
 *   path         canonical path, starts with "/", no trailing slash (except "/")
 *   body         HTML placed inside <main>
 *   jsonld       object or array of schema.org objects
 *   ogType       "website" (default) or "article"
 *   active       nav href to mark current, e.g. "/portals"
 *   css          extra page-scoped CSS (keep it small; shared styles live in server/public/content.css)
 *   noindex      true to keep a page out of search
 */
export function layout({ title, description, path, body, jsonld = [], ogType = "website", active = "", css = "", noindex = false }) {
  const full = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const lds = (Array.isArray(jsonld) ? jsonld : [jsonld]).filter(Boolean);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(abs(path))}">
${noindex ? '<meta name="robots" content="noindex">\n' : ""}<meta property="og:type" content="${esc(ogType)}">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(abs(path))}">
<meta property="og:image" content="${esc(abs("/og.png"))}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#ffffff">
<link rel="stylesheet" href="/site.css?v=3">
<link rel="stylesheet" href="/content.css?v=1">
${css ? `<style>${css}</style>\n` : ""}${lds
    .map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`)
    .join("\n")}
</head>
<body>
${navHtml(active)}
<main>
${body}
</main>
${footerHtml()}
</body>
</html>
`;
}
