// Render site pages without writing files, for checking work.
//   node scripts/render-page.mjs /portals/efront        print the HTML of one page
//   node scripts/render-page.mjs --all                  render every page, report errors, sizes and basic SEO checks
//   node scripts/render-page.mjs --list [prefix]        list paths
import { allPages } from "../server/site/router.mjs";

const args = process.argv.slice(2);
const pages = await allPages();

if (args[0] === "--list") {
  for (const p of pages.filter((p) => !args[1] || p.path.startsWith(args[1]))) console.log(p.path);
  console.log(`${pages.length} pages`);
} else if (args[0] === "--all") {
  let bad = 0;
  const titles = new Map();
  const sel = pages.filter((p) => !args[1] || p.path.startsWith(args[1]));
  for (const p of sel) {
    try {
      const html = p.render();
      if ((p.type ?? "text/html") !== "text/html") continue;
      const problems = [];
      const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
      const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
      const h1s = (html.match(/<h1[\s>]/g) ?? []).length;
      if (!title) problems.push("no <title>");
      else if (titles.has(title)) problems.push(`duplicate title with ${titles.get(title)}`);
      else titles.set(title, p.path);
      if (!desc) problems.push("no meta description");
      else if (desc.length > 170 || desc.length < 70) problems.push(`description length ${desc.length}`);
      if (h1s !== 1) problems.push(`${h1s} <h1>`);
      if (/undefined|\[object Object\]|NaN/.test(html.replace(/<script[\s\S]*?<\/script>/g, ""))) problems.push("contains undefined/[object Object]/NaN");
      if (problems.length) { bad++; console.log(`WARN ${p.path}: ${problems.join("; ")}`); }
    } catch (err) {
      bad++;
      console.log(`ERROR ${p.path}: ${err.stack}`);
    }
  }
  console.log(`${sel.length} pages checked, ${bad} with problems`);
  process.exit(bad ? 1 : 0);
} else {
  const p = pages.find((p) => p.path === args[0]);
  if (!p) { console.error(`no page ${args[0]}`); process.exit(1); }
  console.log(p.render());
}
