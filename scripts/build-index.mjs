import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const dir = join(root, "registry/portals");
const out = join(root, "dist");
mkdirSync(out, { recursive: true });

const entries = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));

const status = (e, ch) => e.access?.[ch]?.status ?? "unknown";
const index = {
  $schema: "https://openinvestorportal.com/schema/index.schema.json",
  generated_at: new Date().toISOString(),
  count: entries.length,
  portals: entries.map((e) => ({
    id: e.id,
    name: e.name,
    vendor: e.vendor.name,
    category: e.category,
    api: status(e, "api"),
    mcp: status(e, "mcp"),
    sftp: status(e, "sftp"),
    verification: e.verification.status,
    updated: e.updated,
    url: `registry/portals/${e.id}.json`,
  })),
};
writeFileSync(join(out, "index.json"), JSON.stringify(index, null, 2) + "\n");
writeFileSync(join(out, "portals.json"), JSON.stringify(entries, null, 2) + "\n");

// Markdown table for the README
const rows = index.portals.map((p) => `| [${p.name}](registry/portals/${p.id}.json) | ${p.category} | ${p.api} | ${p.mcp} | ${p.sftp} | ${p.verification} |`);
const table = ["| Portal | Category | API | MCP | SFTP | Verified |", "|---|---|---|---|---|---|", ...rows].join("\n");
const readmePath = join(root, "README.md");
const readme = readFileSync(readmePath, "utf8");
const updated = readme.replace(/<!-- registry:start -->[\s\S]*<!-- registry:end -->/, `<!-- registry:start -->\n${table}\n<!-- registry:end -->`);
if (updated !== readme) writeFileSync(readmePath, updated);
console.log(`built dist/index.json (${entries.length} portals), README table refreshed`);
