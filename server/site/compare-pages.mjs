// Comparison pages: /compare (index) and /compare/{a}-vs-{b}, generated from the registry for the curated pairs in
// compare-pairs.mjs. Every sentence is derived from registry fields; nothing is ranked beyond the registry's own
// difficulty rating.
import {
  layout,
  esc,
  abs,
  pill,
  diffBadge,
  logoImg,
  extLink,
  breadcrumbs,
  breadcrumbLd,
  faq,
  faqLd,
  STATUS_LABEL,
  CATEGORY_LABEL,
  DIFFICULTY_LABEL,
} from "./layout.mjs";
import { SITE_NAME } from "./context.mjs";
import { PAIRS, comparePath, pairsFor, reasonFor, shortName } from "./compare-pairs.mjs";

const CONTACT = "hello@openinvestorportal.org";
const GUIDE_CHOOSE = "/guides/how-to-choose-an-investor-portal";

// ---------- labels for schema enums ----------
const REGION = { global: "Global", "north-america": "North America", europe: "Europe", uk: "UK", dach: "DACH", apac: "Asia Pacific", latam: "Latin America", "middle-east": "Middle East" };
const ASSET = { "private-equity": "Private equity", "venture-capital": "Venture capital", "private-credit": "Private credit", "real-estate": "Real estate", infrastructure: "Infrastructure", "hedge-fund": "Hedge funds", "fund-of-funds": "Fund of funds", other: "Other" };
const CAP = { documents: "Documents", capital_calls: "Capital calls", distributions: "Distributions", capital_account_statements: "Capital account statements", nav: "NAV", performance: "Performance", tax_documents: "Tax documents", fund_reports: "Fund reports", cap_table: "Cap table", subscriptions: "Subscriptions", kyc: "KYC", messaging: "Messaging", other: "Other" };
const SSO = { saml: "SAML", oidc: "OIDC", microsoft: "Microsoft", google: "Google", none: "None" };
const MFA = { totp: "authenticator app", sms: "SMS", email: "email", push: "push", "hardware-key": "hardware key", none: "none" };
const AUTH = { "oauth2-client-credentials": "OAuth 2 client credentials", "oauth2-authorization-code": "OAuth 2 authorization code", "api-key": "API key", basic: "basic auth", jwt: "JWT", mtls: "mTLS", other: "another method" };
const MCP_AUTH = { oauth2: "OAuth 2", "api-key": "API key", none: "no auth", other: "another auth method" };
const AUD = { lp: "LP", gp: "GP", "fund-admin": "fund administrator", partner: "partner" };
const STYLE = { rest: "REST", graphql: "GraphQL", soap: "SOAP", odata: "OData", other: "other" };
const TRANSPORT = { "streamable-http": "Streamable HTTP", sse: "SSE", stdio: "stdio" };
const FMT = { pdf: "PDF", xlsx: "XLSX", csv: "CSV", xml: "XML", json: "JSON", "ilpa-template": "ILPA template", fundsxml: "FundsXML", other: "Other" };
const STANDARD = { "ilpa-reporting-template": "ILPA reporting template", "ilpa-capital-call-template": "ILPA capital call template", "ilpa-distribution-template": "ILPA distribution template", "ilpa-performance-template": "ILPA performance template", openapi: "OpenAPI", oauth2: "OAuth 2", "saml-sso": "SAML SSO", scim: "SCIM", other: "other" };
const POLICY = { permitted: "permitted", tolerated: "tolerated (not addressed in the terms)", prohibited: "prohibited", unknown: "unknown" };
const VERIF = { unverified: "Unverified", "community-verified": "Community verified", "vendor-verified": "Vendor verified" };
const PHRASE = { available: "available", beta: "in beta", "partner-only": "partner only", planned: "planned", none: "not offered", unknown: "not documented" };
const CHANNELS = [
  ["api", "API"],
  ["mcp", "MCP server"],
  ["sftp", "SFTP"],
  ["webhooks", "Webhooks"],
  ["email_notifications", "Email notifications"],
];
const NOUN = { api: "an API", mcp: "an MCP server", sftp: "SFTP", webhooks: "webhooks", email_notifications: "email notifications" };
const KEY_CAPS = ["capital_calls", "distributions", "capital_account_statements", "tax_documents"];
const CATEGORY_ORDER = ["lp-portal", "fund-admin-portal", "data-room", "reporting-platform", "marketplace", "cap-table", "other"];
const CATEGORY_PLURAL = {
  "lp-portal": "LP portals",
  "fund-admin-portal": "Fund administrator portals",
  "data-room": "Data rooms",
  "reporting-platform": "Reporting platforms",
  marketplace: "Marketplaces",
  "cap-table": "Cap table tools",
  other: "Other",
};

