// Guide: how a GP, fund manager or fund administrator can choose investor portal software.
// Every count and table row is computed from the registry at render time, so the guide stays in step with the data.
import { esc, pill, diffBadge, portalLink, breadcrumbs, faq, faqLd, CATEGORY_LABEL } from "../layout.mjs";

const SLUG = "how-to-choose-an-investor-portal";
const H1 = "How to choose an investor portal";
const UPDATED = "2026-11-07";
const CATEGORIES = ["lp-portal", "fund-admin-portal"];
const OFFERED = ["available", "partner-only", "beta"];

const SRC = {
  ilpaHub: "https://ilpa.org/industry-guidance/templates-standards-model-documents/updated-ilpa-templates-hub/",
  ilpaReporting: "https://ilpa.org/industry-guidance/templates-standards-model-documents/ilpa-templates-hub/ilpa-reporting-template/",
  ilpaCall: "https://ilpa.org/industry-guidance/templates-standards-model-documents/ilpa-templates-hub/ilpa-capital-call-distribution-template/",
  ilpaPerf: "https://ilpa.org/industry-guidance/templates-standards-model-documents/ilpa-templates-hub/ilpa-performance-template/",
  canoe: "https://canoeintelligence.com/solutions/canoe-connect/",
  arch: "https://arch.com/",
  dora: "https://eur-lex.europa.eu/eli/reg/2022/2554/oj/eng",
  rfc9421: "https://www.rfc-editor.org/rfc/rfc9421",
  mcpRegistry: "https://registry.modelcontextprotocol.io/",
};

const a = (href, text) => `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(text)}</a>`;

/** Registry statistics for LP and fund administrator portals. */
function stats(ctx) {
  const list = ctx.portals.filter((e) => CATEGORIES.includes(e.category));
  const count = (fn) => list.filter(fn).length;
  const ch = (e, c) => e.access?.[c]?.status ?? "unknown";
  return {
    list,
    n: list.length,
    lp: count((e) => e.category === "lp-portal"),
    admin: count((e) => e.category === "fund-admin-portal"),
    apiAvailable: count((e) => ch(e, "api") === "available"),
    apiPartner: count((e) => ch(e, "api") === "partner-only"),
    apiUnknown: count((e) => ch(e, "api") === "unknown"),
    apiForLp: count((e) => OFFERED.includes(ch(e, "api")) && (e.access?.api?.audience ?? []).includes("lp")),
    mcpOffered: count((e) => OFFERED.includes(ch(e, "mcp"))),
    sftpOffered: count((e) => OFFERED.includes(ch(e, "sftp"))),
    emailAvailable: count((e) => ch(e, "email_notifications") === "available"),
    prohibited: count((e) => e.terms?.automation_policy === "prohibited"),
    policyUnknown: count((e) => (e.terms?.automation_policy ?? "unknown") === "unknown"),
    ilpa: count((e) => (e.standards ?? []).some((s) => s.startsWith("ilpa-"))),
    mfaListed: count((e) => (e.access?.web?.mfa ?? []).some((m) => m !== "none")),
    ssoListed: count((e) => (e.access?.web?.sso ?? []).some((m) => m !== "none")),
    oipp: count((e) => ["available", "beta"].includes(e.oipp?.status)),
    unverified: count((e) => e.verification?.status === "unverified"),
  };
}

const n = (k, one, many) => `${k} ${k === 1 ? one : many}`;

