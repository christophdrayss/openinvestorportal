// Legal details for the footer and the imprint page (Impressum, § 5 DDG). Edit here only.
import { layout, esc, breadcrumbs, breadcrumbLd } from "./layout.mjs";

export const LEGAL = {
  entity: "OpenInvestorPortal GbR",
  // A GbR has at least two partners, and the imprint must name every one of them.
  partners: ["Christoph Drayss"],
  contactPerson: "Christoph Drayss",
  email: "contact@openinvestorportal.com",
  infoEmail: "info@openinvestorportal.com",
  // Required by § 5 DDG: a postal address where the company can be served (street, postcode, city, country).
  // Shown on the imprint as soon as it is set, e.g. ["Musterstraße 1", "10115 Berlin", "Germany"].
  address: null,
  phone: null,
};

export const CONTACT_EMAIL = LEGAL.email;

const mail = (m) => `<a href="mailto:${esc(m)}">${esc(m)}</a>`;

/** One-line imprint for the footer of every page. */
export const footerLegal = () =>
  `<div class="wrap legal">${esc(LEGAL.entity)} · Contact: ${esc(LEGAL.contactPerson)} · ${mail(LEGAL.email)} · <a href="/imprint">Imprint</a></div>`;

function imprintPage() {
  const crumbs = [{ name: "Imprint", path: "/imprint" }];
  const addr = LEGAL.address ? `<br>${LEGAL.address.map(esc).join("<br>")}` : "";
  const body = `<section class="page-head"><div class="wrap">
  ${breadcrumbs(crumbs)}
  <h1>Imprint (Impressum)</h1>
  <p class="lead">Legal information about the operator of OpenInvestorPortal.</p>
</div></section>
<section class="tight"><div class="wrap prose">
  <h2>Angaben gemäß § 5 DDG</h2>
  <p><strong>${esc(LEGAL.entity)}</strong>${addr}</p>
  <p>Vertreten durch ${LEGAL.partners.length > 1 ? "die Gesellschafter" : "den Gesellschafter"}: ${LEGAL.partners.map(esc).join(", ")}</p>
  <h2>Kontakt</h2>
  <p>Ansprechpartner: ${esc(LEGAL.contactPerson)}<br>E-Mail: ${mail(LEGAL.email)}<br>Allgemeine Anfragen: ${mail(LEGAL.infoEmail)}${
    LEGAL.phone ? `<br>Telefon: ${esc(LEGAL.phone)}` : ""
  }</p>
  <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
  <p>${esc(LEGAL.contactPerson)}${addr ? `, Anschrift wie oben` : ""}</p>
  <h2>Verbraucherstreitbeilegung</h2>
  <p>Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
  <h2>About the registry content</h2>
  <p>Registry entries, comparisons and guides are community research based on public vendor documentation. Most entries are not verified by the vendor. We check them carefully but cannot guarantee that they are complete, current or correct. Nothing on this site is investment, legal or tax advice.</p>
  <p>Product names and logos are trademarks of their respective owners. They are used only to identify the listed products, and listing does not imply endorsement or affiliation. Vendors and trademark owners can request a correction or removal at ${mail(LEGAL.email)}.</p>
  <p>Registry data is published under CC0 and the code under the MIT license.</p>
</div></section>`;
  return layout({
    title: "Imprint (Impressum)",
    description: "Imprint of OpenInvestorPortal: operator, contact person and email address, and notes on the community-researched registry content and trademarks.",
    path: "/imprint",
    body,
    jsonld: [breadcrumbLd(crumbs)],
  });
}

export async function pages(ctx) {
  return [{ path: "/imprint", render: imprintPage, lastmod: ctx.latest, priority: 0.2 }];
}
