// Import researched portal entries from research/*.json into registry/portals/ and
// build docs/PORTAL-ACCESS-SURVEY.md from the accompanying assessments.
//
// Each research file: { "portals": [ <schema-valid entry>, ... ], "assessments": [ { id, difficulty, rationale, sources, ... } ] }
// Usage: node scripts/import-research.mjs [--dry]
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const dry = process.argv.includes("--dry");
const researchDir = join(root, "research");
const portalsDir = join(root, "registry/portals");
const schema = JSON.parse(readFileSync(join(root, "schema/portal.schema.json"), "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

const files = readdirSync(researchDir).filter((f) => f.endsWith(".json") && f !== "assessments.json" && !f.startsWith("deployments-")).sort();
const all = [];
const assessments = {};
let failed = 0;

for (const file of files) {
  const data = JSON.parse(readFileSync(join(researchDir, file), "utf8"));
  for (const a of data.assessments ?? []) assessments[a.id] = { ...a, group: file.replace(".json", "") };
  for (const entry of data.portals ?? []) {
    // Normalise a few things agents commonly get slightly wrong.
    entry.updated ??= "2026-11-07";
    entry.verification ??= { status: "unverified" };
    if (entry.oipp && !entry.oipp.status) entry.oipp.status = "none";
    if (!validate(entry)) {
      failed++;
      console.error(`FAIL ${file} -> ${entry.id ?? "(no id)"}`);
      for (const e of validate.errors) console.error(`  - ${e.instancePath || "/"} ${e.message}`);
      continue;
    }
    all.push({ entry, file });
  }
}

// Write entries (later files win on duplicate ids; report duplicates).
const seen = new Map();
const byId = new Map();
for (const { entry, file } of all) {
  if (seen.has(entry.id)) console.warn(`duplicate id ${entry.id}: ${seen.get(entry.id)} and ${file}, keeping ${file}`);
  seen.set(entry.id, file);
  byId.set(entry.id, entry);
  if (!dry) writeFileSync(join(portalsDir, `${entry.id}.json`), JSON.stringify(entry, null, 2) + "\n");
}

// Merge research/deployments-*.json into registry/deployments.json (dedupe on operator + portal name; research wins).
const depPath = join(root, "registry/deployments.json");
const deployments = existsSync(depPath) ? JSON.parse(readFileSync(depPath, "utf8")) : [];
const depKey = (d) => `${d.operator}|${d.portal_name}`.toLowerCase();
const depIndex = new Map(deployments.map((d, i) => [depKey(d), i]));
let depAdded = 0;
for (const f of readdirSync(researchDir).filter((f) => /^deployments-.*\.json$/.test(f))) {
  for (const d of JSON.parse(readFileSync(join(researchDir, f), "utf8"))) {
    const k = depKey(d);
    if (depIndex.has(k)) deployments[depIndex.get(k)] = d;
    else { depIndex.set(k, deployments.length); deployments.push(d); depAdded++; }
  }
}
if (!dry) writeFileSync(depPath, JSON.stringify(deployments, null, 2) + "\n");

// Survey document: every entry on disk, with this run's (possibly unwritten, in dry mode) entries taking precedence.
for (const f of readdirSync(portalsDir).filter((f) => f.endsWith(".json"))) {
  const id = f.replace(/\.json$/, "");
  if (!byId.has(id)) byId.set(id, JSON.parse(readFileSync(join(portalsDir, f), "utf8")));
}
const entries = [...byId.values()];
const byDifficulty = entries
  .map((e) => ({ e, a: assessments[e.id] }))
  .sort((x, y) => (x.a?.difficulty ?? 9) - (y.a?.difficulty ?? 9) || x.e.name.localeCompare(y.e.name));

const st = (e, ch) => e.access?.[ch]?.status ?? "unknown";
const lines = [
  "# Portal access survey",
  "",
  `Generated ${new Date().toISOString().slice(0, 10)} from \`research/*.json\` by \`scripts/import-research.mjs\`. ${entries.length} portals.`,
  "",
  "Difficulty: 1 = documented self-serve API an investor can use, 2 = partner or client API with some friction, 3 = exports, SFTP or email feeds but no API, 4 = web login only, exports possible, 5 = web login only with MFA, view-only. All entries are unverified community research; vendors correct them by pull request.",
  "",
  "| Portal | Category | Difficulty | API | MCP | SFTP | Investor-side API | Automation policy |",
  "|---|---|---|---|---|---|---|---|",
  ...byDifficulty.map(({ e, a }) =>
    `| [${e.name}](../registry/portals/${e.id}.json) | ${e.category} | ${a?.difficulty ?? "-"} | ${st(e, "api")} | ${st(e, "mcp")} | ${st(e, "sftp")} | ${a?.lp_side_api ?? a?.recipient_side_api ?? a?.investor_side_api ?? "unknown"} | ${e.terms?.automation_policy ?? "unknown"} |`
  ),
  "",
  "## Per portal",
  "",
];
for (const { e, a } of byDifficulty) {
  lines.push(`### ${e.name}`, "");
  if (a?.rationale) lines.push(a.rationale, "");
  if (e.notes) lines.push(`Notes: ${e.notes}`, "");
  if (a?.underlying_software && a.underlying_software !== "unknown") lines.push(`Underlying software: ${a.underlying_software}`, "");
  if (a?.sources?.length) lines.push("Sources:", ...a.sources.map((s) => `- ${s}`), "");
}
if (!dry) {
  mkdirSync(join(root, "docs"), { recursive: true });
  writeFileSync(join(root, "docs/PORTAL-ACCESS-SURVEY.md"), lines.join("\n") + "\n");
  writeFileSync(join(researchDir, "assessments.json"), JSON.stringify(assessments, null, 2) + "\n");
}
console.log(`${all.length} entries imported from ${files.length} files, ${failed} failed validation, ${depAdded} new deployments${dry ? " (dry run)" : ""}`);
process.exit(failed ? 1 : 0);
