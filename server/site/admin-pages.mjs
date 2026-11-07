// /administrators index and /administrators/{slug} pages, generated from registry/deployments.json.
// Names are normalised in admins.mjs (canonicalAdmin, adminPath, adminProduct).
import {
  layout,
  esc,
  abs,
  pill,
  diffBadge,
  portalLink,
  extLink,
  breadcrumbs,
  breadcrumbLd,
  faq,
  faqLd,
  CATEGORY_LABEL,
  DIFFICULTY_LABEL,
} from "./layout.mjs";
import { SITE_NAME } from "./context.mjs";
import { ADMINS, canonicalAdmin, adminPath, adminInfo, adminVariants } from "./admins.mjs";

const CONF_RANK = { confirmed: 0, likely: 1, unknown: 2 };
const CONF_LABEL = { confirmed: "Confirmed", likely: "Likely", unknown: "Unknown" };
const confPill = (c) => {
  const cls = c === "confirmed" ? "available" : c === "likely" ? "partner-only" : "unknown";
  return `<span class="pill ${cls}">${esc(CONF_LABEL[c] ?? "Not stated")}</span>`;
};
const AUDIENCE = { lp: "investors", gp: "fund managers", "fund-admin": "administrators", partner: "partners" };
const OPEN = ["available", "beta", "partner-only"];
const CORRECT_MAIL = "hello@openinvestorportal.org";

let regionNames;
try {
  regionNames = new Intl.DisplayNames(["en"], { type: "region" });
} catch {
  regionNames = null;
}
const countryName = (cc) => {
  if (!cc) return "Not recorded";
  try {
    return regionNames?.of(cc) ?? cc;
  } catch {
    return cc;
  }
};

// Escape free text, then turn bare URLs into short source links.
const linkify = (text) =>
  esc(text).replace(/https?:\/\/[^\s)<;]+/g, (m) => {
    const url = m.replace(/[.,]+$/, "");
    const tail = m.slice(url.length);
    let host = url;
    try {
      host = new URL(url.replace(/&amp;/g, "&")).hostname.replace(/^www\./, "");
    } catch {}
    return `<a href="${url}" target="_blank" rel="nofollow noopener noreferrer">${esc(host)}</a>${tail}`;
  });

const listText = (items) =>
  items.length <= 1 ? items.join("") : items.length === 2 ? items.join(" and ") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
const plural = (n, one, many = one + "s") => `${n} ${n === 1 ? one : many}`;

/** Pick the first candidate between 120 and 160 chars, else the one closest to that range. */
const fitDescription = (cands) => {
  const ok = cands.find((c) => c.length >= 120 && c.length <= 160);
  if (ok) return ok;
  const dist = (c) => (c.length < 120 ? 120 - c.length : c.length > 160 ? c.length - 160 : 0);
  return [...cands].sort((a, b) => dist(a) - dist(b))[0];
};

const poss = (name) => (/s$/i.test(name) ? `${name}'` : `${name}'s`);
const isAdminWide = (d) => /^funds administered by /i.test(d.operator ?? "");

