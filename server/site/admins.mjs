// Fund administrator name normalisation for the /administrators pages, plus each administrator's own
// registry product. Raw names come from registry/deployments.json `administrator`.
//
//   canonicalAdmin("Sanne (now Apex Group)")  -> "Apex Group"
//   adminPath("Aztec Gr")                     -> "/administrators/aztec-group"
//   adminProduct("Citco")                     -> "citcoone"
//   productAdmin("alter-domus-corpro")        -> "Alter Domus"
import { slugify } from "./context.mjs";

/**
 * Canonical administrators with facts used on their pages. Websites are taken from registry vendor
 * entries or from the sources cited in deployment notes; leave `website` out when no source gives one.
 * `product` is the administrator's own registry product (it is the vendor, or owns the vendor).
 * `history` is a short, sourced note shown on the page (for merged or renamed administrators).
 */
export const ADMINS = {
  "Aduro Advisors": { website: "https://www.aduroadvisors.com", product: "fundpanel" },
  "Alter Domus": { website: "https://www.alterdomus.com", product: "alter-domus-corpro" },
  "Apex Group": {
    website: "https://www.apexgroup.com",
    product: "flow",
    productNote: "Apex Group acquired Flow in April 2025; Flow describes itself as an Apex Group company.",
    history:
      "Sanne is now part of Apex Group. Deployments recorded under Sanne are shown here; Apex lists a separate Apex Connect instance for legacy Sanne clients.",
  },
  "Aztec Group": {},
  BNY: { website: "https://www.bny.com" },
  Carta: { website: "https://carta.com", product: "carta" },
  Citco: { website: "https://www.citco.com", product: "citcoone" },
  CSC: { website: "https://www.cscglobal.com", product: "csc-viewpoint" },
  "Gen II Fund Services": { website: "https://gen2fund.com", product: "gen-ii-sensr-portal" },
  HANSAINVEST: {},
  "Hauck Aufhäuser Lampe": {},
  "IQ-EQ": { website: "https://iqeq.com", product: "iq-eq-cosmos" },
  JTC: { website: "https://www.jtcgroup.com" },
  "Juniper Square": { website: "https://www.junipersquare.com", product: "juniper-square" },
  "Langham Hall": { website: "https://www.langhamhall.com" },
  "Maples Group": { website: "https://maples.com" },
  "Northern Trust": {},
  Ocorian: { website: "https://www.ocorian.com" },
  SEI: { website: "https://www.seic.com" },
  "SS&C Technologies": { website: "https://www.ssctech.com", product: "ssc-globeop-investor-portal" },
  "Standish Management": {},
  "State Street": {},
  "TMF Group": { website: "https://www.tmf-group.com" },
  "Ultimus LeverPoint": { website: "https://www.ultimusfundsolutions.com" },
  "Universal Investment": { website: "https://www.universal-investment.com", product: "universal-investment-powerportal" },
  Vistra: { website: "https://www.vistra.com", product: "vistra-vfunds" },
  Waystone: { website: "https://www.waystone.com" },
};

/**
 * Raw or variant spellings -> canonical name. Keys are matched after slugify(), so case, accents,
 * punctuation and "&" vs "and" do not matter. Canonical names map to themselves implicitly.
 */
export const ADMIN_ALIASES = {
  // Sanne was acquired by Apex Group; the registry records it as "Sanne (now Apex Group)".
  "Sanne (now Apex Group)": "Apex Group",
  Sanne: "Apex Group",
  "Sanne Group": "Apex Group",
  Apex: "Apex Group",
  "Apex Fund Services": "Apex Group",
  // Truncated form seen in data exports; same administrator.
  "Aztec Gr": "Aztec Group",
  Aztec: "Aztec Group",
  "Aztec Financial Services": "Aztec Group",
  "BNY Mellon": "BNY",
  "The Bank of New York Mellon": "BNY",
  "Gen II": "Gen II Fund Services",
  "Gen II Fund Services LLC": "Gen II Fund Services",
  "Hauck Aufhauser Lampe": "Hauck Aufhäuser Lampe",
  "Hauck & Aufhäuser": "Hauck Aufhäuser Lampe",
  HAL: "Hauck Aufhäuser Lampe",
  Hansainvest: "HANSAINVEST",
  IQEQ: "IQ-EQ",
  "CSC Global": "CSC",
  "CSC Global Financial Markets": "CSC",
  Maples: "Maples Group",
  "Maples Fund Services": "Maples Group",
  "Citco Group": "Citco",
  "Citco Fund Services": "Citco",
  "Vistra Group": "Vistra",
  "TMF": "TMF Group",
  "JTC Group": "JTC",
  "SEI Investments": "SEI",
  "Ultimus Fund Solutions": "Ultimus LeverPoint",
  Ultimus: "Ultimus LeverPoint",
  "SS&C": "SS&C Technologies",
  "SS&C GlobeOp": "SS&C Technologies",
  GlobeOp: "SS&C Technologies",
  "Alter Domus S.à r.l.": "Alter Domus",
  "Universal-Investment": "Universal Investment",
  "Aduro": "Aduro Advisors",
  "Standish": "Standish Management",
  "Waystone Governance": "Waystone",
};

const key = (s) => slugify(s);
const CANON_BY_KEY = new Map([
  ...Object.keys(ADMINS).map((n) => [key(n), n]),
  ...Object.entries(ADMIN_ALIASES).map(([alias, n]) => [key(alias), n]),
]);

/** Canonical administrator name for a raw string, or null for empty input. Unknown names pass through trimmed. */
export function canonicalAdmin(name) {
  if (name == null) return null;
  const raw = String(name).replace(/\s+/g, " ").trim();
  if (!raw) return null;
  const hit = CANON_BY_KEY.get(key(raw));
  if (hit) return hit;
  // Generic "Old name (now New name)" pattern.
  const now = raw.match(/\(now ([^)]+)\)\s*$/i);
  if (now) return canonicalAdmin(now[1]);
  return raw;
}

/** Slug for an administrator page. */
export const adminSlug = (name) => {
  const c = canonicalAdmin(name);
  return c ? slugify(c) : null;
};

/** Path of the administrator page, e.g. "/administrators/apex-group", or null for empty input. */
export const adminPath = (name) => {
  const s = adminSlug(name);
  return s ? `/administrators/${s}` : null;
};

/** Registry product id the administrator itself offers (its own portal), or null. */
export const adminProduct = (name) => ADMINS[canonicalAdmin(name)]?.product ?? null;

/** Reverse of adminProduct: canonical administrator whose own product this is, or null. */
export const productAdmin = (productId) =>
  Object.entries(ADMINS).find(([, a]) => a.product && a.product === productId)?.[0] ?? null;

/** Known facts for an administrator: { website?, product?, productNote?, history? } (empty object if none). */
export const adminInfo = (name) => ADMINS[canonicalAdmin(name)] ?? {};

/** Raw administrator strings that are not their canonical form, e.g. ["Sanne (now Apex Group)"]. */
export const adminVariants = (name, deployments = []) => {
  const c = canonicalAdmin(name);
  return [...new Set(deployments.map((d) => d.administrator).filter((a) => a && a !== c && canonicalAdmin(a) === c))];
};