function qa(ctx) {
  const s = stats(ctx);
  return [
    {
      q: "What is an investor portal?",
      a: "An investor portal, or LP portal, is the secure website where a fund manager or its administrator publishes documents and data to limited partners: capital call and distribution notices, capital account statements, quarterly reports, tax documents and subscription paperwork. Some portals are sold to GPs directly, others are run by fund administrators for their clients.",
    },
    {
      q: "What should an investor portal requirements checklist include?",
      a: "Cover the investor experience, document delivery and notifications, the capital call and distribution workflow, the fund administrator integration, security (SSO, MFA and audit logs), data residency, and machine access for LPs through an API, MCP server, SFTP or structured email. Add support for the 2025 ILPA templates and what the terms of use say about automated access.",
    },
    {
      q: "Do investor portals offer APIs to limited partners?",
      a: `Rarely, based on current registry research. Of the ${s.n} LP and fund administrator portals in the registry, ${n(s.apiAvailable, "lists", "list")} a documented self-serve API and ${n(s.apiPartner, "lists", "list")} a partner-only API, which usually serves the GP or administrator. ${n(s.apiForLp, "entry names", "entries name")} LPs as an API audience. For ${s.apiUnknown} the status is unknown. Entries are community research and mostly unverified.`,
    },
    {
      q: "Why does an MCP server matter for an investor portal?",
      a: "The Model Context Protocol (MCP) lets AI assistants and agents call a system's tools directly. An LP or administrator using an agent to collect notices and statements can read from a portal that offers MCP or an API without logging in by hand. Where neither exists, the investor falls back to manual downloads or browser automation, which many portal terms prohibit.",
    },
    {
      q: "Which ILPA templates should an investor portal support?",
      a: "ILPA released updated templates in 2025: Reporting Template v2.0 for fees, expenses and carried interest, the Capital Call and Distribution Template v2.0, and the Performance Template v1.1. Their adoption dates fall in 2026 and 2027 depending on the template and fund. Ask vendors how they produce each one and whether the data is exportable, not only the PDF.",
    },
    {
      q: "Is the registry data on investor portals verified?",
      a: `Mostly not yet. ${s.unverified} of the ${s.n} entries covered in this guide are marked unverified community research. Vendors can confirm or correct their entry by pull request, which upgrades it to vendor-verified. Treat the registry as a starting point for vendor questions, not as a substitute for due diligence.`,
    },
  ];
}

function table(ctx) {
  const rows = [...stats(ctx).list].sort((x, y) => x.name.localeCompare(y.name));
  return `<div class="tbl-scroll"><table class="channels">
<caption>LP and fund administrator portals in the registry, alphabetical. Difficulty is the registry rating for investor-side access (1 easy, 5 hard), not a quality score.</caption>
<thead><tr><th scope="col">Portal</th><th scope="col">Category</th><th scope="col">API</th><th scope="col">MCP</th><th scope="col">SFTP</th><th scope="col">Difficulty</th></tr></thead>
<tbody>
${rows
  .map(
    (e) =>
      `<tr><td>${portalLink(ctx, e)}</td><td class="note">${esc(CATEGORY_LABEL[e.category] ?? e.category)}</td><td>${pill(e.access?.api?.status)}</td><td>${pill(
        e.access?.mcp?.status
      )}</td><td>${pill(e.access?.sftp?.status)}</td><td>${diffBadge(ctx.assessments[e.id]?.difficulty)}</td></tr>`
  )
  .join("\n")}
</tbody></table></div>`;
}

