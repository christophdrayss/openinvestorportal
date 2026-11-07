// Embeddable "Listed on OpenInvestorPortal" badges and the /badge page for portal operators.
//   /badge               explainer page for vendors (what it means, listing, verification, embed code, FAQ)
//   /badge/{id}.svg      light badge for one registry entry
//   /badge/{id}-dark.svg dark badge for one registry entry
// badgeSnippet(entry) returns a small section for the portal page with a preview and the embed HTML.
import { SITE_NAME } from "./context.mjs";
import { layout, esc, abs, breadcrumbs, breadcrumbLd, faq, faqLd } from "./layout.mjs";

const CONTACT = "contact@openinvestorportal.com";
const H = 28; // badge height
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const isVerified = (entry) => entry?.verification?.status === "vendor-verified";
const statusText = (entry) => (isVerified(entry) ? "Vendor verified" : "Listed");

// Geometry. Text widths are fixed with textLength so the badge looks the same whatever system font renders it.
const MAIN = { text: "Listed on OpenInvestorPortal", x: 28, len: 136 };
const RIGHT = { Listed: 28, "Vendor verified": 74 };
const PAD = 10;
function dims(entry) {
  const label = statusText(entry);
  const split = MAIN.x + MAIN.len + 8;
  const right = RIGHT[label] + PAD * 2;
  return { label, split, right, width: split + right };
}

const THEMES = {
  light: {
    bg: "#ffffff", border: "#d5dbe3", ink: "#0b1220", ring: "#0b1220", lens: "#9CAF88",
    seg: "#eef2ea", segInk: "#3f5242", vseg: "#5e7461", vsegInk: "#ffffff",
  },
  dark: {
    bg: "#0b1220", border: "#26324a", ink: "#e8edf3", ring: "#e8edf3", lens: "#9CAF88",
    seg: "#1b2638", segInk: "#c5d5b8", vseg: "#9CAF88", vsegInk: "#0b1220",
  },
};

/** SVG markup for one entry's badge. variant: "light" | "dark". */
export function badgeSvg(entry, variant = "light") {
  const t = THEMES[variant] ?? THEMES.light;
  const { label, split, right, width } = dims(entry);
  const verified = isVerified(entry);
  const segFill = verified ? t.vseg : t.seg;
  const segInk = verified ? t.vsegInk : t.segInk;
  const title = `${entry.name}: ${label} on ${SITE_NAME}`;
  const ty = 17.8; // text baseline
  const s = 18 / 28; // logo mark from layout.mjs LOGO_SVG (viewBox 28), scaled to 18px
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${H}" viewBox="0 0 ${width} ${H}" role="img" aria-labelledby="t">
<title id="t">${esc(title)}</title>
<defs><clipPath id="r"><rect width="${width}" height="${H}" rx="5"/></clipPath></defs>
<g clip-path="url(#r)">
<rect width="${width}" height="${H}" fill="${t.bg}"/>
<rect x="${split}" width="${right}" height="${H}" fill="${segFill}"/>
</g>
<rect x=".5" y=".5" width="${width - 1}" height="${H - 1}" rx="4.5" fill="none" stroke="${t.border}"/>
<line x1="${split}" y1="1" x2="${split}" y2="${H - 1}" stroke="${t.border}"/>
<g transform="translate(6 5) scale(${s.toFixed(4)})" fill="none">
<path d="M14 7.07A8 8 0 0 1 14 20.93A8 8 0 0 1 14 7.07Z" fill="${t.lens}"/>
<circle cx="10" cy="14" r="8" stroke="${t.ring}" stroke-width="2.2"/>
<circle cx="18" cy="14" r="8" stroke="${t.ring}" stroke-width="2.2"/>
</g>
<g font-family="${FONT}" font-size="10.5" font-weight="600">
<text x="${MAIN.x}" y="${ty}" fill="${t.ink}" textLength="${MAIN.len}" lengthAdjust="spacingAndGlyphs">${MAIN.text}</text>
<text x="${split + PAD}" y="${ty}" fill="${segInk}" textLength="${RIGHT[label]}" lengthAdjust="spacingAndGlyphs">${esc(label)}</text>
</g>
</svg>
`;
}

const badgePath = (id, dark = false) => `/badge/${id}${dark ? "-dark" : ""}.svg`;
const altText = (entry) => `${entry.name}: ${statusText(entry)} on ${SITE_NAME}`;

/** Embed HTML for a vendor's site: a link to the absolute registry URL wrapping the badge image. */
export function embedHtml(entry, dark = false) {
  return `<a href="${esc(abs(`/portals/${entry.id}`))}" title="${esc(entry.name)} on ${SITE_NAME}"><img src="${esc(
    abs(badgePath(entry.id, dark))
  )}" alt="${esc(altText(entry))}" width="${dims(entry).width}" height="${H}"></a>`;
}