/** Group deployments by canonical administrator. Also adds administrators that only have their own product. */
function collectAdmins(ctx) {
  const map = new Map();
  const get = (name) => {
    if (!map.has(name)) {
      const info = adminInfo(name);
      const own = info.product && ctx.byId.get(info.product) ? ctx.byId.get(info.product) : null;
      map.set(name, { name, path: adminPath(name), info, own, deployments: [] });
    }
    return map.get(name);
  };
  for (const d of ctx.deployments) {
    if (!d.administrator) continue;
    get(canonicalAdmin(d.administrator)).deployments.push(d);
  }
  for (const [name, info] of Object.entries(ADMINS)) if (info.product && ctx.byId.has(info.product)) get(name);
  for (const a of map.values()) {
    a.deployments.sort((x, y) => (CONF_RANK[x.confidence] ?? 3) - (CONF_RANK[y.confidence] ?? 3));
    // Products used across deployments, most deployments first, own product first among ties.
    const count = new Map();
    const best = new Map();
    for (const d of a.deployments) {
      if (!d.product || !ctx.byId.has(d.product)) continue;
      count.set(d.product, (count.get(d.product) ?? 0) + 1);
      best.set(d.product, Math.min(best.get(d.product) ?? 3, CONF_RANK[d.confidence] ?? 3));
    }
    if (a.own && !count.has(a.own.id)) count.set(a.own.id, 0);
    a.products = [...count.entries()]
      .sort((x, y) => y[1] - x[1] || (best.get(x[0]) ?? 3) - (best.get(y[0]) ?? 3) || x[0].localeCompare(y[0]))
      .map(([id, n]) => ({ entry: ctx.byId.get(id), n, summary: ctx.summaryById.get(id), assessment: ctx.assessments[id] }));
    a.usedProducts = a.products.filter((p) => p.n > 0);
    a.unidentified = a.deployments.filter((d) => !d.product).length;
    a.variants = adminVariants(a.name, ctx.deployments);
    a.indexable = Boolean(a.own) || a.deployments.length >= 2 || a.deployments.some((d) => d.product);
    a.slug = a.path.split("/").pop();
  }
  return [...map.values()].sort((x, y) => x.name.localeCompare(y.name));
}

const softwareCell = (ctx, d) => {
  const e = d.product && ctx.byId.get(d.product);
  return e ? portalLink(ctx, e) : `<span class="muted">Not identified</span>`;
};

const operatorCell = (d) => {
  const name = esc(d.operator);
  const link = d.operator_website ? ` <span class="sub">${extLink(d.operator_website, "Website")}</span>` : "";
  const wide = isAdminWide(d) ? `<span class="sub">Administrator-wide portal</span>` : "";
  return `${name}${link}${wide}`;
};

