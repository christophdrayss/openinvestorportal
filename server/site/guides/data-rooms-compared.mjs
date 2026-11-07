// Guide: data rooms compared, owner-side versus recipient-side access. Tables are generated from the registry.
import { esc, abs, pill, diffBadge, portalLink, breadcrumbs, faq, faqLd, DIFFICULTY_LABEL } from "../layout.mjs";
import * as cmpPairs from "../compare-pairs.mjs";

const SLUG = "data-rooms-compared";
const UPDATED = "2026-11-07";
const H1 = "Data rooms compared: API, MCP and investor access";

const rooms = (ctx) => ctx.portals.filter((p) => p.category === "data-room").sort((a, b) => a.name.localeCompare(b.name));

// Link to a registry entry by id; plain text if the entry is gone.
const L = (ctx, id, text) => {
  const e = ctx.byId.get(id);
  return e ? `<a href="/portals/${esc(id)}">${esc(text ?? e.name)}</a>` : esc(text ?? id);
};
const status = (e, ch) => e?.access?.[ch]?.status ?? "unknown";
const offered = (s) => ["available", "beta", "partner-only"].includes(s);

// Recipient-side access from the assessment: true, false or "unknown".
function recipient(ctx, id) {
  const a = ctx.assessments[id] ?? {};
  const v = a.recipient_side_api ?? a.lp_side_api ?? a.investor_side_api ?? "unknown";
  if (v === true) return { cls: "available", label: "Documented" };
  if (v === false) return { cls: "none", label: "Not offered" };
  return { cls: "unknown", label: "Unknown" };
}

function table(ctx) {
  const rows = rooms(ctx)
    .map((e) => {
      const r = recipient(ctx, e.id);
      const d = ctx.assessments[e.id]?.difficulty ?? ctx.summaryById.get(e.id)?.difficulty;
      return `<tr><td>${portalLink(ctx, e)}</td><td>${pill(status(e, "api"))}</td><td>${pill(status(e, "mcp"))}</td><td>${pill(
        status(e, "webhooks")
      )}</td><td><span class="pill ${r.cls}">${esc(r.label)}</span></td><td>${diffBadge(d)}</td></tr>`;
    })
    .join("\n");
  return `<div class="dr-scroll"><table class="channels dr-table">
<thead><tr><th>Data room</th><th>API</th><th>MCP</th><th>Webhooks</th><th>Recipient-side access</th><th>Difficulty</th></tr></thead>
<tbody>
${rows}
</tbody></table></div>`;
}

function mcpList(ctx) {
  const list = rooms(ctx).filter((e) => offered(status(e, "mcp")));
  if (!list.length) return "<p>No data room in the registry currently records an MCP server.</p>";
  return `<ul>${list
    .map((e) => {
      const m = e.access.mcp;
      const who = m.maintainer === "vendor" ? "vendor-maintained" : m.maintainer ? `maintained by ${esc(m.maintainer)}` : "maintainer not recorded";
      return `<li>${L(ctx, e.id)}: ${pill(m.status)} ${who}</li>`;
    })
    .join("")}</ul>`;
}

function counts(ctx) {
  const list = rooms(ctx);
  return {
    total: list.length,
    api: list.filter((e) => status(e, "api") === "available").length,
    apiAny: list.filter((e) => offered(status(e, "api"))).length,
    mcp: list.filter((e) => offered(status(e, "mcp"))).length,
    webhooks: list.filter((e) => status(e, "webhooks") === "available").length,
    recipientYes: list.filter((e) => recipient(ctx, e.id).cls === "available").length,
    recipientNo: list.filter((e) => recipient(ctx, e.id).cls === "none").length,
  };
}

function compareLinks(ctx) {
  const ids = new Set(rooms(ctx).map((e) => e.id));
  const pairs = (cmpPairs.PAIRS ?? []).filter(([a, b]) => ids.has(a) || ids.has(b));
  const path = cmpPairs.comparePath ?? ((a, b) => `/compare/${a}-vs-${b}`);
  const name = (id) => ctx.byId.get(id)?.name ?? id;
  const items = pairs.map(([a, b]) => `<li><a href="${esc(path(a, b))}">${esc(name(a))} vs ${esc(name(b))}</a></li>`);
  items.push(`<li><a href="/compare">All side-by-side portal and data room comparisons</a></li>`);
  items.push(`<li><a href="/portals/category/data-room">Every data room in the registry</a></li>`);
  items.push(`<li><a href="/guides/how-to-choose-an-investor-portal">How to choose an investor portal</a></li>`);
  items.push(`<li><a href="/guides/investor-portals-with-api-and-mcp">Investor portals with an API or MCP server</a></li>`);
  return `<ul>${items.join("")}</ul>`;
}