// ---------- small helpers ----------
const lab = (map, v) => map[v] ?? String(v);
const list = (arr, map) => (arr ?? []).map((v) => lab(map, v));
/** "a", "a and b", "a, b and c" */
const joinOr = (arr) => (arr.length <= 1 ? arr.join("") : `${arr.slice(0, -1).join(", ")} or ${arr.at(-1)}`);
const join = (arr) => (arr.length <= 1 ? arr.join("") : `${arr.slice(0, -1).join(", ")} and ${arr.at(-1)}`);
const st = (e, ch) => e.access?.[ch]?.status ?? "unknown";
const ph = (s) => PHRASE[s] ?? s;
const offered = (s) => ["available", "beta", "partner-only"].includes(s);
const low1 = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const cap1 = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const p = (html) => `<p>${html}</p>`;
const sub = (html) => (html ? `<span class="sub">${html}</span>` : "");

/** Investor-side programmatic access from the assessment: "yes" | "no" | "unknown". */
function investorSide(ctx, e) {
  const a = ctx.assessments[e.id] ?? {};
  const v = a.lp_side_api ?? a.recipient_side_api ?? a.investor_side_api;
  return v === true ? "yes" : v === false ? "no" : "unknown";
}
const INVESTOR_SIDE = { yes: "documented", no: "not offered", unknown: "unknown" };
const INVESTOR_PILL = { yes: "available", no: "none", unknown: "unknown" };
const difficulty = (ctx, e) => ctx.assessments[e.id]?.difficulty ?? ctx.summaryById.get(e.id)?.difficulty ?? null;
const deps = (ctx, e) => ctx.deployments.filter((d) => d.product === e.id);
const policy = (e) => e.terms?.automation_policy ?? "unknown";

/** Short factual detail for a channel, used in sentences. */
function apiDetail(e) {
  const a = e.access?.api ?? {};
  const bits = [];
  if (a.style) bits.push(lab(STYLE, a.style));
  if (a.auth?.length) bits.push(join(list(a.auth, AUTH)));
  if (a.audience?.length) bits.push(`for ${join(list(a.audience, AUD))} users`);
  if (a.docs_url) bits.push("public docs");
  if (a.sandbox) bits.push("sandbox");
  return bits.join(", ");
}
function mcpDetail(e) {
  const m = e.access?.mcp ?? {};
  const bits = [];
  if (m.maintainer && m.maintainer !== "unknown") bits.push(`${m.maintainer}-maintained`);
  if (m.endpoint) bits.push("endpoint published");
  if (m.transport?.length) bits.push(join(list(m.transport, TRANSPORT)));
  if (m.auth?.length) bits.push(join(list(m.auth, MCP_AUTH)));
  return bits.join(", ");
}
const detail = (e, ch) => (ch === "api" ? apiDetail(e) : ch === "mcp" ? mcpDetail(e) : "");
const statusText = (e, ch) => {
  const d = detail(e, ch);
  return ph(st(e, ch)) + (d && st(e, ch) !== "unknown" && st(e, ch) !== "none" ? ` (${d})` : "");
};

/** Title within 60 characters, falling back to shorter wordings. */
function pairTitle(A, B) {
  const opts = [
    `${A} vs ${B}: API, MCP and investor access compared`,
    `${A} vs ${B}: API, MCP and investor access`,
    `${A} vs ${B}: API, MCP and access compared`,
    `${A} vs ${B}: API and investor access`,
    `${A} vs ${B}: API and MCP compared`,
    `${A} vs ${B}: API and MCP access`,
    `${A} vs ${B}: API and MCP`,
    `${A} vs ${B} compared`,
  ];
  return opts.find((t) => t.length <= 60) ?? opts.at(-1);
}
/** First candidate between 120 and 160 characters, else the closest one trimmed. */
function pickDesc(opts) {
  const ok = opts.find((d) => d.length >= 120 && d.length <= 160);
  if (ok) return ok;
  const short = opts.filter((d) => d.length <= 160).sort((x, y) => y.length - x.length)[0];
  return short ?? opts[0].slice(0, 157).replace(/\s+\S*$/, "") + "...";
}

