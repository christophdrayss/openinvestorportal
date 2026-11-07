// Guide: what a "partner-only" API status means for an investor (LP), with eFront Investment Café as the
// worked example. All registry facts (statuses, deployments, the partner-only table) are generated from ctx.
import { esc, pill, portalLink, breadcrumbs, faq, faqLd, STATUS_LABEL, CATEGORY_LABEL, DIFFICULTY_LABEL } from "../layout.mjs";

const SLUG = "partner-only-portal-access-explained";
const UPDATED = "2026-11-07";
const EXAMPLE_ID = "efront-investment-cafe";

const AUDIENCE_LABEL = { lp: "Investor (LP)", gp: "GP", "fund-admin": "Fund administrator", partner: "Distribution partner" };
const POLICY_LABEL = { permitted: "Permitted", tolerated: "Tolerated", prohibited: "Prohibited", unknown: "Unknown" };
const EXPORT_LABEL = { pdf: "PDF", xlsx: "XLSX", csv: "CSV", xml: "XML", json: "JSON", "ilpa-template": "ILPA template", fundsxml: "FundsXML", other: "Other" };

const st = (entry, ch) => entry?.access?.[ch]?.status ?? "unknown";
const audienceText = (entry) => {
  const a = entry?.access?.api?.audience ?? [];
  return a.length ? a.map((x) => AUDIENCE_LABEL[x] ?? x).join(", ") : "Not stated";
};

const QA = [
  {
    q: "Do I need a contract with the portal vendor to get my documents?",
    a: "No. As an investor your relationship is with the fund manager (GP) and its administrator, not with the portal vendor. A partner-only API is sold to the GP or administrator. Your documents come to you through the portal login, notification emails, or whatever delivery the GP or administrator agrees to set up for you.",
  },
  {
    q: "What does partner-only mean in the OpenInvestorPortal registry?",
    a: "It means the API exists but credentials require a commercial agreement with the vendor. The audience field says who can sign that agreement. For many portals the audience is only the GP, the fund administrator or a distribution partner, which leaves no direct API route for an investor.",
  },
  {
    q: "How can I get capital call notices from an eFront Investment Café portal automatically?",
    a: "The registry lists email notifications as available for eFront Investment Café, so the usual route is to parse the notification emails and then fetch or receive the notice. You can also ask the GP or administrator to send notices to a nominated email address or SFTP folder. The registry has not identified any investor-side API.",
  },
  {
    q: "Can I use browser automation on a partner-only portal?",
    a: "Only if the portal terms allow it. Check the automation policy in the registry entry and read the terms yourself. If the policy is prohibited, connectors must not automate the login. If it is unknown, nobody has checked yet, so treat it as unconfirmed until you or the vendor clarify it.",
  },
  {
    q: "Will the open protocol replace partner APIs?",
    a: "No. Partner APIs serve GPs and administrators who run the fund. The Open Investor Portal Protocol adds an investor-facing endpoint that the portal operator enables once. Each investor then links their own key to their existing account, without a separate contract per investor.",
  },
];

const SOURCES = [
  ["eFront Investment Café product page", "https://www.efront.com/alternative-investment-software/efront-investment-cafe/"],
  ["Apex Group, investor portal technology", "https://www.apexgroup.com/technology-platforms/investor-portal/"],
  ["Apex Group, client portals", "https://www.apexgroup.com/client-portals/"],
  ["Ocorian, investor services", "https://www.ocorian.com/service/investor-services"],
  ["Ocorian partners with BlackRock's eFront (press release via Mondaq)", "https://www.mondaq.com/PressRelease/86414/Ocorian-Partners-With-Blackrocks-Efront-Suite-For-Its-Global-Funds-Administration-Platform"],
  ["ILPA Capital Call & Distribution Template", "https://ilpa.org/industry-guidance/templates-standards-model-documents/ilpa-templates-hub/ilpa-capital-call-distribution-template/"],
  ["ILPA templates hub", "https://ilpa.org/industry-guidance/templates-standards-model-documents/updated-ilpa-templates-hub/"],
];

function partnerOnly(ctx) {
  return ctx.portals.filter((p) => st(p, "api") === "partner-only").sort((a, b) => a.name.localeCompare(b.name));
}

function statusCounts(ctx) {
  const c = {};
  for (const p of ctx.portals) c[st(p, "api")] = (c[st(p, "api")] ?? 0) + 1;
  return c;
}