const QA = [
  {
    q: "What is the difference between owner-side and recipient-side data room access?",
    a: "Owner-side access lets the fund manager who runs the room create rooms, upload documents, invite users and read analytics through an API or MCP server. Recipient-side access would let an invited investor retrieve the documents shared with them programmatically. In the registry, the data rooms that document an API describe owner-side access; none documents a recipient-side API.",
  },
  {
    q: "Which data rooms have an API?",
    a: "As recorded in the registry, Papermark, Datasite and Digify list an API as available, and Ideals and Intralinks offer one through a paid add-on or through sales (partner only). SmartRoom mentions an API without public documentation. For the other entries the API status is unknown. Check each entry page for the current status and sources.",
  },
  {
    q: "Is there an open source data room?",
    a: "Papermark is recorded as open source under the AGPLv3 license, with a hosted service and self-hosting on its Enterprise plan. No other data room in the registry is recorded as open source.",
  },
  {
    q: "Which data rooms offer an MCP server?",
    a: "The registry records vendor MCP servers for Papermark (available, alpha), Ideals (available, enabled by admins per user group), DocSend (beta), and Datasite and Ansarada (partner only, enabled per account or per room). Each acts with the permissions of the signed-in user.",
  },
  {
    q: "Can an LP download data room documents automatically?",
    a: "Not through a documented recipient API today. Some MCP servers are scoped to the signed-in user's permissions, which may in principle cover invited users, but no vendor confirms this for investors. Terms of use also matter: Intralinks prohibits bots and RPA, and Ideals prohibits unapproved tools. Ask the fund manager which official channel they support.",
  },
  {
    q: "How accurate is this comparison?",
    a: "Entries are community research from public vendor pages and are mostly unverified. Where the registry says unknown, the information was not found, not confirmed absent. Vendors can correct or verify their entry by pull request.",
  },
];

