// Guide: automating capital call and distribution notice collection for LP operations teams.
// Every count and table row is computed from the registry at render time.
import { esc, pill, diffBadge, portalLink, breadcrumbs, faq, faqLd, STATUS_LABEL, CATEGORY_LABEL, DIFFICULTY_LABEL } from "../layout.mjs";

const SLUG = "automate-capital-call-notices";
const H1 = "How to automate capital call and distribution notices";

const ILPA_CCD = "https://ilpa.org/industry-guidance/templates-standards-model-documents/ilpa-templates-hub/ilpa-capital-call-distribution-template/";
const ILPA_HUB = "https://ilpa.org/industry-guidance/templates-standards-model-documents/updated-ilpa-templates-hub/";

const POLICY = {
  permitted: ["available", "Permitted"],
  tolerated: ["beta", "Tolerated"],
  prohibited: ["none", "Prohibited"],
  unknown: ["unknown", "Unknown"],
};
const policyPill = (p) => {
  const [cls, label] = POLICY[p] ?? POLICY.unknown;
  return `<span class="pill ${cls}">${label}</span>`;
};
const st = (entry, ch) => entry.access?.[ch]?.status ?? "unknown";
const listJoin = (xs) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);
const investorSide = (a) => a && (a.lp_side_api === true || a.investor_side_api === true || a.recipient_side_api === true);

const FAQ = [
  {
    q: "What is the most reliable way to automate capital call notices?",
    a: "A documented API or MCP server that the investor is allowed to use, followed by delivery that the GP or administrator sets up for you, such as a nominated mailbox, SFTP drop or data feed. Both are sanctioned channels, so they do not depend on screen layouts or break when a portal changes its login page.",
  },
  {
    q: "Can I scrape an investor portal to download my own documents?",
    a: "Only where the portal's terms allow it. The registry records each portal's position in the terms.automation_policy field. Where it is prohibited, use the web portal manually, ask the GP for delivery by email or SFTP, or ask the vendor for API access. Where it is unknown, read the terms or ask the vendor before automating.",
  },
  {
    q: "Is email parsing a safe substitute for portal access?",
    a: "It is a sanctioned and low-risk trigger, because the notices are sent to you. Its limits are that some notifications only link into the portal rather than attaching the document, formats vary by sender, and an email can be missed or filtered. Use it to detect new notices and reconcile against a commitment list, not as the only record.",
  },
  {
    q: "What data format should capital call data use?",
    a: "The ILPA Capital Call and Distribution Template v2.0, released in 2025, defines the accounting detail and transaction components of notices. The Open Investor Portal Protocol aligns its capital call and distribution payloads with it, so data from different portals can be compared field by field.",
  },
  {
    q: "Should automation ever pay or acknowledge a capital call?",
    a: "No. Collection should be read-only. Funding a call is a separate, controlled payment process, and any change to wire instructions in a notice should be verified independently with a known contact before money moves.",
  },
];

