import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

export const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const dir = join(root, "registry/portals");

export function loadPortals() {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));
}

export function deployments() {
  const f = join(root, "registry/deployments.json");
  return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : [];
}

export function assessments() {
  const f = join(root, "research/assessments.json");
  return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : {};
}

export function summarize(e, a = assessments()[e.id], deps = deployments()) {
  const s = (ch) => e.access?.[ch]?.status ?? "unknown";
  return {
    id: e.id,
    name: e.name,
    vendor: e.vendor.name,
    website: e.website,
    category: e.category,
    regions: e.regions ?? [],
    asset_classes: e.asset_classes ?? [],
    api: s("api"),
    mcp: s("mcp"),
    sftp: s("sftp"),
    oipp: e.oipp?.status ?? "not-yet",
    automation_policy: e.terms?.automation_policy ?? "unknown",
    difficulty: a?.difficulty ?? null,
    deployments: deps.filter((d) => d.product === e.id).length,
    logo: existsSync(join(root, "server/public/logos", e.id + ".png")) ? `/logos/${e.id}.png` : null,
    verification: e.verification.status,
    updated: e.updated,
  };
}

export function searchPortals(portals, { query, capability, region, channel } = {}) {
  const q = query?.toLowerCase();
  return portals.filter((e) => {
    if (q && !`${e.name} ${e.vendor.name} ${e.id} ${e.notes ?? ""}`.toLowerCase().includes(q)) return false;
    if (capability && !(e.capabilities ?? []).includes(capability)) return false;
    if (region && !(e.regions ?? []).includes(region)) return false;
    if (channel && !["available", "partner-only", "beta"].includes(e.access?.[channel]?.status)) return false;
    return true;
  });
}
