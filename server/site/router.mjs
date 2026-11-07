// Router for all server-rendered SEO pages. Each page module exports `pages(ctx)` returning
//   [{ path, render: () => string, type?: "text/html" (default) | "image/svg+xml" | "application/xml" | "text/plain",
//      lastmod?: "YYYY-MM-DD", priority?: 0..1, sitemap?: true (default for html) }]
// The same list drives the live server, the sitemap and the static export (scripts/build-site.mjs).
import { buildContext } from "./context.mjs";
// Modules load independently, so one broken module never takes the others down.
const load = async (name) => {
  try {
    return await import(`./${name}.mjs`);
  } catch (err) {
    console.error(`[site] module ${name} failed to load: ${err.message}`);
    return { pages: async () => [] };
  }
};
const [home, portalPages, adminPages, comparePages, guidePages, badge, legal, technical] = await Promise.all(
  ["home", "portal-pages", "admin-pages", "compare-pages", "guide-pages", "badge", "legal", "technical"].map(load)
);
const contentModules = [home, portalPages, adminPages, comparePages, guidePages, badge, legal];
const safePages = async (m, ...args) => {
  try {
    return await m.pages(...args);
  } catch (err) {
    console.error(`[site] pages() failed: ${err.stack}`);
    return [];
  }
};

export async function allPages(ctx = buildContext()) {
  const lists = await Promise.all(contentModules.map((m) => safePages(m, ctx)));
  const content = lists.flat();
  const tech = await safePages(technical, ctx, content);
  const out = [...content, ...tech];
  const seen = new Set();
  for (const p of out) {
    if (seen.has(p.path)) console.warn(`[site] duplicate path ${p.path}`);
    seen.add(p.path);
  }
  return out;
}

/** Try to serve a site page. Returns true when handled. */
export async function handleSite(req, res, url) {
  if (req.method !== "GET" && req.method !== "HEAD") return false;
  const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : "/";
  const page = (await allPages()).find((p) => p.path === path);
  if (!page) return false;
  const type = page.type ?? "text/html";
  res.writeHead(200, {
    "content-type": `${type}; charset=utf-8`,
    "cache-control": "public, max-age=300",
  });
  res.end(req.method === "HEAD" ? undefined : page.render());
  return true;
}