// ---------- comparison table ----------
function webCell(e) {
  const w = e.access?.web ?? {};
  const lines = [];
  lines.push(w.sso?.length ? `SSO: ${esc(join(list(w.sso, SSO)))}` : "SSO: not recorded");
  if (w.mfa?.length) lines.push(`MFA: ${esc(join(list(w.mfa, MFA)))}`);
  return `${pill(w.status ?? "unknown")}${sub(lines.join("<br>"))}`;
}
function apiCell(e) {
  const a = e.access?.api ?? {};
  const lines = [];
  if (a.style) lines.push(`Style: ${esc(lab(STYLE, a.style))}`);
  if (a.auth?.length) lines.push(`Auth: ${esc(join(list(a.auth, AUTH)))}`);
  if (a.audience?.length) lines.push(`Audience: ${esc(join(list(a.audience, AUD)))}`);
  if (a.sandbox) lines.push("Sandbox: yes");
  if (a.docs_url) lines.push(extLink(a.docs_url, "API docs"));
  else if (offered(a.status)) lines.push("Docs: not public");
  return `${pill(a.status ?? "unknown")}${sub(lines.join("<br>"))}`;
}
function mcpCell(e) {
  const m = e.access?.mcp ?? {};
  const lines = [];
  if (m.maintainer) lines.push(`Maintainer: ${esc(m.maintainer)}`);
  if (m.endpoint) lines.push(`Endpoint: <code>${esc(m.endpoint)}</code>`);
  else if (offered(m.status)) lines.push("Endpoint: not published");
  if (m.transport?.length) lines.push(`Transport: ${esc(join(list(m.transport, TRANSPORT)))}`);
  if (m.auth?.length) lines.push(`Auth: ${esc(join(list(m.auth, MCP_AUTH)))}`);
  if (m.docs_url) lines.push(extLink(m.docs_url, "MCP docs"));
  return `${pill(m.status ?? "unknown")}${sub(lines.join("<br>"))}`;
}
const simpleCell = (e, ch) => pill(st(e, ch)) + (e.access?.[ch]?.docs_url ? sub(extLink(e.access[ch].docs_url, "Docs")) : "");
const chips = (arr, map, empty = "None listed") => (arr?.length ? esc(list(arr, map).join(", ")) : `<span class="muted">${empty}</span>`);
function termsCell(e) {
  const t = e.terms ?? {};
  const pol = policy(e);
  const cls = { permitted: "available", tolerated: "beta", prohibited: "none", unknown: "unknown" }[pol];
  const label = { permitted: "Permitted", tolerated: "Tolerated", prohibited: "Prohibited", unknown: "Unknown" }[pol];
  return `<span class="pill ${cls}">${esc(label)}</span>${sub(t.tos_url ? extLink(t.tos_url, "Terms") : "Terms URL not recorded")}`;
}
function depsCell(ctx, e) {
  const d = deps(ctx, e);
  if (!d.length) return "0";
  const names = [...new Set(d.map((x) => x.operator))];
  return `${d.length}${sub(esc(names.slice(0, 4).join("; ") + (names.length > 4 ? "; and more" : "")))}`;
}
function diffCell(ctx, e) {
  const d = difficulty(ctx, e);
  return `${diffBadge(d)}${d ? sub(esc(DIFFICULTY_LABEL[d])) : ""}`;
}

function cmpTable(ctx, a, b) {
  const row = (label, fn) => `<tr><th scope="row">${label}</th><td>${fn(a)}</td><td>${fn(b)}</td></tr>`;
  const head = (e) =>
    `<th scope="col"><a class="cmp-name" href="/portals/${esc(e.id)}">${logoImg(ctx, e, 28)}<span>${esc(e.name)}</span></a></th>`;
  return `<div class="cmp-scroll"><table class="cmp">
<caption class="sr">${esc(a.name)} and ${esc(b.name)} compared</caption>
<thead><tr><th scope="col"><span class="sr">Field</span></th>${head(a)}${head(b)}</tr></thead>
<tbody>
${[
  row("Vendor", (e) => `${esc(e.vendor.name)}${sub([e.vendor.country ? `Country: ${esc(e.vendor.country)}` : "", e.vendor.website ? extLink(e.vendor.website, "Vendor site") : ""].filter(Boolean).join("<br>"))}`),
  row("Category", (e) => `<a href="/portals/category/${esc(e.category)}">${esc(CATEGORY_LABEL[e.category] ?? e.category)}</a>`),
  row("Regions", (e) => chips(e.regions, REGION)),
  row("Asset classes", (e) => chips(e.asset_classes, ASSET, "Not recorded")),
  row("Web and SSO", webCell),
  row("API", apiCell),
  row("Investor-side API", (e) => { const v = investorSide(ctx, e); return `<span class="pill ${INVESTOR_PILL[v]}">${esc(cap1(INVESTOR_SIDE[v]))}</span>${sub("From the registry assessment")}`; }),
  row("MCP", mcpCell),
  row("SFTP", (e) => simpleCell(e, "sftp")),
  row("Webhooks", (e) => simpleCell(e, "webhooks")),
  row("Email notifications", (e) => simpleCell(e, "email_notifications")),
  row("Export formats", (e) => chips(e.access?.export_formats, FMT)),
  row("Capabilities", (e) => chips(e.capabilities, CAP)),
  row("Standards", (e) => chips(e.standards, STANDARD)),
  row("Difficulty", (e) => diffCell(ctx, e)),
  row("Automation policy and terms", termsCell),
  row("Known deployments", (e) => depsCell(ctx, e)),
  row("Verification", (e) => `<span class="pill ${esc(e.verification?.status ?? "unverified")}">${esc(VERIF[e.verification?.status] ?? "Unverified")}</span>${sub(`Updated ${esc(e.updated ?? "date not recorded")}`)}`),
].join("\n")}
</tbody></table></div>`;
}