// What each linked product offers for programmatic access, and what that means for an investor.
function accessSection(ctx, a) {
  if (!a.products.length) {
    return `<p>The software behind ${esc(poss(a.name))} investor portal is not identified in the registry yet, so its access channels are unknown. Investors can still ask the fund manager or ${esc(a.name)} whether statements and notices are available as a data feed (SFTP or partner API) or as email notifications, and whether delegated access for a service provider is permitted. The guide to <a href="/guides/partner-only-portal-access-explained">partner-only portal access</a> explains what those arrangements usually look like, and the guide to <a href="/guides/automate-capital-call-notices">automating capital call notices</a> covers what you can do with email alone.</p>`;
  }
  const items = a.products.map(({ entry: e, assessment: s }) => {
    const acc = e.access ?? {};
    const bits = [];
    for (const [ch, label] of [
      ["api", "API"],
      ["mcp", "MCP"],
      ["sftp", "SFTP"],
      ["email_notifications", "Email notifications"],
    ]) {
      const st = acc[ch]?.status ?? "unknown";
      if (st === "unknown") continue;
      const aud = acc[ch]?.audience?.length ? ` (${acc[ch].audience.map((x) => AUDIENCE[x] ?? x).join(", ")})` : "";
      bits.push(`${label}: ${pill(st)}${esc(aud)}`);
    }
    const lp = s?.lp_side_api ?? s?.investor_side_api ?? s?.recipient_side_api;
    const lpText = lp === true ? " An investor-side API is recorded." : lp === false ? " No investor-side API is recorded." : "";
    const terms = e.terms?.automation_policy === "prohibited" && !/terms/i.test(s?.rationale ?? "") ? " The product's terms prohibit automated access without permission." : "";
    return `<li><strong><a href="/portals/${esc(e.id)}">${esc(e.name)}</a></strong>, difficulty ${diffBadge(s?.difficulty)}. ${
      bits.length ? bits.join(" · ") + "." : "No access channel beyond the web portal is recorded."
    } ${esc((s?.rationale ?? "") + lpText + terms)}</li>`;
  });
  const anyLp = a.products.some(({ entry: e, assessment: s }) => (s?.lp_side_api ?? s?.investor_side_api) === true || (e.access?.api?.audience ?? []).includes("lp"));
  const partner = a.products.filter(({ entry: e }) => ["api", "sftp"].some((ch) => OPEN.includes(e.access?.[ch]?.status))).map(({ entry: e }) => e.name);
  const email = a.products.filter(({ entry: e }) => e.access?.email_notifications?.status === "available").map(({ entry: e }) => e.name);
  const mcp = a.products.filter(({ entry: e }) => ["available", "beta"].includes(e.access?.mcp?.status)).map(({ entry: e }) => e.name);
  const minDiff = Math.min(...a.products.map((p) => p.assessment?.difficulty ?? 9));
  return `<p>${
    anyLp
      ? `At least one portal product recorded for ${esc(a.name)} documents an investor-side API.`
      : `None of the portal products recorded for ${esc(a.name)} documents a self-serve API for investors.`
  }${minDiff < 9 ? ` ${a.products.length === 1 ? "It is" : "The easiest of them is"} rated ${minDiff} of 5 on the registry's difficulty scale (${esc(DIFFICULTY_LABEL[minDiff])}).` : ""} What each product offers:</p>
<ul>${items.join("\n")}</ul>
<h3>Practical steps for an investor</h3>
<ol>
<li><strong>Identify the portal.</strong> Match the portal name or web address on your notices to the table above. Each ${esc(a.name)} fund can sit on a different product.</li>
${
  partner.length
    ? `<li><strong>Ask for a feed.</strong> ${esc(listText(partner))} ${partner.length === 1 ? "has" : "have"} an API or SFTP channel that is partner-only or client-side. Ask the fund manager or ${esc(a.name)} whether statements and notices can be delivered to you or your service provider through it. The guide to <a href="/guides/partner-only-portal-access-explained">partner-only portal access</a> explains how these arrangements work.</li>`
    : `<li><strong>Ask for a feed.</strong> No API or SFTP channel is recorded for these products. Ask the fund manager or ${esc(a.name)} whether a data feed exists anyway; registry entries are community research and can be incomplete. See the guide to <a href="/guides/partner-only-portal-access-explained">partner-only portal access</a>.</li>`
}
${
  email.length
    ? `<li><strong>Use email notices.</strong> ${esc(listText(email))} ${email.length === 1 ? "sends" : "send"} email notifications, which can trigger your own workflow when a capital call or report is posted. See the guide to <a href="/guides/automate-capital-call-notices">automating capital call notices</a>.</li>`
    : `<li><strong>Use email notices.</strong> Notification emails are not confirmed for these products, but most portals send them. The guide to <a href="/guides/automate-capital-call-notices">automating capital call notices</a> shows how to build on them.</li>`
}
${mcp.length ? `<li><strong>MCP.</strong> ${esc(listText(mcp))} ${mcp.length === 1 ? "has" : "have"} an MCP server recorded; check the product page for who it is offered to.</li>` : ""}
<li><strong>Check the terms.</strong> Read the portal's terms before automating anything, and get written permission where the terms require it.</li>
</ol>`;
}

function adminFaq(ctx, a) {
  const qa = [];
  const used = a.usedProducts.map((p) => p.entry.name);
  const own = a.own?.name;
  let answer;
  if (used.length) {
    answer = `Public sources link ${a.name} to ${listText(used)} across ${plural(a.deployments.length, "known deployment")}.`;
    if (own && !used.includes(own)) answer += ` ${a.name} also offers its own portal, ${own}.`;
    if (a.unidentified) answer += ` The software behind ${plural(a.unidentified, "further portal")} is not identified yet.`;
  } else if (own) {
    answer = `${a.name} offers its own investor portal, ${own}. No individual fund deployments are recorded yet.`;
  } else {
    answer = `${a.name} runs an investor portal for the funds it administers, but the underlying software is not identified in the registry yet.`;
  }
  qa.push({ q: `Which investor portal does ${a.name} use?`, a: answer });

  if (a.products.length) {
    const lp = a.products.some(({ entry: e, assessment: s }) => s?.lp_side_api === true || (e.access?.api?.audience ?? []).includes("lp"));
    const apiProducts = a.products.filter(({ entry: e }) => OPEN.includes(e.access?.api?.status)).map(({ entry: e }) => e.name);
    qa.push({
      q: `Does the ${a.name} investor portal have an API for investors?`,
      a: lp
        ? `An investor-side API is recorded for at least one product. Check the product pages for terms and how to request access.`
        : apiProducts.length
          ? `No self-serve investor API is recorded. ${listText(apiProducts)} ${apiProducts.length === 1 ? "has" : "have"} an API that is partner-only or aimed at fund managers and administrators.`
          : `No API is recorded for the portal products linked to ${a.name}. Access is through the web portal unless the fund manager arranges a feed.`,
    });
  }
  qa.push({
    q: `How can I get documents from ${a.name}-administered funds automatically?`,
    a: `Identify which portal product your fund uses, then ask the fund manager or ${a.name} whether statements and notices can be sent as an SFTP or API feed to you or your service provider. Email notifications can also trigger your own workflow. Always check the portal's terms first.`,
  });
  qa.push({
    q: `How reliable is this ${a.name} data?`,
    a: `It is community research compiled from public sources such as administrator websites, press releases and vendor case studies. Each deployment is marked confirmed, likely or unknown. Corrections are welcome by email to ${CORRECT_MAIL} or by pull request.`,
  });
  qa.push({
    q: `Is ${SITE_NAME} affiliated with ${a.name}?`,
    a: `No. ${SITE_NAME} is an independent open registry. It is not affiliated with ${a.name} or with the portal vendors listed.`,
  });
  return qa;
}

