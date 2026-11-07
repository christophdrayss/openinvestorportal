// Registry pages: /portals (full registry), /portals/category/{category} (hubs) and /portals/{id} (one per entry).
// Everything is written from registry/portals/*.json, research/assessments.json and registry/deployments.json.
import {
  esc,
  abs,
  pill,
  diffBadge,
  logoImg,
  portalLink,
  extLink,
  breadcrumbs,
  breadcrumbLd,
  faq,
  faqLd,
  STATUS_LABEL,
  CATEGORY_LABEL,
  DIFFICULTY_LABEL,
  layout,
} from "./layout.mjs";
import { SITE_NAME } from "./context.mjs";
import { adminPath, canonicalAdmin } from "./admins.mjs";
import { pairsFor, comparePath } from "./compare-pairs.mjs";
import { badgeSnippet } from "./badge.mjs";

// ---------------------------------------------------------------------------------------------
// Labels and vocabulary
// ---------------------------------------------------------------------------------------------

const CATEGORY_ORDER = ["lp-portal", "fund-admin-portal", "data-room", "reporting-platform", "marketplace", "cap-table", "other"];

// Plural labels for hub pages and registry groups. `title` is used where `plural` would make the <title> too long.
const CATEGORY_HUB = {
  "lp-portal": { plural: "LP portals", title: "LP portals", noun: "an LP portal" },
  "fund-admin-portal": { plural: "Fund administrator portals", title: "Fund admin portals", noun: "a fund administrator portal" },
  "data-room": { plural: "Data rooms", title: "Data rooms", noun: "a data room" },
  "reporting-platform": { plural: "Investor reporting platforms", title: "Reporting platforms", noun: "an investor reporting platform" },
  marketplace: { plural: "Investment platforms and marketplaces", title: "Investment marketplaces", noun: "an investment platform or marketplace" },
  "cap-table": { plural: "Cap table platforms", title: "Cap table platforms", noun: "a cap table platform" },
  other: { plural: "Other investor platforms", title: "Other investor platforms", noun: "an investor platform" },
};

// One factual sentence of context per hub. Kept generic so it holds for every entry in the category.
const CATEGORY_CONTEXT = {
  "lp-portal": "LP portals are the web portals a GP or its administrator uses to publish capital call notices, distribution notices, statements and reports to investors.",
  "fund-admin-portal": "Fund administrator portals are run by the administrator itself, so an investor in several funds with the same administrator usually meets one portal for all of them.",
  "data-room": "Data rooms hold documents shared with prospective and existing investors, mostly during fundraising and due diligence.",
  "reporting-platform": "Reporting platforms collect, aggregate or analyse investor data across funds, often on the investor side rather than the fund side.",
  marketplace: "Investment platforms and marketplaces give investors access to private market funds and hold their documents and statements in the platform account.",
  "cap-table": "Cap table platforms record ownership and share transactions and often hold investor documents alongside them.",
  other: "Other investor platforms cover onboarding, communications and adjacent tools that hold investor documents.",
};

const REGION_LABEL = {
  global: "Global",
  "north-america": "North America",
  europe: "Europe",
  uk: "UK",
  dach: "DACH",
  apac: "APAC",
  latam: "Latin America",
  "middle-east": "Middle East",
};
const ASSET_LABEL = {
  "private-equity": "Private equity",
  "venture-capital": "Venture capital",
  "private-credit": "Private credit",
  "real-estate": "Real estate",
  infrastructure: "Infrastructure",
  "hedge-fund": "Hedge funds",
  "fund-of-funds": "Fund of funds",
  other: "Other",
};
const POLICY_LABEL = {
  permitted: "Permitted",
  tolerated: "Tolerated (not addressed in terms)",
  prohibited: "Prohibited by the terms",
  unknown: "Unknown (terms not checked)",
};
const VERIFICATION_LABEL = {
  unverified: "Unverified community research",
  "community-verified": "Community verified",
  "vendor-verified": "Vendor verified",
};
const CONFIDENCE_LABEL = { confirmed: "Confirmed", likely: "Likely", unknown: "Unknown" };
const AUDIENCE_LABEL = { lp: "investors (LPs)", gp: "GPs", "fund-admin": "fund administrators", partner: "partners" };
const AUTH_LABEL = {
  "oauth2-client-credentials": "OAuth 2.0 client credentials",
  "oauth2-authorization-code": "OAuth 2.0 authorization code",
  oauth2: "OAuth 2.0",
  "api-key": "API key",
  basic: "Basic auth",
  jwt: "JWT",
  mtls: "Mutual TLS",
  none: "None",
  other: "Other",
};
const SSO_LABEL = { saml: "SAML", oidc: "OpenID Connect", microsoft: "Microsoft", google: "Google", none: "None" };
const MFA_LABEL = { totp: "Authenticator app", sms: "SMS", email: "Email", push: "Push", "hardware-key": "Hardware key", none: "None" };
const TRANSPORT_LABEL = { "streamable-http": "Streamable HTTP", sse: "SSE", stdio: "stdio" };
const CAPABILITY_LABEL = {
  documents: "Documents",
  capital_calls: "Capital call notices",
  distributions: "Distribution notices",
  capital_account_statements: "Capital account statements",
  nav: "NAV",
  performance: "Performance data",
  tax_documents: "Tax documents (K-1 and similar)",
  fund_reports: "Fund reports",
  cap_table: "Cap table",
  subscriptions: "Subscriptions",
  kyc: "KYC and onboarding",
  messaging: "Messaging",
  other: "Other",
};
const STANDARD_LABEL = {
  "ilpa-reporting-template": "ILPA reporting template",
  "ilpa-capital-call-template": "ILPA capital call template",
  "ilpa-distribution-template": "ILPA distribution template",
  "ilpa-performance-template": "ILPA performance template",
  openapi: "OpenAPI",
  oauth2: "OAuth 2.0",
  "saml-sso": "SAML SSO",
  scim: "SCIM",
  other: "Other",
};
const EXPORT_LABEL = { pdf: "PDF", xlsx: "XLSX", csv: "CSV", xml: "XML", json: "JSON", "ilpa-template": "ILPA template", fundsxml: "FundsXML", other: "other formats" };

