// Guide: alternatives to Canoe Intelligence for LP document collection, written after Bloomberg's acquisition.
// Facts are sourced from docs/LANDSCAPE.md and vendor or press pages fetched on 2026-11-07 (see SOURCES).
import { esc, breadcrumbs, faq, faqLd } from "../layout.mjs";

const slug = "canoe-alternatives";
const h1 = "Canoe Intelligence alternatives for LP document collection";

const SOURCES = [
  ["Pulse 2.0, Bloomberg completes Canoe Intelligence acquisition (2026-10-02)", "https://pulse2.com/bloomberg-completes-canoe-intelligence-acquisition-to-expand-private-markets-platform/"],
  ["Canoe Intelligence, home page", "https://canoeintelligence.com/"],
  ["Canoe Intelligence, Canoe Connect", "https://canoeintelligence.com/solutions/canoe-connect/"],
  ["Canoe Intelligence, implementation and data security", "https://canoeintelligence.com/implementation-data-security/"],
  ["Canoe Intelligence, API developer portal terms of use", "https://canoeintelligence.com/api-terms-of-use/"],
  ["Arch, home page", "https://arch.com/"],
  ["Arch, Client API documentation", "https://arch.co/client-api/api-docs/"],
  ["AltExchange, home page (\"AltExchange is now part of iCapital\")", "https://www.altexchange.com/"],
  ["FinTech Global, iCapital to acquire AltExchange (2024-11-04)", "https://fintech.global/2024/11/04/icapital-acquires-altexchange-to-boost-alternative-investment-data-management/"],
  ["Alkymi, home page", "https://www.alkymi.io/"],
  ["Shapefin, Carta acquires Accelex (2025-10-02)", "https://shapefin.com/carta-acquires-accelex-to-enhance-alternative-investment-portfolio-analytics-for-limited-partners/"],
  ["Akoya, home page", "https://akoya.com/"],
  ["EIOPA, Digital Operational Resilience Act (DORA)", "https://www.eiopa.europa.eu/digital-operational-resilience-act-dora_en"],
  ["Regulation (EU) 2022/2554 (DORA), EUR-Lex", "https://eur-lex.europa.eu/eli/reg/2022/2554/oj/eng"],
];

const QA = [
  {
    q: "What happened to Canoe Intelligence?",
    a: "In October 2026 Bloomberg announced that it had completed its acquisition of Canoe Intelligence. According to the announcement, Canoe will continue providing its existing service while operating as part of Bloomberg, joint clients can already send Canoe data into Bloomberg PORT Enterprise, and Bloomberg plans to bring private markets data into its ASKB interface.",
  },
  {
    q: "What kinds of Canoe alternative are there?",
    a: "Four broad approaches: credential-based collection services that log into GP portals for you (such as Canoe, Arch and iCapital, which now includes AltExchange), extraction and AI tools that turn documents into data (such as Alkymi and Carta's LP Portfolio Analytics, formerly Accelex), building collection in-house, and open protocols where the portal itself serves data to a key the investor controls.",
  },
  {
    q: "Is it allowed to automate logins to GP portals?",
    a: "It depends on each portal's terms of service. Some terms permit consented automation, some say nothing, and some prohibit it. The OpenInvestorPortal registry records an automation policy for each listed portal, but most entries are still unknown, so ask any provider how it checks the terms of each portal it connects to.",
  },
  {
    q: "Does DORA apply to an LP document collection provider?",
    a: "For EU financial entities in DORA's scope, which include alternative investment fund managers and UCITS management companies, a provider that logs into portals or processes fund data for them is generally an ICT third-party service provider. That means contract terms, an entry in the register of information and ongoing oversight. Confirm the classification with your compliance team.",
  },
  {
    q: "Can I switch providers without re-linking every portal?",
    a: "With a credential-based service, switching usually means giving the new provider your portal credentials and second factors again. With an open protocol link, the portal is linked to your own key rather than to a provider, so changing client software does not change the link. Ask every provider what an exit looks like before you sign.",
  },
  {
    q: "Who publishes this guide?",
    a: "OpenInvestorPortal publishes this guide. It maintains the open registry and protocol and also sells Managed Portal Vaults, a paid custody service described in the guide. Vendors can correct any statement by pull request or email.",
  },
];

