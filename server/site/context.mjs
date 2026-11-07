// Shared data context for every generated page. Built once per request (the registry is small).
import { existsSync } from "node:fs";
import { join } from "node:path";
import { root, loadPortals, deployments, assessments, summarize } from "../registry.mjs";

// Public origin used for canonical URLs, sitemap and structured data. Placeholder until the domain is live.
export const SITE_URL = (process.env.SITE_URL ?? "https://openinvestorportal.org").replace(/\/$/, "");
export const SITE_NAME = "OpenInvestorPortal";
// Static export (GitHub Pages and other static hosts): no live JSON API or MCP endpoint, only static JSON files.
export const STATIC_EXPORT = process.env.STATIC_EXPORT === "1";
/** URL path of a JSON resource: the live API path, or its static file in a static export. */
export const apiPath = (p) => (STATIC_EXPORT ? `${p}.json` : p);

export const slugify = (s) =>
  String(s).normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function buildContext() {
  const portals = loadPortals();
  const a = assessments();
  const deps = deployments();
  const byId = new Map(portals.map((p) => [p.id, p]));
  const summaries = portals.map((p) => summarize(p, a[p.id], deps));
  const summaryById = new Map(summaries.map((s) => [s.id, s]));
  const latest = portals.map((p) => p.updated).filter(Boolean).sort().at(-1) ?? new Date().toISOString().slice(0, 10);
  return {
    portals, // full registry entries (schema/portal.schema.json)
    byId, // id -> entry
    assessments: a, // id -> { difficulty 1-5, rationale, sources[], lp_side_api|recipient_side_api|investor_side_api, underlying_software, ... }
    deployments: deps, // [{ operator, operator_website, administrator, portal_name, product, country, confidence, notes }]
    summaries, // registry.mjs summarize() output, same order as portals
    summaryById,
    latest, // newest `updated` date in the registry, YYYY-MM-DD
    hasLogo: (id) => existsSync(join(root, "server/public/logos", id + ".png")),
    root,
  };
}
