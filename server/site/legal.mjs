// Legal details for the footer and the imprint page (Impressum, § 5 DDG). Edit here only.
import { layout, esc } from "./layout.mjs";

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

/** Discreet imprint link for the footer of every page. */
export const footerLegal = () => `<div class="wrap legal"><a href="/imprint">Imprint</a></div>`;

// Deliberately quiet: small, muted type. The page exists to meet the legal requirement, not to be read.
const IMPRINT_CSS = `.imprint{padding:40px 0 56px;border:0;color:#94a3b8;font-size:12.5px;line-height:1.6}
.imprint h1{font-size:15px;font-weight:600;letter-spacing:0;color:#64748b;margin:0 0 16px}
.imprint h2{font-size:12.5px;font-weight:600;color:#64748b;margin:18px 0 2px;letter-spacing:0}
.imprint p{margin:0 0 6px;max-width:640px}
.imprint strong{font-weight:500;color:#64748b}
.imprint a{color:inherit}`;

function imprintPage() {
  const addr = LEGAL.address ? `<br>${LEGAL.address.map(esc).join("<br>")}` : "";
  const body = `<section class="imprint"><div class="wrap">
  <h1>Imprint (Impressum)</h1>
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
    noindex: true,
    css: IMPRINT_CSS,
  });
}

export async function pages(ctx) {
  return [{ path: "/imprint", render: imprintPage, lastmod: ctx.latest, sitemap: false }];
}