const CHANNELS = [
  ["web", "Web portal"],
  ["api", "API"],
  ["mcp", "MCP server"],
  ["sftp", "SFTP"],
  ["webhooks", "Webhooks"],
  ["email_notifications", "Email notifications"],
];

const GUIDES = {
  automate: ["/guides/automate-capital-call-notices", "How to automate capital call notices"],
  partnerOnly: ["/guides/partner-only-portal-access-explained", "Partner-only portal access explained"],
  choose: ["/guides/how-to-choose-an-investor-portal", "How to choose an investor portal"],
  apiMcp: ["/guides/investor-portals-with-api-and-mcp", "Investor portals with an API and MCP server"],
  canoe: ["/guides/canoe-alternatives", "Canoe alternatives for LP document collection"],
  dataRooms: ["/guides/data-rooms-compared", "Data rooms compared"],
};

const TITLE_SUFFIX = ": API, MCP and document access";
const TITLE_MAX = 60;
const OFFERED = new Set(["available", "beta", "partner-only"]);
const CONTACT = "mailto:hello@openinvestorportal.com?subject=Registry%20correction";

// ---------------------------------------------------------------------------------------------
// Small text helpers
// ---------------------------------------------------------------------------------------------

const status = (entry, ch) => entry.access?.[ch]?.status ?? "unknown";
const offers = (entry, ch) => OFFERED.has(status(entry, ch));
const label = (map, v) => map[v] ?? v;
const labels = (map, list) => (list ?? []).filter((v) => v !== undefined).map((v) => label(map, v));
const plural = (n, one, many = one + "s") => `${n} ${n === 1 ? one : many}`;
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
// Lowercase the first letter for use mid-sentence, but leave acronyms such as NAV, KYC or LP alone.
const lowerFirst = (s) => (s && !/^[A-Z]{2}/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);
const sentence = (s) => (s && !/[.!?]$/.test(s.trim()) ? s.trim() + "." : (s ?? "").trim());

/** "a, b and c" */
const andList = (items) => {
  const xs = items.filter(Boolean);
  if (xs.length <= 2) return xs.join(" and ");
  return `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`;
};

const NUMBER_WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const num = (n) => NUMBER_WORDS[n] ?? String(n);

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const countryName = (code) => {
  if (!code) return "Not recorded";
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
};

/** Trim to max characters on a word boundary. */
const clip = (s, max) => (s.length <= max ? s : s.slice(0, s.lastIndexOf(" ", max - 1)).replace(/[,;:]$/, "") + ".");

const hubPath = (category) => `/portals/category/${category}`;
const portalPath = (id) => `/portals/${id}`;
const internal = ([href, text]) => `<a href="${esc(href)}">${esc(text)}</a>`;
const srcLink = (href) => {
  const text = href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  return `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(text)}</a>`;
};

/** Investor-side API flag from the assessment. The research uses three key names for the same idea. */
const investorApi = (a) => a?.lp_side_api ?? a?.investor_side_api ?? a?.recipient_side_api ?? "unknown";

const styleLabel = (st) => ({ rest: "REST", graphql: "GraphQL", soap: "SOAP", odata: "OData", other: "other" })[st] ?? st;
const audienceText = (aud) => andList(labels(AUDIENCE_LABEL, aud));

// ---------------------------------------------------------------------------------------------
// Titles and names
// ---------------------------------------------------------------------------------------------

// Hand-picked short names where the generic shortening would lose the product or the vendor.
const SHORT_NAME = {
  "ssc-globeop-investor-portal": "SS&C GlobeOp Portal",
  "intralinks-fundcentre": "Intralinks FundCentre",
  "fis-digital-data-exchange": "FIS Data Exchange",
  "universal-investment-powerportal": "UI PowerPortal",
};
const GENERIC_SUFFIX = / (Investor Portal|Investment Portal|Client Portal|Virtual Data Room|Secure Dataroom|Data Room)$/;

/** Name used in the <title>, short enough to keep "{name}: API, MCP and document access" within 60 characters. */
function titleName(entry) {
  const room = TITLE_MAX - TITLE_SUFFIX.length;
  const noParen = entry.name.replace(/\s*\([^)]*\)\s*/g, " ").trim();
  const candidates = [entry.name, SHORT_NAME[entry.id], noParen, noParen.replace(GENERIC_SUFFIX, "")];
  return candidates.find((c) => c && c.length <= room) ?? clip(noParen, room).replace(/\.$/, "");
}

// ---------------------------------------------------------------------------------------------
// Sentences written from the data
// ---------------------------------------------------------------------------------------------

function apiPhrase(entry) {
  const api = entry.access?.api ?? {};
  const aud = api.audience?.length ? ` for ${audienceText(api.audience)}` : "";
  switch (api.status) {
    case "available":
      return `the API is available${aud}`;
    case "partner-only":
      return `the API is partner only${aud}`;
    case "beta":
      return `the API is in beta${aud}`;
    case "planned":
      return "an API is planned";
    case "none":
      return "there is no API";
    default:
      return "API availability is unknown";
  }
}

function mcpPhrase(entry) {
  const mcp = entry.access?.mcp ?? {};
  const who = mcp.maintainer === "vendor" ? "vendor " : mcp.maintainer === "community" ? "community " : "";
  switch (mcp.status) {
    case "available":
      return `a ${who}MCP server is available`;
    case "beta":
      return `a ${who}MCP server is in beta`;
    case "partner-only":
      return "an MCP server is offered to partners only";
    case "planned":
      return "an MCP server is planned";
    case "none":
      return "there is no MCP server";
    default:
      return "MCP support is unknown";
  }
}