// ---------- generated prose ----------
function differences(ctx, a, b, A, B) {
  const diffs = [];
  const same = [];
  const nothing = [];
  for (const [ch, label] of CHANNELS) {
    const sa = st(a, ch);
    const sb = st(b, ch);
    const da = detail(a, ch);
    const db = detail(b, ch);
    if (sa === sb && (da === db || sa === "unknown" || sa === "none")) {
      if (sa === "unknown") nothing.push(NOUN[ch]);
      else if (sa === "none") same.push(`Neither offers ${NOUN[ch]}, according to the registry.`);
      else same.push(`${label}: both are recorded as ${ph(sa)}${da ? ` (${esc(da)})` : ""}.`);
    } else {
      diffs.push(`<strong>${label}.</strong> ${esc(A)}: ${esc(statusText(a, ch))}. ${esc(B)}: ${esc(statusText(b, ch))}.`);
    }
  }
  if (nothing.length) same.push(`Neither entry documents ${joinOr(nothing)}.`);

  const ia = investorSide(ctx, a);
  const ib = investorSide(ctx, b);
  if (ia !== ib) diffs.push(`<strong>Investor-side API.</strong> The assessment records access for the investor as ${INVESTOR_SIDE[ia]} for ${esc(A)} and ${INVESTOR_SIDE[ib]} for ${esc(B)}.`);
  else same.push(`Investor-side API: ${INVESTOR_SIDE[ia]} for ${ia === "no" ? "either" : "both"}, according to the assessment.`);

  const dA = difficulty(ctx, a);
  const dB = difficulty(ctx, b);
  if (dA && dB && dA !== dB)
    diffs.push(`<strong>Difficulty.</strong> The registry rates ${esc(A)} ${dA} of 5 (${esc(low1(DIFFICULTY_LABEL[dA]))}) and ${esc(B)} ${dB} of 5 (${esc(low1(DIFFICULTY_LABEL[dB]))}). The rating describes how hard programmatic access is for an investor, not product quality.`);
  else if (dA && dA === dB) same.push(`Difficulty: both are rated ${dA} of 5 (${esc(low1(DIFFICULTY_LABEL[dA]))}).`);

  const setDiff = (x, y) => (x ?? []).filter((v) => !(y ?? []).includes(v));
  const listDiff = (label, field, map, get) => {
    const xa = get(a) ?? [];
    const xb = get(b) ?? [];
    const onlyA = setDiff(xa, xb);
    const onlyB = setDiff(xb, xa);
    if (!xa.length && !xb.length) return;
    if (!onlyA.length && !onlyB.length) {
      same.push(`${label}: both list ${esc(join(list(xa, map)))}.`);
      return;
    }
    const parts = [];
    if (onlyA.length) parts.push(`${xb.length ? `listed for ${esc(A)} only` : `${esc(A)} lists`}: ${esc(join(list(onlyA, map)))}`);
    if (onlyB.length) parts.push(`${xa.length ? `listed for ${esc(B)} only` : `${esc(B)} lists`}: ${esc(join(list(onlyB, map)))}`);
    if (!xa.length) parts.push(`none recorded for ${esc(A)}`);
    if (!xb.length) parts.push(`none recorded for ${esc(B)}`);
    diffs.push(`<strong>${label}.</strong> ${cap1(parts.join("; "))}.`);
  };
  listDiff("Capabilities", "capabilities", CAP, (e) => e.capabilities);
  listDiff("Export formats", "export_formats", FMT, (e) => e.access?.export_formats);
  listDiff("Regions", "regions", REGION, (e) => e.regions);
  listDiff("Asset classes", "asset_classes", ASSET, (e) => e.asset_classes);
  listDiff("Standards", "standards", STANDARD, (e) => e.standards);
  listDiff("Web SSO", "sso", SSO, (e) => (e.access?.web?.sso ?? []).filter((s) => s !== "none"));
  listDiff("MFA methods", "mfa", MFA, (e) => e.access?.web?.mfa);

  const pa = policy(a);
  const pb = policy(b);
  if (pa !== pb) diffs.push(`<strong>Automation in the terms.</strong> Recorded as ${POLICY[pa]} for ${esc(A)} and ${POLICY[pb]} for ${esc(B)}.`);
  else same.push(`Automation policy: ${POLICY[pa]} for both.`);

  const na = deps(ctx, a).length;
  const nb = deps(ctx, b).length;
  if (na !== nb) diffs.push(`<strong>Known deployments.</strong> The registry links ${na} known deployment${na === 1 ? "" : "s"} to ${esc(A)} and ${nb} to ${esc(B)}. This counts what the community has documented, not market share.`);
  else same.push(na ? `Known deployments: ${na} each in the registry.` : "Known deployments: none documented for either yet.");

  return { diffs, same };
}