const preview = (entry, dark = false, lazy = false) =>
  `<p class="preview"><img src="${esc(badgePath(entry.id, dark))}" alt="${esc(altText(entry))}" width="${dims(entry).width}" height="${H}"${
    lazy ? ' loading="lazy"' : ""
  }></p>`;

const BADGE_CSS = `.badge-box{border:1px solid var(--line);border-radius:12px;padding:20px;margin:16px 0;background:#fff}
.badge-box.dark{background:#0b1220;border-color:#0b1220}
.badge-box .preview{margin:0 0 14px;line-height:0}
.badge-box pre{white-space:pre-wrap;word-break:break-all;font-size:12.5px}
.badge-snippet h2{margin-top:0}`;

/** Section for the portal page: "For {vendor}: show your listing". */
export const badgeSnippet = (entry) => {
  if (!entry?.id) return "";
  const vendor = entry.vendor?.name ?? entry.name;
  return `<section class="badge-snippet tight"><div class="wrap prose">
<style>${BADGE_CSS}</style>
<h2>For ${esc(vendor)}: show your listing</h2>
<p>If you operate ${esc(entry.name)}, you can link to this registry entry from your developer, security or integrations page with the badge below. It links back here, so investors and their operations teams can see how access works.</p>
<div class="badge-box">${preview(entry, false, true)}
<pre><code>${esc(embedHtml(entry))}</code></pre></div>
<p>${
    isVerified(entry)
      ? "This entry is vendor verified."
      : "This entry is not vendor verified yet. Confirm it with a pull request from an email on your company domain, or with a DNS TXT record."
  } See <a href="/badge">how the badge and vendor verification work</a>.</p>
</div></section>`;
};

const FAQ = [
  {
    q: "Does the badge mean OpenInvestorPortal endorses our product?",
    a: "No. The badge states that the product has an entry in an open registry of investor portals. It is not an award, rating or endorsement, and OpenInvestorPortal is not affiliated with any listed vendor.",
  },
  {
    q: "Is there a fee to be listed or to use the badge?",
    a: "No. Listing, corrections and the badge are free. The registry data is published under CC0 and the code under the MIT license.",
  },
  {
    q: "When does the badge read Vendor verified?",
    a: "Only when the entry's verification status is vendor-verified. A maintainer sets that after the vendor confirms the entry, either through a pull request from an email address on the vendor's domain or a DNS TXT record on the vendor's domain. All other entries read Listed.",
  },
  {
    q: "Does the badge update automatically?",
    a: "Yes. The image is generated from the registry entry. When an entry becomes vendor verified, the badge on your site changes without any edit to your embed code.",
  },
  {
    q: "Does the badge track visitors?",
    a: "No. It is a static SVG image with no scripts and no cookies. The link is a plain hyperlink to the public registry entry.",
  },
  {
    q: "Can we correct or remove our entry?",
    a: `Yes. Open a pull request to the registry with the change and its source, or email ${CONTACT}. Maintainers act on removal requests from trademark owners without discussion.`,
  },
];