function lead(entry, a) {
  const hub = CATEGORY_HUB[entry.category] ?? CATEGORY_HUB.other;
  const regions = entry.regions ?? [];
  const where = regions.includes("global")
    ? "used globally"
    : regions.length
      ? `used in ${andList(labels(REGION_LABEL, regions))}`
      : "";
  const assets = (entry.asset_classes ?? []).filter((x) => x !== "other");
  const what = assets.length ? `for ${andList(labels(ASSET_LABEL, assets).map(lowerFirst))}` : "";
  const from = entry.name.toLowerCase().startsWith(entry.vendor.name.toLowerCase()) ? "" : ` from ${entry.vendor.name}`;
  const first = `${entry.name} is ${hub.noun}${from}${where ? ", " + where : ""}${what ? " " + what : ""}.`;
  const rating = a?.difficulty
    ? `The registry rates investor document access ${a.difficulty} of 5 (${lowerFirst(DIFFICULTY_LABEL[a.difficulty])}): `
    : "Investor document access is not yet rated: ";
  return `${first} ${rating}${apiPhrase(entry)}, and ${mcpPhrase(entry)}.`;
}

function description(entry, a, deps) {
  const d = a?.difficulty ? ` Investor access rated ${a.difficulty} of 5.` : "";
  const tail = deps.length ? " How LPs get documents, who runs it, and sources." : " How LPs get documents today, terms and sources.";
  const st = (ch) => lowerFirst(STATUS_LABEL[status(entry, ch)]);
  const core = `API ${st("api")}, MCP ${st("mcp")}, SFTP ${st("sftp")}.`;
  const options = [
    `${entry.name} by ${entry.vendor.name}: ${core}${d}${tail}`,
    `${entry.name}: ${core}${d}${tail}`,
    `${titleName(entry)}: ${core}${d}${tail}`,
    `${titleName(entry)}: ${core}${d}`,
  ];
  return options.find((o) => o.length <= 160 && o.length >= 120) ?? options.find((o) => o.length <= 160) ?? clip(options.at(-1), 160);
}

/** Practical routes for an investor, chosen from channel statuses, audience, policy and difficulty. Returns HTML list items. */
function investorRoutes(entry, a) {
  const acc = entry.access ?? {};
  const api = acc.api ?? {};
  const aud = api.audience ?? [];
  const lpApi = investorApi(a) === true || aud.includes("lp");
  const routes = [];
  const partnerGuide = internal(GUIDES.partnerOnly);
  const notifyGuide = internal(GUIDES.automate);

  if (api.status === "available" && lpApi) {
    routes.push(
      `<strong>Use the API.</strong> The API is open to ${audienceText(aud) || "investors"}. Ask the vendor for credentials for your organisation${api.docs_url ? " and start from the API documentation linked above" : ""}.`
    );
  } else if (api.status === "partner-only" && lpApi) {
    routes.push(
      `<strong>Ask about API access.</strong> The API is partner only, but investors are among its listed users. Expect a commercial agreement with ${esc(entry.vendor.name)} before credentials are issued. See ${partnerGuide}.`
    );
  } else if (OFFERED.has(api.status)) {
    const who = aud.length ? audienceText(aud) : "the vendor's clients and partners";
    routes.push(
      `<strong>The API is for ${esc(who)}, not for investors.</strong> Ask the GP or administrator to deliver documents to a nominated email address or SFTP folder, or to send a data feed from their side of the API. See ${partnerGuide}.`
    );
  } else {
    routes.push(
      `<strong>Ask the GP or administrator for delivery.</strong> With no investor API on record, the practical route is delivery of notices and reports to a nominated email address, an SFTP folder or a data feed set up by the fund side.`
    );
  }

  if (OFFERED.has(acc.mcp?.status)) {
    const scope = acc.mcp.status === "partner-only" ? "is offered to partners only" : acc.mcp.status === "beta" ? "is in beta" : "is available";
    routes.push(
      `<strong>MCP server.</strong> An MCP server ${scope}. The registry has not confirmed that an investor account can connect to it, so check with ${esc(entry.vendor.name)} before relying on it.`
    );
  }
  if (OFFERED.has(acc.sftp?.status)) {
    routes.push(`<strong>SFTP.</strong> SFTP delivery is ${lowerFirst(STATUS_LABEL[acc.sftp.status])}. Ask the GP or administrator whether documents can be pushed to an SFTP server you control.`);
  }
  if (acc.email_notifications?.status === "available") {
    routes.push(
      `<strong>Email notifications.</strong> Turn on notifications and route them to a monitored mailbox, so new notices trigger your own processing. See ${notifyGuide}.`
    );
  } else {
    routes.push(`<strong>Notifications.</strong> Email notifications are ${lowerFirst(STATUS_LABEL[acc.email_notifications?.status ?? "unknown"])} in the registry. Where they exist, routing them to a monitored mailbox is the first step in ${notifyGuide}.`);
  }
  if (acc.web?.status === "available") {
    const formats = labels(EXPORT_LABEL, acc.export_formats);
    routes.push(
      `<strong>Manual download.</strong> Download documents from the web portal${formats.length ? ` (exports recorded: ${esc(andList(formats))})` : ""}.${a?.difficulty === 5 ? " MFA on each session makes unattended access impractical." : ""}`
    );
  }

  const policy = entry.terms?.automation_policy ?? "unknown";
  if (policy === "prohibited") {
    routes.push(`<strong>No scraping.</strong> The terms prohibit automated access. Do not scrape the portal or run browser automation against it. Use the routes above.`);
  } else if (policy === "permitted") {
    routes.push(`<strong>Automation.</strong> The terms or the vendor permit consented automation. Use your own credentials and the documented interfaces.`);
  } else if (policy === "tolerated") {
    routes.push(`<strong>Automation.</strong> The terms do not address automated access. Read them before automating anything, and prefer the documented routes above.`);
  } else {
    routes.push(`<strong>Check the terms.</strong> The registry has not reviewed the terms for automated access. Read them before automating anything.`);
  }
  return routes;
}