function fitNeeds(ctx, a, b, A, B) {
  // "x for both" when equal, else "x for A and y for B". Values are plain text, escaped here.
  const both = (va, vb) => (va === vb ? `${esc(va)} for ${/^(not |none|no )/.test(va) ? "either" : "both"}` : `${esc(va)} for ${esc(A)} and ${esc(vb)} for ${esc(B)}`);
  const S = (e, ch) => ph(st(e, ch));
  const apiText = (e) => {
    const x = e.access?.api?.audience;
    return S(e, "api") + (x?.length && offered(st(e, "api")) ? ` (aimed at ${join(list(x, AUD))} users)` : "");
  };
  const inv = (e) => INVESTOR_SIDE[investorSide(ctx, e)];
  const fmts = (e) => (e.access?.export_formats?.length ? join(list(e.access.export_formats, FMT)) : "no export formats");
  const keyCaps = (e) => KEY_CAPS.filter((c) => (e.capabilities ?? []).includes(c));
  const kc = (e) => {
    const k = keyCaps(e);
    return k.length === KEY_CAPS.length ? "all four" : k.length ? join(k.map((c) => lab(CAP, c).toLowerCase())) : "none of the four";
  };
  const regions = (e) => join(list(e.regions, REGION)) || "no regions";
  const assets = (e) => join(list(e.asset_classes, ASSET)).toLowerCase() || "none";
  const backOffice = (e) => `API ${S(e, "api")}, webhooks ${S(e, "webhooks")} and SFTP ${S(e, "sftp")}`;
  const diff = (e) => (difficulty(ctx, e) ? `${difficulty(ctx, e)} of 5` : "unrated");
  const nDeps = (e) => deps(ctx, e).length;

  const lp = [
    `If your investors or your operations team need documents and data through an API, the registry records the API as ${both(apiText(a), apiText(b))}. Access for the investor itself is recorded as ${both(inv(a), inv(b))}.`,
    `If you want to reach the data from an AI assistant, the MCP server is ${both(S(a, "mcp"), S(b, "mcp"))}. ${offered(st(a, "mcp")) || offered(st(b, "mcp")) ? " A vendor MCP server can still be limited to the vendor's direct customers, so read the research notes below for who may sign in." : ""}`,
    `If you process capital call and distribution notices from your inbox, email notifications are ${both(S(a, "email_notifications"), S(b, "email_notifications"))}.`,
    `If you load files into your own systems, the registry lists ${both(fmts(a), fmts(b))}.`,
    `If you plan to automate your own login, automation in the terms is ${both(POLICY[policy(a)], POLICY[policy(b)])}. Where it is prohibited or unknown, ask the GP or the vendor for a sanctioned channel first.`,
  ];
  const gp = [
    backOffice(a) === backOffice(b)
      ? `If you need to connect the product to your back office, both entries record ${esc(backOffice(a))}.`
      : `If you need to connect the product to your back office, ${esc(A)} records ${esc(backOffice(a))}; ${esc(B)} records ${esc(backOffice(b))}.`,
    `If the product must carry the core LP reporting items (capital calls, distributions, capital account statements and tax documents), the structured capabilities cover ${both(kc(a), kc(b))}.`,
    `If your investors are concentrated in particular markets, the regions recorded are ${both(regions(a), regions(b))}.`,
  ];
  if (a.asset_classes?.length || b.asset_classes?.length)
    gp.push(`If you manage a specific strategy, the asset classes recorded are ${both(assets(a), assets(b))}.`);
  const nd = (n) => `${n} known deployment${n === 1 ? "" : "s"}`;
  gp.push(
    nDeps(a) + nDeps(b) === 0
      ? `If you want to see who already runs each product, the registry has no documented deployments for either yet. Operators can add theirs to the registry.`
      : `If you want to see who already runs each product, the registry documents ${nDeps(a) === nDeps(b) ? `${nd(nDeps(a))} for each` : `${nd(nDeps(a))} for ${esc(A)} and ${nDeps(b)} for ${esc(B)}`}. The portal pages name the operators.`
  );
  gp.push(
    `If your investors will want programmatic access later, the difficulty rating is ${both(diff(a), diff(b))}, where 1 is a documented self-serve API an investor can use and 5 is web login only with MFA.`
  );
  return { lp, gp };
}

function researchNotes(ctx, e) {
  const as = ctx.assessments[e.id] ?? {};
  const ch = [
    ["Web", e.access?.web?.notes],
    ["API", e.access?.api?.notes],
    ["MCP", e.access?.mcp?.notes],
    ["SFTP", e.access?.sftp?.notes],
    ["Webhooks", e.access?.webhooks?.notes],
    ["Email", e.access?.email_notifications?.notes],
    ["Terms", e.terms?.notes],
  ].filter(([, n]) => n);
  return `<h3><a href="/portals/${esc(e.id)}">${esc(e.name)}</a></h3>
${as.rationale ? p(`<strong>Assessment.</strong> ${esc(as.rationale)}`) : ""}
${e.notes ? p(`<strong>Research notes.</strong> ${esc(e.notes)}`) : ""}
${ch.length ? `<ul>${ch.map(([k, n]) => `<li><strong>${k}:</strong> ${esc(n)}</li>`).join("")}</ul>` : ""}
${as.sources?.length ? `<p class="sources">Sources: ${as.sources.map((s) => `<a href="${esc(s)}" rel="noopener nofollow">${esc(s.replace(/^https?:\/\//, ""))}</a>`).join(" · ")}</p>` : ""}`;
}

