// /guides index plus one page per guide module in server/site/guides/*.mjs.
// A guide module default-exports:
//   { slug, title, h1, description, updated: "YYYY-MM-DD", summary (one sentence for the index), order (number),
//     render(ctx) => HTML for inside <main> (use helpers from ../layout.mjs), jsonld?(ctx) => object[] }
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { layout, breadcrumbs, breadcrumbLd, esc, abs } from "./layout.mjs";
import { SITE_NAME } from "./context.mjs";

async function loadGuides(ctx) {
  const dir = join(ctx.root, "server/site/guides");
  const files = readdirSync(dir).filter((f) => f.endsWith(".mjs")).sort();
  const mods = [];
  for (const f of files) {
    try {
      // Cache-bust on mtime-free basis: guides are static between restarts, so a plain import is fine.
      const m = (await import(pathToFileURL(join(dir, f)).href)).default;
      if (m?.slug && typeof m.render === "function") mods.push(m);
      else console.warn(`[guides] ${f} has no default export with slug and render()`);
    } catch (err) {
      console.error(`[guides] failed to load ${f}:`, err.message);
    }
  }
  return mods.sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.title.localeCompare(b.title));
}

export async function pages(ctx) {
  const guides = await loadGuides(ctx);
  const index = {
    path: "/guides",
    lastmod: guides.map((g) => g.updated).sort().at(-1) ?? ctx.latest,
    priority: 0.7,
    render: () =>
      layout({
        title: "Guides to investor portal access",
        description:
          "Short, neutral guides on choosing an investor portal, comparing APIs and MCP servers, and automating capital call and distribution notices.",
        path: "/guides",
        active: "/guides",
        jsonld: [
          breadcrumbLd([{ name: "Guides", path: "/guides" }]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Guides",
            url: abs("/guides"),
            hasPart: guides.map((g) => ({ "@type": "Article", headline: g.h1 ?? g.title, url: abs(`/guides/${g.slug}`) })),
          },
        ],
        body: `<section class="page-head"><div class="wrap">
  ${breadcrumbs([{ name: "Guides", path: "/guides" }])}
  <h1>Guides</h1>
  <p class="lead">Practical, vendor-neutral guides built on the open registry. Every table is generated from live registry data.</p>
</div></section>
<section class="tight"><div class="wrap"><div class="cards">
${guides
  .map(
    (g) => `<a class="card link-card" href="/guides/${esc(g.slug)}"><h3>${esc(g.h1 ?? g.title)}</h3><p>${esc(g.summary ?? g.description)}</p><span class="more">Read the guide</span></a>`
  )
  .join("\n")}
</div></div></section>`,
      }),
  };
  const pagesOut = guides.map((g) => ({
    path: `/guides/${g.slug}`,
    lastmod: g.updated ?? ctx.latest,
    priority: 0.8,
    render: () =>
      layout({
        title: g.title,
        description: g.description,
        path: `/guides/${g.slug}`,
        active: "/guides",
        ogType: "article",
        css: g.css ?? "",
        jsonld: [
          breadcrumbLd([
            { name: "Guides", path: "/guides" },
            { name: g.h1 ?? g.title, path: `/guides/${g.slug}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: g.h1 ?? g.title,
            description: g.description,
            dateModified: g.updated ?? ctx.latest,
            author: { "@type": "Organization", name: SITE_NAME },
            publisher: { "@type": "Organization", name: SITE_NAME },
            mainEntityOfPage: abs(`/guides/${g.slug}`),
          },
          ...(g.jsonld?.(ctx) ?? []),
        ],
        body: g.render(ctx),
      }),
  }));
  return [index, ...pagesOut];
}
