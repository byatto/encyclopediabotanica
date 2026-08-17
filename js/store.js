// =============================================================
// store.js — on-device storage for care-log edits and notes
// =============================================================
// The plant records in js/plants.js are the shared, read-only
// starting data (and are the only thing new-plant-prompt.md ever
// writes to). Anything you fill in on your phone — acquired date,
// source, location, last repotted, pot/soil, propagation, and free
// text notes — is saved here instead, in this browser's
// localStorage, keyed by each plant's stable "id".
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
  if (!persistent) memoryFallback = { version: 1, logs: {} };

  function readRaw() {
    if (!persistent) return memoryFallback;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { version: 1, logs: {} };
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || typeof parsed.logs !== "object") {
        return { version: 1, logs: {} };
      }
      return parsed;
    } catch (err) {
      console.warn("PlantStore: could not read saved data, starting fresh.", err);
      return { version: 1, logs: {} };
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
    if (merge) {
      const current = readRaw();
      const mergedLogs = Object.assign({}, current.logs, incoming.logs);
      writeRaw({ version: 1, logs: mergedLogs });
    } else {
      writeRaw({ version: 1, logs: incoming.logs });
    }
    return true;
  }

  /** Danger zone: wipe all saved log data on this device. */
  function clearAll() {
    writeRaw({ version: 1, logs: {} });
  }

  global.PlantStore = {
    getLog,
    setLogField,
    resetLog,
    isPersistent,
    exportJSON,
    importJSON,
    clearAll
  };
})(window);
