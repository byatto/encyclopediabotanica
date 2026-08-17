// =============================================================
// print-render.js — renders js/plants.js into A4 pages for print.html
// =============================================================
// Reads the `plants` array (declared globally by js/plants.js) and
// builds one page <article> per record using createElement +
// textContent so that no plant text is ever interpreted as HTML.
// =============================================================

// ── Helpers ─────────────────────────────────────────────────

/**
 * Create an element, optionally set its textContent, and add
 * any CSS class names.
 * e.g. el("p", "Hello world", "my-class")
 */
function el(tag, text, ...classes) {
  const e = document.createElement(tag);
  if (text !== undefined && text !== null) e.textContent = text;
  if (classes.length) e.className = classes.join(" ");
  return e;
}

/**
 * Append one or more child elements to a parent.
 * Returns the parent for easy chaining.
 */
function append(parent, ...children) {
  children.forEach(c => parent.appendChild(c));
  return parent;
}

// ── Error display ────────────────────────────────────────────

/**
 * Show a helpful plain-text error instead of a blank page
 * when plants.js is missing or broken.
 */
function showLoadError(reason) {
  const box = document.getElementById("catalogue");
  box.style.cssText = [
    "max-width:500px", "margin:60px auto", "padding:28px 32px",
    "background:#fff", "border:1px solid #e3e4dd", "border-radius:4px",
    "font-family:system-ui,sans-serif", "color:#2a2d28", "line-height:1.7"
  ].join(";");

  const h = el("h2", "Catalogue could not load");
  h.style.cssText = "margin:0 0 12px;font-size:18px;";
  box.appendChild(h);

  const msg = el("p", reason);
  msg.style.cssText = "margin:0 0 12px;color:#5c5f57;";
  box.appendChild(msg);

  const hint = el("p",
    "Check that js/plants.js is in the js/ folder next to print.html " +
    "and that its contents are valid JavaScript " +
    "(no missing commas, unclosed brackets, etc.)."
  );
  hint.style.cssText = "margin:0;color:#9a9d92;font-size:14px;";
  box.appendChild(hint);
}

// ── Page builder ─────────────────────────────────────────────

/**
 * Build and return one <article class="page"> DOM node
 * for the given plant record object.
 */
