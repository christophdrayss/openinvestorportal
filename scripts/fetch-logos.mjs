// Download a small logo (favicon) for every registry entry into server/public/logos/<id>.png.
// Uses Google's favicon service keyed by the vendor's own domain, so the page itself never calls third parties.
// Usage: node scripts/fetch-logos.mjs [--force]
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const dir = join(root, "registry/portals");
const out = join(root, "server/public/logos");
mkdirSync(out, { recursive: true });
const force = process.argv.includes("--force");

const isPng = (b) => b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
const isIco = (b) => b.length > 4 && b[0] === 0 && b[1] === 0 && b[2] === 1 && b[3] === 0;

async function tryFetch(url) {
  const res = await fetch(url, { redirect: "follow", headers: { "user-agent": "OpenInvestorPortal-LogoFetcher/0.1" } });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  return isPng(buf) || isIco(buf) ? buf : null;
}

const entries = readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));
let ok = 0, skipped = 0, missing = [];
for (const e of entries) {
  const target = join(out, `${e.id}.png`);
  if (existsSync(target) && !force) { skipped++; continue; }
  const host = new URL(e.website).hostname.replace(/^www\./, "");
  const candidates = [
    `https://www.google.com/s2/favicons?domain=${host}&sz=128`,
    `https://icons.duckduckgo.com/ip3/${host}.ico`,
  ];
  let buf = null;
  for (const url of candidates) {
    try { buf = await tryFetch(url); } catch { buf = null; }
    if (buf && buf.length > 400) break; // tiny payloads are usually the generic placeholder globe
    buf = null;
  }
  if (buf) { writeFileSync(target, buf); ok++; console.log(`ok   ${e.id} (${host}, ${buf.length} bytes)`); }
  else { missing.push(e.id); console.log(`miss ${e.id} (${host})`); }
}
console.log(`\n${ok} fetched, ${skipped} already present, ${missing.length} missing${missing.length ? ": " + missing.join(", ") : ""}`);