function exampleFacts(ctx, e) {
  const a = ctx.assessments[e.id] ?? {};
  const exports = (e.access?.export_formats ?? []).map((x) => EXPORT_LABEL[x] ?? x).join(", ") || "Not stated";
  return `<dl class="facts">
  <div><dt>API</dt><dd>${pill(st(e, "api"))}</dd></div>
  <div><dt>API audience</dt><dd>${esc(audienceText(e))}</dd></div>
  <div><dt>Email notifications</dt><dd>${pill(st(e, "email_notifications"))}</dd></div>
  <div><dt>SFTP</dt><dd>${pill(st(e, "sftp"))}</dd></div>
  <div><dt>MCP</dt><dd>${pill(st(e, "mcp"))}</dd></div>
  <div><dt>Exports</dt><dd>${esc(exports)}</dd></div>
  <div><dt>Automation policy</dt><dd>${esc(POLICY_LABEL[e.terms?.automation_policy ?? "unknown"])}</dd></div>
  <div><dt>Difficulty</dt><dd>${a.difficulty ? `${a.difficulty} / 5: ${esc(DIFFICULTY_LABEL[a.difficulty])}` : "Unrated"}</dd></div>
</dl>`;
}

function partnerTable(ctx) {
  const rows = partnerOnly(ctx)
    .map((p) => {
      const exports = (p.access?.export_formats ?? []).map((x) => EXPORT_LABEL[x] ?? x).join(", ") || "Not stated";
      return `<tr><td>${portalLink(ctx, p)}</td><td>${esc(CATEGORY_LABEL[p.category] ?? p.category)}</td><td>${esc(audienceText(p))}</td><td>${pill(st(p, "email_notifications"))}</td><td>${pill(st(p, "sftp"))}</td><td>${pill(st(p, "webhooks"))}</td><td>${pill(st(p, "mcp"))}</td><td>${esc(exports)}</td><td>${esc(POLICY_LABEL[p.terms?.automation_policy ?? "unknown"])}</td></tr>`;
    })
    .join("\n");
  return `<div class="tbl-scroll"><table class="channels po-table">
<thead><tr><th>Portal</th><th>Category</th><th>API audience</th><th>Email</th><th>SFTP</th><th>Webhooks</th><th>MCP</th><th>Exports</th><th>Automation policy</th></tr></thead>
<tbody>
${rows}
</tbody></table></div>`;
}

const TEMPLATE = `Subject: Delivery of capital call and distribution notices for [investor entity]

Dear [Investor Relations / Investor Services team],

We are invested in [fund name] through [investor entity name, investor ID if known].
We currently receive notices through the investor portal. To support our internal
processing, could you please also deliver the following documents for this account:

- capital call notices
- distribution notices
- capital account statements and quarterly reports

to [nominated email address, e.g. notices@investor.example]
or to an SFTP folder we provide (we can share host details and a public key).

Where possible, please include the data in the ILPA Capital Call & Distribution
Template format (or the ILPA Reporting Template for statements) as XLSX or CSV,
alongside the PDF notice.

Please let us know if you need a signed request, a side letter reference or
additional verification before setting this up.

Kind regards,
[Name, role, entity]`;