const PAGE_CSS = `.adm td.note{white-space:normal;min-width:280px;max-width:460px;font-size:13.5px;color:var(--ink2)}
.adm td .sub{display:block;font-size:12.5px;color:var(--muted);margin-top:2px}
.adm td:first-child{white-space:normal}
.adm .muted,.muted{color:var(--muted)}
.adm-own{display:flex;flex-wrap:wrap;gap:10px 22px;align-items:center}
.adm-sec{margin-top:8px}`;

function adminPage(ctx, a) {
  const crumbs = [
    { name: "Administrators", path: "/administrators" },
    { name: a.name, path: a.path },
  ];
  const usedNames = a.usedProducts.map((p) => p.entry.name);
  const prodNames = a.products.map((p) => p.entry.name);
  const h1 = `Which investor portal does ${a.name} use?`;
  const nDep = plural(a.deployments.length, "known deployment");
  const short = prodNames.length > 2 ? `${prodNames.slice(0, 2).join(", ")} and others` : listText(prodNames);
  const description = fitDescription(
    prodNames.length
      ? [
          `${a.name} investor portal software: ${listText(prodNames)}. API, MCP and SFTP status, known funds, and how investors can get documents programmatically.`,
          `${a.name} investor portal software: ${short}. API, MCP and SFTP status, known funds, and how investors can get documents programmatically.`,
          `${a.name} investor portal software: ${short}. API, MCP and SFTP status and how investors get documents.`,
          `${a.name} investor portal software: ${short}. Access channels from ${nDep}.`,
        ]
      : [
          `Investor portal used by ${a.name}: what public sources show, which software is still unidentified, and how investors can ask for documents programmatically.`,
          `Investor portal used by ${a.name}: what public sources show and how investors can ask for documents programmatically. Independent community research.`,
        ]
  );

  const confCounts = { confirmed: 0, likely: 0, unknown: 0 };
  for (const d of a.deployments) confCounts[d.confidence ?? "unknown"] = (confCounts[d.confidence ?? "unknown"] ?? 0) + 1;

  let shortAnswer;
  if (usedNames.length) {
    shortAnswer = `Public sources link ${esc(a.name)} to ${listText(
      a.usedProducts.map((p) => `<a href="/portals/${esc(p.entry.id)}">${esc(p.entry.name)}</a>`)
    )} across ${esc(nDep)}.`;
    if (a.own && !a.usedProducts.some((p) => p.entry.id === a.own.id))
      shortAnswer += ` It also offers its own portal, <a href="/portals/${esc(a.own.id)}">${esc(a.own.name)}</a>.`;
    if (a.unidentified) shortAnswer += ` The software behind ${esc(plural(a.unidentified, "further portal"))} is not identified yet.`;
  } else if (a.own) {
    shortAnswer = `${esc(a.name)} offers its own investor portal, <a href="/portals/${esc(a.own.id)}">${esc(a.own.name)}</a>. No individual fund deployments are recorded yet.`;
  } else {
    shortAnswer = `${esc(a.name)} runs an investor portal for the funds it administers, but the underlying software is not identified in the registry yet. If you know it, please tell us.`;
  }

  const ownBlock = a.own
    ? (() => {
        const s = ctx.summaryById.get(a.own.id);
        const asmt = ctx.assessments[a.own.id];
        return `<h2>${esc(poss(a.name))} own portal product</h2>
<div class="card adm-sec">
  <div class="adm-own">${portalLink(ctx, a.own)} <span class="muted">${esc(CATEGORY_LABEL[a.own.category] ?? a.own.category)}</span>
  <span>API ${pill(s?.api)}</span><span>MCP ${pill(s?.mcp)}</span><span>SFTP ${pill(s?.sftp)}</span><span>Difficulty ${diffBadge(asmt?.difficulty)}</span></div>
  ${a.info.productNote ? `<p class="muted" style="margin:12px 0 0">${esc(a.info.productNote)}</p>` : ""}
  ${asmt?.rationale ? `<p style="margin:12px 0 0">${esc(asmt.rationale)}</p>` : ""}
  <p style="margin:12px 0 0"><a href="/portals/${esc(a.own.id)}">${esc(a.own.name)} API and document access details</a></p>
</div>`;
      })()
    : "";

  const productTable = a.products.length
    ? `<h2>Portal software linked to ${esc(a.name)}</h2>
<p>Products linked to ${esc(a.name)} in the registry, with the access channels recorded for each. Difficulty runs from 1 (documented self-serve API) to 5 (web only with MFA, view only).</p>
<div class="tablewrap adm"><table>
<thead><tr><th>Product</th><th>Category</th><th>API</th><th>MCP</th><th>SFTP</th><th>Difficulty</th><th>Deployments here</th></tr></thead>
<tbody>${a.products
        .map(
          ({ entry: e, n, summary: s, assessment: x }) =>
            `<tr><td>${portalLink(ctx, e)}${e.id === a.own?.id ? `<span class="sub">${esc(poss(a.name))} own product</span>` : ""}</td><td>${esc(
              CATEGORY_LABEL[e.category] ?? e.category
            )}</td><td>${pill(s?.api)}</td><td>${pill(s?.mcp)}</td><td>${pill(s?.sftp)}</td><td>${diffBadge(x?.difficulty)}</td><td>${n}</td></tr>`
        )
        .join("\n")}</tbody></table></div>`
    : "";

  const depTable = a.deployments.length
    ? `<h2>Known funds and portals</h2>
<p>Each row is a portal that investors in ${esc(a.name)}-administered funds are known to see. ${a.deployments.some(isAdminWide) ? ` Rows marked administrator-wide apply to funds ${esc(a.name)} administers in general rather than to one named fund.` : ""}${a.variants.length ? ` Rows recorded under ${esc(listText(a.variants.map((v) => `"${v}"`)))} are included.` : ""}</p>
<div class="tablewrap adm"><table>
<thead><tr><th>Fund or operator</th><th>Portal name</th><th>Software</th><th>Country</th><th>Confidence</th><th>Notes</th></tr></thead>
<tbody>${a.deployments
        .map(
          (d) =>
            `<tr><td>${operatorCell(d)}</td><td>${esc(d.portal_name)}</td><td>${softwareCell(ctx, d)}</td><td>${esc(countryName(d.country))}</td><td>${confPill(
              d.confidence
            )}</td><td class="note">${d.notes ? linkify(d.notes) : '<span class="muted">None</span>'}</td></tr>`
        )
        .join("\n")}</tbody></table></div>`
    : `<h2>Known funds and portals</h2><p>No individual fund deployments are recorded for ${esc(a.name)} yet.</p>`;

  const qa = adminFaq(ctx, a);
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: a.name,
    ...(a.info.website ? { url: a.info.website } : {}),
    ...(a.variants.length ? { alternateName: a.variants } : {}),
    description: `Fund administrator. Investor portal software linked to it in the ${SITE_NAME} registry: ${prodNames.length ? listText(prodNames) : "not identified"}.`,
  };
  const page = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: h1,
    url: abs(a.path),
    dateModified: ctx.latest,
    about: { "@type": "Organization", name: a.name, ...(a.info.website ? { url: a.info.website } : {}) },
    publisher: { "@type": "Organization", name: SITE_NAME },
  };

  const mailSubject = encodeURIComponent(`Correction: ${a.name} investor portal`);
  const body = `<section class="page-head"><div class="wrap">
  ${breadcrumbs(crumbs)}
  <h1>${esc(h1)}</h1>
  <p class="lead">Investor portal software that ${esc(a.name)} puts in front of investors in the funds it administers, compiled from public sources, with what each product offers for API, MCP and SFTP access.</p>
  <div class="meta"><span>Independent community research. Not affiliated with ${esc(a.name)}.</span><span>${a.deployments.length ? esc(nDep) : "No fund deployments recorded"}</span><span>Updated ${esc(ctx.latest)}</span>${
    a.info.website ? `<span>${extLink(a.info.website, `${a.name} website`)}</span>` : ""
  }</div>
</div></section>
<section class="tight"><div class="wrap"><div class="prose wide">
  <div class="callout"><strong>Short answer.</strong> ${shortAnswer}</div>
  ${a.info.history ? `<p class="callout">${esc(a.info.history)}</p>` : ""}
  ${ownBlock}
  ${productTable}
  ${depTable}
  ${
    a.deployments.length
      ? `<p class="updated">Confidence: ${confCounts.confirmed} confirmed, ${confCounts.likely} likely, ${confCounts.unknown} unknown. Confirmed means a public source from the administrator, operator or vendor names the software. Likely means it is inferred from indirect evidence. Unknown means the portal exists but its software is not identified.</p>`
      : ""
  }
  <div class="prose">
  <h2>Getting documents from ${esc(a.name)}-administered funds programmatically</h2>
  ${accessSection(ctx, a)}
  <h2>Correct or add to this page</h2>
  <p>This page is generated from <code>registry/deployments.json</code>, which is open data and mostly unverified. If you work at ${esc(
    a.name
  )}, a fund it administers or a portal vendor and something here is wrong or missing, email <a href="mailto:${CORRECT_MAIL}?subject=${mailSubject}">${CORRECT_MAIL}</a> or open a pull request with a public source. We correct entries promptly.</p>
  <h2>Frequently asked questions</h2>
  ${faq(qa)}
  </div>
  <div class="related"><h2>Related</h2><ul>
    <li><a href="/administrators">All fund administrators and their portals</a></li>
    ${a.products.map(({ entry: e }) => `<li><a href="/portals/${esc(e.id)}">${esc(e.name)} access details</a></li>`).join("\n    ")}
    <li><a href="/portals/category/fund-admin-portal">Fund administrator portals in the registry</a></li>
    <li><a href="/guides/automate-capital-call-notices">Automate capital call notices</a></li>
    <li><a href="/guides/partner-only-portal-access-explained">Partner-only portal access explained</a></li>
  </ul></div>
</div></div></section>`;

  return layout({
    title: h1,
    description,
    path: a.path,
    active: "/administrators",
    css: PAGE_CSS,
    noindex: !a.indexable,
    jsonld: [breadcrumbLd(crumbs), page, org, faqLd(qa)],
    body,
  });
}