export default {
  slug: SLUG,
  title: "Automate capital call notices: an LP operations guide",
  h1: H1,
  description:
    "How LP teams can automate capital call notices and statements across investor portals: APIs, GP delivery, email parsing and terms-aware automation.",
  updated: "2026-11-07",
  summary: "The routes to collecting capital call and distribution notices from many portals, in order of preference, with a live table of each portal's channels and terms.",
  order: 3,
  jsonld: () => [faqLd(FAQ)],
  render(ctx) {
    const rows = ctx.portals
      .filter((p) => (p.capabilities ?? []).includes("capital_calls"))
      .map((p) => ({ p, a: ctx.assessments[p.id] }))
      .sort((x, y) => (x.a?.difficulty ?? 9) - (y.a?.difficulty ?? 9) || x.p.name.localeCompare(y.p.name));
    const n = rows.length;
    const count = (fn) => rows.filter(fn).length;
    const investorRows = rows.filter(({ a }) => investorSide(a));
    const nInvestorApi = investorRows.length;
    const allReporting = investorRows.length > 0 && investorRows.every(({ p }) => p.category === "reporting-platform");
    const nApiPartner = count(({ p }) => st(p, "api") === "partner-only");
    const nEmailNone = count(({ p }) => st(p, "email_notifications") === "none");
    const nEmailUnknown = count(({ p }) => st(p, "email_notifications") === "unknown");
    const nEmail = count(({ p }) => st(p, "email_notifications") === "available");
    const nSftp = count(({ p }) => ["available", "partner-only"].includes(st(p, "sftp")));
    const nSftpAvail = count(({ p }) => st(p, "sftp") === "available");
    const nProhibited = count(({ p }) => p.terms?.automation_policy === "prohibited");
    const nPermitted = count(({ p }) => p.terms?.automation_policy === "permitted");
    const nPolicyUnknown = count(({ p }) => (p.terms?.automation_policy ?? "unknown") === "unknown");
    const nOipp = count(({ p }) => ["available", "beta"].includes(p.oipp?.status));
    const nIlpaCc = count(({ p }) => (p.standards ?? []).includes("ilpa-capital-call-template"));
    const dist = [1, 2, 3, 4, 5].map((d) => [d, count(({ a }) => a?.difficulty === d)]).filter(([, c]) => c);
    const plural = (c, one, many) => `${c} ${c === 1 ? one : many}`;

    const carta = ctx.byId.get("carta");
    const cartaEmail = carta?.access?.email_notifications?.notes;
    const juniper = ctx.byId.get("juniper-square");

    const table = `<div class="tbl-scroll"><table class="cmp cc-table">
<thead><tr><th>Portal</th><th>API</th><th>MCP</th><th>SFTP</th><th>Email notifications</th><th>Difficulty</th><th>Automation policy</th></tr></thead>
<tbody>
${rows
  .map(
    ({ p, a }) =>
      `<tr><td>${portalLink(ctx, p)}</td><td>${pill(st(p, "api"))}</td><td>${pill(st(p, "mcp"))}</td><td>${pill(st(p, "sftp"))}</td><td>${pill(
        st(p, "email_notifications")
      )}</td><td>${diffBadge(a?.difficulty)}</td><td>${policyPill(p.terms?.automation_policy)}</td></tr>`
  )
  .join("\n")}
</tbody></table></div>`;

    const sources = [
      [ILPA_CCD, "ILPA Capital Call & Distribution Template"],
      [ILPA_HUB, "ILPA templates hub"],
      ...(juniper?.terms?.tos_url ? [[juniper.terms.tos_url, "Juniper Square end user terms of use"]] : []),
      ...(carta?.access?.mcp?.docs_url ? [[carta.access.mcp.docs_url, "Carta connector listing"]] : []),
      ...(ctx.byId.get("chronograph-lp")?.access?.mcp?.docs_url ? [[ctx.byId.get("chronograph-lp").access.mcp.docs_url, "Chronograph MCP connectors"]] : []),
      ...(ctx.byId.get("arch")?.access?.api?.docs_url ? [[ctx.byId.get("arch").access.api.docs_url, "Arch Client API documentation"]] : []),
    ];

    return `<section class="page-head"><div class="wrap">
  ${breadcrumbs([{ name: "Guides", path: "/guides" }, { name: H1, path: `/guides/${SLUG}` }])}
  <h1>${esc(H1)}</h1>
  <p class="lead">A practical guide for LP operations teams that collect capital call and distribution notices, capital account statements and quarterly reports across many investor portals. It sets out the routes in order of preference and shows, from registry data, which channels each portal offers.</p>
  <div class="meta"><span>Updated 2026-11-07</span><span>${plural(n, "portal", "portals")} with capital call data in the registry</span></div>
</div></section>
<section class="tight"><div class="wrap"><div class="prose">

<h2>The problem: one notice, many portals</h2>
<p>A family office, fund-of-funds team, pension fund or insurer with commitments to dozens of funds rarely deals with one portal. Each GP chooses its own investor portal, and many administrators run their own. The same software is often deployed per GP or per administrator, so an LP can hold separate logins for several instances of one product. The registry currently lists ${plural(n, "portal", "portals")} that deliver capital call information to investors.</p>
<p>The work that follows is familiar. A notice arrives by email, usually with a link rather than the document. Someone logs in, completes a second factor, finds the notice, downloads the PDF, renames it, files it by entity and fund, and keys the amount, due date and wire details into the accounting system or a treasury workflow. The same happens for distribution notices, capital account statements and quarterly reports, on a quarterly cycle that bunches the load into a few weeks.</p>
<p>The cost is not only time. Capital calls have short funding windows, so a missed email or an expired session is an operational risk. And the people doing the work hold a growing set of credentials and authenticator entries that are hard to audit or hand over.</p>
<p>There are five routes to reducing this work. They are listed below in order of preference: the earlier routes are sanctioned by the portal or the GP, need less maintenance and carry less risk.</p>

<h2>A common payload: the ILPA Capital Call &amp; Distribution Template v2.0</h2>
<p>Whatever the route, decide first what the data should look like when it arrives. In 2025 ILPA released version 2.0 of its <a href="${esc(ILPA_CCD)}" rel="noopener">Capital Call &amp; Distribution Template</a>, replacing the 2011 version. It covers the accounting detail and transaction components of notices, and ILPA's adoption timeline refers to Q1 2026 and Q1 2027. ILPA publishes it as a document package. The research behind this registry found no machine-readable schema or API on ILPA's template hub.</p>
<p>Mapping every source to the template's transaction types and definitions lets you compare notices from different GPs field by field, and makes a later change of route invisible to downstream systems. In the registry, ${plural(nIlpaCc, "portal declares", "portals declare")} support for the ILPA capital call template in its <code>standards</code> field. Others may support it without the entry saying so, so ask your GPs which version they will deliver.</p>

<h2>Route 1: a documented API or MCP server you are allowed to use</h2>
<p>The cleanest route is an API or MCP server that the vendor documents and makes available to investors, not only to the GP. Many portals have an API, but it is often built for the GP, the administrator or integration partners. Of the portals in the table below, the registry records ${nApiPartner} APIs as <em>partner only</em>. Of the ${plural(n, "portal", "portals")} with capital call data, the assessments record investor-side programmatic access for ${nInvestorApi}. The difference matters, and the guide <a href="/guides/partner-only-portal-access-explained">partner-only portal access explained</a> covers what it means in practice.</p>
<p>${
      investorRows.length
        ? `In the registry, those entries are ${listJoin(investorRows.map(({ p }) => `<a href="/portals/${esc(p.id)}">${esc(p.name)}</a>${allReporting ? "" : ` (${esc((CATEGORY_LABEL[p.category] ?? p.category).toLowerCase())})`}`))}. ${
            allReporting
              ? "All of them are reporting platforms where the LP is the customer, rather than a GP's own portal."
              : ""
          }`
        : ""
    } The guide to <a href="/guides/investor-portals-with-api-and-mcp">investor portals with an API or MCP server</a> compares these options in more detail. Check three things before you build: that the access is for your organisation and not only for the GP, which resources it exposes (capital calls and documents, not only holdings), and whether the vendor's terms allow use by an agent acting for you.</p>

<h2>Route 2: ask the GP or administrator to deliver to you</h2>
<p>When the portal has no investor API, the next best route is often a request rather than software. GPs and administrators already send notices. Ask whether they can also attach documents to emails sent to a nominated address, push files to an SFTP server or provide a data feed. Only ${plural(nSftp, "portal", "portals")} in the table ${nSftp === 1 ? "records" : "record"} an SFTP channel${
      nSftpAvail === 0 && nSftp ? ", all of them partner only" : `, ${nSftpAvail} of them self-serve`
    }, so this is usually an arrangement with the GP or administrator rather than a portal feature you switch on. Delivery the GP sets up for you is plainly within the terms, and it tells the GP and its vendor that investors want direct access.</p>
<p>A short request is enough. Adapt this text to your entity names and destinations:</p>
<div class="callout"><p><strong>Subject: Document delivery request for [Investor entity] in [Fund name]</strong></p>
<p>We are an investor in [Fund name] through [Investor entity]. To process notices reliably, we would like capital call notices, distribution notices, capital account statements and quarterly reports delivered directly, in addition to the investor portal.</p>
<p>Please let us know which of these you can support: (1) each document attached in full to an email sent to [ops-documents@example.com]; (2) delivery to our SFTP server, with credentials we will provide; (3) a data feed or export of notice data, ideally in the ILPA Capital Call &amp; Distribution Template v2.0 format; (4) investor access to an API or MCP server for your portal, if available.</p>
<p>Please keep wire instructions in the notice itself. We will confirm any change in bank details by phone with a known contact. Thank you.</p></div>
<p>Keep a record of what each GP agreed. The registry has fields for the channels a portal supports, and corrections from LPs and vendors are welcome by pull request.</p>

<h2>Route 3: parse the email notifications</h2>
<p>Many portals email investors when something new is posted. ${plural(nEmail, "portal", "portals")} in the table record email notifications as available, ${nEmailUnknown} unknown and ${nEmailNone} not offered. Notifications arrive in your own mailbox, so processing them is within your control and does not touch the portal.</p>
<p>A workable setup routes all fund notices to one shared mailbox, classifies each message by sender and subject, extracts attachments where present, and creates a task when the message only contains a link. Check what each sender actually includes. ${
      cartaEmail
        ? `For example, the Carta entry notes: "${esc(cartaEmail.replace(/\.$/, ""))}."`
        : "Some notifications only link into the portal rather than attaching the document."
    } In that case email parsing tells you a notice exists and when it arrived, which is still useful for deadlines and reconciliation, but someone or something still has to fetch the document.</p>
<p>Treat the parsed mailbox as a trigger and a control, not as the system of record. Reconcile notices against your commitment list each quarter, so a filtered or missing email shows up as a gap.</p>

<h2>Route 4: browser automation, only where the terms permit it</h2>
<p>Automating the portal's web interface with the investor's own login can fill the gap for portals with no other channel. It is also where most of the risk lies, so it comes after the sanctioned routes. Some portal terms forbid robots, scraping or automated queries outright. ${
      juniper?.terms?.automation_policy === "prohibited" && juniper.terms.notes
        ? `For example, the Juniper Square entry records: "${esc(juniper.terms.notes.replace(/\.$/, ""))}."`
        : ""
    }</p>
<p>The registry records each portal's position in the <code>terms.automation_policy</code> field: <em>permitted</em> where the terms or vendor explicitly allow consented automation, <em>tolerated</em> where the terms do not address it, <em>prohibited</em> where they forbid it, and <em>unknown</em> where nobody has checked. Among the portals in the table, ${nProhibited} are recorded as prohibited, ${nPermitted} as permitted and ${nPolicyUnknown} as unknown. Unknown is not permission: read the terms, or ask the vendor, before you automate.</p>
<p>Where automation is allowed, the registry's connector rules are a reasonable baseline: run on your own infrastructure with your own credentials, keep a human in the loop for second factors, stay read-only, pace requests like one careful user, identify the client in the user agent, log every fetch, and stop if the portal blocks. Never solve CAPTCHAs, spoof fingerprints or share sessions. Where the policy is prohibited, use one of the other routes and ask the vendor to offer investor access.</p>

<h2>Route 5: managed collection</h2>
<p>Some teams prefer to hand the work to a service. Commercial aggregators collect documents from GP portals and inboxes on an LP's behalf, extract the data and deliver it to portfolio and accounting systems. They differ in how they reach portals, where credentials are held, and which downstream systems they support. The guide to <a href="/guides/canoe-alternatives">Canoe alternatives</a> compares the options neutrally.</p>
<p>Questions to ask any provider: which portals it reaches by API, by consented automation and by manual collection; how it handles portals whose terms prohibit automation; where credentials and second factors are held, and who can access them; whether output is mapped to the ILPA templates; and what happens to your data and credentials when you leave.</p>
<p class="callout"><strong>Disclosure.</strong> The publisher of this registry also sells a managed service, <a href="/vaults">Managed Portal Vaults</a>. It is one option among several, it is a custody service, and it states that it uses manual collection where a portal's terms do not allow automation. Nothing in the registry data or this guide depends on it.</p>

<h2>Portals with capital call data: channels and terms</h2>
<p>The table lists every registry entry with the <code>capital_calls</code> capability, sorted by difficulty, which runs from 1 (${esc(DIFFICULTY_LABEL[1].toLowerCase())}) to 5 (${esc(DIFFICULTY_LABEL[5].toLowerCase())}). Status labels: ${Object.values(STATUS_LABEL).map(esc).join(", ")}. Entries are community research and mostly unverified. Vendors and users can correct them by pull request.</p>
<p>Difficulty across these portals: ${dist.map(([d, c]) => `${plural(c, "portal", "portals")} rated ${d} of 5`).join(", ")}.</p>
</div></div>
<div class="wrap">${table}</div>
<div class="wrap"><div class="prose">

<h2>How the open protocol turns this into one integration</h2>
<p>Each route above is a separate integration per portal or per GP. The Open Investor Portal Protocol (OIPP) is designed to replace that with one. An investor registers once and gets a cryptographic identity, then links it to each portal account from inside the portal, where the portal stays in control and can revoke the link. From then on the investor's own client signs every request with its key, and reaches each linked portal through the same small REST surface, mirrored as MCP tools: accounts, documents, capital calls, distributions, capital account statements and a notifications feed that replaces email alerts.</p>
<p>Capital call and distribution payloads in OIPP are aligned with the ILPA templates, so a capital call from one portal looks the same as one from another. In the default mode no portal password or token is held by the platform, and portal data flows directly from the portal to the investor's client. Today ${plural(nOipp, "portal", "portals")} in the table ${nOipp === 1 ? "implements" : "implement"} OIPP, so for now the protocol sits alongside the routes above. Each LP request to a vendor to support it moves a portal from routes 3 to 5 towards route 1. <a href="/#how">How the protocol works</a> has the details.</p>

<h2>Frequently asked questions</h2>
</div>
${faq(FAQ)}
<div class="prose">
<h2>Sources</h2>
<p>Portal channels, difficulty ratings and automation policies come from the <a href="/portals">open registry</a> and its research assessments, as of the date above. Each portal page lists its own sources.</p>
<ul class="sources">
${sources.map(([href, label]) => `<li>${esc(label)}: <a href="${esc(href)}" rel="noopener">${esc(href)}</a></li>`).join("\n")}
</ul>
<div class="related"><h2>Related guides</h2><ul>
<li><a href="/guides/partner-only-portal-access-explained">Partner-only portal access explained</a></li>
<li><a href="/guides/investor-portals-with-api-and-mcp">Investor portals with an API or MCP server</a></li>
<li><a href="/guides/canoe-alternatives">Canoe alternatives for LP document collection</a></li>
<li><a href="/portals">Browse the portal registry</a></li>
</ul></div>
</div></div></section>`;
  },
  css: `.tbl-scroll{overflow-x:auto;margin:8px 0 24px}.cc-table{min-width:860px}.cc-table td{white-space:nowrap}.cc-table thead th{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-weight:600}.prose .callout p{margin:0 0 10px}.prose .callout p:last-child{margin:0}`,
};