function render(ctx) {
  const e = ctx.byId.get(EXAMPLE_ID);
  const counts = statusCounts(ctx);
  const total = ctx.portals.length;
  const po = partnerOnly(ctx);
  const poLp = po.filter((p) => (p.access?.api?.audience ?? []).includes("lp")).length;
  const poEmail = po.filter((p) => st(p, "email_notifications") === "available").length;
  const n = (s) => counts[s] ?? 0;

  const example = e
    ? `<p>The registry entry for ${portalLink(ctx, e)} reads as follows. Vendor: ${esc(e.vendor.name)}. Category: ${esc(CATEGORY_LABEL[e.category] ?? e.category)}. The entry is community research with verification status <strong>${esc(e.verification?.status ?? "unverified")}</strong>.</p>
${exampleFacts(ctx, e)}
<p>The API note in the entry says: "${esc(e.access?.api?.notes ?? "")}" The general note adds: "No LP-side programmatic access identified." In other words, the API that exists is described as back-office integration for the GP or administrator, and the registry has found no route for an investor to obtain API credentials.</p>`
    : `<p>The eFront entry is not in the registry at the moment.</p>`;

  return `<section class="page-head"><div class="wrap">
  ${breadcrumbs([{ name: "Guides", path: "/guides" }, { name: "Partner-only access explained", path: `/guides/${SLUG}` }])}
  <h1>Partner-only portal APIs: what investors can do instead</h1>
  <p class="lead">Many investor portals list an API that only the fund manager, administrator or a distribution partner can contract for. This guide explains what that means for an LP, using eFront Investment Café as the example, and the practical ways to get capital call notices without a vendor contract.</p>
  <div class="meta"><span>Updated ${esc(UPDATED)}</span><span>Tables generated from the live registry</span></div>
</div></section>
<section class="tight"><div class="wrap">
<div class="prose">
<p>An investor in a fund whose portal runs on eFront put the question plainly: "So I must sign a contract with eFront? I just want the capital call notice." The registry had marked the eFront API as partner-only, and the label read like a door the investor had to unlock.</p>
<div class="callout"><strong>Short answer: no.</strong> A partner-only API is sold to the vendor's customer, which is the GP or the fund administrator. An investor usually has no API route at all. The practical routes are notification email parsing, asking the GP or administrator to deliver notices to a nominated email address or SFTP folder, a GP data feed, or browser automation where the portal terms allow it. In the long run, an investor-facing protocol endpoint removes the problem.</div>

<h2>What the access statuses mean for an investor</h2>
<p>Every registry entry records a status per access channel: web, API, MCP, SFTP, webhooks and email notifications. The schema defines the values. Here is what each one means if you are the LP trying to get your own documents. Counts are for the API channel across all ${total} entries.</p>
<ul>
<li>${pill("available")} <strong>Documented and self-serve.</strong> You can read the docs and request credentials. Check the audience field: some available APIs are still meant for GPs, not LPs. ${n("available")} entries.</li>
<li>${pill("partner-only")} <strong>The API exists but needs a commercial agreement.</strong> The audience field says who may sign one. When the audience is GP, fund administrator or distribution partner, an investor cannot obtain credentials on their own. ${n("partner-only")} entries.</li>
<li>${pill("beta")} <strong>Released to a limited group, subject to change.</strong> Useful to watch, risky to build a process on. ${n("beta")} entries.</li>
<li>${pill("planned")} <strong>Announced, not yet released.</strong> ${n("planned")} ${n("planned") === 1 ? "entry" : "entries"}.</li>
<li>${pill("none")} <strong>Confirmed absent.</strong> Someone checked and found no API. ${n("none")} entries.</li>
<li>${pill("unknown")} <strong>Nobody has checked yet.</strong> This is not a negative finding. It means the research is open. ${n("unknown")} entries.</li>
</ul>
<p>The audience field matters as much as the status. Of the ${po.length} partner-only APIs in the registry, ${poLp} list investors among the audience. For the rest, partner-only effectively means "not for LPs".</p>

<h2>Why vendors gate their APIs</h2>
<p>Gating is a normal consequence of how these products are sold, not a judgment about investors.</p>
<ul>
<li><strong>The customer is the GP or administrator.</strong> Portal software is licensed to the firm that runs the fund or its administration. That firm decides which investors see which documents, and it pays for the platform. An API is part of that commercial relationship.</li>
<li><strong>Contracts define who may access data.</strong> The licence, the administration agreement and the fund documents set out who handles investor data and on whose instructions. A vendor that issued credentials directly to investors would step outside those agreements.</li>
<li><strong>Data protection.</strong> Under rules such as the GDPR, the firm that collects investor data generally decides how it is used, and a software provider processes it on that firm's instructions. Opening a separate channel to each investor would need that firm's consent and controls.</li>
<li><strong>Support and security.</strong> Each API client needs onboarding, monitoring and support. Many portals are deployed per GP or administrator, so a single investor-facing API would have to span many separate instances.</li>
</ul>

<h2>Worked example: eFront Investment Café</h2>
${example}

<h2>Practical routes to your notices today</h2>
<h3>1. Parse the notification emails</h3>
<p>Most portals email investors when a new document is posted. ${poEmail} of the ${po.length} partner-only entries list email notifications as available, eFront Investment Café among them. A mailbox rule or a small parser can detect the notice, record the fund, amount type and due date from the subject or body where present, and alert your team to fetch the PDF. The guide to <a href="/guides/automate-capital-call-notices">automating capital call and distribution notices</a> covers the setup in detail.</p>
<h3>2. Ask the GP or administrator to deliver to you</h3>
<p>Administrators already distribute notices to investors, so the request is about where and in what form, not about new access. Ask for delivery to a nominated email address or SFTP folder, ideally with a structured file next to the PDF. The ILPA Capital Call & Distribution Template gives both sides a shared field list, so the request is easy to specify. A short template:</p>
<pre class="po-template">${esc(TEMPLATE)}</pre>
<p>Send it to the investor relations contact named in your fund documents or the administrator's investor services team. Keep it narrow: a specific fund, a specific entity and a specific destination are easier to approve.</p>
<h3>3. A GP data feed</h3>
<p>Some GPs and administrators provide periodic data files to investors or to the investor's own reporting platform. If you already use a portfolio monitoring or reporting provider, ask whether it receives feeds from your GP or administrator, and whether your fund can be added. This route depends on the GP, not on the portal vendor.</p>
<h3>4. Browser automation, only if the terms allow it</h3>
<p>Logging in with a script on your own account is a fallback. It breaks with every portal change and multi-factor prompt, and it may be against the portal terms. Check the automation policy in the registry entry and read the terms yourself. For eFront Investment Café the registry records the policy as ${esc((POLICY_LABEL[e?.terms?.automation_policy ?? "unknown"] ?? "unknown").toLowerCase())}, which means it has not been checked. Where an entry says prohibited, connectors must not automate the login.</p>

<h2>How the open protocol changes the picture</h2>
<p>The routes above all work around the same gap: there is no investor-facing interface. The Open Investor Portal Protocol (OIPP) fills it. The portal operator, the GP or administrator running the instance, enables one standard endpoint and a "Connect with OpenInvestorPortal" option in the portal they already run. Each investor then links their own cryptographic key to the account they already have, and signs every request with it.</p>
<ul>
<li>No separate contract per investor. The operator enables the endpoint once, for all its investors.</li>
<li>No passwords or tokens leave the portal, and OpenInvestorPortal never holds portal data in the default mode.</li>
<li>The operator decides which capabilities a link can read, and can revoke it at any time.</li>
<li>Capital call and distribution payloads align with the ILPA templates, so the data is the same across portals.</li>
</ul>
<p>Partner APIs stay as they are, serving GPs and administrators. The protocol adds the investor side. You can see which portals support it, and which APIs investors can use today, in the overview of <a href="/guides/investor-portals-with-api-and-mcp">investor portals with an API or MCP server</a>.</p>
</div>

<h2 class="po-h2">All partner-only APIs in the registry</h2>
<p class="po-intro">${po.length} entries list their API as ${esc(STATUS_LABEL["partner-only"].toLowerCase())}. The other columns show the channels an investor might use instead. Statuses are community research and mostly unverified. Vendors are invited to correct their entry.</p>
${partnerTable(ctx)}

<div class="prose">
<h2>Frequently asked questions</h2>
${faq(QA)}

<div class="related">
<h2>Related</h2>
<ul>
<li><a href="/guides/automate-capital-call-notices">Automate capital call notices</a></li>
<li><a href="/guides/investor-portals-with-api-and-mcp">Investor portals with API and MCP</a></li>
${e ? `<li><a href="/portals/${esc(e.id)}">${esc(e.name)} access details</a></li>` : ""}
<li><a href="/administrators">Fund administrators and their portals</a></li>
<li><a href="/portals">Full portal registry</a></li>
</ul>
</div>

<h2>Sources</h2>
<p class="sources">Registry data: the ${e ? `<a href="/portals/${esc(e.id)}">${esc(e.name)}</a> entry` : "eFront entry"}, registry/deployments.json and research/assessments.json, plus the schema definitions of each status. External sources:</p>
<ul class="sources">
${SOURCES.map(([t, u]) => `<li>${esc(t)}: <a href="${esc(u)}" rel="nofollow noopener" target="_blank">${esc(u)}</a></li>`).join("\n")}
</ul>
<p class="updated">Not affiliated with eFront, BlackRock or any listed vendor. Product names identify the listed products only.</p>
</div>
</div></section>`;
}

export default {
  slug: SLUG,
  title: "eFront investor portal API: partner-only access explained",
  h1: "Partner-only portal APIs: what investors can do instead",
  description:
    "What a partner-only API status means for an LP, using eFront as the example, and the practical ways to get capital call notices without a vendor contract.",
  updated: UPDATED,
  summary: "Why an investor needs no vendor contract when a portal API is partner-only, and the practical routes to capital call notices.",
  order: 6,
  css: `.tbl-scroll{overflow-x:auto;margin:8px 0 12px}
.po-table td:first-child{white-space:nowrap}
.po-table td{font-size:14px}
.po-h2{font-size:clamp(22px,2.6vw,28px);margin:44px 0 12px;letter-spacing:-.02em}
.po-intro{max-width:760px;color:var(--ink2)}
.po-template{white-space:pre-wrap;background:#f7f8fa;border:1px solid var(--line);border-radius:10px;padding:16px 18px;font-size:13.5px;line-height:1.55;overflow-x:auto}`,
  render,
  jsonld: () => [faqLd(QA)],
};