function render(ctx) {
  const s = stats(ctx);
  return `<section class="page-head"><div class="wrap">
  ${breadcrumbs([
    { name: "Guides", path: "/guides" },
    { name: H1, path: `/guides/${SLUG}` },
  ])}
  <h1>${esc(H1)}</h1>
  <p class="lead">A vendor-neutral requirements checklist for GPs, fund managers and fund administrators buying investor portal software, with the questions to ask and live registry data on how each portal can be accessed.</p>
  <div class="meta"><span class="updated">Updated <time datetime="${UPDATED}">${UPDATED}</time></span><span>For GPs, fund managers and fund administrators</span></div>
</div></section>
<section class="tight"><div class="wrap"><article class="prose">

<p>An investor portal is where your limited partners meet your back office. It holds capital call and distribution notices, capital account statements, quarterly reports, K-1s and other tax documents, and often subscription paperwork. LPs judge a manager partly by how easy it is to get these documents, and increasingly by whether their own systems can collect them without a person logging in.</p>
<p>This guide sets out what to evaluate, which standards matter, and what to ask vendors. It does not recommend a product. The registry data below is community research, and most entries are unverified, so use it to frame questions rather than to decide.</p>

<h2>The requirements checklist</h2>

<h3>1. Investor experience</h3>
<ul>
  <li><strong>One login across funds and vehicles.</strong> An LP in several of your funds, feeders or SPVs should see all positions in one place, with clear entity names.</li>
  <li><strong>Delegated users.</strong> Institutional LPs send documents to consultants, auditors, custodians and administrators. Check how you grant and revoke access per entity and per document type.</li>
  <li><strong>Search and filtering</strong> by fund, entity, document type and period, plus bulk download.</li>
  <li><strong>Data, not only PDFs.</strong> Capital account balances, commitments, unfunded amounts and cash flows shown as data and exportable to CSV or Excel.</li>
  <li><strong>Accessibility and language support</strong> if your LP base is international.</li>
</ul>

<h3>2. Document delivery and notifications</h3>
<ul>
  <li>Notifications by email when a document is posted, configurable per user and per document type.</li>
  <li>Whether the email contains only a link, or also a summary or attachment. Many LPs route these emails into automated intake, so consistent subject lines and sender addresses help.</li>
  <li>Read receipts and download tracking, so investor relations can see who has opened a notice.</li>
  <li>Versioning and corrections: how a restated statement replaces the original, and how LPs are told.</li>
</ul>
<p>The registry records email notifications as available for ${n(s.emailAvailable, "portal", "portals")} of the ${s.n} LP and fund administrator portals it covers. For most of the rest, notification behaviour has not been checked.</p>

<h3>3. Capital call and distribution workflow</h3>
<ul>
  <li>Generating notices per investor from the fund ledger, with allocation detail and wire instructions.</li>
  <li>Controls on wire instructions: how changes are approved, and how LPs verify them. Treat any change to wire instructions as a fraud risk.</li>
  <li>Tracking receipts against calls, with reminders for late payers.</li>
  <li>Structured notice data that follows the ILPA Capital Call and Distribution Template, not only a PDF.</li>
</ul>
<p>For a deeper look at the LP side of this workflow, read <a href="/guides/automate-capital-call-notices">how LPs automate capital call and distribution notices</a>.</p>

<h3>4. Fund administrator integration</h3>
<p>If a third-party administrator keeps your books, the portal has to take its output reliably. Ask how documents and data move from the administrator into the portal: an API, SFTP drops, a file-naming convention, or manual upload. Ask who owns the mapping of investor entities between the two systems, and what happens when you change administrator. Some administrators run their own portal; then the question becomes whether you can also publish to a GP-branded portal without duplicate work. The <a href="/administrators">administrator directory</a> shows which administrators are linked to which portals in the registry.</p>

<h3>5. Security: SSO, MFA and audit</h3>
<ul>
  <li><strong>MFA for investors</strong>, with methods stated: TOTP apps, hardware keys, SMS or email codes.</li>
  <li><strong>SSO for your staff</strong> through SAML or OIDC, and ideally SCIM for provisioning.</li>
  <li><strong>Audit logs</strong> of logins, views, downloads and permission changes, exportable for your auditors and for LP due diligence questionnaires.</li>
  <li>Independent assurance reports such as SOC 2 or ISO 27001, penetration test summaries, and an incident notification commitment in the contract.</li>
</ul>
<p>Few registry entries state these details yet: ${n(s.mfaListed, "entry lists", "entries list")} investor MFA methods and ${n(s.ssoListed, "lists", "list")} SSO options. That is a gap in public documentation, not proof of absence, so ask.</p>

<h3>6. Data residency and regulation</h3>
<p>The registry records each vendor's country and the regions it serves, not where data is hosted. Ask for hosting regions, subprocessors and backup locations, and whether you can pin data to a region. EU fund managers should also check obligations under the Digital Operational Resilience Act, which applies from January 2025, covers alternative investment fund managers and requires a register of ICT third-party arrangements (${a(SRC.dora, "Regulation (EU) 2022/2554")}). A portal vendor is one of those arrangements.</p>

<h3>7. Machine access for LPs: API, MCP, SFTP and email</h3>
<p>This item is newer, and it is where portals differ most. Institutional LPs, family offices and their administrators hold positions in many funds, so they automate intake rather than log in to each portal. Commercial services exist to do this for them: Canoe states that it covers more than 3,000 connected portals and uses APIs or RPA scripts to log in on clients' behalf (${a(SRC.canoe, "Canoe Connect")}), and Arch collects statements, capital calls and K-1s from portals and inboxes (${a(SRC.arch, "Arch")}). When a portal offers no machine route, the LP's tooling stores credentials and drives your web interface, which is fragile for them and opaque for you.</p>
<p>The options, from most to least structured:</p>
<ul>
  <li><strong>API for investors.</strong> A documented API an LP can use with its own credentials, scoped to its own accounts. Distinct from a GP-side API, which lets you push data in but does nothing for LPs.</li>
  <li><strong>MCP server.</strong> The Model Context Protocol lets AI assistants and agents call tools such as "list documents" directly. Public servers are listed in the ${a(SRC.mcpRegistry, "official MCP Registry")}. See <a href="/guides/investor-portals-with-api-and-mcp">investor portals with an API or MCP server</a>.</li>
  <li><strong>SFTP feeds</strong> of documents and data files per investor, common with larger LPs and their administrators.</li>
  <li><strong>Structured email</strong> with consistent metadata or attachments, which LP intake tools can parse.</li>
</ul>
<p>Current registry research shows how rare investor-side access is. Of ${s.n} LP and fund administrator portals, ${n(s.apiAvailable, "lists", "list")} a self-serve API and ${n(s.apiPartner, "lists", "list")} a partner-only API, typically for the GP or administrator. ${n(s.apiForLp, "entry names", "entries name")} LPs as an API audience. ${n(s.mcpOffered, "portal offers", "portals offer")} an MCP server in some form, and ${n(s.sftpOffered, "offers", "offer")} SFTP. A portal that gives LPs a sanctioned machine route removes a reason for scraping and a recurring support burden.</p>

<h2>Standards to require</h2>
<h3>The 2025 ILPA templates</h3>
<p>The Institutional Limited Partners Association updated its templates in 2025 (${a(SRC.ilpaHub, "ILPA templates hub")}):</p>
<ul>
  <li><strong>Reporting Template v2.0</strong> for fees, expenses and carried interest, released January 2025. It applies to funds in their investment period in Q1 2026 or launched on or after 1 January 2026 (${a(SRC.ilpaReporting, "ILPA Reporting Template")}).</li>
  <li><strong>Capital Call and Distribution Template v2.0</strong>, replacing the 2011 template, with first delivery expected in Q1 2027 (${a(SRC.ilpaCall, "ILPA Capital Call and Distribution Template")}).</li>
  <li><strong>Performance Template v1.1</strong>, with granular and gross-up methodologies, for funds starting on or after 1 January 2026 (${a(SRC.ilpaPerf, "ILPA Performance Template")}).</li>
</ul>
<p>ILPA publishes these as spreadsheet packages with definitions, not as an API or machine-readable schema. So ask vendors two things: can the portal produce each template, and can LPs get the underlying data in a structured form. Only ${n(s.ilpa, "entry", "entries")} in this part of the registry list any ILPA template support today, which mostly reflects missing documentation.</p>

<h3>Terms on automation</h3>
<p>Read the investor terms of use, not only your own contract. Many portal terms forbid robots, scraping or sharing credentials with advisers. The registry records this as an automation policy: ${n(s.prohibited, "LP or administrator portal prohibits", "LP or administrator portals prohibit")} automated access in their terms, and for ${s.policyUnknown} the policy has not been checked. A ban on automation with no API leaves your LPs with manual downloads only. If the vendor prohibits automation, ask what sanctioned alternative it offers investors, and whether you as the client can enable it.</p>

<h2>Questions to ask vendors</h2>
<ol>
  <li>Can an LP, or an agent or administrator acting for that LP, retrieve its own documents and data without a browser? Through which channel, and at what cost to us or to them?</li>
  <li>Is the API documented publicly? Who can get credentials: GPs, administrators, LPs?</li>
  <li>Do you offer an MCP server? Is it read-only, and is it scoped to the user's own permissions?</li>
  <li>What do your investor terms say about automated access and delegated access by advisers?</li>
  <li>Which ILPA templates can you produce today, and are they available as data as well as PDF?</li>
  <li>How do documents and data arrive from our fund administrator, and what breaks if we change administrator?</li>
  <li>Which MFA methods do investors have, and can we enforce MFA? Which SSO and provisioning standards do you support for our staff?</li>
  <li>What do your audit logs record, how long are they kept, and can we export them?</li>
  <li>Where is our data hosted, who are your subprocessors, and can we choose a region?</li>
  <li>How do you notify investors of new documents, and can LPs subscribe to changes programmatically, for example through webhooks or a change feed?</li>
  <li>How do we export all documents, data and audit history if we leave?</li>
</ol>

<h2>How LP and administrator portals compare on access</h2>
<p>The table is generated from the registry on every request. Each row links to a portal page with sources, notes and terms. Status values: available means documented and self-serve, partner only means it exists but needs a commercial agreement, and unknown means nobody has checked yet. For side-by-side views, see <a href="/compare">portal comparisons</a> or the full <a href="/portals/category/lp-portal">list of LP portals</a>.</p>
</article>
${table(ctx)}
<article class="prose">
<div class="callout"><strong>Vendors:</strong> these entries are community research and ${s.unverified === s.n ? "all" : "mostly"} unverified. If your entry is wrong or out of date, correct it by pull request and it can be marked vendor-verified.</div>

<h2>Being protocol-ready</h2>
<p>OpenInvestorPortal publishes a draft open protocol, OIPP, for this machine access problem. A portal implements a small read-only REST surface for accounts, documents, capital calls, distributions, capital account statements and change notifications, mirrored as MCP tools. The investor signs each request with its own key using ${a(SRC.rfc9421, "HTTP Message Signatures (RFC 9421)")}. No password or token is shared with anyone, the portal decides what each link may read, and it can revoke a link at any time. Payloads are intended to follow the 2025 ILPA templates. ${s.oipp ? n(s.oipp, "portal in this part of the registry supports", "portals in this part of the registry support") + " it so far." : "No portal in the registry supports it yet; the specification is a draft."}</p>
<p>You do not need to adopt the protocol to benefit from its design. A portal is protocol-ready when it keeps stable document identifiers, typed document metadata, ILPA-aligned notice data, a feed of what changed, and per-investor access scopes. Those same properties make any API, SFTP feed or future standard easier to support, and they shorten LP due diligence. <a href="/#how">How the protocol works</a> explains the trust model in more detail.</p>

<h2>Frequently asked questions</h2>
${faq(qa(ctx))}

<div class="related"><h2>Related</h2><ul>
  <li><a href="/guides/investor-portals-with-api-and-mcp">Investor portals with an API or MCP server</a></li>
  <li><a href="/guides/automate-capital-call-notices">Automating capital call notices</a></li>
  <li><a href="/compare">Compare investor portals</a></li>
  <li><a href="/portals/category/lp-portal">All LP portals in the registry</a></li>
  <li><a href="/portals/category/fund-admin-portal">Fund administrator portals</a></li>
</ul></div>

<h2>Sources</h2>
<ul class="sources">
  <li>${a(SRC.ilpaHub, "ILPA, updated templates hub")}</li>
  <li>${a(SRC.ilpaReporting, "ILPA Reporting Template v2.0")}</li>
  <li>${a(SRC.ilpaCall, "ILPA Capital Call and Distribution Template v2.0")}</li>
  <li>${a(SRC.ilpaPerf, "ILPA Performance Template v1.1")}</li>
  <li>${a(SRC.canoe, "Canoe Intelligence, Canoe Connect")}</li>
  <li>${a(SRC.arch, "Arch, product overview")}</li>
  <li>${a(SRC.dora, "Regulation (EU) 2022/2554 (DORA)")}</li>
  <li>${a(SRC.rfc9421, "IETF RFC 9421, HTTP Message Signatures")}</li>
  <li>${a(SRC.mcpRegistry, "Model Context Protocol Registry")}</li>
  <li>Registry entries for each portal, linked in the table above, each with its own sources.</li>
</ul>
</article>
</div></section>`;
}

export default {
  slug: SLUG,
  title: "How to choose an investor portal: requirements checklist",
  h1: H1,
  description:
    "A neutral checklist for GPs and fund administrators choosing investor portal software: LP experience, capital calls, security, ILPA templates and API access.",
  updated: UPDATED,
  summary: "A requirements checklist and vendor questions for GPs and administrators buying investor portal software, with live registry data on LP access.",
  order: 1,
  css: ".tbl-scroll{overflow-x:auto;max-width:960px;margin:8px 0 24px}.tbl-scroll caption{caption-side:top;text-align:left;font-size:13px;color:var(--muted);padding:0 0 6px}",
  render,
  jsonld: (ctx) => [faqLd(qa(ctx))],
};
