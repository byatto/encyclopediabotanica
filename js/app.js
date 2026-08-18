// =============================================================
// app.js — mobile app logic for index.html
// =============================================================
// Renders plants as a searchable list + detail view, with an
// editable care log saved via js/store.js (PlantStore). Routing is
// hash-based (#/, #/plant/<id>, #/about) so back/forward and deep
// links work without a server, entirely offline.
//
// WHERE PLANTS COME FROM (added in v5)
// -------------------------------------
// There are now two sources of plant records, merged together:
//
//   - REPO_PLANTS: the `plants` array from js/plants.js — the
//     shared file the owner edits and commits.
//   - locally-added plants: records saved on this device only, via
//     the in-app "Add plant" flow (see js/local-plants.js and
//     js/add-plant-dialog.js), stored in IndexedDB (see js/db.js).
//
// `PLANTS` (below) is the combined, de-duplicated list actually
// shown by the app. If a locally-added plant's id also exists in
// js/plants.js (e.g. because you committed an export that included
// it), the repo version wins and the local copy is simply ignored —
// never deleted automatically. See rebuildPlantsList().
//
// Loading local plants from IndexedDB is asynchronous, so the very
// first render uses repo plants only (instant, no waiting), and
// then re-renders a moment later once local plants are known — see
// "Initial render" at the bottom of this file.
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
  const btnAddPlant  = document.getElementById("btn-add-plant");

  const detailContent = document.getElementById("detail-content");
  const btnBack        = document.getElementById("btn-back");
  const btnAbout        = document.getElementById("btn-about");

  const toastEl = document.getElementById("toast");

  // `plants` is declared with `const` at the top level of js/plants.js,
  // which — unlike `var` — does NOT attach to `window`. It's still a
  // plain global identifier though, since these are both classic
  // (non-module) scripts sharing one global scope, so reference it
  // directly rather than via `window.plants`.
  const REPO_PLANTS = typeof plants !== "undefined" ? plants : [];

  // The combined, de-duplicated list the app actually renders from.
  // Starts as just the repo plants; rebuildPlantsList() below layers
  // locally-added ones on top once IndexedDB has answered.
  let PLANTS = REPO_PLANTS;

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
  // Exposed so js/add-plant-dialog.js can reuse the same toast
  // instead of building its own — one visual style, one place it's defined.
  window.showAppToast = showToast;

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

  // ── Photo object URLs ────────────────────────────────────────
  // A local (on-device) photo is stored as a Blob in IndexedDB, and
  // shown via `URL.createObjectURL(blob)` — a temporary browser URL
  // that points at the blob's bytes in memory. Those need to be
  // explicitly released (`revokeObjectURL`) once we're done with
  // them, or the browser holds onto that memory pointlessly. Both
  // render functions below clear and rebuild their container from
  // scratch each time, so the simplest safe rule is: revoke
  // everything we handed out last time, right before building fresh
  // thumbnails/photos this time.
  let activeObjectUrls = [];
  function trackObjectUrl(url) { activeObjectUrls.push(url); }
  function revokeTrackedObjectUrls() {
    activeObjectUrls.forEach(url => URL.revokeObjectURL(url));
    activeObjectUrls = [];
  }

  /**
   * Build a photo box for a plant. Shows, in order of preference:
   * a photo saved on this device → the `photo` path from the plant
   * record → a quiet placeholder. The on-device lookup is async
   * (IndexedDB), so the repo photo (or placeholder) appears first
   * and is swapped out the moment the local one is ready — the list
   * never waits on IndexedDB before showing something.
   */
  function thumbEl(plant, sizeClass) {
    const wrap = el("div", null, "thumb", sizeClass || "");

    const placeholder = el("div", null, "thumb-placeholder");
    placeholder.innerHTML = LEAF_PLACEHOLDER_SVG;

    const img = document.createElement("img");
    img.alt = "";
    img.loading = "lazy";
    img.hidden = true;
    // Covers both a missing repo photo file (404) and, in principle,
    // a corrupted local blob — either way, fall back to the placeholder.
    img.addEventListener("error", () => {
      img.hidden = true;
      placeholder.hidden = false;
    });

    function showImage(src) {
      img.src = src;
      img.hidden = false;
      placeholder.hidden = true;
    }

    if (plant.photo) showImage(plant.photo);

    append(wrap, img, placeholder);

    if (global_PlantDB()) {
      global_PlantDB().getPhoto(plant.id).then(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        trackObjectUrl(url);
        showImage(url);
      }).catch(() => { /* IndexedDB unavailable — repo photo/placeholder stands */ });
    }

    return wrap;
  }

  // Small guard so this file doesn't hard-crash if js/db.js failed
  // to load for some reason — the app degrades to repo-photos-only.
  function global_PlantDB() {
    return window.PlantDB || null;
  }

  // ── Search index ────────────────────────────────────────────
  // One lower-cased haystack per plant, covering every field worth
  // finding by ("toxic", "easy", "spider mites", ...). Rebuilt
  // whenever the plant list changes (repo load, or a local plant is
  // added/deleted).

  let searchIndex = new Map();
  function rebuildSearchIndex() {
    searchIndex = new Map();
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
  }
  rebuildSearchIndex(); // seed with repo plants immediately

  function matches(plant, query) {
    if (!query) return true;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (searchIndex.get(plant.id) || "").includes(q);
  }

  /**
   * Re-reads locally-added plants from IndexedDB and rebuilds PLANTS
   * as REPO_PLANTS + (local plants whose id isn't already a repo
   * id). Call this after adding or deleting a local plant, and once
   * at startup. See js/db.js for where local plants are stored.
   */
  async function rebuildPlantsList() {
    let localRecords = [];
    const db = global_PlantDB();
    if (db) {
      try {
        localRecords = await db.getAllLocalPlants();
      } catch (err) {
        console.warn("Could not load locally-added plants:", err);
      }
    }
    const repoIds = new Set(REPO_PLANTS.map(p => p.id));
    const overlay = localRecords
      .filter(p => !repoIds.has(p.id)) // repo record wins on an id clash
      .map(p => Object.assign({}, p, { isLocal: true }));
    PLANTS = REPO_PLANTS.concat(overlay);
    rebuildSearchIndex();
  }

  // ── List view ────────────────────────────────────────────────

  function renderList() {
    revokeTrackedObjectUrls();
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
      if (plant.isLocal) badges.appendChild(el("span", "Local", "badge", "badge-local"));
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

  /**
   * Builds the "Set photo" / "Remove photo" controls for a plant.
   * Works for every plant, repo or local — device-local photos are
   * a per-plant override regardless of where the record itself came
   * from. Returns the controls element to append as a SIBLING after
   * the photo box, not a child of it — the photo box clips its
   * contents to a fixed aspect ratio (see .d-photo in app.css),
   * which would cut these buttons off if nested inside it.
   */
  function buildPhotoControls(plant) {
    const controls = el("div", null, "photo-controls");
    const db = global_PlantDB();
    if (!db || !window.PhotoIntake) return controls; // storage or picker unavailable — quietly skip

    const setBtn = el("button", "Set photo", "btn", "photo-control-btn");
    setBtn.type = "button";
    setBtn.addEventListener("click", async () => {
      let blob;
      try {
        blob = await window.PhotoIntake.pickAndResizePhoto();
      } catch (err) {
        alert("Couldn't read that photo: " + err.message);
        return;
      }
      if (!blob) return; // picker was cancelled
      try {
        await db.savePhoto(plant.id, blob);
        const persisted = await db.requestPersistenceOnce();
        showToast(persisted === true ? "Photo saved — protected from automatic cleanup" : "Photo saved");
        renderDetail(plant.id); // rebuild so the new photo shows and "Remove" appears
      } catch (err) {
        alert("Couldn't save that photo: " + err.message);
      }
    });
    controls.appendChild(setBtn);

    db.getPhoto(plant.id).then(existingBlob => {
      if (!existingBlob) return;
      const removeBtn = el("button", "Remove photo", "btn", "btn-danger", "photo-control-btn");
      removeBtn.type = "button";
      removeBtn.addEventListener("click", async () => {
        if (!confirm("Remove your photo for " + plant.common + "? This reverts to the repo photo or placeholder on this device.")) return;
        await db.deletePhoto(plant.id);
        showToast("Photo removed");
        renderDetail(plant.id);
      });
      controls.appendChild(removeBtn);
    }).catch(() => {});

    return controls;
  }

  function renderDetail(id) {
    revokeTrackedObjectUrls();
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

    // Photo, plus Set/Remove controls (device-local, see buildPhotoControls)
    // underneath it — appended as siblings, not nested, see that function's comment.
    const photoWrap = thumbEl(plant, "d-photo");
    detailContent.appendChild(photoWrap);
    detailContent.appendChild(buildPhotoControls(plant));

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

    // Local-plant marker + delete (only for plants added via "Add
    // plant" on this device that aren't in js/plants.js yet)
    if (plant.isLocal) {
      const localNote = el("p", "Local — not yet in plants.js", "local-marker");
      detailContent.appendChild(localNote);

      const deleteBtn = el("button", "Delete this local plant", "text-link-btn", "danger-link");
      deleteBtn.addEventListener("click", async () => {
        if (!confirm("Delete your local record for " + plant.common + " (and its photo, if any)? This can't be undone — but since it was never added to plants.js, nothing in the shared file is affected.")) return;
        const db = global_PlantDB();
        if (db) {
          await db.deleteLocalPlant(plant.id);
          await db.deletePhoto(plant.id);
        }
        showToast("Local plant deleted");
        await window.AppRefresh.refresh("#/");
      });
      detailContent.appendChild(deleteBtn);
    }

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

  // Shared refresh hook: called after IndexedDB data changes outside
  // of a normal page render (adding a plant, deleting a local plant,
  // restoring a backup) so the app's in-memory PLANTS/search index
  // catch up, then navigates or re-renders as requested.
  window.AppRefresh = {
    refresh: async function (targetHash) {
      await rebuildPlantsList();
      if (targetHash && location.hash !== targetHash) {
        location.hash = targetHash; // triggers route() via hashchange
      } else {
        route();
      }
    }
  };

  // ── Search input ─────────────────────────────────────────────

  searchInput.addEventListener("input", () => {
    searchQuery = searchInput.value;
    if (parseHash().view === "list") renderList();
  });

  // ── Add plant ────────────────────────────────────────────────

  if (btnAddPlant) {
    btnAddPlant.addEventListener("click", () => {
      if (window.AddPlantDialog) window.AddPlantDialog.open();
    });
  }

  // ── Back button ──────────────────────────────────────────────

  btnBack.addEventListener("click", () => {
    location.hash = "#/";
  });

  btnAbout.addEventListener("click", () => {
    location.hash = location.hash === "#/about" ? "#/" : "#/about";
  });

  // ── Export / import / clear (About view) ────────────────────
  // Backups now cover three things: care-log text (PlantStore /
  // localStorage), and locally-added plants + their photos
  // (PlantDB / IndexedDB). The download is one JSON file either way
  // — see js/db.js for why photos become base64 text inside it.

  document.getElementById("btn-export").addEventListener("click", async () => {
    const today = new Date().toISOString().slice(0, 10);
    let backup;
    try {
      const logsExport = JSON.parse(PlantStore.exportJSON()); // { version: 1, logs: {...} }
      const db = global_PlantDB();
      const dbExport = db ? await db.exportAll() : { localPlants: [], photos: [] };
      backup = {
        version: 2,
        logs: logsExport.logs || {},
        localPlants: dbExport.localPlants,
        photos: dbExport.photos
      };
    } catch (err) {
      alert("Couldn't prepare a backup: " + err.message);
      return;
    }

    const json = JSON.stringify(backup, null, 2);
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
    reader.onload = async () => {
      try {
        const raw = reader.result;
        let parsed;
        try { parsed = JSON.parse(raw); } catch (err) { parsed = null; }

        // v2 backups carry a localPlants and/or photos array; a plain
        // v1 (or unrecognised) file is handed to PlantStore as-is,
        // which does its own validation and reports its own errors.
        const looksLikeV2 = parsed && (Array.isArray(parsed.localPlants) || Array.isArray(parsed.photos));

        if (looksLikeV2) {
          if (parsed.logs && typeof parsed.logs === "object") {
            PlantStore.importJSON(JSON.stringify({ version: 1, logs: parsed.logs }), { merge: true });
          }
          const db = global_PlantDB();
          if (db) await db.importAll({ localPlants: parsed.localPlants, photos: parsed.photos });
          await window.AppRefresh.refresh();
          showToast("Backup restored (logs, local plants & photos)");
        } else {
          PlantStore.importJSON(raw, { merge: true });
          showToast("Backup restored (care-log data)");
          if (parseHash().view === "plant") route();
        }
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

  // ── Export plants.js (folds locally-added plants into the file
  //    the owner commits — see js/local-plants.js for the assembly
  //    logic) ─────────────────────────────────────────────────

  const btnExportPlants = document.getElementById("btn-export-plants");
  if (btnExportPlants) {
    btnExportPlants.addEventListener("click", async () => {
      const db = global_PlantDB();
      if (!db || !window.LocalPlants) {
        alert("Export isn't available in this browser.");
        return;
      }
      try {
        const localRecords = await db.getAllLocalPlants();
        const localOnly = localRecords.filter(p => !REPO_PLANTS.some(rp => rp.id === p.id));
        if (localOnly.length === 0) {
          alert('No locally-added plants to export yet — use "Add plant" first.');
          return;
        }
        const response = await fetch("js/plants.js");
        if (!response.ok) throw new Error("Could not load js/plants.js (HTTP " + response.status + ").");
        const originalText = await response.text();
        const merged = window.LocalPlants.mergePlantsJsSource(originalText, localOnly);

        const blob = new Blob([merged], { type: "text/javascript" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "plants.js";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast("plants.js downloaded — replace js/plants.js in the repo with it");
      } catch (err) {
        alert("Couldn't export plants.js: " + err.message);
      }
    });
  }

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
  // Render immediately with repo plants only (instant, no waiting on
  // IndexedDB), then layer in locally-added plants a moment later.
  route();
  rebuildPlantsList().then(route);
})();