// Neutral comparison of approaches, not vendors. Cost is "per vendor" unless a source states it.
const ROWS = [
  {
    approach: "Credential-based collection service",
    examples: "Canoe, Arch, iCapital (incl. AltExchange)",
    creds: "Usually the provider, for portals it logs into on your behalf. Storage details are per vendor.",
    coverage: "The provider's library of portal connectors, plus inbox collection. Canoe states 3,000+ connected portals.",
    extraction: "Included. Providers extract capital calls, distribution notices and statements into structured data.",
    exit: "Depends on contract and export options. Some offer a client API (Arch documents one). Credentials and second factors move with you on exit.",
    cost: "Per vendor",
    reg: "Generally an ICT third-party service for EU financial entities under DORA.",
  },
  {
    approach: "Extraction and AI tool",
    examples: "Alkymi, Carta LP Portfolio Analytics (formerly Accelex)",
    creds: "You, for documents you supply. The provider, where it also retrieves from portals.",
    coverage: "Any document you route to it. Portal retrieval coverage is per vendor.",
    extraction: "Core function: models and checks that turn PDFs into data.",
    exit: "Depends on export of extracted data and history.",
    cost: "Per vendor",
    reg: "Generally an ICT third-party service under DORA when hosted by the provider.",
  },
  {
    approach: "Build in-house",
    examples: "Your own scripts, RPA and extraction stack",
    creds: "You, in your own vault or keychain.",
    coverage: "Only the portals you build and maintain connectors for.",
    extraction: "You build it or buy a component.",
    exit: "No vendor lock-in. Maintenance and key-person risk stay with you.",
    cost: "Internal engineering and maintenance",
    reg: "No outsourcing for the build itself. Hosting and tools you use may still be ICT third-party services.",
  },
  {
    approach: "Open protocol, self-managed (OIPP)",
    examples: "OpenInvestorPortal protocol and client",
    creds: "No portal passwords leave the portal. You hold your private key; the portal holds your public key.",
    coverage: "Portals that implement the protocol, plus local read-only connectors where portal terms allow.",
    extraction: "Portal returns structured records with documents (draft spec). PDFs from other portals still need extraction.",
    exit: "Open spec, MIT-licensed code. The link is between your key and the portal.",
    cost: "Free, open source",
    reg: "In the default mode the platform holds no credentials and is not in the data path, which reduces the DORA footprint.",
  },
  {
    approach: "Managed Portal Vault",
    examples: "OpenInvestorPortal (publisher of this guide)",
    creds: "OpenInvestorPortal, in a hardware security module dedicated to you. This is a custody service.",
    coverage: "OIPP where offered, sanctioned APIs, consented automation where terms allow, otherwise manual collection under power of attorney.",
    extraction: "Normalised to the ILPA templates, filed by entity, fund and document type.",
    exit: "Keys are non-exportable. On exit a new key is created under your control, portals are re-linked, the vault key is destroyed, and a full export is handed over.",
    cost: "Per legal entity per month, plus a per-portal fee",
    reg: "An ICT third-party service under DORA. The agreement is written for those requirements.",
  },
];