function apiAnswer(entry) {
  const api = entry.access?.api ?? {};
  const name = entry.name;
  const aud = api.audience?.length ? audienceText(api.audience) : null;
  const lp = api.audience?.includes("lp");
  const kind = api.style ? `a ${styleLabel(api.style)} API` : "an API";
  const docs = api.docs_url ? " Public documentation is linked on this page." : "";
  switch (api.status) {
    case "available":
      return `Yes. ${name} has ${kind}${aud ? ` for ${aud}` : ""}.${docs}${aud && !lp ? " Investors are not listed among its users, so an LP usually cannot get credentials directly." : ""}`;
    case "beta":
      return `An API is in beta${aud ? ` for ${aud}` : ""}.${docs} Coverage and access terms may change.`;
    case "partner-only":
      return `Only for partners. The registry records ${kind} that requires an agreement with ${entry.vendor.name}${aud ? `, aimed at ${aud}` : ""}.${lp ? " Investors are among the listed users, but access is not self-serve." : " There is no self-serve API for investors."}`;
    case "planned":
      return `Not yet. An API is listed as planned for ${name}. No release date is recorded.`;
    case "none":
      return `No. The registry records no API for ${name}.`;
    default:
      return `Not confirmed. The research behind this entry found no public API documentation for ${name}, and nobody has confirmed whether an API exists. ${entry.vendor.name} can correct the entry.`;
  }
}

function mcpAnswer(entry) {
  const mcp = entry.access?.mcp ?? {};
  const name = entry.name;
  const who = mcp.maintainer === "vendor" ? `${entry.vendor.name} maintains it.` : mcp.maintainer === "community" ? "It is maintained by the community, not the vendor." : "";
  const caveat = " The registry has not confirmed that an investor account can use it.";
  switch (mcp.status) {
    case "available":
      return `Yes. An MCP server is available for ${name}. ${who}${caveat}`.replace(/\s+/g, " ").trim();
    case "beta":
      return `An MCP server for ${name} is in beta. ${who}${caveat}`.replace(/\s+/g, " ").trim();
    case "partner-only":
      return `Only for partners. An MCP server exists for ${name} but is not open to investors on a self-serve basis.`;
    case "planned":
      return `Not yet. An MCP server is listed as planned for ${name}.`;
    case "none":
      return `No. The registry records no MCP server for ${name}.`;
    default:
      return `Not known. No MCP server for ${name} has been found or confirmed. ${entry.vendor.name} can correct the entry.`;
  }
}

function downloadAnswer(entry, a) {
  const lp = investorApi(a);
  const parts = [];
  if (a?.difficulty) parts.push(`The registry rates investor access ${a.difficulty} of 5: ${lowerFirst(DIFFICULTY_LABEL[a.difficulty])}.`);
  if (a?.rationale) parts.push(sentence(a.rationale));
  if (lp === true) parts.push("The research records an investor-side API.");
  else if (lp === false) parts.push("The research records no investor-side API.");
  else parts.push("Whether an investor can get API access is not documented.");
  if (lp !== true) parts.push("The usual route is delivery by the GP or administrator to a nominated email address, SFTP folder or data feed.");
  if (entry.terms?.automation_policy === "prohibited") parts.push("The terms prohibit automated access, so scraping is not an option.");
  return parts.join(" ");
}

function whoAnswer(entry, deps) {
  // One mention per operator, with any administrators that are not already in the operator name.
  const admins = new Map();
  for (const d of deps) {
    const list = admins.get(d.operator) ?? new Set();
    const admin = canonicalAdmin(d.administrator);
    if (admin && !d.operator.includes(admin)) list.add(admin);
    admins.set(d.operator, list);
  }
  const names = [...admins].map(([op, list]) => (list.size ? `${op} (administrator ${andList([...list])})` : op));
  return `The registry records ${plural(deps.length, "known deployment")}: ${andList(names)}. Confidence varies by deployment and the list is not complete.`;
}

// ---------------------------------------------------------------------------------------------
// HTML blocks
// ---------------------------------------------------------------------------------------------

const CSS = `.channels td{white-space:normal}.channels td.note{min-width:240px}.channels .muted,.muted{color:var(--muted)}
.tablewrap{margin:12px 0 8px}.reg-group{margin:40px 0 0}.reg-group h2{font-size:22px;margin:0 0 6px}.reg-group p{margin:0 0 12px;color:var(--ink2)}
.routes li{margin:10px 0}.disclaimer{font-size:13.5px;color:var(--muted);margin:28px 0 0}.deps td{white-space:normal}
.hubs{display:flex;flex-wrap:wrap;gap:8px 10px;list-style:none;padding:0;margin:12px 0 0}.hubs a{display:inline-block;padding:6px 12px;border:1px solid var(--line);border-radius:999px;text-decoration:none;font-size:14px;background:#fff}
.facts .v .pill{margin:0}`;

function registryTable(ctx, entries, { policy = false } = {}) {
  const rows = entries
    .map((e) => {
      const a = ctx.assessments[e.id];
      return `<tr><td>${portalLink(ctx, e)}</td><td>${esc(e.vendor.name)}</td><td>${pill(status(e, "api"))}</td><td>${pill(status(e, "mcp"))}</td><td>${pill(status(e, "sftp"))}</td><td>${diffBadge(a?.difficulty)}</td>${policy ? `<td>${esc(label(POLICY_LABEL, e.terms?.automation_policy ?? "unknown"))}</td>` : ""}</tr>`;
    })
    .join("");
  return `<div class="tablewrap"><table>
<thead><tr><th scope="col">Portal</th><th scope="col">Vendor</th><th scope="col">API</th><th scope="col">MCP</th><th scope="col">SFTP</th><th scope="col">Difficulty</th>${policy ? '<th scope="col">Automation</th>' : ""}</tr></thead>
<tbody>${rows}</tbody></table></div>`;
}

function itemListLd(ctx, entries, name) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: entries.length,
    itemListElement: entries.map((e, i) => ({ "@type": "ListItem", position: i + 1, name: e.name, url: abs(portalPath(e.id)) })),
  };
}

