// Curated comparison pairs (portal ids). Only pairs a buyer or investor would plausibly search as "A vs B":
// same category or clear substitutes, both entries with enough registry data to compare. Never all combinations.
// Order inside a pair is fixed: the better-known name first. The order of PAIRS is the display order.
//   PAIRS        [[idA, idB], ...]
//   comparePath  canonical URL for a pair, whichever order the ids are passed in
//   pairsFor     pairs that contain an id
//   reasonFor    one-sentence reason the pair is compared, used in the intro and on the index
//   shortName    the name buyers use for the product, used in titles and headings

const LIST = [
  // LP portals
  ["juniper-square", "carta", "Both are US LP portals that also run a fund administration service on the same platform, and both give investors one login across every fund they hold there."],
  ["efront-investment-cafe", "allvue-investor-portal", "Both are investor portals that sit on top of a private markets back-office suite, used by private equity, private credit and fund-of-funds managers."],
  ["efront-investment-cafe", "fis-digital-data-exchange", "eFront and FIS Investran are private equity back-office systems, and each has its own investor portal: eFront Investment Café and FIS Digital Data Exchange."],
  ["juniper-square", "intralinks-fundcentre", "Both are large multi-GP LP portals where one investor login covers many sponsors, used for capital call notices, reports and tax documents."],
  ["efront-investment-cafe", "intralinks-fundcentre", "Both are used by GPs and fund administrators in Europe and elsewhere to publish notices and reports to LPs."],
  ["carta", "angellist-venture", "Both serve venture funds with fund administration, an LP portal and a vendor MCP server."],
  ["angellist-venture", "sydecar", "Both are US platforms for venture SPVs and funds where investors receive capital calls, documents and K-1s online."],
  ["juniper-square", "cash-flow-portal", "Both serve real estate sponsors who raise from many individual investors, and both have a vendor MCP server for sponsor teams."],
  ["dynamo-investor-portal", "backstop-client-portal", "Both are investor reporting portals from investment management software vendors that serve private equity, hedge fund and fund-of-funds managers."],
  ["altvia-sharesecure", "investorflow-investor-portal", "Both are Salesforce-based LP portals sold to private equity and venture firms."],
  ["quantium", "fundrbird", "Both are private markets software suites with an investor portal module, used by GPs in Germany and wider Europe."],
  ["odin", "roundtable", "Both are European platforms for setting up SPVs and small funds, with an investor dashboard for documents and holdings."],
  // Fund administrator portals
  ["universal-investment-powerportal", "finventions-investment-portal", "Both are reporting portals that German fund administrators (service KVGs) give to institutional investors."],
  ["alter-domus-corpro", "iq-eq-cosmos", "Both are proprietary client and investor portals of Luxembourg-headquartered private markets fund administrators."],
  // Data rooms
  ["datasite", "intralinks-vdrpro", "Both are established virtual data rooms for M&A and fundraising due diligence."],
  ["datasite", "ideals-vdr", "Both are global virtual data rooms with a vendor MCP connector and an API, used for deal and fundraising rooms."],
  ["docsend", "papermark", "Both share documents and data rooms through tracked links with viewer analytics, and Papermark is an open source option in the same space."],
  ["datasite", "papermark", "Both offer data rooms with a documented developer API and a vendor MCP server, so they come up when a team wants to automate its rooms."],
  ["docsend", "digify", "Both are document sharing tools with link tracking and data rooms, used by founders and fund managers for investor materials."],
  ["ideals-vdr", "firmex", "Both are virtual data rooms for deal diligence and fundraising, and they publish very different amounts about programmatic access."],
  // Reporting platforms
  ["sp-global-ilevel", "chronograph-lp", "Both are portfolio monitoring platforms used by GPs and LPs, and both have announced MCP servers."],
  ["msci-private-i", "chronograph-lp", "Both are LP-side platforms that collect GP reporting and give allocators a book of record with analytics."],
  ["addepar-client-portal", "arch", "Both are used by family offices and wealth managers to track private fund holdings, and Arch integrates with Addepar."],
  // Marketplaces
  ["icapital", "cais", "Both are US alternative investment platforms for wealth managers and their advisors."],
  ["moonfare", "titanbay", "Both are European private markets platforms that give wealth clients, directly or through their bank or adviser, access to private equity funds."],
  ["moonfare", "liqid", "Both are German platforms that give individual investors access to private equity and venture funds."],
];

export const PAIRS = LIST.map(([a, b]) => [a, b]);

const key = (a, b) => `${a}-vs-${b}`;
const REASONS = new Map(LIST.map(([a, b, r]) => [key(a, b), r]));

/** Canonical [a, b] order for two ids if they form a curated pair, otherwise the order given. */
export const canonicalPair = (a, b) => (REASONS.has(key(a, b)) ? [a, b] : REASONS.has(key(b, a)) ? [b, a] : [a, b]);
export const comparePath = (a, b) => `/compare/${key(...canonicalPair(a, b))}`;
export const pairsFor = (id) => PAIRS.filter(([a, b]) => a === id || b === id);
export const reasonFor = (a, b) => REASONS.get(key(...canonicalPair(a, b))) ?? "";

const SHORT = {
  "juniper-square": "Juniper Square",
  carta: "Carta",
  "efront-investment-cafe": "eFront",
  "allvue-investor-portal": "Allvue",
  "fis-digital-data-exchange": "FIS Data Exchange",
  "intralinks-fundcentre": "Intralinks FundCentre",
  "angellist-venture": "AngelList",
  sydecar: "Sydecar",
  "cash-flow-portal": "Cash Flow Portal",
  "dynamo-investor-portal": "Dynamo",
  "backstop-client-portal": "Backstop",
  "altvia-sharesecure": "Altvia",
  "investorflow-investor-portal": "InvestorFlow",
  quantium: "Quantium",
  fundrbird: "Fundrbird",
  odin: "Odin",
  roundtable: "Roundtable",
  "universal-investment-powerportal": "Universal Investment",
  "finventions-investment-portal": "Finventions",
  "alter-domus-corpro": "Alter Domus CorPro",
  "iq-eq-cosmos": "IQ-EQ Cosmos",
  datasite: "Datasite",
  "intralinks-vdrpro": "Intralinks",
  "ideals-vdr": "Ideals",
  docsend: "DocSend",
  papermark: "Papermark",
  digify: "Digify",
  firmex: "Firmex",
  "sp-global-ilevel": "iLEVEL",
  "chronograph-lp": "Chronograph",
  "msci-private-i": "MSCI Private i",
  "addepar-client-portal": "Addepar",
  arch: "Arch",
  icapital: "iCapital",
  cais: "CAIS",
  moonfare: "Moonfare",
  titanbay: "Titanbay",
  liqid: "LIQID",
};
/** Short product name for titles and headings; falls back to the registry name. */
export const shortName = (entry) => SHORT[entry.id] ?? entry.name;
