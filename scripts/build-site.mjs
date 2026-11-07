// Static export of every server-rendered page into dist/site/, ready for any static host (GitHub Pages).
//   /portals/efront -> dist/site/portals/efront/index.html, /sitemap.xml -> dist/site/sitemap.xml
// Also writes the registry as static JSON (/v1/portals.json, /v1/portals/{id}.json, /v1/deployments.json),
// copies public assets and adds a 404 page. The filterable REST API and MCP endpoint need the Node server.
//
// Env:
//   SITE_URL   public origin plus path, e.g. https://openinvestorportal.com
//   BASE_PATH  path prefix when served from a subpath, e.g. /openinvestorportal (defaults to SITE_URL's path)
// Usage: SITE_URL=... node scripts/build-site.mjs
process.env.STATIC_EXPORT = "1";
const { mkdirSync, writeFileSync, readFileSync, cpSync, rmSync, existsSync, readdirSync } = await import("node:fs");
const { join, dirname, extname } = await import("node:path");
const { root, loadPortals, deployments, assessments, summarize } = await import("../server/registry.mjs");
const { allPages } = await import("../server/site/router.mjs");
const { layout, withSlash } = await import("../server/site/layout.mjs");
const { SITE_URL } = await import("../server/site/context.mjs");

const BASE = (process.env.BASE_PATH ?? new URL(SITE_URL).pathname).replace(/\/+$/, "");

// Prefix root-relative URLs with BASE so the site works under a subpath. Absolute URLs (SITE_URL) already carry it.
function rebase(text, kind) {
  if (!BASE && kind !== "html") return text;
  if (kind === "html") {
    // Folder-style page links get a trailing slash, as static hosts redirect /x to /x/.
    text = text.replace(/\bhref="(\/[^"#?]*?)((?:[#?][^"]*)?)"/g, (m, p, rest) => `href="${withSlash(p)}${rest}"`);
    text = text.replace(/\b(href|src|action|srcset)="\/(?!\/)/g, `$1="${BASE}/`);
    text = text.replace(/"(\/(?:logos|portals|compare|guides|administrators|badge|v1|schema)\/)/g, `"${BASE}$1`); // inline JSON
  }
  if (kind === "css") text = text.replace(/url\(\s*(['"]?)\/(?!\/)/g, `url($1${BASE}/`);
  if (kind === "manifest") text = text.replace(/"src":"\/(?!\/)/g, `"src":"${BASE}/`);
  return text;
}

const out = join(root, "dist/site");
if (existsSync(out)) rmSync(out, { recursive: true });
mkdirSync(out, { recursive: true });
const write = (rel, data) => {
  const file = join(out, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, data);
};

const pages = await allPages();
for (const p of pages) {
  const type = p.type ?? "text/html";
  const isHtml = type === "text/html";
  const rel = p.path === "/" ? "index.html" : isHtml && !extname(p.path) ? join(p.path, "index.html") : p.path;
  const body = p.render();
  write(rel, isHtml ? rebase(body, "html") : type === "image/svg+xml" ? body : body);
}

// 404 page (GitHub Pages serves /404.html for unknown paths).
write(
  "404.html",
  rebase(
    layout({
      title: "Page not found",
      description: "This page does not exist. Browse the open registry of investor portals, comparisons and guides on OpenInvestorPortal instead.",
      path: "/404",
      noindex: true,
      body: `<section class="page-head"><div class="wrap"><h1>Page not found</h1><p class="lead">The page you asked for does not exist or has moved.</p></div></section>
<section class="tight"><div class="wrap prose"><p>Try the <a href="/portals">registry of investor portals</a>, the <a href="/compare">comparisons</a> or the <a href="/guides">guides</a>.</p></div></section>`,
    }),
    "html"
  )
);

// Static JSON: the same shapes as the live API.
const portals = loadPortals();
const a = assessments();
const deps = deployments();
const summaries = portals.map((e) => summarize(e, a[e.id], deps)).map((s) => ({ ...s, logo: s.logo && BASE + s.logo }));
write("v1/portals.json", JSON.stringify({ count: summaries.length, portals: summaries }, null, 2));
for (const e of portals) write(`v1/portals/${e.id}.json`, JSON.stringify({ ...e, deployments: deps.filter((d) => d.product === e.id) }, null, 2));
write("v1/deployments.json", JSON.stringify({ count: deps.length, deployments: deps }, null, 2));

// Assets.
const pub = join(root, "server/public");
for (const f of readdirSync(pub)) {
  if (f.endsWith(".html")) continue;
  const src = join(pub, f);
  if (f === "logos") cpSync(src, join(out, "logos"), { recursive: true });
  else if (f.endsWith(".css")) write(f, rebase(readFileSync(src, "utf8"), "css"));
  else if (f.endsWith(".webmanifest")) write(f, rebase(readFileSync(src, "utf8"), "manifest"));
  else cpSync(src, join(out, f));
}
cpSync(join(root, "schema"), join(out, "schema"), { recursive: true });
write(".nojekyll", "");

console.log(`${pages.length} pages, ${portals.length} portal JSON files written to dist/site (base path "${BASE || "/"}")`);