function table() {
  const cols = [
    ["creds", "Who holds credentials"],
    ["coverage", "Coverage model"],
    ["extraction", "Data extraction"],
    ["exit", "Lock-in and exit"],
    ["cost", "Cost model"],
    ["reg", "Regulation (DORA)"],
  ];
  return `<div class="tablewrap cmp-wrap"><table class="cmp cmp-approaches">
<caption>Approaches to LP document collection compared. Examples are illustrative, not a ranking.</caption>
<thead><tr><th scope="col">Approach</th>${cols.map(([, label]) => `<th scope="col">${esc(label)}</th>`).join("")}</tr></thead>
<tbody>
${ROWS.map(
  (r) =>
    `<tr><th scope="row">${esc(r.approach)}<span class="ex">${esc(r.examples)}</span></th>${cols
      .map(([k]) => `<td>${esc(r[k])}</td>`)
      .join("")}</tr>`
).join("\n")}
</tbody></table></div>`;
}

function registryStats(ctx) {
  const total = ctx.portals.length;
  const policy = { permitted: 0, tolerated: 0, prohibited: 0, unknown: 0 };
  let oippLive = 0;
  for (const p of ctx.portals) {
    const k = p.terms?.automation_policy ?? "unknown";
    policy[k in policy ? k : "unknown"]++;
    if (["available", "beta"].includes(p.oipp?.status)) oippLive++;
  }
  return { total, policy, oippLive };
}

const css = `
.cmp-wrap{margin:18px 0 8px;overflow-x:auto}
.cmp-approaches{min-width:1040px;margin:0;font-size:13.5px}
.cmp-approaches caption{caption-side:bottom;text-align:left;padding:10px 12px;font-size:12.5px;color:var(--muted)}
.cmp-approaches thead th{font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);font-weight:600}
.cmp-approaches tbody th{width:15%;color:var(--ink);font-size:13.5px}
.cmp-approaches .ex{display:block;font-weight:400;color:var(--muted);font-size:12.5px;margin-top:4px}
.prose .disclosure{margin-top:0}
.wide-break{max-width:1120px}
`;