const factRow = (k, v) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`;

function factsGrid(ctx, entry, a) {
  const vendor = entry.vendor.website ? extLink(entry.vendor.website, entry.vendor.name) : esc(entry.vendor.name);
  const hub = hubFor(ctx, entry.category);
  const cat = esc(CATEGORY_LABEL[entry.category] ?? entry.category);
  return `<dl class="facts">
${factRow("Vendor", vendor + (entry.vendor.country ? ` <span class="muted">${esc(countryName(entry.vendor.country))}</span>` : ""))}
${factRow("Category", hub ? `<a href="${hubPath(entry.category)}">${cat}</a>` : cat)}
${factRow("Regions", esc(labels(REGION_LABEL, entry.regions).join(", ") || "Not recorded"))}
${factRow("Asset classes", esc(labels(ASSET_LABEL, entry.asset_classes).join(", ") || "Not recorded"))}
${factRow("Investor access difficulty", `${diffBadge(a?.difficulty)}${a?.difficulty ? ` <span class="muted">${esc(DIFFICULTY_LABEL[a.difficulty])}</span>` : ""}`)}
${factRow("Automation policy", esc(label(POLICY_LABEL, entry.terms?.automation_policy ?? "unknown")))}
${factRow("Verification", esc(label(VERIFICATION_LABEL, entry.verification.status)))}
${factRow("Last updated", `<time datetime="${esc(entry.updated)}">${esc(entry.updated)}</time>`)}
</dl>`;
}

/** Auth, docs and notes cells for one channel. */
function channelCells(key, ch) {
  const auth = [];
  const docs = [];
  const notes = [];
  if (key === "web") {
    if (ch.sso?.length) auth.push(`SSO: ${labels(SSO_LABEL, ch.sso).join(", ")}`);
    if (ch.mfa?.length) auth.push(`MFA: ${labels(MFA_LABEL, ch.mfa).join(", ")}`);
    if (ch.automation_friendly === true) notes.push("No bot blocking recorded.");
    if (ch.automation_friendly === false) notes.push("Bot blocking or CAPTCHA recorded.");
  } else {
    auth.push(...labels(AUTH_LABEL, ch.auth));
  }
  if (key === "api") {
    if (ch.style) notes.push(`Style: ${styleLabel(ch.style)}.`);
    if (ch.audience?.length) notes.push(`Audience: ${audienceText(ch.audience)}.`);
    if (ch.sandbox === true) notes.push("Sandbox available.");
    if (ch.rate_limits) notes.push(`Rate limits: ${sentence(ch.rate_limits)}`);
    if (ch.openapi_url) docs.push(extLink(ch.openapi_url, "OpenAPI spec"));
  }
  if (key === "mcp") {
    if (ch.transport?.length) notes.push(`Transport: ${labels(TRANSPORT_LABEL, ch.transport).join(", ")}.`);
    if (ch.maintainer && ch.maintainer !== "unknown") notes.push(`Maintained by the ${ch.maintainer}.`);
    if (ch.endpoint) notes.push(`Endpoint: <code>${esc(ch.endpoint)}</code>.`);
    if (ch.official_registry_name) notes.push(`MCP Registry name: <code>${esc(ch.official_registry_name)}</code>.`);
    if (ch.source_url) docs.push(extLink(ch.source_url, "Source"));
  }
  if (ch.docs_url) docs.unshift(extLink(ch.docs_url, "Docs"));
  if (ch.notes) notes.push(esc(ch.notes));
  const none = '<span class="muted">Not recorded</span>';
  return {
    auth: auth.length ? esc(auth.join("; ")) : none,
    docs: docs.length ? docs.join("<br>") : none,
    notes: notes.length ? notes.join(" ") : none,
  };
}

function channelsTable(entry) {
  const rows = CHANNELS.map(([key, name]) => {
    const ch = entry.access?.[key] ?? { status: "unknown" };
    const c = channelCells(key, ch);
    return `<tr><td>${esc(name)}</td><td>${pill(ch.status)}</td><td>${c.auth}</td><td>${c.docs}</td><td class="note">${c.notes}</td></tr>`;
  }).join("\n");
  return `<div class="tablewrap"><table class="channels">
<thead><tr><th scope="col">Channel</th><th scope="col">Status</th><th scope="col">Auth</th><th scope="col">Docs</th><th scope="col">Notes</th></tr></thead>
<tbody>
${rows}
</tbody></table></div>`;
}

function deploymentsBlock(entry, deps) {
  if (!deps.length) return "";
  const rows = deps
    .map((d) => {
      const op = d.operator_website ? extLink(d.operator_website, d.operator) : esc(d.operator);
      const adminName = canonicalAdmin(d.administrator);
      const adminHref = adminPath(d.administrator);
      const admin = adminName ? (adminHref ? `<a href="${esc(adminHref)}">${esc(adminName)}</a>` : esc(adminName)) : '<span class="muted">Not recorded</span>';
      const portal = d.portal_name ? `<span class="sub" style="display:block;font-size:12.5px;color:var(--muted)">${esc(d.portal_name)}</span>` : "";
      return `<tr><td>${op}${portal}</td><td>${admin}</td><td>${esc(countryName(d.country))}</td><td>${esc(label(CONFIDENCE_LABEL, d.confidence ?? "unknown"))}</td></tr>`;
    })
    .join("");
  return `<h2 id="who-runs-it">Who runs it</h2>
<p>Funds and administrators known to run ${esc(entry.name)}, from public sources. "Likely" means the link is inferred, not stated. The list is not complete.</p>
<div class="tablewrap"><table class="deps">
<thead><tr><th scope="col">Fund or operator</th><th scope="col">Administrator</th><th scope="col">Country</th><th scope="col">Confidence</th></tr></thead>
<tbody>${rows}</tbody></table></div>`;
}

function capabilitiesBlock(entry) {
  const caps = labels(CAPABILITY_LABEL, entry.capabilities);
  const stds = labels(STANDARD_LABEL, entry.standards);
  const formats = labels(EXPORT_LABEL, entry.access?.export_formats);
  const terms = entry.terms ?? {};
  return `<h2 id="capabilities">Capabilities and terms</h2>