export default {
  slug: SLUG,
  title: "Virtual data room comparison: API, MCP and LP access",
  h1: H1,
  description:
    "Virtual data room comparison for fund managers and LPs: permissions, watermarking, NDA gating, API, MCP servers, webhooks, exports and open source options.",
  updated: UPDATED,
  summary: "Owner-side versus recipient-side access in data rooms, with a registry table of API, MCP, webhooks and investor access.",
  order: 5,
  css: `.dr-scroll{overflow-x:auto;margin:18px 0 8px}.dr-table{margin:0;min-width:640px}.dr-table td{white-space:nowrap}.dr-table td:first-child{white-space:normal}`,
  render(ctx) {
    const c = counts(ctx);
    const dsMcp = offered(status(ctx.byId.get("datasite"), "mcp"));
    const pm = ctx.byId.get("papermark");
    const recipientText = c.recipientYes
      ? `${c.recipientYes} of the ${c.total} entries document it.`
      : `None of the ${c.total} data room entries document it.`;
    const recipientNoText = c.recipientNo
      ? ` The assessments record it as not offered for ${c.recipientNo}, because their APIs manage recipients rather than serve them. For the rest it is unknown.`
      : " For all of them it is unknown.";
    const webhookCount = c.webhooks
      ? `${c.webhooks} data room${c.webhooks === 1 ? "" : "s"} record${c.webhooks === 1 ? "s" : ""} webhooks as available.`
      : "No data room records webhooks as available.";
    return `<section class="page-head"><div class="wrap">
  ${breadcrumbs([{ name: "Guides", path: "/guides" }, { name: H1, path: `/guides/${SLUG}` }])}
  <h1>${esc(H1)}</h1>
  <p class="lead">A virtual data room comparison for fund managers using a data room for fundraising and investor reporting, and for LPs who receive documents through one. It covers what to check, what each option offers programmatically, and where the investor stands.</p>
  <div class="meta"><span>Updated ${UPDATED}</span><span>${c.total} data rooms in the registry</span><span>Tables generated from live registry data</span></div>
</div></section>
<section class="tight"><div class="wrap"><div class="prose">

<h2>Two kinds of programmatic access</h2>
<p>A data room has two sides. The <strong>owner</strong>, usually the fund manager (GP) or an adviser, creates rooms, uploads documents, sets permissions and reads analytics. The <strong>recipient</strong>, an invited LP or prospective investor, opens what has been shared with them.</p>
<p><strong>Owner-side access</strong> means the GP can manage rooms through an API or an MCP server: create a room for a new raise, upload a quarterly report, invite a list of investors, or pull view analytics into a CRM. This is where data room vendors have invested. ${c.apiAny} of the ${c.total} data rooms in the registry offer an API in some form (${c.api} listed as available, the rest partner only), and ${c.mcp} record an MCP server.</p>
<p><strong>Recipient-side access</strong> means the invited investor can get documents out programmatically, for example to file them in their own document system or pass them to an agent. ${recipientText}${recipientNoText} In practice an LP still opens links in a browser, often after email verification or an NDA click-through.</p>
<div class="callout"><strong>Why this matters for LPs.</strong> An investor with many fund positions may receive documents through several data rooms and LP portals at once. Owner-side APIs help the GP, not the investor. The registry tracks both sides so that the gap is visible. The <a href="/#how">OpenInvestorPortal protocol</a> describes a recipient-side API that any portal or data room could implement.</div>

<h2>The data rooms in the registry</h2>
<p>Every data room entry, in alphabetical order. API, MCP and webhook status come from the entry. Recipient-side access comes from the registry's assessment. Difficulty is the registry's 1 to 5 rating of how hard it is for an investor to get documents out, from 1 (${esc(DIFFICULTY_LABEL[1].toLowerCase())}) to 5 (${esc(DIFFICULTY_LABEL[5].toLowerCase())}). It is not a quality score.</p>
${table(ctx)}
<p class="updated">Entries are community research and mostly unverified. Unknown means the information was not found in public sources, not that the feature is missing. Vendors can correct their entry by pull request.</p>

<h2>What to check when choosing a data room</h2>
<p>For a fundraising data room or an investor reporting room, the usual checklist is below. For each item, this is what the registry records today. Anything not listed was not found.</p>
<ul>
<li><strong>Permissions.</strong> Folder and document level access per investor or group. ${L(ctx, "papermark")} lists granular permissions. ${L(ctx, "drooms", "Drooms")} sets print and download permissions per user and document. The ${L(ctx, "datasite", "Datasite")} and ${L(ctx, "digify", "Digify")} APIs cover membership and permission controls.</li>
<li><strong>Watermarking and document control.</strong> ${L(ctx, "papermark")} lists dynamic watermarking. ${L(ctx, "digify", "Digify")} is DRM focused, with watermarking and revocation. ${L(ctx, "smartroom", "SmartRoom")} SmartLock and ${L(ctx, "ansarada", "Ansarada")} Remote Doc-Destruct can revoke access after download. ${L(ctx, "brainloop", "Brainloop")} integrates information rights management.</li>
<li><strong>NDA gating.</strong> ${L(ctx, "papermark")} can gate rooms behind an NDA. ${L(ctx, "digify", "Digify")} links can require an NDA or email verification. ${L(ctx, "smartroom", "SmartRoom")} uses DocuSign for NDAs.</li>
<li><strong>Analytics.</strong> ${L(ctx, "papermark")} offers page-level analytics, also through its API. The ${L(ctx, "digify", "Digify")} API covers analytics, and the ${L(ctx, "docsend", "DocSend")} MCP server exposes visits and the audit log.</li>
<li><strong>SSO and MFA.</strong> ${L(ctx, "papermark")} supports SAML SSO on its Data Rooms Premium and Enterprise plans. ${L(ctx, "drooms", "Drooms")} lists SSO and two-factor authentication, ${L(ctx, "ansarada", "Ansarada")} SSO and authenticator-based MFA, ${L(ctx, "docsend", "DocSend")} SSO for account users, and ${L(ctx, "brainloop", "Brainloop")} several two-factor options. For most other entries SSO is not confirmed.</li>
<li><strong>API and MCP.</strong> Whether there is a public API, who may use it, and whether it is included in your plan or sold as an add-on. The ${L(ctx, "ideals-vdr", "Ideals")} API is a paid enterprise add-on; the ${L(ctx, "intralinks-vdrpro", "Intralinks")} APIs are available through sales. See the MCP section below.</li>
<li><strong>Webhooks.</strong> Event notifications for views and downloads. ${webhookCount} ${L(ctx, "digify", "Digify")} sends View, Print and Download events. ${L(ctx, "papermark")} lists webhooks as planned. For the rest the status is unknown.</li>
<li><strong>Exports and archives.</strong> ${L(ctx, "docsend", "DocSend")} owners can download a Space or folders as a ZIP. The ${L(ctx, "ideals-vdr", "Ideals")} API covers bulk document upload and download. ${L(ctx, "drooms", "Drooms")} delivers completed rooms as a certified archive, digitally or on USB.</li>
<li><strong>Self-hosting and open source.</strong> ${pm ? `${L(ctx, "papermark")} is open source under AGPLv3 and can be self-hosted on its Enterprise plan.` : ""} No other data room in the registry is recorded as open source.</li>
<li><strong>Certifications and hosting.</strong> ${L(ctx, "papermark")} states SOC 2 Type II, ISO 27001, GDPR and EU hosting. ${L(ctx, "drooms", "Drooms")} is ISO 27001 and 27018 certified. ${L(ctx, "netfiles")} states hosting in Germany, and ${L(ctx, "smartroom", "SmartRoom")} hosting on Azure. The registry does not record certifications for the other entries, which does not mean they lack them.</li>
</ul>

<h2>Data room MCP servers</h2>
<p>An MCP server lets an AI assistant such as Claude, ChatGPT or Copilot work inside a data room on a user's behalf. These data rooms record one:</p>
${mcpList(ctx)}
<p>${L(ctx, "papermark")} publishes a vendor MCP server, both hosted (OAuth with dynamic client registration) and as an npm package, with about 65 tools across rooms, documents, links, visitors and analytics. It is marked alpha and acts as the owner's user.${
      dsMcp
        ? ` The ${L(ctx, "datasite", "Datasite MCP")} works with Claude, ChatGPT, Microsoft Copilot and Blueflame AI, signs in with Datasite credentials and is scoped to existing permissions. The account must be enabled for MCP, and the endpoint is not published.`
        : ""
    } ${L(ctx, "ideals-vdr", "Ideals")} admins enable its connector per user group. The ${L(ctx, "ansarada", "Ansarada")} server is read-only, covering rooms, folders and document metadata but not document content, and is enabled per room on request. The ${L(ctx, "docsend", "DocSend")} remote server is in beta for account users.</p>
<p>Each of these servers acts with the signed-in user's permissions. For the GP that means owner-side automation. Whether an invited investor can connect the same server to their own account is not stated by any vendor, so the registry records recipient-side access as unknown or not offered.</p>

<h2>Terms of use and automation</h2>
<p>Before automating anything on the recipient side, read the room's terms. The ${L(ctx, "intralinks-vdrpro", "Intralinks VDRPro")} terms bar bots, spiders and RPA on the platform. The ${L(ctx, "ideals-vdr", "Ideals")} terms bar access by means other than those Ideals provides, and AI tools that have not been approved. The ${L(ctx, "firmex", "Firmex")} and ${L(ctx, "netfiles")} terms do not address automated access. For most other entries the terms were not reviewed. Official channels, such as an MCP server the room admin has enabled, are the safer route.</p>

<h2>What this means for each reader</h2>
<h3>Fund managers</h3>
<p>If you want to automate fundraising and reporting rooms, the useful questions are whether the API is public or sales-gated, which plan includes it, whether an MCP server exists and who can enable it, and whether webhooks report views and downloads. If your investors ask for programmatic delivery, ask the vendor whether guest or investor users can be enabled for the API or MCP server.</p>
<h3>LPs receiving documents</h3>
<p>Expect browser links with email verification, NDA gates and watermarks. Email is the most common signal that something new has arrived: ${L(ctx, "papermark")} recipients receive share links by email, and ${L(ctx, "docsend", "DocSend")} visitors on email-verified links can receive Space update emails. If you need documents in your own systems, ask the GP which official export or delivery channel they support, and check each room's entry for its terms.</p>

<h2>Compare data rooms side by side</h2>
${compareLinks(ctx)}

<h2>Frequently asked questions</h2>
${faq(QA)}

<h2>Sources</h2>
<p class="sources">This guide is generated from the registry entries and assessments for each data room, researched from public vendor pages on ${UPDATED}. Primary sources per entry:</p>
<ul class="sources">
${rooms(ctx)
  .map((e) => {
    const src = [...new Set([...(ctx.assessments[e.id]?.sources ?? []), e.access?.api?.docs_url, e.access?.mcp?.docs_url].filter(Boolean))];
    const links = src.map((u) => `<a href="${esc(u)}" rel="nofollow noopener" target="_blank">${esc(u.replace(/^https?:\/\//, ""))}</a>`).join(", ");
    return `<li><a href="/portals/${esc(e.id)}">${esc(e.name)}</a>: ${links || "no sources recorded"}</li>`;
  })
  .join("\n")}
</ul>
</div></div></section>`;
  },
  jsonld(ctx) {
    return [
      faqLd(QA),
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Data rooms in the OpenInvestorPortal registry",
        itemListOrder: "https://schema.org/ItemListUnordered",
        itemListElement: rooms(ctx).map((e, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: e.name,
          url: abs(`/portals/${e.id}`),
        })),
      },
    ];
  },
};
