// Guide: which investor portals offer an API, an MCP server or SFTP, and who each one is for.
// Every table and count is generated from ctx (registry/portals/*.json and research/assessments.json).
import { esc, pill, diffBadge, portalLink, breadcrumbs, faq, faqLd, CATEGORY_LABEL } from "../layout.mjs";

const SLUG = "investor-portals-with-api-and-mcp";
const H1 = "Investor portal APIs and MCP servers: what an LP can actually use";

const AUDIENCE_LABEL = { lp: "LP", gp: "GP", "fund-admin": "Fund admin", partner: "Partner" };
const API_AUTH_LABEL = {
  "oauth2-client-credentials": "OAuth 2 client credentials",
  "oauth2-authorization-code": "OAuth 2 authorization code",
  "api-key": "API key",
  basic: "Basic",
  jwt: "JWT",
  mtls: "mTLS",
  other: "Other",
};
const MCP_AUTH_LABEL = { oauth2: "OAuth 2", "api-key": "API key", none: "None", other: "Other (sign-in)" };
const SHOWN = new Set(["available", "beta", "partner-only", "planned"]);

const list = (arr, labels) => (arr?.length ? arr.map((x) => labels[x] ?? x).join(", ") : "");
const orNot = (s) => (s ? esc(s) : `<span class="muted">Not recorded</span>`);
const byName = (a, b) => a.name.localeCompare(b.name);
const status = (p, ch) => p.access?.[ch]?.status ?? "unknown";
const link = (p) => `<a href="/portals/${esc(p.id)}">${esc(p.name)}</a>`;
const names = (arr) => {
  const l = arr.map(link);
  return l.length <= 1 ? l.join("") : `${l.slice(0, -1).join(", ")} and ${l.at(-1)}`;
};
const plainNames = (arr) => {
  const l = arr.map((p) => p.name);
  return l.length <= 1 ? l.join("") : `${l.slice(0, -1).join(", ")} and ${l.at(-1)}`;
};
const n = (k, one, many = one + "s") => `${k} ${k === 1 ? one : many}`;

function data(ctx) {
  const P = [...ctx.portals].sort(byName);
  const apiOpen = P.filter((p) => ["available", "beta"].includes(status(p, "api")));
  const aud = (p) => p.access.api.audience ?? [];
  const apiLp = apiOpen.filter((p) => aud(p).includes("lp"));
  const apiGp = apiOpen.filter((p) => aud(p).length && !aud(p).includes("lp"));
  const apiNoAud = apiOpen.filter((p) => !aud(p).length);
  const apiPartner = P.filter((p) => status(p, "api") === "partner-only");
  const apiPartnerLp = apiPartner.filter((p) => (p.access.api.audience ?? []).includes("lp"));
  const apiUnknown = P.filter((p) => status(p, "api") === "unknown");
  const mcp = P.filter((p) => SHOWN.has(status(p, "mcp")));
  const mcpAvail = mcp.filter((p) => status(p, "mcp") === "available");
  const mcpBeta = mcp.filter((p) => status(p, "mcp") === "beta");
  const mcpPartner = mcp.filter((p) => status(p, "mcp") === "partner-only");
  const sftp = P.filter((p) => SHOWN.has(status(p, "sftp")));
  const oipp = P.filter((p) => SHOWN.has(p.oipp?.status ?? "unknown"));
  const unverified = P.filter((p) => (p.verification?.status ?? "unverified") === "unverified");
  return { P, apiOpen, apiLp, apiGp, apiNoAud, apiPartner, apiPartnerLp, apiUnknown, mcp, mcpAvail, mcpBeta, mcpPartner, sftp, oipp, unverified };
}

function countRow(P, ch, label) {
  const c = (s) => P.filter((p) => status(p, ch) === s).length;
  return `<tr><td>${esc(label)}</td>${["available", "beta", "partner-only", "planned", "none", "unknown"]
    .map((s) => `<td>${c(s)}</td>`)
    .join("")}</tr>`;
}

function apiTable(ctx, rows) {
  return `<div class="tblwrap"><table class="channels">
<thead><tr><th>Portal</th><th>Category</th><th>API</th><th>Audience</th><th>Auth</th><th>Difficulty</th></tr></thead>
<tbody>${rows
    .map((p) => {
      const api = p.access.api;
      return `<tr><td>${portalLink(ctx, p)}</td><td>${esc(CATEGORY_LABEL[p.category] ?? p.category)}</td><td>${pill(api.status)}</td><td>${orNot(
        list(api.audience, AUDIENCE_LABEL)
      )}</td><td>${orNot(list(api.auth, API_AUTH_LABEL))}</td><td>${diffBadge(ctx.assessments[p.id]?.difficulty)}</td></tr>`;
    })
    .join("\n")}</tbody></table></div>`;
}