<p>${caps.length ? `What ${esc(entry.name)} exposes to investors, according to the research: ${esc(andList(caps.map(lowerFirst)))}.` : "No capabilities are recorded yet."}</p>
<ul>
<li><strong>Export formats:</strong> ${esc(formats.join(", ") || "Not recorded")}</li>
<li><strong>Standards:</strong> ${esc(stds.join(", ") || "None recorded")}</li>
<li><strong>Terms of service:</strong> ${terms.tos_url ? extLink(terms.tos_url, "Read the terms") : "No terms link recorded"}</li>
<li><strong>Automation policy:</strong> ${esc(label(POLICY_LABEL, terms.automation_policy ?? "unknown"))}${terms.notes ? `. ${esc(sentence(terms.notes))}` : ""}</li>
</ul>`;
}

function oippBlock(entry) {
  const st = entry.oipp?.status ?? "none";
  const on = st === "available" || st === "beta";
  const head = on
    ? `<p><strong>${esc(entry.name)} supports the Open Investor Portal Protocol${entry.oipp.version ? ` version ${esc(entry.oipp.version)}` : ""}${st === "beta" ? " in beta" : ""}.</strong> Investors can link their own OIPP key and fetch documents through one interface.</p>`
    : `<p><strong>Not yet on the open protocol.</strong> ${esc(entry.name)} does not implement the Open Investor Portal Protocol (OIPP), the open API any portal can implement so investors reach every portal through one interface with their own key.</p>`;
  return `<h2 id="oipp">OIPP status</h2>
${head}
<div class="callout"><strong>For ${esc(entry.vendor.name)}.</strong> If anything on this page is wrong or out of date, correct the entry by pull request to the registry or by <a href="${CONTACT}">email</a>. A pull request from a vendor-owned domain marks the entry vendor verified. ${on ? "" : "Implementing OIPP lets investors and their agents fetch documents without scraping, under your own access rules. "}See <a href="/badge">the registry badge</a> for how to show your status.</div>
${badgeSnippet(entry)}`;
}

function relatedBlock(ctx, entry) {
  const pairs = pairsFor(entry.id)
    .filter(([x, y]) => ctx.byId.has(x) && ctx.byId.has(y))
    .map(([x, y]) => [comparePath(x, y), `${ctx.byId.get(x).name} vs ${ctx.byId.get(y).name}`]);
  const peers = ctx.portals.filter((p) => p.category === entry.category && p.id !== entry.id).sort(byName);
  const guides = [GUIDES.automate];
  if (OFFERED.has(status(entry, "api")) && status(entry, "api") !== "available") guides.push(GUIDES.partnerOnly);
  if (offers(entry, "api") || offers(entry, "mcp")) guides.push(GUIDES.apiMcp);
  if (entry.category === "data-room") guides.push(GUIDES.dataRooms);
  if (entry.category === "reporting-platform") guides.push(GUIDES.canoe);
  guides.push(GUIDES.choose);
  if (!guides.includes(GUIDES.partnerOnly)) guides.push(GUIDES.partnerOnly);
  const hub = hubFor(ctx, entry.category);
  const list = (items) => `<ul>${items.join("")}</ul>`;
  const li = ([href, text]) => `<li><a href="${esc(href)}">${esc(text)}</a></li>`;
  return `<div class="related">
${pairs.length ? `<h2>Comparisons</h2>${list(pairs.map(li))}` : ""}
${peers.length ? `<h2${pairs.length ? ' style="margin-top:22px"' : ""}>Other ${esc(lowerFirst((CATEGORY_HUB[entry.category] ?? CATEGORY_HUB.other).plural))}</h2>${list(peers.map((p) => `<li><a href="${portalPath(p.id)}">${logoImg(ctx, p, 16)}${esc(p.name)}</a></li>`))}` : ""}
<h2 style="margin-top:22px">Guides</h2>${list(guides.map(li))}
<h2 style="margin-top:22px">More in the registry</h2>${list(
    [hub ? [hubPath(entry.category), `${hub.plural} compared`] : null, ["/portals", "Full investor portal registry"], ["/compare", "All comparisons"]].filter(Boolean).map(li)
  )}
</div>`;
}

function sourcesBlock(entry, a) {
  const sources = [...new Set(a?.sources ?? [])];
  return `<h2 id="sources">Sources and notes</h2>
${entry.notes ? `<p>${esc(entry.notes)}</p>` : ""}
${sources.length ? `<div class="sources"><p>Sources checked for the assessment:</p><ul>${sources.map((s) => `<li>${srcLink(s)}</li>`).join("")}</ul></div>` : '<p class="sources">No sources recorded for the assessment yet.</p>'}`;
}

const byName = (x, y) => x.name.localeCompare(y.name, "en", { sensitivity: "base" });

/** Hub definition for a category, or null when the category has fewer than 3 entries. */
function hubFor(ctx, category) {
  const count = ctx.portals.filter((p) => p.category === category).length;
  return count >= 3 ? CATEGORY_HUB[category] ?? null : null;
}

// ---------------------------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------------------------

function renderPortal(ctx, entry) {
  const a = ctx.assessments[entry.id];
  const deps = ctx.deployments.filter((d) => d.product === entry.id);
  const path = portalPath(entry.id);
  const hub = hubFor(ctx, entry.category);
  const crumbs = [{ name: "Registry", path: "/portals" }, ...(hub ? [{ name: hub.plural, path: hubPath(entry.category) }] : []), { name: entry.name, path }];

  const qa = [
    { q: `Does ${entry.name} have an API?`, a: apiAnswer(entry) },
    { q: `Does ${entry.name} have an MCP server?`, a: mcpAnswer(entry) },
    { q: `Can investors download documents from ${entry.name} programmatically?`, a: downloadAnswer(entry, a) },
    ...(deps.length ? [{ q: `Who uses ${entry.name}?`, a: whoAnswer(entry, deps) }] : []),
  ];

  const lpFlag = investorApi(a);
  const lpLine =
    lpFlag === true
      ? "The research records an investor-side API."
      : lpFlag === false
        ? "The research records no investor-side API."
        : "Whether an investor can get API access is not documented.";

  const body = `<header class="page-head"><div class="wrap">