function indexPage(ctx, admins) {
  const crumbs = [{ name: "Administrators", path: "/administrators" }];
  const adminDeps = ctx.deployments.filter((d) => d.administrator);
  const identified = adminDeps.filter((d) => d.product).length;
  const confirmed = adminDeps.filter((d) => d.confidence === "confirmed").length;
  const productIds = new Set(adminDeps.map((d) => d.product).filter(Boolean));
  const noAdmin = ctx.deployments.filter((d) => !d.administrator);
  const unidentifiedFunds = noAdmin.filter((d) => !d.product || !ctx.byId.has(d.product)).length;
  const funds = noAdmin
    .filter((d) => d.product && ctx.byId.has(d.product))
    .sort((x, y) => x.operator.localeCompare(y.operator) || (CONF_RANK[x.confidence] ?? 3) - (CONF_RANK[y.confidence] ?? 3));
  const h1 = "Which investor portal does each fund administrator use?";

  const rows = admins
    .map((a) => {
      const used = a.usedProducts.map((p) => `<a href="/portals/${esc(p.entry.id)}">${esc(p.entry.name)}</a>`);
      const ownOnly = a.own && !a.usedProducts.some((p) => p.entry.id === a.own.id);
      const sw = [
        ...used,
        ...(ownOnly ? [`<a href="/portals/${esc(a.own.id)}">${esc(a.own.name)}</a> <span class="muted">(own product)</span>`] : []),
        ...(a.unidentified ? [`<span class="muted">${esc(plural(a.unidentified, "unidentified portal"))}</span>`] : []),
      ];
      return `<tr><td><a href="${esc(a.path)}">${esc(a.name)}</a>${a.variants.length ? `<span class="sub">Includes ${esc(listText(a.variants))}</span>` : ""}</td><td class="note">${
        sw.join(", ") || '<span class="muted">Not identified</span>'
      }</td><td>${a.own ? "Yes" : "No"}</td><td>${a.deployments.length}</td></tr>`;
    })
    .join("\n");

  const fundRows = funds
    .map(
      (d) =>
        `<tr><td>${esc(d.operator)}${d.operator_website ? ` <span class="sub">${extLink(d.operator_website, "Website")}</span>` : ""}</td><td>${esc(
          d.portal_name
        )}</td><td>${softwareCell(ctx, d)}</td><td>${esc(countryName(d.country))}</td><td>${confPill(d.confidence)}</td></tr>`
    )
    .join("\n");

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Fund administrators and their investor portal software",
    numberOfItems: admins.length,
    itemListElement: admins.map((a, i) => ({ "@type": "ListItem", position: i + 1, name: a.name, url: abs(a.path) })),
  };

  const body = `<section class="page-head"><div class="wrap">
  ${breadcrumbs(crumbs)}
  <h1>${esc(h1)}</h1>
  <p class="lead">Fund administrators often choose the portal their investors see. This index maps ${admins.length} administrators to the portal software they use, from ${
    adminDeps.length
  } deployments recorded in the open registry.</p>
  <div class="meta"><span>Independent community research. Not affiliated with any administrator listed.</span><span>Updated ${esc(ctx.latest)}</span></div>
</div></section>
<section class="tight"><div class="wrap">
  <dl class="facts">
    <div><dt>Administrators</dt><dd>${admins.length}</dd></div>
    <div><dt>Administrator deployments</dt><dd>${adminDeps.length}</dd></div>
    <div><dt>Software identified</dt><dd>${identified} of ${adminDeps.length}</dd></div>
    <div><dt>Confirmed by a public source</dt><dd>${confirmed} of ${adminDeps.length}</dd></div>
    <div><dt>Distinct products</dt><dd>${productIds.size}</dd></div>
  </dl>
  <div class="prose">
  <h2>Why the administrator matters to investors</h2>
  <p>An investor in many private funds deals with many portals. Often the fund administrator, not the fund manager, decides which one. Knowing the software behind a portal tells you which access channels may exist, such as a partner API, an SFTP feed or email notifications, and what to ask for when you want documents delivered programmatically. The same product can appear under different names: Apex Group, Ocorian and Aztec Group all run portals on eFront Investment Café, for example.</p>
  <h2>How the data is compiled</h2>
  <p>Each deployment links an administrator, or a fund, to a portal product, using public sources such as administrator websites, press releases and vendor case studies. Every row carries a confidence level:</p>
  <ul>
    <li><strong>Confirmed</strong>: a public source from the administrator, operator or vendor names the software.</li>
    <li><strong>Likely</strong>: inferred from indirect evidence, such as trade press, a case study, an acquisition or a shared technical fingerprint.</li>
    <li><strong>Unknown</strong>: the portal exists, but its software is not identified yet.</li>
  </ul>
  <p>The data is community research and mostly unverified. Names are normalised, so a deployment recorded under a former name, such as Sanne, appears under the current owner. Each administrator page lists the sources.</p>
  </div>
  <h2>Administrators</h2>
  <div class="tablewrap adm"><table>
  <thead><tr><th>Administrator</th><th>Portal software used</th><th>Own product</th><th>Deployments</th></tr></thead>
  <tbody>${rows}</tbody></table></div>
  <div class="prose">
  <h2>Funds with a known portal and no administrator recorded</h2>
  <p>These funds run an investor portal without a fund administrator named in the registry. Each links to the product entry that describes access.${unidentifiedFunds ? ` ${plural(unidentifiedFunds, "further fund has", "further funds have")} a named portal whose software is not identified yet.` : ""}</p>
  </div>
  <div class="tablewrap adm"><table>
  <thead><tr><th>Fund or operator</th><th>Portal name</th><th>Software</th><th>Country</th><th>Confidence</th></tr></thead>
  <tbody>${fundRows}</tbody></table></div>
  <div class="prose">
  <h2>Correct or add a deployment</h2>
  <p>Know which portal an administrator or fund uses? Email <a href="mailto:${CORRECT_MAIL}?subject=${encodeURIComponent(
    "Administrator portal deployment"
  )}">${CORRECT_MAIL}</a> or open a pull request against <code>registry/deployments.json</code> with a public source. Administrators and vendors can correct their own rows the same way.</p>
  </div>
  <div class="related"><h2>Related</h2><ul>
    <li><a href="/portals/category/fund-admin-portal">Fund administrator portals in the registry</a></li>
    <li><a href="/portals">Full investor portal registry</a></li>
    <li><a href="/guides/automate-capital-call-notices">Automate capital call notices</a></li>
    <li><a href="/guides/partner-only-portal-access-explained">Partner-only portal access explained</a></li>
  </ul></div>
</div></section>`;

  return layout({
    title: h1,
    description:
      "Which investor portal software fund administrators such as Apex Group, Alter Domus, Citco and Ocorian use, with deployment counts and confidence levels.",
    path: "/administrators",
    active: "/administrators",
    css: PAGE_CSS,
    jsonld: [
      breadcrumbLd(crumbs),
      { "@context": "https://schema.org", "@type": "CollectionPage", name: h1, url: abs("/administrators"), dateModified: ctx.latest, mainEntity: itemList },
    ],
    body,
  });
}

export async function pages(ctx) {
  const admins = collectAdmins(ctx);
  return [
    { path: "/administrators", lastmod: ctx.latest, priority: 0.7, render: () => indexPage(ctx, collectAdmins(ctx)) },
    ...admins.map((a) => ({
      path: a.path,
      lastmod: ctx.latest,
      priority: a.indexable ? 0.6 : 0.2,
      sitemap: a.indexable,
      render: () => adminPage(ctx, a),
    })),
  ];
}
