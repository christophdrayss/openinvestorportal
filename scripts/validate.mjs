import { readFileSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const schema = JSON.parse(readFileSync(join(root, "schema/portal.schema.json"), "utf8"));
const dir = join(root, "registry/portals");

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

let failed = 0;
const ids = new Set();
for (const file of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
  const path = join(dir, file);
  let entry;
  try {
    entry = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    console.error(`FAIL ${file}: invalid JSON (${e.message})`);
    failed++;
    continue;
  }
  const errors = [];
  if (!validate(entry)) errors.push(...validate.errors.map((e) => `${e.instancePath || "/"} ${e.message}`));
  if (entry.id !== basename(file, ".json")) errors.push(`id "${entry.id}" does not match filename`);
  if (ids.has(entry.id)) errors.push(`duplicate id "${entry.id}"`);
  ids.add(entry.id);
  if (entry.verification?.status !== "unverified" && !entry.verification?.verified_by)
    errors.push("verification.verified_by is required when status is not unverified");
  if (entry.access?.mcp?.status === "available" && !entry.access.mcp.endpoint && !entry.access.mcp.source_url && !entry.access.mcp.docs_url)
    errors.push("access.mcp: available MCP needs an endpoint, source_url or docs_url");
  if (entry.access?.api?.status === "available" && !entry.access.api.docs_url)
    errors.push("access.api: available API needs docs_url");

  if (errors.length) {
    failed++;
    console.error(`FAIL ${file}`);
    for (const e of errors) console.error(`  - ${e}`);
  } else {
    console.log(`ok   ${file}`);
  }
}
const depSchema = JSON.parse(readFileSync(join(root, "schema/deployments.schema.json"), "utf8"));
const validateDeps = ajv.compile(depSchema);
const deps = JSON.parse(readFileSync(join(root, "registry/deployments.json"), "utf8"));
if (!validateDeps(deps)) {
  failed++;
  console.error("FAIL deployments.json");
  for (const e of validateDeps.errors) console.error(`  - ${e.instancePath || "/"} ${e.message}`);
}
for (const d of deps) if (d.product && !ids.has(d.product)) { failed++; console.error(`FAIL deployments.json: unknown product "${d.product}" for ${d.operator}`); }
console.log(`${deps.length} deployments checked`);
console.log(`\n${ids.size} entries, ${failed} failed`);
process.exit(failed ? 1 : 0);