function faqFor(ctx, a, b, A, B) {
  const apiA = `${A}: API ${statusText(a, "api")}, investor-side access ${INVESTOR_SIDE[investorSide(ctx, a)]}`;
  const apiB = `${B}: API ${statusText(b, "api")}, investor-side access ${INVESTOR_SIDE[investorSide(ctx, b)]}`;
  const mcp = (e, N) => `${N}: ${statusText(e, "mcp").replace("endpoint published", `endpoint ${e.access?.mcp?.endpoint}`)}`;
  const dA = difficulty(ctx, a);
  const dB = difficulty(ctx, b);
  const pol = (e, N) => {
    const x = policy(e);
    return x === "prohibited"
      ? `${N}'s terms prohibit automated access, so use an API, export or delegated user the vendor offers.`
      : x === "permitted"
        ? `${N}'s terms permit automated access through the channels the vendor provides.`
        : x === "tolerated"
          ? `${N}'s terms do not address automated access; credential sharing and security testing are typically still barred.`
          : `${N}'s position on automated access is not recorded; check the terms before automating.`;
  };
  return [
    { q: `Does ${A} or ${B} have an API investors can use?`, a: `${apiA}. ${apiB}. These are registry records from public sources, so confirm current terms with the vendor.` },
    { q: `Do ${A} and ${B} offer an MCP server?`, a: `${mcp(a, A)}. ${mcp(b, B)}. Vendor MCP servers often serve the vendor's direct customers first, such as GP teams, rather than every investor.` },
    {
      q: `How hard is it to get data out of ${A} and ${B} automatically?`,
      a: `The registry rates ${A} ${dA ? `${dA} of 5 (${low1(DIFFICULTY_LABEL[dA])})` : "as unrated"} and ${B} ${dB ? `${dB} of 5 (${low1(DIFFICULTY_LABEL[dB])})` : "as unrated"}. The scale runs from 1, a documented self-serve API an investor can use, to 5, web login only with MFA.`,
    },
    { q: `May I automate my login to ${A} or ${B}?`, a: `${pol(a, A)} ${pol(b, B)}` },
    {
      q: `Is this comparison affiliated with ${A} or ${B}?`,
      a: `No. ${SITE_NAME} is independent community research built from an open registry. It is not affiliated with, sponsored by or reviewed by ${a.vendor.name} or ${b.vendor.name}. Both entries were last updated ${a.updated === b.updated ? `on ${a.updated}` : `on ${a.updated} and ${b.updated}`}, and corrections are welcome by pull request or email to ${CONTACT}.`,
    },
  ];
}

const softwareLd = (e) => ({
  "@type": "SoftwareApplication",
  name: e.name,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: abs(`/portals/${e.id}`),
  ...(e.website ? { sameAs: e.website } : {}),
  author: { "@type": "Organization", name: e.vendor.name, ...(e.vendor.website ? { url: e.vendor.website } : {}) },
});

const pairCategory = (ctx, [a, b]) => ctx.byId.get(a)?.category ?? ctx.byId.get(b)?.category ?? "other";

function relatedPairs(ctx, a, b) {
  const self = comparePath(a.id, b.id);
  const own = [...pairsFor(a.id), ...pairsFor(b.id)];
  const cat = PAIRS.filter((pr) => pairCategory(ctx, pr) === a.category);
  const seen = new Set([self]);
  const out = [];
  for (const pr of [...own, ...cat]) {
    const path = comparePath(...pr);
    if (seen.has(path) || !pr.every((id) => ctx.byId.has(id))) continue;
    seen.add(path);
    out.push(pr);
    if (out.length >= 6) break;
  }
  return out;
}
const pairLabel = (ctx, [x, y]) => `${shortName(ctx.byId.get(x))} vs ${shortName(ctx.byId.get(y))}`;