function badgePage(ctx) {
  const ex = ctx.byId.get("efront-investment-cafe") ?? ctx.portals[0];
  const crumbs = [{ name: "Registry badge", path: "/badge" }];
  const verifiedCount = ctx.portals.filter(isVerified).length;
  const list = [...ctx.portals]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(
      (p) =>
        `<li><a href="/portals/${esc(p.id)}">${esc(p.name)} investor portal access</a> <span style="color:var(--muted)">· <code>${esc(
          badgePath(p.id)
        )}</code></span></li>`
    )
    .join("");
  const body = `<header class="page-head"><div class="wrap">
${breadcrumbs(crumbs)}
<h1>The OpenInvestorPortal registry badge</h1>
<p class="lead">A small, neutral badge that portal vendors can place on their developer, security or integrations pages. It links to the product's entry in the open registry, where investors and their operations teams can see how web, API, MCP, SFTP and email access work.</p>
</div></header>
<section class="tight"><div class="wrap prose">
<h2>What the badge means</h2>
<p>The badge says one thing: this product has an entry in the ${SITE_NAME} registry. The registry is an open, community-maintained record of investor (LP) portals, fund administrator portals and data rooms, and of the channels each one offers for getting documents and data out. It is not a rating, award or certification.</p>
<p>The right side of the badge shows the entry's verification status, read live from the registry:</p>
<ul>
<li><strong>Listed</strong>: the entry exists. It may be community research that the vendor has not reviewed.</li>
<li><strong>Vendor verified</strong>: the vendor has confirmed the entry and a maintainer has recorded the proof.</li>
</ul>
<p>Today ${ctx.portals.length} products are listed and ${verifiedCount} ${verifiedCount === 1 ? "is" : "are"} vendor verified. Most entries are community research, so vendors are encouraged to review and correct theirs.</p>

<h2>How listing and corrections work</h2>
<p>Each product is one JSON file in the registry, validated against a public schema. Anyone can propose a new entry or a change.</p>
<ol>
<li><strong>Pull request.</strong> Edit or add <code>registry/portals/{id}.json</code> and open a pull request. Describe the source of each fact: a public documentation URL, your own account or a statement from the vendor.</li>
<li><strong>Email.</strong> If you prefer not to use a pull request, email <a href="mailto:${CONTACT}?subject=Registry%20entry%20correction">${CONTACT}</a> with the entry and the change. A maintainer makes the edit.</li>
</ol>
<p>Entries record what exists, not what is planned or promised. Values stay <code>unknown</code> until someone has a source. Credentials, internal URLs and non-public endpoints are not accepted.</p>

<h2>What vendor verified requires</h2>
<p>An entry moves to <code>vendor-verified</code> when a maintainer confirms that the vendor itself stands behind it. Either of these is accepted as proof:</p>
<ul>
<li>A pull request whose author uses an email address on the vendor's own domain.</li>
<li>A DNS TXT record at <code>_openinvestorportal.{your-domain}</code> containing the entry's <code>id</code>.</li>
</ul>
<p>The maintainer records the proof in the entry's <code>verification</code> field, with who verified it and when. Between unverified and vendor verified there is a <code>community-verified</code> level, where a maintainer has checked the public facts such as documentation and login URLs. The badge shows Listed for both unverified and community-verified entries.</p>
<div class="callout"><strong>Verification confirms that the vendor reviewed the entry.</strong> It does not mean ${SITE_NAME} has audited the product, its security or its API.</div>

<h2>Embed code</h2>
<p>Find your product in the registry and use its <code>id</code>. Each entry has a light and a dark badge. The examples below use ${esc(
    ex.name
  )}. Your own entry page shows the same snippet, filled in.</p>
<h3>Light badge</h3>
<p>For white or light backgrounds. Served at <code>${esc(abs(badgePath("{id}")))}</code>.</p>
<div class="badge-box">${preview(ex)}
<pre><code>${esc(embedHtml(ex))}</code></pre></div>
<h3>Dark badge</h3>
<p>For dark headers and footers. Served at <code>${esc(abs(badgePath("{id}", true)))}</code>.</p>
<div class="badge-box dark">${preview(ex, true)}
<pre><code>${esc(embedHtml(ex, true))}</code></pre></div>
<p>Keep the link pointing to your entry, keep the width and height attributes, and do not alter the image. A Listed badge is ${
    dims({}).width
  } pixels wide and a Vendor verified badge ${dims({ verification: { status: "vendor-verified" } }).width}. Both are ${H} pixels high.</p>

<h2>Find your entry</h2>
<p>Each listed product with the path of its light badge. Add <code>-dark</code> before <code>.svg</code> for the dark variant. If your product is missing, <a href="mailto:${CONTACT}?subject=List%20our%20portal">email the maintainers</a> or open a pull request. You can also browse <a href="/portals">the full investor portal registry</a>.</p>
<details><summary>${ctx.portals.length} listed products</summary><ul>${list}</ul></details>

<h2>Frequently asked questions</h2>
${faq(FAQ)}
</div></section>`;
  return layout({
    title: "Registry badge for investor portal vendors",
    description:
      "Embed the Listed on OpenInvestorPortal badge, link to your registry entry, correct it by pull request or email, and learn what vendor verified requires.",
    path: "/badge",
    body,
    css: BADGE_CSS,
    jsonld: [
      breadcrumbLd(crumbs),
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "The OpenInvestorPortal registry badge",
        url: abs("/badge"),
        dateModified: ctx.latest,
        isPartOf: { "@type": "WebSite", name: SITE_NAME, url: abs("/") },
      },
      faqLd(FAQ),
    ],
  });
}

export async function pages(ctx) {
  const out = [{ path: "/badge", render: () => badgePage(ctx), lastmod: ctx.latest, priority: 0.5 }];
  for (const entry of ctx.portals) {
    for (const dark of [false, true]) {
      out.push({
        path: badgePath(entry.id, dark),
        type: "image/svg+xml",
        sitemap: false,
        lastmod: entry.updated ?? ctx.latest,
        render: () => badgeSvg(entry, dark ? "dark" : "light"),
      });
    }
  }
  return out;
}
