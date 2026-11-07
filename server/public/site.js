// Small progressive enhancements shared by every page.
(() => {
  // Mobile menu: the button toggles the nav links as a dropdown panel.
  const nav = document.querySelector("body > nav");
  const btn = nav?.querySelector(".menu-btn");
  if (btn) {
    const set = (open) => {
      nav.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
    };
    btn.addEventListener("click", () => set(!nav.classList.contains("open")));
    nav.querySelectorAll("ul a").forEach((a) => a.addEventListener("click", () => set(false)));
    document.addEventListener("keydown", (e) => e.key === "Escape" && set(false));
    document.addEventListener("click", (e) => !nav.contains(e.target) && set(false));
  }

  // Tables: give every cell the label of its column header, so small screens can show
  // rows as stacked cards (see table.stack in site.css) instead of scrolling sideways.
  // The registry table on the landing page has its own mobile layout and is skipped.
  const label = (table) => {
    const heads = [...table.querySelectorAll("thead tr:last-child th")].map((th) => {
      const c = th.cloneNode(true);
      c.querySelectorAll(".plogo, .sr, img, svg").forEach((n) => n.remove());
      return c.textContent.replace(/\s+/g, " ").trim();
    });
    if (!heads.length) return;
    table.classList.add("stack");
    table.querySelectorAll("tbody tr").forEach((tr) =>
      [...tr.children].forEach((cell, i) => heads[i] && !cell.dataset.label && (cell.dataset.label = heads[i]))
    );
  };
  document.querySelectorAll("main table:not(#reg), section table:not(#reg)").forEach(label);
})();