function buildPage(plant) {
  const article = el("article");
  article.className = "page";
  if (plant.id) article.id = "plant-" + plant.id;

  // ─ Header ─────────────────────────────────────────────────
  const head = el("header", null, "head");

  append(head, el("div", plant.family, "kicker"));

  const h1 = el("h1", plant.latin, "latin-name", "latin");
  head.appendChild(h1);

  // Common name line — with optional qualifier span
  const commonLine = el("div", null, "common-name");
  commonLine.appendChild(document.createTextNode(plant.common));
  if (plant.qualifier) {
    const q = el("span", plant.qualifier, "qualifier");
    commonLine.appendChild(q);
  }
  head.appendChild(commonLine);

  article.appendChild(head);

  // ─ Top grid: photo + glance ────────────────────────────────
  const top = el("div", null, "top");

  // Photo box — no <img> if photo field is empty (fixes v2 glitch)
  const photoBox = el("div", null, "photo");
  function showPhotoPlaceholder() {
    photoBox.innerHTML = "";
    photoBox.appendChild(
      el("span",
        "Photo — add an image to /photos and set photo: \"photos/…\" in js/plants.js",
        "photo-placeholder"
      )
    );
  }
  if (plant.photo) {
    const img = document.createElement("img");
    img.src = plant.photo;
    img.alt = plant.common + " (" + plant.latin + ")";
    img.addEventListener("error", showPhotoPlaceholder); // missing/broken file → quiet placeholder, not a broken-image icon
    photoBox.appendChild(img);
  } else {
    showPhotoPlaceholder();
  }
  top.appendChild(photoBox);

  // Quick-glance panel
  const glance = el("dl", null, "glance");
  const glanceRows = [
    ["Light",      plant.glance.light],
    ["Water",      plant.glance.water],
    ["Humidity",   plant.glance.humidity],
    ["Temp",       plant.glance.temp],
    ["Toxicity",   plant.glance.toxicity],
    ["Difficulty", plant.glance.difficulty]
  ];
  glanceRows.forEach(([label, value]) => {
    const row = el("div", null, "g-row");
    append(row, el("dt", label), el("dd", value));
    glance.appendChild(row);
  });
  top.appendChild(glance);

  article.appendChild(top);

  // ─ Care sections ──────────────────────────────────────────
  const sections = el("div", null, "sections");

  function careSection(title, content) {
    const sec = el("section");
    sec.appendChild(el("h2", title));

    if (Array.isArray(content)) {
      // Array → bulleted list (used for pests)
      const ul = el("ul");
      content.forEach(item => append(ul, el("li", item)));
      sec.appendChild(ul);
    } else {
      sec.appendChild(el("p", content));
    }
    return sec;
  }

  append(sections,
    careSection("About",                plant.about),
    careSection("Growing Cycle",        plant.cycle),
    careSection("Watering",             plant.watering),
    careSection("Feeding",              plant.feeding),
    careSection("Pests & Stress Signals", plant.pests),
    careSection("Origins & Notes",      plant.origins)
  );

  article.appendChild(sections);

  // ─ Log strip ──────────────────────────────────────────────
  // Print pages always show the log as it currently stands on-device
  // (on-device edits from the app override the plants.js defaults),
  // so paper copies match what you see in the app.
  const savedLog = (window.PlantStore && plant.id)
    ? window.PlantStore.getLog(plant.id, plant.log)
    : plant.log;

  const log = el("dl", null, "log");

  // Helper to add one log cell; wide = spans two columns
  function logItem(label, value, wide) {
    const div = el("div", null, "l-item" + (wide ? " l-wide" : ""));
    div.appendChild(el("dt", label));
    div.appendChild(el("dd", value || " ")); // non-breaking space keeps the ruled line visible
    log.appendChild(div);
  }

  // Special label for the orchid: "Pot / Bark Mix"; all others: "Pot / Soil"
  const potLabel = plant.family === "Orchidaceae" ? "Pot / Bark Mix" : "Pot / Soil";

  logItem("Acquired",    savedLog.acquired);
  logItem("Source",      savedLog.source,      true);  // wide
  logItem("Location",    savedLog.location);
  logItem("Last Repotted", savedLog.repotted);
  logItem(potLabel,      savedLog.potSoil,     true);  // wide
  logItem("Propagation", savedLog.propagation);

  article.appendChild(log);

  // ─ Notes block ────────────────────────────────────────────
  const notes = el("div", null, "notes-block");
  notes.appendChild(el("h2", "Notes & Care Log"));

  if (savedLog.notes) {
    // On-device notes exist — print them instead of blank ruled lines
    const notesText = el("p", savedLog.notes);
    notesText.style.cssText = "font-size:9.5pt;color:var(--soft);white-space:pre-wrap;";
    notes.appendChild(notesText);
  } else {
    notes.appendChild(el("div", null, "notes-lines"));
  }

  article.appendChild(notes);

  // ─ Footer ─────────────────────────────────────────────────
  const foot = el("div", null, "foot");
  foot.appendChild(el("span", "Houseplant Catalogue"));
  foot.appendChild(el("span", plant.latin, "latin")); // Latin name in footer = italic too
  article.appendChild(foot);

  return article;
}

// ── Main render ──────────────────────────────────────────────

(function render() {
  // Guard: plants.js must have loaded and declared window.plants
  if (typeof plants === "undefined" || !Array.isArray(plants)) {
    showLoadError(
      "js/plants.js either did not load or does not declare a " +
      "\"const plants = [ … ]\" array."
    );
    return;
  }

  if (plants.length === 0) {
    showLoadError("js/plants.js loaded but the plants array is empty.");
    return;
  }

  const catalogue = document.getElementById("catalogue");
  plants.forEach(plant => catalogue.appendChild(buildPage(plant)));
})();


/* ============================================================
   FROZEN COPY EXPORT
   Clicking "Save frozen copy" clones the rendered DOM, strips
   all <script> tags and the helper bar, then downloads the
   result as a static HTML file.
   ============================================================ */

document.getElementById("btn-freeze").addEventListener("click", function () {
  // Clone the whole document so we can mutate without affecting the live page
  const clone = document.documentElement.cloneNode(true);

  // Remove all <script> elements — the frozen copy needs no JS
  clone.querySelectorAll("script").forEach(s => s.remove());

  // Remove the helper bar (it has class "helper")
  clone.querySelectorAll(".helper").forEach(h => h.remove());

  // Compose the file — doctype + cleaned HTML
  const html = "<!DOCTYPE html>\n" + clone.outerHTML;

  // Build a filename like catalogue-frozen-2026-01-15.html
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const filename = "catalogue-frozen-" + today + ".html";

  // Trigger a download via a temporary invisible link
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();

  // Clean up immediately
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});