function renderPair(ctx, a, b) {
  const A = shortName(a);
  const B = shortName(b);
  const path = comparePath(a.id, b.id);
  const title = pairTitle(A, B);
  const h1 = `${A} vs ${B}: API, MCP and investor access compared`;
  const reason = reasonFor(a.id, b.id);
  const description = pickDesc([
    `${A} vs ${B} compared from open registry data: API, MCP, SFTP, webhooks, exports, automation terms and investor-side access.`,
    `${A} vs ${B} compared from open registry data: API, MCP, SFTP, webhooks, email notices, export formats, automation terms and investor-side access.`,
    `${A} vs ${B}: API, MCP, SFTP, webhooks and automation terms compared from open registry data.`,
    `${A} vs ${B}: API, MCP and investor access compared.`,
  ]);
  const crumbs = [
    { name: "Compare", path: "/compare" },
    { name: `${A} vs ${B}`, path },
  ];
  const { diffs, same } = differences(ctx, a, b, A, B);
  const { lp, gp } = fitNeeds(ctx, a, b, A, B);
  const qa = faqFor(ctx, a, b, A, B);
  const rel = relatedPairs(ctx, a, b);
  const lastmod = [a.updated, b.updated].filter(Boolean).sort().at(-1) ?? ctx.latest;
  const unverified = [a, b].filter((e) => (e.verification?.status ?? "unverified") === "unverified").length;

  const body = `<header class="page-head"><div class="wrap">
${breadcrumbs(crumbs)}
<h1>${esc(h1)}</h1>
<p class="lead">${esc(reason)} This page sets the two registry entries side by side: how investors log in, whether an API or MCP server exists and for whom, what files can be exported, and what the terms say about automation.</p>
<div class="meta"><span>Category: ${esc(CATEGORY_LABEL[a.category] ?? a.category)}${a.category !== b.category ? ` and ${esc(CATEGORY_LABEL[b.category] ?? b.category)}` : ""}</span><span>Updated ${esc(lastmod)}</span><span>Independent, not affiliated with either vendor</span></div>
</div></header>

<section class="tight"><div class="wrap">
<div class="callout"><strong>Independent community research.</strong> This comparison is generated from the open ${SITE_NAME} registry (CC0). It is not affiliated with, sponsored by or reviewed by ${esc(a.vendor.name)} or ${esc(b.vendor.name)}. ${
    unverified === 2 ? "Neither entry is vendor verified yet" : unverified === 1 ? "One of the two entries is not vendor verified yet" : "Both entries are vendor verified"
  }, so treat it as a starting point and confirm details with the vendor. If something is wrong or out of date, <a href="/badge">correct the entry</a> by pull request or email <a href="mailto:${CONTACT}?subject=${encodeURIComponent(`Correction: ${A} vs ${B}`)}">${CONTACT}</a>.</div>

<h2 id="table">Side by side</h2>
${cmpTable(ctx, a, b)}
<p class="updated">"Not documented" and "Unknown" mean the researchers found no public statement either way, not that the feature is missing.</p>

<div class="prose">
<h2 id="differences">Key differences</h2>
${diffs.length ? `<ul>${diffs.map((d) => `<li>${d}</li>`).join("")}</ul>` : p("The registry records the same values for both entries on every compared field.")}
${same.length ? `<h3>What the entries have in common</h3><ul>${same.map((s) => `<li>${s}</li>`).join("")}</ul>` : ""}

<h2 id="fit">Which fits which need</h2>
<p>Neither product is right for every team. The statements below are conditional and come straight from the registry fields above.</p>
<h3>For investors and LP operations teams</h3>
<ul>${lp.map((x) => `<li>${x}</li>`).join("")}</ul>
<h3>For GPs, fund administrators and buyers</h3>
<ul>${gp.map((x) => `<li>${x}</li>`).join("")}</ul>
<p>For a structured shortlist beyond these two products, see the guide <a href="${GUIDE_CHOOSE}">how to choose an investor portal</a>.</p>

<h2 id="notes">What the research says</h2>
${researchNotes(ctx, a)}
${researchNotes(ctx, b)}

<h2 id="faq">Frequently asked questions</h2>
</div>
${faq(qa)}

<div class="related">
<h2>Registry entries</h2>
<ul>
<li><a href="/portals/${esc(a.id)}">${logoImg(ctx, a)}${esc(a.name)} investor access</a></li>
<li><a href="/portals/${esc(b.id)}">${logoImg(ctx, b)}${esc(b.name)} investor access</a></li>
<li><a href="/portals/category/${esc(a.category)}">${esc(CATEGORY_PLURAL[a.category] ?? "Entries")} in the registry</a></li>
</ul>
</div>
${
  rel.length
    ? `<div class="related"><h2>Related comparisons</h2><ul>${rel.map((pr) => `<li><a href="${esc(comparePath(...pr))}">${esc(pairLabel(ctx, pr))}</a></li>`).join("")}</ul></div>`
    : ""
}
<div class="related"><h2>More</h2><ul>
<li><a href="/compare">All comparisons</a></li>
<li><a href="${GUIDE_CHOOSE}">How to choose an investor portal</a></li>
<li><a href="/guides/investor-portals-with-api-and-mcp">Investor portals with an API or MCP server</a></li>
</ul></div>
</div></section>`;

  return layout({
    title,
    description,
    path,
    body,
    active: "/compare",
    css: PAGE_CSS,
    jsonld: [
      breadcrumbLd(crumbs),
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `${A} vs ${B}`,
        numberOfItems: 2,
        itemListElement: [a, b].map((e, i) => ({ "@type": "ListItem", position: i + 1, item: softwareLd(e) })),
      },
      faqLd(qa),
    ],
  });
}

const PAGE_CSS = `.cmp-scroll{overflow-x:auto;margin:0 -4px}.cmp{min-width:640px}.cmp thead th{width:39%}.cmp thead th:first-child{width:22%}
.cmp-name{display:inline-flex;align-items:center;gap:10px;text-decoration:none;color:var(--ink);font-weight:600}.cmp-name:hover span{text-decoration:underline;text-underline-offset:3px}
.cmp-name .plogo{width:28px;height:28px;border-radius:7px}.cmp .sub{display:block;margin-top:6px;font-size:13px;line-height:1.5;color:var(--muted)}
.cmp code{font-size:12px;word-break:break-all}.cmp .muted{color:var(--muted)}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.related li a .plogo{width:18px;height:18px}.cmp-group{margin:36px 0 0}.cmp-group h2{font-size:22px;margin:0 0 14px}
.cmp-logos{display:flex;gap:6px;margin-bottom:10px}.cmp-logos .plogo{width:26px;height:26px;border-radius:6px}`;

