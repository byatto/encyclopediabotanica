// =============================================================
// app.js — mobile app logic for index.html
// =============================================================
// Renders js/plants.js as a searchable list + detail view, with
// an editable care log saved via js/store.js (PlantStore). Routing
// is hash-based (#/, #/plant/<id>, #/about) so back/forward and
// deep links work without a server, entirely offline.
// =============================================================

(function () {
  "use strict";

  // ── DOM refs ─────────────────────────────────────────────────
  const viewList   = document.getElementById("view-list");
  const viewDetail = document.getElementById("view-detail");
  const viewAbout  = document.getElementById("view-about");

  const searchInput  = document.getElementById("search");
  const resultCount  = document.getElementById("result-count");
  const plantListEl  = document.getElementById("plant-list");
  const emptyState   = document.getElementById("empty-state");
  const emptyQuery   = emptyState.querySelector("span");

  const detailContent = document.getElementById("detail-content");
  const btnBack        = document.getElementById("btn-back");
  const btnAbout        = document.getElementById("btn-about");

  const toastEl = document.getElementById("toast");

  // `plants` is declared with `const` at the top level of js/plants.js,
  // which — unlike `var` — does NOT attach to `window`. It's still a
  // plain global identifier though, since these are both classic
  // (non-module) scripts sharing one global scope, so reference it
  // directly rather than via `window.plants`.
  const PLANTS = typeof plants !== "undefined" ? plants : [];

  let toastTimer = null;
  let searchQuery = "";

  // ── Small DOM helpers (textContent only — never innerHTML for
  //    plant data, matching the print renderer's approach) ──────

  function el(tag, text, ...classes) {
    const e = document.createElement(tag);
    if (text !== undefined && text !== null) e.textContent = text;
    if (classes.length) e.className = classes.join(" ");
    return e;
  }

  function append(parent, ...children) {
    children.forEach(c => parent.appendChild(c));
    return parent;
  }

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1800);
  }

  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  const LEAF_PLACEHOLDER_SVG =
    '<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M50 15C66 15 80 30 80 52C80 74 66 90 48 90C34 90 22 78 22 60C22 40 34 22 50 15Z" fill="currentColor" opacity="0.35"/>' +
    "</svg>";

  function thumbEl(plant, sizeClass) {
    const wrap = el("div", null, "thumb", sizeClass || "");
    if (plant.photo) {
      const img = document.createElement("img");
      img.src = plant.photo;
      img.alt = "";
      img.loading = "lazy";
      const placeholder = el("div", null, "thumb-placeholder");
      placeholder.innerHTML = LEAF_PLACEHOLDER_SVG;
      placeholder.hidden = true;
      img.addEventListener("error", () => {
        img.remove();
        placeholder.hidden = false;
      });
      append(wrap, img, placeholder);
    } else {
      const placeholder = el("div", null, "thumb-placeholder");
      placeholder.innerHTML = LEAF_PLACEHOLDER_SVG;
      wrap.appendChild(placeholder);
    }
    return wrap;
  }

  // ── Search index ────────────────────────────────────────────
  // One lower-cased haystack per plant, built once, covering every
  // field worth finding by ("toxic", "easy", "spider mites", ...).

  const searchIndex = new Map();
  PLANTS.forEach(p => {
    const haystack = [
      p.family, p.latin, p.common, p.qualifier,
      p.glance && p.glance.light, p.glance && p.glance.water,
      p.glance && p.glance.humidity, p.glance && p.glance.toxicity,
      p.glance && p.glance.difficulty,
      p.about, p.cycle, p.watering, p.feeding, p.origins,
      Array.isArray(p.pests) ? p.pests.join(" ") : ""
    ].filter(Boolean).join(" ").toLowerCase();
    searchIndex.set(p.id, haystack);
  });

  function matches(plant, query) {
    if (!query) return true;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (searchIndex.get(plant.id) || "").includes(q);
  }

  // ── List view ────────────────────────────────────────────────

  function renderList() {
    const filtered = PLANTS.filter(p => matches(p, searchQuery));

    plantListEl.innerHTML = "";
    plantListEl.hidden = filtered.length === 0;
    emptyState.hidden = filtered.length !== 0;
    if (filtered.length === 0) emptyQuery.textContent = searchQuery;

    resultCount.textContent = PLANTS.length
      ? (searchQuery
          ? `${filtered.length} of ${PLANTS.length} plants`
          : `${PLANTS.length} plant${PLANTS.length === 1 ? "" : "s"}`)
      : "";

    filtered.forEach(plant => {
      const li = el("li");
      const a = el("a", null, "plant-card-link");
      a.href = "#/plant/" + encodeURIComponent(plant.id);

      const body = el("div", null, "plant-card-body");
      append(body, el("div", plant.family, "plant-card-kicker"));
      append(body, el("div", plant.latin, "plant-card-latin", "latin"));

      const commonLine = el("div", null, "plant-card-common");
      commonLine.appendChild(document.createTextNode(plant.common));
      if (plant.qualifier) commonLine.appendChild(el("span", plant.qualifier, "qualifier"));
      body.appendChild(commonLine);

      const badges = el("div", null, "plant-card-badges");
      if (plant.glance.difficulty) badges.appendChild(el("span", plant.glance.difficulty, "badge"));
      if (plant.glance.light) badges.appendChild(el("span", plant.glance.light, "badge"));
      body.appendChild(badges);

      append(a, thumbEl(plant), body);
      li.appendChild(a);
      plantListEl.appendChild(li);
    });
  }

  // ── Detail view ──────────────────────────────────────────────

  function careSection(title, content) {
    const sec = el("section", null, "d-section");
    sec.appendChild(el("h2", title));
    if (Array.isArray(content)) {
      const ul = el("ul");
      content.forEach(item => ul.appendChild(el("li", item)));
      sec.appendChild(ul);
    } else {
      sec.appendChild(el("p", content));
    }
    return sec;
  }

  function glanceTile(label, value) {
    const tile = el("div", null, "glance-tile");
    const dl = document.createElement("dl");
    dl.style.margin = "0";
    dl.appendChild(el("dt", label));
    dl.appendChild(el("dd", value || "—"));
    tile.appendChild(dl);
    return tile;
  }

  function logField(labelText, plantId, fieldKey, value, statusEl, wide, multiline) {
    const wrap = el("div", null, "log-field", wide ? "wide" : "");
    const label = el("label", labelText);
    const inputId = "log-" + plantId + "-" + fieldKey;
    label.htmlFor = inputId;

    const input = document.createElement(multiline ? "textarea" : "input");
    input.id = inputId;
    if (!multiline) input.type = "text";
    input.value = value || "";
    input.autocomplete = "off";

    const save = debounce(() => {
      PlantStore.setLogField(plantId, fieldKey, input.value);
      statusEl.textContent = "Saved";
      statusEl.classList.add("saved");
      setTimeout(() => statusEl.classList.remove("saved"), 900);
    }, 350);

    input.addEventListener("input", save);

    append(wrap, label, input);
    return wrap;
  }

  function renderDetail(id) {
    const plant = PLANTS.find(p => p.id === id);
    detailContent.innerHTML = "";

    if (!plant) {
      const msg = el("p", "That plant couldn't be found. It may have been renamed or removed from js/plants.js.");
      msg.style.cssText = "color:var(--soft);padding-top:20px;";
      detailContent.appendChild(msg);
      return;
    }

    document.title = plant.common + " — Encyclopedia Botanica";

    // Header
    detailContent.appendChild(el("div", plant.family, "d-kicker"));
    detailContent.appendChild(el("h2", plant.latin, "d-latin", "latin"));
    const commonLine = el("div", null, "d-common");
    commonLine.appendChild(document.createTextNode(plant.common));
    if (plant.qualifier) commonLine.appendChild(el("span", plant.qualifier, "qualifier"));
    detailContent.appendChild(commonLine);

    // Photo
    const photoWrap = thumbEl(plant, "d-photo");
    detailContent.appendChild(photoWrap);

    // Quick glance
    const glance = document.createElement("div");
    glance.className = "glance-grid";
    append(glance,
      glanceTile("Light", plant.glance.light),
      glanceTile("Water", plant.glance.water),
      glanceTile("Humidity", plant.glance.humidity),
      glanceTile("Temp", plant.glance.temp),
      glanceTile("Toxicity", plant.glance.toxicity),
      glanceTile("Difficulty", plant.glance.difficulty)
    );
    detailContent.appendChild(glance);

    // Care sections
    append(detailContent,
      careSection("About", plant.about),
      careSection("Growing Cycle", plant.cycle),
      careSection("Watering", plant.watering),
      careSection("Feeding", plant.feeding),
      careSection("Pests & Stress Signals", plant.pests),
      careSection("Origins & Notes", plant.origins)
    );

    // Care log (editable, saved on-device)
    const savedLog = PlantStore.getLog(plant.id, plant.log);
    const potLabel = plant.family === "Orchidaceae" ? "Pot / Bark Mix" : "Pot / Soil";

    const logSection = el("section", null, "d-section");
    logSection.appendChild(el("h2", "Care Log"));
    if (!PlantStore.isPersistent()) {
      const warn = el("p", "Storage isn't available in this browser session — log entries here won't be saved after you close the app.");
      warn.style.cssText = "color:var(--danger);font-size:12.5px;margin-bottom:10px;";
      logSection.appendChild(warn);
    }

    const status = el("div", "", "log-status");
    const grid = el("div", null, "log-grid");
    append(grid,
      logField("Acquired", plant.id, "acquired", savedLog.acquired, status),
      logField("Last repotted", plant.id, "repotted", savedLog.repotted, status),
      logField("Source", plant.id, "source", savedLog.source, status, true),
      logField("Location", plant.id, "location", savedLog.location, status),
      logField("Propagation", plant.id, "propagation", savedLog.propagation, status),
      logField(potLabel, plant.id, "potSoil", savedLog.potSoil, status, true),
      logField("Notes", plant.id, "notes", savedLog.notes, status, true, true)
    );
    logSection.appendChild(grid);
    logSection.appendChild(status);

    const resetBtn = el("button", "Reset log to defaults", "text-link-btn");
    resetBtn.style.marginTop = "12px";
    resetBtn.addEventListener("click", () => {
      if (confirm("Clear your saved log and notes for " + plant.common + "? This can't be undone.")) {
        PlantStore.resetLog(plant.id);
        renderDetail(plant.id);
        showToast("Log reset");
      }
    });
    logSection.appendChild(resetBtn);

    detailContent.appendChild(logSection);

    // Footer links
    const footer = el("div", null, "d-footer-links");
    const printLink = el("a", "Print / export PDF ↗");
    printLink.href = "print.html#plant-" + encodeURIComponent(plant.id);
    footer.appendChild(printLink);
    detailContent.appendChild(footer);
  }

  // ── About / settings view ───────────────────────────────────

  function renderAbout() {
    document.title = "About — Encyclopedia Botanica";
    const persistNotice = document.getElementById("storage-notice");
    persistNotice.hidden = PlantStore.isPersistent();
  }

  // ── Router ───────────────────────────────────────────────────

  function parseHash() {
    const hash = location.hash.replace(/^#\/?/, "");
    const parts = hash.split("/").filter(Boolean);
    if (parts[0] === "plant" && parts[1]) return { view: "plant", id: decodeURIComponent(parts[1]) };
    if (parts[0] === "about") return { view: "about" };
    return { view: "list" };
  }

  function showView(name) {
    viewList.hidden   = name !== "list";
    viewDetail.hidden = name !== "plant";
    viewAbout.hidden  = name !== "about";
    window.scrollTo(0, 0);
  }

  function route() {
    const r = parseHash();
    if (r.view === "plant") {
      renderDetail(r.id);
      showView("plant");
    } else if (r.view === "about") {
      renderAbout();
      showView("about");
    } else {
      document.title = "Encyclopedia Botanica";
      renderList();
      showView("list");
    }
  }

  window.addEventListener("hashchange", route);

  // ── Search input ─────────────────────────────────────────────

  searchInput.addEventListener("input", () => {
    searchQuery = searchInput.value;
    if (parseHash().view === "list") renderList();
  });

  // ── Back button ──────────────────────────────────────────────

  btnBack.addEventListener("click", () => {
    if (history.length > 1 && document.referrer === "") {
      // no-op; hash navigation below handles the common case
    }
    location.hash = "#/";
  });

  btnAbout.addEventListener("click", () => {
    location.hash = location.hash === "#/about" ? "#/" : "#/about";
  });

  // ── Export / import / clear (About view) ────────────────────

  document.getElementById("btn-export").addEventListener("click", () => {
    const json = PlantStore.exportJSON();
    const today = new Date().toISOString().slice(0, 10);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "encyclopedia-botanica-backup-" + today + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("Backup downloaded");
  });

  document.getElementById("import-file").addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        PlantStore.importJSON(reader.result, { merge: true });
        showToast("Data imported");
        if (parseHash().view === "plant") route();
      } catch (err) {
        alert("Import failed: " + err.message);
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  });

  document.getElementById("btn-clear").addEventListener("click", () => {
    if (confirm("Delete every saved log entry and note on this device? Your plants.js reference data is unaffected. This can't be undone.")) {
      PlantStore.clearAll();
      showToast("All saved data cleared");
      if (parseHash().view === "plant") route();
    }
  });

  // ── Install prompt (Android/Chrome "Add to Home screen") ────

  let deferredInstallPrompt = null;
  const installBanner = document.getElementById("install-banner");
  const btnInstall = document.getElementById("btn-install");
  const btnDismissInstall = document.getElementById("btn-dismiss-install");
  const btnInstallAbout = document.getElementById("btn-install-about");

  function installDismissed() {
    try { return localStorage.getItem("encyclopediabotanica:install-dismissed") === "1"; }
    catch (e) { return false; }
  }
  function dismissInstall() {
    try { localStorage.setItem("encyclopediabotanica:install-dismissed", "1"); } catch (e) {}
    installBanner.hidden = true;
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (!installDismissed() && !window.matchMedia("(display-mode: standalone)").matches) {
      installBanner.hidden = false;
    }
    if (btnInstallAbout) btnInstallAbout.hidden = false;
  });

  async function triggerInstall() {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installBanner.hidden = true;
  }

  btnInstall.addEventListener("click", triggerInstall);
  if (btnInstallAbout) btnInstallAbout.addEventListener("click", triggerInstall);
  btnDismissInstall.addEventListener("click", dismissInstall);

  window.addEventListener("appinstalled", () => {
    installBanner.hidden = true;
    showToast("Installed — find it on your home screen");
  });

  // ── Service worker registration + update flow ───────────────

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").then(reg => {
        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              showToast("Updated — reload to get the latest version");
            }
          });
        });
      }).catch(err => console.warn("Service worker registration failed:", err));
    });
  }

  // ── Initial render ──────────────────────────────────────────
  route();
})();