function mcpTable(ctx, rows) {
  return `<div class="tblwrap"><table class="channels">
<thead><tr><th>Portal</th><th>MCP</th><th>Endpoint</th><th>Auth</th><th>Maintainer</th></tr></thead>
<tbody>${rows
    .map((p) => {
      const m = p.access.mcp;
      return `<tr><td>${portalLink(ctx, p)}</td><td>${pill(m.status)}</td><td>${
        m.endpoint ? `<code>${esc(m.endpoint)}</code>` : `<span class="muted">Not published</span>`
      }</td><td>${orNot(list(m.auth, MCP_AUTH_LABEL))}</td><td>${orNot(m.maintainer && m.maintainer !== "unknown" ? m.maintainer[0].toUpperCase() + m.maintainer.slice(1) : "")}</td></tr>`;
    })
    .join("\n")}</tbody></table></div>`;
}

function sftpTable(ctx, rows) {
  return `<div class="tblwrap"><table class="channels">
<thead><tr><th>Portal</th><th>SFTP</th><th>Registry note</th></tr></thead>
<tbody>${rows
    .map((p) => `<tr><td>${portalLink(ctx, p)}</td><td>${pill(p.access.sftp.status)}</td><td class="note">${orNot(p.access.sftp.notes)}</td></tr>`)
    .join("\n")}</tbody></table></div>`;
}

function faqItems(ctx) {
  const d = data(ctx);
  return [
    {
      q: "Is there an investor portal API that an LP can use directly?",
      a: d.apiLp.length
        ? `In the registry, ${n(d.apiLp.length, "portal")} list${d.apiLp.length === 1 ? "s" : ""} an available or beta API whose audience includes LPs: ${plainNames(
            d.apiLp
          )}. The other ${d.apiOpen.length - d.apiLp.length} available or beta APIs are issued to GPs, fund administrators, account owners or commercial partners, or their audience is not recorded.`
        : "No portal in the registry currently lists an available or beta API whose audience includes LPs.",
    },
    {
      q: "What is the difference between an API and an MCP server?",
      a: "An API is a documented interface that your own code calls to fetch data, such as documents or capital account balances. An MCP server is an interface built for AI assistants: an MCP client such as Claude or ChatGPT connects to it, signs in as a user and calls the tools it offers. Both are only useful to an investor if the investor can obtain credentials.",
    },
    {
      q: "What does partner-only mean for a portal API?",
      a: "In the registry, partner-only means the interface exists but requires a commercial agreement with the vendor. In practice that agreement is usually signed by the fund manager, the fund administrator or an integration partner, not by an individual LP. The audience field records who may obtain credentials.",
    },
    {
      q: "Can an LP use a vendor MCP server to read their own fund documents?",
      a: `Usually not yet, or not confirmed. ${n(d.mcp.length, "portal")} in the registry record an MCP server, but most registry notes describe access for GP teams, advisors or account users, and several state that investor or viewer access is not documented. Check the registry entry for each portal.`,
    },
    {
      q: "Is SFTP still used for fund reporting data?",
      a: d.sftp.length
        ? `The registry records SFTP for ${n(d.sftp.length, "portal")}, and for ${n(
            d.P.filter((p) => status(p, "sftp") === "unknown").length,
            "portal"
          )} it is unknown. Where SFTP exists it is typically arranged per client or used by administrators to post statements, not offered as a self-serve investor feature.`
        : "No portal in the registry currently records an SFTP channel.",
    },
    {
      q: "How does the Open Investor Portal Protocol relate to vendor APIs?",
      a: `OIPP is a draft open specification for a small, read-only investor API that any portal can implement, with the investor authenticating with their own key. It does not replace a vendor API. ${
        d.oipp.length ? `${n(d.oipp.length, "portal")} in the registry report OIPP status.` : "No portal in the registry reports OIPP support yet."
      }`,
    },
  ];
}