// ---------- index ----------
function renderIndex(ctx, pairs) {
  const path = "/compare";
  const crumbs = [{ name: "Compare", path }];
  const groups = CATEGORY_ORDER.map((cat) => [cat, pairs.filter((pr) => pairCategory(ctx, pr) === cat)]).filter(([, l]) => l.length);
  const card = (pr) => {
    const [a, b] = pr.map((id) => ctx.byId.get(id));
    return `<a class="card link-card" href="${esc(comparePath(a.id, b.id))}"><div class="cmp-logos">${logoImg(ctx, a, 26)}${logoImg(ctx, b, 26)}</div><h3>${esc(shortName(a))} vs ${esc(
      shortName(b)
    )}</h3><p>${esc(reasonFor(a.id, b.id))}</p><span class="more">API ${esc(STATUS_LABEL[st(a, "api")].toLowerCase())} vs ${esc(STATUS_LABEL[st(b, "api")].toLowerCase())} · MCP ${esc(
      STATUS_LABEL[st(a, "mcp")].toLowerCase()
    )} vs ${esc(STATUS_LABEL[st(b, "mcp")].toLowerCase())}</span></a>`;
  };
  const body = `<header class="page-head"><div class="wrap">
${breadcrumbs(crumbs)}
<h1>Investor portal comparisons</h1>
<p class="lead">${pairs.length} side-by-side comparisons of LP portals, fund administrator portals, data rooms, reporting platforms and marketplaces, generated from the open registry. Each one covers web login, API, MCP, SFTP, webhooks, exports, terms on automation and access for the investor.</p>
<div class="meta"><span>Updated ${esc(ctx.latest)}</span><span>Independent community research</span></div>
</div></header>
<section class="tight"><div class="wrap">
<div class="prose">
<h2>How these comparisons are built</h2>
<p>Every comparison is rendered from two entries in the ${SITE_NAME} registry, an open dataset published under CC0. The registry records, per product, the status of each access channel (available, beta, partner only, planned, not offered or unknown), who an API is for, export formats, capabilities, the automation clauses in the terms and a difficulty rating from 1 to 5 for programmatic access by an investor.</p>
<p>The pairs are chosen by hand: products in the same category, or clear substitutes that buyers and investors put side by side. The text states only differences found in the data. Where both entries are unknown on a channel, the page says so instead of guessing. Nothing is ranked or scored beyond the registry's own difficulty rating, and no vendor has paid for or reviewed a comparison.</p>
<p>Most entries are community research and not yet vendor verified. Vendors can <a href="/badge">correct their entry</a> by pull request or email, and every comparison that uses it updates on the next request. To choose a product for your own funds, start with the guide <a href="${GUIDE_CHOOSE}">how to choose an investor portal</a> or browse the <a href="/portals">full registry</a>.</p>
</div>
${groups
  .map(
    ([cat, l]) => `<div class="cmp-group" id="${esc(cat)}"><h2>${esc(CATEGORY_PLURAL[cat] ?? cat)}</h2><div class="cards">${l.map(card).join("")}</div></div>`
  )
  .join("\n")}
<div class="related"><h2>More</h2><ul>
<li><a href="/portals">Browse the registry</a></li>
<li><a href="${GUIDE_CHOOSE}">How to choose an investor portal</a></li>
<li><a href="/guides/data-rooms-compared">Data rooms compared</a></li>
<li><a href="/guides/investor-portals-with-api-and-mcp">Investor portals with an API or MCP server</a></li>
</ul></div>
</div></section>`;
  return layout({
    title: "Investor portal comparisons: API, MCP and access",
    description: `${pairs.length} side-by-side comparisons of LP portals, data rooms and fund administrator portals: API, MCP, exports and automation terms, from open data.`,
    path,
    body,
    active: "/compare",
    css: PAGE_CSS,
    jsonld: [
      breadcrumbLd(crumbs),
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Investor portal comparisons",
        numberOfItems: pairs.length,
        itemListElement: pairs.map((pr, i) => ({ "@type": "ListItem", position: i + 1, name: pairLabel(ctx, pr), url: abs(comparePath(...pr)) })),
      },
    ],
  });
}

export async function pages(ctx) {
  const pairs = PAIRS.filter(([a, b]) => a !== b && ctx.byId.has(a) && ctx.byId.has(b));
  const out = [
    { path: "/compare", render: () => renderIndex(ctx, pairs), lastmod: ctx.latest, priority: 0.7 },
  ];
  for (const [x, y] of pairs) {
    const a = ctx.byId.get(x);
    const b = ctx.byId.get(y);
    out.push({
      path: comparePath(x, y),
      render: () => renderPair(ctx, a, b),
      lastmod: [a.updated, b.updated].filter(Boolean).sort().at(-1) ?? ctx.latest,
      priority: 0.6,
    });
  }
  return out;
}