${breadcrumbs(crumbs)}
<div class="title-row"><h1>${esc(entry.name)}: API, MCP and document access</h1></div>
<p class="lead">${esc(lead(entry, a))}</p>
<div class="meta"><span>Vendor: ${esc(entry.vendor.name)}</span><span>${esc(label(VERIFICATION_LABEL, entry.verification.status))}</span><span>Updated <time datetime="${esc(entry.updated)}">${esc(entry.updated)}</time></span></div>
</div></header>
<section class="tight"><div class="wrap">
<div class="prose wide">
${factsGrid(ctx, entry, a)}
<h2 id="channels">Access channels</h2>
<p>Each way to get data out of ${esc(entry.name)}, as recorded in the registry. "Unknown" means nobody has checked yet, not that the channel is missing.</p>
${channelsTable(entry)}
</div>
<div class="prose">
<h2 id="investor-access">How an investor gets documents today</h2>
${a?.rationale ? `<p>${esc(sentence(a.rationale))} ${esc(lpLine)}</p>` : `<p>${esc(lpLine)}</p>`}
<ul class="routes">${investorRoutes(entry, a).map((r) => `<li>${r}</li>`).join("")}</ul>
<p>Background: ${internal(GUIDES.automate)} and ${internal(GUIDES.partnerOnly)}.</p>
${deploymentsBlock(entry, deps)}
${capabilitiesBlock(entry)}
${oippBlock(entry)}
${sourcesBlock(entry, a)}
<h2 id="faq">Questions</h2>
${faq(qa)}
<p class="disclaimer">Independent community research. Not affiliated with ${esc(entry.vendor.name)}. Facts are ${esc(lowerFirst(label(VERIFICATION_LABEL, entry.verification.status)))} as of ${esc(entry.updated)}.</p>
</div>
${relatedBlock(ctx, entry)}
</div></section>`;

  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: entry.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: entry.website,
    publisher: { "@type": "Organization", name: entry.vendor.name, ...(entry.vendor.website ? { url: entry.vendor.website } : {}) },
  };

  return layout({
    title: `${titleName(entry)}${TITLE_SUFFIX}`,
    description: description(entry, a, deps),
    path,
    body,
    jsonld: [breadcrumbLd(crumbs), software, faqLd(qa)],
    active: "/portals",
    css: CSS,
  });
}

/** Intro paragraph for a hub, written from the counts. */
function hubIntro(ctx, category, entries) {
  const hub = CATEGORY_HUB[category];
  const n = entries.length;
  const count = (ch, st) => entries.filter((e) => status(e, ch) === st).length;
  // e.g. "An API is offered by 12 of 22, all partner only; for 8 it is unknown."
  const channelSummary = (ch, noun) => {
    const parts = ["available", "beta", "partner-only"].map((st) => [st, count(ch, st)]).filter(([, c]) => c);
    const total = parts.reduce((s, [, c]) => s + c, 0);
    const unknown = count(ch, "unknown");
    const tail = unknown ? `; for ${unknown} it is unknown.` : ".";
    if (!total) return `No entry records ${noun}${tail}`;
    const kinds = parts.map(([st, c]) => `${c} ${lowerFirst(STATUS_LABEL[st])}`);
    const breakdown = parts.length === 1 ? `, ${total === 1 ? "" : "all "}${lowerFirst(STATUS_LABEL[parts[0][0]])}` : ` (${kinds.join(", ")})`;
    return `${cap(noun)} is offered by ${total} of ${n}${breakdown}${tail}`;
  };
  const diffs = entries.map((e) => ctx.assessments[e.id]?.difficulty).filter(Boolean);
  const byD = [1, 2, 3, 4, 5].map((d) => [d, diffs.filter((x) => x === d).length]).filter(([, c]) => c);
  const spread = diffs.length
    ? `Difficulty ratings for investor access run from ${Math.min(...diffs)} to ${Math.max(...diffs)} out of 5 (${byD.map(([d, c]) => `${c} rated ${d}`).join(", ")}). Lower is easier.`
    : "";
  const lpApi = entries.filter((e) => investorApi(ctx.assessments[e.id]) === true);
  const lpLine = lpApi.length
    ? `The research records an investor-side API for ${andList(lpApi.map((e) => e.name))}.`
    : "The research records no investor-side API in this category.";
  const prohibited = entries.filter((e) => e.terms?.automation_policy === "prohibited").length;
  const policy = prohibited ? `The terms of ${plural(prohibited, "entry", "entries")} prohibit automated access.` : "";
  return `${CATEGORY_CONTEXT[category]} The registry lists ${plural(n, lowerFirst(hub.plural).replace(/s$/, ""), lowerFirst(hub.plural))}. ${channelSummary("api", "an API")} ${channelSummary("mcp", "an MCP server")} ${spread} ${lpLine} ${policy}`
    .replace(/\s+/g, " ")
    .trim();
}

function renderHub(ctx, category) {
  const hub = CATEGORY_HUB[category];
  const entries = ctx.portals.filter((p) => p.category === category).sort(byName);
  const path = hubPath(category);
  const crumbs = [{ name: "Registry", path: "/portals" }, { name: hub.plural, path }];
  const h1 = `${hub.plural}: API, MCP and document access compared`;
  const title = [h1, `${hub.title}: API, MCP and document access compared`, `${hub.title}: API, MCP and document access`].find((t) => t.length <= TITLE_MAX);
  const apiCount = entries.filter((e) => offers(e, "api")).length;
  const mcpCount = entries.filter((e) => offers(e, "mcp")).length;
  const desc = clip(
    `${entries.length} ${hub.plural.toLowerCase()} compared on investor access: ${apiCount} with an API, ${mcpCount} with an MCP server, SFTP and difficulty ratings, from the open registry.`,
    160
  );
  const others = CATEGORY_ORDER.filter((c) => c !== category && hubFor(ctx, c));
  const guides = [GUIDES.automate, GUIDES.partnerOnly, GUIDES.apiMcp, ...(category === "data-room" ? [GUIDES.dataRooms] : []), ...(category === "reporting-platform" ? [GUIDES.canoe] : []), GUIDES.choose];
  const li = ([href, text]) => `<li><a href="${esc(href)}">${esc(text)}</a></li>`;

  const body = `<header class="page-head"><div class="wrap">