function render(ctx) {
  const d = data(ctx);
  const total = d.P.length;
  const A = (id) => ctx.byId.get(id);
  const ref = (id) => (A(id) ? `${link(A(id))} (${pill(A(id).access?.mcp?.status)})` : "");

  const emailAvail = d.P.filter((p) => status(p, "email_notifications") === "available").length;
  const webhookAvail = d.P.filter((p) => status(p, "webhooks") === "available");

  // Vendor MCP highlights: only portals present in the registry with an MCP status recorded.
  const highlights = [
    ["addepar-client-portal", "The registry notes an official server marked closed beta in vendor documentation, with sign-in through an Addepar account and tools for private fund cash movements and upcoming capital activity. It is aimed at advisor firm users; end-client access is not stated."],
    ["papermark", "A vendor server, hosted with OAuth and also published as an npm package. The registry notes version 0.1.0, described as alpha, with tools for data rooms, documents, links and visitor analytics. It acts as the data room owner, not as a visitor."],
    ["angellist-venture", "A read-only vendor server with tools for capital accounts, capital calls, distributions and documents. The registry notes it is available to GPs and their teams only, and that LP use cases are not yet supported."],
    ["chronograph-lp", "A vendor server with query, entity search, commitment history and exposure tools. Chronograph LP is an LP-side monitoring platform where the LP is the customer, so here the server is for the investor organisation."],
    ["carta", "A vendor remote server that signs in with existing Carta credentials. The registry notes that fund performance data is mentioned, documents and capital calls are not, and LP coverage is unconfirmed."],
    ["docsend", "A vendor server in beta for DocSend account users on certain plans, enabled by an admin. Use by people who only view a shared space is not stated."],
    ["juniper-square", "A vendor server in beta with select customers, with read-only tools for contacts, accounts, positions, documents and transactions. The registry records it as GP-side only."],
    ["securitize", "Recorded from a third-party profile as a public server with five tools. The registry notes this is not verified against vendor documentation."],
  ].filter(([id]) => A(id) && SHOWN.has(A(id).access?.mcp?.status));

  const qa = faqItems(ctx);

  return `<section class="page-head"><div class="wrap">
  ${breadcrumbs([
    { name: "Guides", path: "/guides" },
    { name: H1, path: `/guides/${SLUG}` },
  ])}
  <h1>${esc(H1)}</h1>
  <p class="lead">Many investor portals now advertise an API or an MCP server. The question for an investor is narrower: can you, as the LP, get credentials? This guide sorts the ${total} portals in the open registry by channel and by who each interface is for.</p>
  <div class="meta"><span>Updated 2026-11-07</span><span>${d.apiOpen.length} portals with an available or beta API</span><span>${d.mcp.length} with an MCP server</span><span>${d.sftp.length} with SFTP</span></div>
</div></section>
<section class="tight"><div class="wrap"><div class="prose">

<h2>Four ways data leaves an investor portal</h2>
<p>An investor portal holds the documents and figures a fund manager shares with its investors: capital call notices, distribution notices, capital account statements, quarterly reports and tax documents. There are four common routes for getting that data out without a person logging in and downloading files.</p>
<ul>
  <li><strong>API.</strong> A documented interface your own software calls, usually over REST with a key or OAuth token. It returns structured data and files on request. It is the most precise channel, and the one with the most rules about who gets credentials.</li>
  <li><strong>MCP server.</strong> The Model Context Protocol is an open standard that lets AI assistants call tools on a remote system. A portal's MCP server lets an assistant such as Claude or ChatGPT sign in as a user and query that user's data. It is not a bulk feed. It answers questions and can fetch documents, within the signed-in user's permissions.</li>
  <li><strong>SFTP.</strong> A file transfer server where files are dropped on a schedule. It suits back-office pipelines that load statements into an accounting or reporting system. It is usually set up per client, not self-serve.</li>
  <li><strong>Email feeds.</strong> Notification emails when a new document is posted. The registry counts below show how often they are recorded. They tell you something changed, but they often link back to the portal rather than carry the document.</li>
</ul>
<p>The registry records a status for each channel on every portal. The table below counts them across all ${total} entries. Unknown means nobody has checked yet, not that the channel is absent.</p>
<div class="tblwrap"><table class="channels">
<thead><tr><th>Channel</th><th>Available</th><th>Beta</th><th>Partner only</th><th>Planned</th><th>Not offered</th><th>Unknown</th></tr></thead>
<tbody>
${countRow(d.P, "api", "API")}
${countRow(d.P, "mcp", "MCP server")}
${countRow(d.P, "sftp", "SFTP")}
${countRow(d.P, "webhooks", "Webhooks")}
${countRow(d.P, "email_notifications", "Email notifications")}
</tbody></table></div>

<h2>The key question: who is the API for?</h2>
<p>An API listed as available does not mean an investor can use it. Much portal software is bought by the fund manager (the GP) or the fund administrator, and the API exists so that they can integrate the portal with their CRM, fund accounting or data warehouse. The investor sees the portal from the other side, as an invited user.</p>
<p>The registry captures this in the <code>access.api.audience</code> field, which lists who may obtain credentials: <code>lp</code>, <code>gp</code>, <code>fund-admin</code> or <code>partner</code>. Only an audience that includes <code>lp</code> means an investor can request keys for their own data. The status <code>partner-only</code> means the API exists but requires a commercial agreement with the vendor. That agreement is almost always held by the GP, the administrator or an integration partner, so for an LP a partner-only API is effectively GP-side. The guide <a href="/guides/partner-only-portal-access-explained">partner-only portal access explained</a> covers what that means in practice.</p>
<div class="callout"><strong>Reading the tables.</strong> Entries are community research and ${d.unverified.length === total ? "all are" : `${d.unverified.length} of ${total} are`} currently unverified. Difficulty is the registry's own 1 to 5 rating of how hard it is for an investor to get data out programmatically (1 is a documented self-serve investor API). Vendors can correct their entry by pull request.</div>

<h2>Portals with an API marked available or beta</h2>
<p>${n(d.apiOpen.length, "portal")} in the registry list an API as available or beta. They split by audience as follows.</p>

<h3>Usable by investors (${d.apiLp.length})</h3>
${
  d.apiLp.length
    ? `<p>The audience includes LPs. Check the portal entry for plan requirements: an investor-side API can still require a paid subscription.</p>${apiTable(ctx, d.apiLp)}`
    : `<p>No portal currently lists an available or beta API whose audience includes LPs.</p>`
}

<h3>GP or owner side only (${d.apiGp.length})</h3>
${
  d.apiGp.length
    ? `<p>The audience does not include LPs. These APIs serve the firm that licenses the software, its administrator or integration partners. A family office that is itself the licensee of a platform can use that platform's API for its own data, but an investor invited into someone else's portal cannot.</p>${apiTable(ctx, d.apiGp)}`
    : `<p>None at present.</p>`
}
${
  d.apiNoAud.length
    ? `<h3>Audience not recorded (${d.apiNoAud.length})</h3><p>The API is listed, but the registry does not yet record who may obtain credentials.</p>${apiTable(ctx, d.apiNoAud)}`
    : ""
}
<p>A further ${n(d.apiPartner.length, "portal")} list an API as partner-only${
    d.apiPartnerLp.length ? `, of which ${d.apiPartnerLp.length} name LPs in the audience (${names(d.apiPartnerLp)})` : ""
  }. For ${n(d.apiUnknown.length, "portal")} the API status is unknown. The <a href="/portals">full registry of investor portals</a> lists every entry with its channel statuses.</p>

<h2>Portals with an MCP server</h2>
<p>${n(d.mcp.length, "portal")} in the registry record an MCP server: ${d.mcpAvail.length} available, ${d.mcpBeta.length} in beta and ${d.mcpPartner.length} partner-only${
    d.mcp.length - d.mcpAvail.length - d.mcpBeta.length - d.mcpPartner.length ? `, plus ${d.mcp.length - d.mcpAvail.length - d.mcpBeta.length - d.mcpPartner.length} planned` : ""
  }. Endpoint and authentication are shown where the vendor or a source has published them. Where they are not published, the registry says so.</p>
${mcpTable(ctx, d.mcp)}
<p>An MCP server inherits the permissions of the account that signs in. Whether that account can be an investor depends on the vendor. Most entries describe a server for the firm's own users.</p>

<h3>What the vendor MCP servers cover</h3>
<p>Short summaries from the registry notes, in no particular order. Status is shown next to each name.</p>
<ul>
${highlights.map(([id, text]) => `  <li>${ref(id)}: ${esc(text)}</li>`).join("\n")}
</ul>
<p>The pattern across these entries: MCP servers in this market are new, most dated entries in the registry are from 2026, and they are built first for the people who operate the portal. Investor-side MCP access is explicitly ruled out in some entries and not stated in most others.</p>

<h2>SFTP and email feeds</h2>
<p>${
    d.sftp.length
      ? `${n(d.sftp.length, "portal")} in the registry record an SFTP channel. In each case the notes describe an arrangement for specific clients or for administrators posting files, rather than a self-serve investor feature.`
      : "No portal in the registry currently records an SFTP channel."
  }</p>
${d.sftp.length ? sftpTable(ctx, d.sftp) : ""}
<p>Email notifications are recorded as available for ${n(emailAvail, "portal")}. ${
    webhookAvail.length
      ? `Webhooks, a machine-readable alternative, are recorded as available for ${n(webhookAvail.length, "portal")} (${names(webhookAvail)}).`
      : "No portal records available webhooks."
  } For a practical approach to turning notification emails into structured records, see <a href="/guides/automate-capital-call-notices">how to automate capital call and distribution notices</a>.</p>

<h2>Where the open protocol fits</h2>
<p>An LP with commitments to many funds deals with many portals, each with its own login, MFA and, at best, its own API. The Open Investor Portal Protocol (OIPP) is a draft open specification for a small, read-only API that any portal can implement: accounts, documents, capital calls, distributions, capital account statements and change notifications, with payloads aligned to ILPA templates.</p>
<p>The design gives the investor one identity across portals. The investor generates a key pair locally and registers only the public key. They link that identity to each portal account they already hold, and then sign requests to each portal directly. No passwords, tokens or portal data pass through OpenInvestorPortal. A local MCP server can sit on top, so the same investor-side assistant works across every portal that implements the protocol.</p>
<p>OIPP is a proposal, not an industry standard. ${
    d.oipp.length ? `${n(d.oipp.length, "portal")} in the registry currently report an OIPP status.` : "No portal in the registry reports OIPP support yet."
  } It does not compete with vendor APIs for GP-side integration. It addresses the gap the tables above show: few interfaces are issued to investors.</p>

<h2>A practical approach for LP operations teams</h2>
<ol>
  <li>List the portals you log in to and look each one up in the <a href="/portals">investor portal registry</a>.</li>
  <li>Where the API audience includes LPs, ask the vendor for credentials and check plan requirements.</li>
  <li>Where the API is GP-side or partner-only, ask the fund manager or administrator whether they can enable a data feed, SFTP drop or MCP access for your account.</li>
  <li>Where nothing programmatic exists, use notification emails as the trigger and download documents through the portal, within its terms.</li>
  <li>If you know an entry is wrong or out of date, submit a correction so the next team benefits.</li>
</ol>

<h2>Frequently asked questions</h2>
${faq(qa)}

<h2>Sources</h2>
<ul class="sources">
  <li>OpenInvestorPortal registry entries in <code>registry/portals/</code>, schema in <code>schema/portal.schema.json</code>, difficulty ratings in <code>research/assessments.json</code>. Each portal page lists its own sources.</li>
${[...new Set(d.mcp.concat(d.apiOpen).flatMap((p) => [p.access.api?.docs_url, p.access.mcp?.docs_url]).filter(Boolean))]
  .sort()
  .map((u) => `  <li><a href="${esc(u)}" rel="nofollow noopener" target="_blank">${esc(u)}</a></li>`)
  .join("\n")}
  <li>Model Context Protocol: <a href="https://modelcontextprotocol.io" rel="noopener" target="_blank">modelcontextprotocol.io</a></li>
</ul>

<div class="related">
  <h2>Related</h2>
  <ul>
    <li><a href="/guides/partner-only-portal-access-explained">Partner-only portal access explained</a></li>
    <li><a href="/guides/automate-capital-call-notices">Automate capital call notices</a></li>
    <li><a href="/guides/how-to-choose-an-investor-portal">How to choose an investor portal</a></li>
    <li><a href="/portals">Investor portal registry</a></li>
    <li><a href="/compare">Portal comparisons</a></li>
  </ul>
</div>
<p class="updated">Updated 2026-11-07. Tables regenerate from registry data on every request.</p>

</div></div></section>`;
}

export default {
  slug: SLUG,
  title: "Investor portal APIs and MCP servers: what LPs can use",
  h1: H1,
  description:
    "Which investor portals offer an API, MCP server or SFTP feed, and whether an LP can use it or it is GP-side only. Tables generated from the open registry.",
  updated: "2026-11-07",
  summary: "Which portals offer an API, MCP server or SFTP, and whether an investor can get credentials or it is GP-side only.",
  order: 2,
  css: ".tblwrap{overflow-x:auto;margin:0 0 18px}.tblwrap .channels{min-width:560px}.channels code{font-size:12.5px;word-break:break-all;white-space:normal}.channels .muted{color:var(--muted);font-weight:400}.channels td:first-child .pname{display:inline-flex;align-items:center;gap:8px}",
  render,
  jsonld: (ctx) => [faqLd(faqItems(ctx))],
};
