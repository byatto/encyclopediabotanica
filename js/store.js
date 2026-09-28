// =============================================================
// store.js — on-device storage for care-log edits, notes, and the
// watering log
// =============================================================
// The plant records in js/plants.js are the shared, read-only
// starting data (and are the only thing new-plant-prompt.md ever
// writes to). Anything you fill in on your phone — acquired date,
// source, location, last repotted, pot/soil, propagation, free text
// notes, and every time you log a watering — is saved here instead,
// in this browser's localStorage, keyed by each plant's stable "id".
//
// This keeps two things separate on purpose:
//   - js/plants.js   → shared reference data, edited by hand / AI,
//                       the same on every device.
//   - localStorage    → your personal log for your actual plants,
//                       local to this phone/browser only.
//
// Because it's local to one browser, use "Export data" in the app
// occasionally to save a backup JSON file, and "Import data" to
// restore it (e.g. after reinstalling, or to move to a new phone).
//
// TWO KINDS OF DATA IN HERE
// --------------------------
// "logs" holds single current-state facts per plant (acquired date,
// location, …) — editing a field simply overwrites it.
// "waterings" holds a growing HISTORY per plant: every time you log
// a watering, a new entry is added, never overwritten. That's why
// it gets its own get/add/delete functions below instead of
// reusing getLog/setLogField — the shape of the data is different
// (a list that grows, not a single value that changes).
// =============================================================