${breadcrumbs(crumbs)}
<h1>${esc(h1)}</h1>
<p class="lead">${esc(hubIntro(ctx, category, entries))}</p>
<div class="meta"><span>${plural(entries.length, "entry", "entries")}</span><span>Community research, mostly unverified</span><span>Updated ${esc(latestOf(entries))}</span></div>
</div></header>
<section class="tight"><div class="wrap">
${registryTable(ctx, entries, { policy: true })}
<div class="prose">
<p>Difficulty is the registry's own rating of how hard it is for an investor to get documents out programmatically, from 1 (documented self-serve API) to 5 (web access only with MFA, view only). Each entry page explains the rating, lists the access channels and gives practical routes for investors.</p>
<p>Vendors can correct their entry by pull request or <a href="${CONTACT}">email</a>.</p>
</div>
<div class="related">
<h2>Other categories</h2><ul>${others.map((c) => li([hubPath(c), `${CATEGORY_HUB[c].plural} compared`])).join("")}${li(["/portals", "Full registry"])}</ul>
<h2 style="margin-top:22px">Guides and comparisons</h2><ul>${guides.map(li).join("")}${li(["/compare", "Side-by-side comparisons"])}</ul>
</div>
</div></section>`;

  return layout({
    title,
    description: desc,
    path,
    body,
    jsonld: [breadcrumbLd(crumbs), itemListLd(ctx, entries, h1)],
    active: "/portals",
    css: CSS,
  });
}

function renderRegistry(ctx) {
  const groups = CATEGORY_ORDER.map((c) => [c, ctx.portals.filter((p) => p.category === c).sort(byName)]).filter(([, list]) => list.length);
  const crumbs = [{ name: "Registry", path: "/portals" }];
  const n = ctx.portals.length;
  const apiCount = ctx.portals.filter((e) => offers(e, "api")).length;
  const mcpCount = ctx.portals.filter((e) => offers(e, "mcp")).length;
  const hubs = groups.filter(([c]) => hubFor(ctx, c));
  const title = "Investor portal registry: API, MCP and SFTP access";
  const desc = `All ${n} investor portals, fund administrator portals and data rooms in the open registry, with API, MCP and SFTP status and an investor access difficulty rating.`;

  const sections = groups
    .map(([c, list]) => {
      const hub = hubFor(ctx, c);
      const name = (CATEGORY_HUB[c] ?? CATEGORY_HUB.other).plural;
      return `<div class="reg-group" id="${esc(c)}">
<h2>${esc(name)}</h2>
<p>${plural(list.length, "entry", "entries")}.${hub ? ` <a href="${hubPath(c)}">Compare ${esc(name.toLowerCase())}</a>.` : ""}</p>
${registryTable(ctx, list)}
</div>`;
    })
    .join("\n");

  const body = `<header class="page-head"><div class="wrap">
${breadcrumbs(crumbs)}
<h1>Investor portal registry: API, MCP and SFTP access</h1>
<p class="lead">Every investor portal, fund administrator portal and data room in the ${SITE_NAME} registry, with how an investor can get documents out. ${plural(n, "entry", "entries")}: ${apiCount} offer an API in some form and ${mcpCount} an MCP server. Difficulty runs from 1 (documented self-serve API) to 5 (web access only with MFA).</p>
<ul class="hubs">${hubs.map(([c]) => `<li><a href="${hubPath(c)}">${esc(CATEGORY_HUB[c].plural)}</a></li>`).join("")}<li><a href="/compare">Comparisons</a></li><li><a href="/guides">Guides</a></li></ul>
<div class="meta"><span>Community research, mostly unverified</span><span>Data CC0</span><span>Updated ${esc(ctx.latest)}</span></div>
</div></header>
<section class="tight"><div class="wrap">
<div class="prose wide"><p>"Partner only" means an API exists but needs a commercial agreement, usually for GPs or administrators rather than investors. "Unknown" means nobody has checked yet. Open an entry for its access channels, terms, known deployments and sources. Vendors can correct their entry by pull request or <a href="${CONTACT}">email</a>.</p></div>
${sections}
</div></section>`;

  const collection = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description: desc,
    url: abs("/portals"),
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: abs("/") },
    mainEntity: itemListLd(ctx, groups.flatMap(([, list]) => list), "Investor portal registry"),
  };
  delete collection.mainEntity["@context"];

  return layout({ title, description: desc, path: "/portals", body, jsonld: [breadcrumbLd(crumbs), collection], active: "/portals", css: CSS });
}

const latestOf = (entries) => entries.map((e) => e.updated).filter(Boolean).sort().at(-1) ?? "";

export async function pages(ctx) {
  const hubs = CATEGORY_ORDER.filter((c) => hubFor(ctx, c));
  return [
    { path: "/portals", render: () => renderRegistry(ctx), lastmod: ctx.latest, priority: 0.9 },
    ...hubs.map((c) => ({
      path: hubPath(c),
      render: () => renderHub(ctx, c),
      lastmod: latestOf(ctx.portals.filter((p) => p.category === c)) || ctx.latest,
      priority: 0.7,
    })),
    ...ctx.portals.map((entry) => ({
      path: portalPath(entry.id),
      render: () => renderPortal(ctx, entry),
      lastmod: entry.updated,
      priority: 0.8,
    })),
  ];
}