function render(ctx) {
  const s = registryStats(ctx);
  const oippLine =
    s.oippLive === 0
      ? `As of this guide, none of the ${s.total} portals in the registry implements the protocol yet. Until portals adopt it, coverage comes from local read-only connectors where portal terms allow.`
      : `As of this guide, ${s.oippLive} of the ${s.total} portals in the registry list protocol support as available or in beta. The rest are reached through local read-only connectors where portal terms allow.`;

  return `<section class="page-head"><div class="wrap">
  ${breadcrumbs([
    { name: "Guides", path: "/guides" },
    { name: h1, path: `/guides/${slug}` },
  ])}
  <h1>${esc(h1)}</h1>
  <p class="lead">Bloomberg has acquired Canoe Intelligence. If you are reviewing how your team collects capital calls, statements and K-1s from GP portals, this guide sets out the main approaches, what each one asks you to trust, and the questions to put to any provider.</p>
  <p class="meta"><span>Updated 2026-11-07</span><span>Published by OpenInvestorPortal, which also runs a paid service covered below</span></p>
</div></section>
<section class="tight"><div class="wrap">
<div class="prose">

<h2>What Canoe does</h2>
<p>Canoe Intelligence collects alternative investment documents for investors and turns them into data. Its Canoe Connect product states that "using APIs or RPA scripts, Canoe logs into GP portals for you", that it collects from portals and inboxes, and that it "manages MFA requirements across 3,000+ connected portals". Canoe extracts and structures data from documents such as capital calls, distribution notices and partner capital account statements, and delivers it to accounting and reporting tools including Addepar, Tamarac, Black Diamond and Orion. Its site lists wealth managers, institutional investors, family offices, capital allocators and asset servicers as audiences.</p>
<p>Canoe's security page says it encrypts data in transit and at rest and undergoes an annual SOC 2 Type 2 audit. It does not publish how portal credentials are stored or where data is hosted. Canoe also publishes terms of use for an API developer portal.</p>

<h2>The Bloomberg acquisition</h2>
<p>In early October 2026 Bloomberg announced that it had completed its acquisition of Canoe Intelligence. The announcement says that:</p>
<ul>
<li>Canoe will continue providing its existing service while operating as part of Bloomberg.</li>
<li>Existing joint clients can already send permissioned private fund data from Canoe into Bloomberg PORT Enterprise.</li>
<li>Bloomberg plans deeper integration in exposure and risk analysis, cash management, underlying holdings and investment books of record, and intends to bring private markets data into ASKB, its conversational AI interface.</li>
</ul>
<p>The announcement says nothing about pricing, contract terms or the Canoe brand, and this guide does not speculate about them. An acquisition is a normal moment to check whether your current setup still fits, whatever you decide.</p>

<h2>The types of alternative</h2>

<h3>Credential-based collection services</h3>
<p>These services do what Canoe does. You give the provider access to your GP portal accounts, and it logs in, downloads new documents, extracts the data and delivers it downstream.</p>
<ul>
<li><strong>Arch</strong> says it pulls "statements, capital calls, and K-1s" from portals and inboxes, with "automated extraction plus layered data checks". Arch documents a Client API for its clients, with JWT client-credential authentication (see the <a href="/portals/arch">Arch entry in the registry</a>).</li>
<li><strong>iCapital</strong> agreed to acquire AltExchange in late 2024, and AltExchange's site now says it "is now part of iCapital". AltExchange describes AI-driven automation that consolidates alternative holdings, collects tax documents and syncs data to portfolio management systems. See the <a href="/portals/icapital">iCapital entry</a> for what is known about its interfaces.</li>
</ul>
<p>Other aggregation and reporting platforms, such as Chronograph, Backstop, Masttro and Landytech, also bring alternatives data together. Their collection methods differ, so check each one directly.</p>

<h3>Extraction and AI tools</h3>
<p>These tools focus on turning documents into data. You can route documents to them from your inbox or a document store, and some also retrieve from portals.</p>
<ul>
<li><strong>Alkymi</strong> describes itself as an enterprise AI platform for private markets data, handling capital notices, quarterly reports and financial statements. It lists a Portal Retrieval capability, and a client describes its Portal Download Service. It lists integrations with Snowflake, SimCorp and FINBOURNE.</li>
<li><strong>Accelex</strong> was acquired by Carta in October 2025. It automated document collection from investor portals, email and transfer tools and extracted performance data. Carta announced an LP Portfolio Analytics suite built on it, and the Accelex domain now redirects to Carta.</li>
</ul>

<h3>Building in-house</h3>
<p>Some LP teams write their own scripts or robotic process automation for each portal and pair them with an extraction model. You keep full control of credentials and data and avoid vendor lock-in. In exchange you maintain every connector through portal redesigns, MFA changes and GP platform migrations, and you still have to check each portal's terms of service.</p>

<h3>Open protocols</h3>
<p>The approaches above all work around portals that offer no investor API. An open protocol changes the portal side instead. The investor creates a key pair, links the public key to each portal account from inside the portal, and then signs read-only requests that the portal answers directly. No portal password is handed to anyone. The pattern is familiar from US open finance: Akoya, for example, connects to bank and brokerage data through OAuth-based APIs where "login credentials aren't copied or stored", though it does not cover alternative funds.</p>
<p>The OpenInvestorPortal protocol (OIPP) is one such approach for investor portals. ${esc(oippLine)} That is the main limit today: a protocol only helps where portals adopt it.</p>

<h2>The approaches compared</h2>
<p>The table compares approaches, not vendors. Where a provider does not publish a fact, it says "per vendor". DORA (Regulation (EU) 2022/2554) has applied since 17 January 2025 and covers, among others, alternative investment fund managers and UCITS management companies. It requires them to manage ICT third-party risk and keep a register of their ICT third-party arrangements.</p>
</div>
<div class="wide-break">${table()}</div>
<div class="prose">

<h2>Questions to ask any provider</h2>
<p>These questions apply to every option above, including ours.</p>
<ol>
<li><strong>Credential custody.</strong> Who holds my portal usernames and passwords? Where are they stored, encrypted under whose keys, and which staff can access them? Are credentials ever shared with sub-processors?</li>
<li><strong>MFA handling.</strong> How do you satisfy one-time codes, SMS and email factors? Are second factors held in a dedicated authenticator or phone number for my entity, or shared? What happens when a GP changes its MFA method?</li>
<li><strong>Terms of service per portal.</strong> Have you checked each portal's terms on automated access? What do you do where a portal prohibits automation? Will you show me the list? The registry records an automation policy per portal: of ${s.total} entries, ${s.policy.permitted} are marked permitted, ${s.policy.tolerated} tolerated, ${s.policy.prohibited} prohibited and ${s.policy.unknown} unknown. Entries are community research and mostly unverified.</li>
<li><strong>Data residency.</strong> Where are documents, extracted data and credentials hosted? Can I choose a region? How long do you retain documents after delivery?</li>
<li><strong>Exit.</strong> What can I export, in which formats, and at what cost? How long does re-linking take with a new provider? Is there a written exit plan of the kind DORA expects for ICT third-party arrangements?</li>
<li><strong>Change of control.</strong> If the provider is acquired or changes its product, what notice does the contract give you, and does it let you leave?</li>
</ol>

<h2>The open protocol and Managed Portal Vaults</h2>
<p class="callout disclosure"><strong>Disclosure.</strong> OpenInvestorPortal publishes this guide. It maintains the open registry and protocol, and it sells Managed Portal Vaults, the paid service described in this section. Weigh what follows with that in mind.</p>
<p>The self-managed protocol is free and open source. Your key stays on your device or in your own key management system, requests go directly between you and each portal, and OpenInvestorPortal does not see your documents. It needs software on your side and, today, portal adoption.</p>
<p><a href="/vaults">Managed Portal Vaults</a> is the opposite choice, and we describe it as a custody service. We hold your investor key and second-factor seeds in a hardware security module dedicated to you, collect from each portal and deliver documents to your SFTP server, SharePoint, Google Drive, document management system or our API. Where a portal's terms do not allow automation, our team collects documents manually under a limited power of attorney. Documents pass through our infrastructure. That makes us an ICT third-party provider for EU clients under DORA, like the other services in the table.</p>
<p>Which approach fits depends on your portfolio, your team and your risk policy. A credential-based service with a large connector library may cover more of your portals today than any protocol. An in-house build may suit a team that wants full control. Start from the questions above and apply them evenly.</p>

<h2>Related guides and data</h2>
<ul>
<li><a href="/guides/automate-capital-call-notices">How to automate capital call and distribution notices</a></li>
<li><a href="/guides/investor-portals-with-api-and-mcp">Investor portals with an API or MCP server</a></li>
<li><a href="/portals">The investor portal registry: access methods for every listed portal</a></li>
</ul>

<h2>Frequently asked questions</h2>
${faq(QA)}

<h2>Sources</h2>
<p class="updated">Pages checked on 2026-11-07. Vendor claims are quoted as the vendor states them. Vendors can request a correction by pull request or email.</p>
<ol class="sources">
${SOURCES.map(([label, url]) => `<li><a href="${esc(url)}" rel="noopener noreferrer">${esc(label)}</a></li>`).join("\n")}
</ol>
</div>
</div></section>`;
}

export default {
  slug,
  title: "Canoe Intelligence alternatives: LP document collection",
  h1,
  description:
    "Canoe Intelligence is now part of Bloomberg. A neutral guide to LP document collection options: collection services, AI extraction, in-house and open protocols.",
  updated: "2026-11-07",
  summary: "After Bloomberg's acquisition of Canoe, the approaches to LP document collection compared, with questions to ask any provider.",
  order: 4,
  css,
  render,
  jsonld: () => [faqLd(QA)],
};