(function (global) {
  "use strict";

  const STORAGE_KEY = "encyclopediabotanica:v1";
  const EMPTY_LOG = Object.freeze({
    acquired: "", source: "", location: "",
    repotted: "", potSoil: "", propagation: "", notes: ""
  });

  // ── Safe localStorage access ───────────────────────────────
  // Private browsing / disabled storage can make localStorage throw
  // on read or write. Fall back to an in-memory store so the app
  // still works for the session, and flag it so the UI can warn.

  let memoryFallback = null;
  let persistent = true;

  function probeStorage() {
    try {
      const testKey = "encyclopediabotanica:probe";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch (err) {
      return false;
    }
  }

  persistent = typeof window !== "undefined" && !!window.localStorage && probeStorage();
  if (!persistent) memoryFallback = { version: 1, logs: {}, waterings: {} };

  // Ensures older saved data (from before the watering log existed)
  // gets a "waterings" bucket added on the fly, instead of every
  // caller having to check for it.
  function withWateringsDefault(data) {
    if (!data.waterings || typeof data.waterings !== "object") data.waterings = {};
    return data;
  }

  function readRaw() {
    if (!persistent) return memoryFallback;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { version: 1, logs: {}, waterings: {} };
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || typeof parsed.logs !== "object") {
        return { version: 1, logs: {}, waterings: {} };
      }
      return withWateringsDefault(parsed);
    } catch (err) {
      console.warn("PlantStore: could not read saved data, starting fresh.", err);
      return { version: 1, logs: {}, waterings: {} };
    }
  }

  function writeRaw(data) {
    if (!persistent) {
      memoryFallback = data;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn("PlantStore: could not save data (storage full or unavailable).", err);
    }
  }

  // ── Public API ──────────────────────────────────────────────

  /**
   * Merge a plant's default log (from plants.js) with any saved
   * on-device overrides. Only fields the user has actually edited
   * take precedence; anything untouched falls back to the default.
   */
  function getLog(plantId, defaultLog) {
    const data = readRaw();
    const saved = data.logs[plantId] || {};
    const base = Object.assign({}, EMPTY_LOG, defaultLog || {});
    return Object.assign({}, base, saved);
  }

  /**
   * Save a single field (acquired, source, location, repotted,
   * potSoil, propagation, or notes) for one plant.
   */
  function setLogField(plantId, field, value) {
    const data = readRaw();
    if (!data.logs[plantId]) data.logs[plantId] = {};
    data.logs[plantId][field] = value;
    writeRaw(data);
  }

  /** Remove all saved overrides for one plant (revert to defaults). */
  function resetLog(plantId) {
    const data = readRaw();
    delete data.logs[plantId];
    writeRaw(data);
  }

  // ── Watering log ──────────────────────────────────────────────
  // Each entry: { id, at (ISO timestamp), amount ("Light"/"Normal"/
  // "Heavy" — app.js's choice, this file doesn't care what strings
  // it's given), note }. `id` is a short random tag (not a counter,
  // to stay simple) used only so one entry can be found again to
  // delete it.

  function makeWateringId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  /** Every watering logged for a plant, oldest first. */
  function getWaterings(plantId) {
    const data = readRaw();
    const list = data.waterings[plantId];
    return Array.isArray(list)
      ? list.slice().sort((a, b) => new Date(a.at) - new Date(b.at))
      : [];
  }

  /** Log a new watering. `amount` and `note` are optional free text. */
  function addWatering(plantId, { amount = "", note = "", at } = {}) {
    const data = readRaw();
    if (!data.waterings[plantId]) data.waterings[plantId] = [];
    const entry = { id: makeWateringId(), at: at || new Date().toISOString(), amount, note };
    data.waterings[plantId].push(entry);
    writeRaw(data);
    return entry;
  }

  /** Remove one logged watering (e.g. an accidental tap), by its id. */
  function deleteWatering(plantId, entryId) {
    const data = readRaw();
    if (!Array.isArray(data.waterings[plantId])) return;
    data.waterings[plantId] = data.waterings[plantId].filter(e => e.id !== entryId);
    writeRaw(data);
  }

  /**
   * Merges two plants→[entries] maps for import, keeping every
   * unique entry from both sides (by id) rather than one replacing
   * the other. Unlike the single-value log fields above, watering
   * history is an append-only record — silently dropping entries
   * because they happened to be missing from whichever side "won"
   * would be a real loss of data, not just an old value being
   * refreshed, so importing merges instead of overwriting.
   */
  function mergeWateringsMaps(current, incoming) {
    const merged = {};
    const allPlantIds = new Set(Object.keys(current || {}).concat(Object.keys(incoming || {})));
    allPlantIds.forEach(plantId => {
      const byId = new Map();
      (current[plantId] || []).forEach(e => byId.set(e.id, e));
      (incoming[plantId] || []).forEach(e => byId.set(e.id, e));
      merged[plantId] = Array.from(byId.values()).sort((a, b) => new Date(a.at) - new Date(b.at));
    });
    return merged;
  }

  /** Whether saved data actually persists across sessions on this device. */
  function isPersistent() {
    return persistent;
  }

  /** Export everything saved so far as a pretty-printed JSON string. */
  function exportJSON() {
    const data = readRaw();
    return JSON.stringify(data, null, 2);
  }

  /**
   * Replace (or merge into) the saved data from a previously
   * exported JSON string. Returns true on success.
   */
  function importJSON(jsonText, { merge = false } = {}) {
    let incoming;
    try {
      incoming = JSON.parse(jsonText);
    } catch (err) {
      throw new Error("That file isn't valid JSON.");
    }
    if (!incoming || typeof incoming !== "object" || typeof incoming.logs !== "object") {
      throw new Error("That file doesn't look like an Encyclopedia Botanica export.");
    }
    const incomingWaterings = (incoming.waterings && typeof incoming.waterings === "object") ? incoming.waterings : {};
    if (merge) {
      const current = readRaw();
      const mergedLogs = Object.assign({}, current.logs, incoming.logs);
      const mergedWaterings = mergeWateringsMaps(current.waterings, incomingWaterings);
      writeRaw({ version: 1, logs: mergedLogs, waterings: mergedWaterings });
    } else {
      writeRaw({ version: 1, logs: incoming.logs, waterings: incomingWaterings });
    }
    return true;
  }

  /** Danger zone: wipe all saved log data (including watering history) on this device. */
  function clearAll() {
    writeRaw({ version: 1, logs: {}, waterings: {} });
  }

  global.PlantStore = {
    getLog,
    setLogField,
    getWaterings,
    addWatering,
    deleteWatering,
    resetLog,
    isPersistent,
    exportJSON,
    importJSON,
    clearAll
  };
})(window);
