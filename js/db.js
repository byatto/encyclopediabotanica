// =============================================================
// db.js — on-device storage for photos and locally-added plants
// =============================================================
// WHY TWO STORAGE SYSTEMS?
// ------------------------
// js/store.js already saves small text (your care-log entries) in
// "localStorage" — a simple key/value box built into every browser.
// That's fine for a few short strings, but it's a poor fit for:
//
//   - photos, which are binary and can be a megabyte or more each
//   - whole plant records, which are structured objects, not text
//
// For those, this file uses "IndexedDB" instead — a proper
// in-browser database built for exactly this: bigger, structured,
// binary-friendly data. It's a different API to localStorage, and
// a much fussier one, so everything below wraps it in plain
// functions that return Promises, so the rest of the app never has
// to touch the raw IndexedDB API directly.
//
// PRIVACY, BY DESIGN
// -------------------
// Everything in this file stays on this device. There is no upload,
// no sync, no network call anywhere below — photos and locally-added
// plants live only in this browser's IndexedDB until you explicitly
// export/back them up yourself (see the About screen). This is a
// deliberate choice, not an oversight: earlier drafts of this app's
// brief avoided any browser storage at all, because it started life
// as a plain file you opened from disk. Now that it's an installed
// app, the trade-off flips — on-device storage is the whole point,
// as long as nothing ever leaves the device. It doesn't.
// =============================================================

(function (global) {
  "use strict";

  const DB_NAME = "encyclopedia-botanica";
  const DB_VERSION = 1;

  const PHOTOS_STORE = "photos";       // keyed by plant id → { id, blob, updatedAt }
  const LOCAL_PLANTS_STORE = "localPlants"; // keyed by plant id → the plant record + a bit of bookkeeping

  // ── Opening the database ────────────────────────────────────
  // IndexedDB is asynchronous and callback-based under the hood.
  // We open it once and reuse the same connection (a Promise that
  // resolves to the open database), rather than reopening on every
  // call.

  let dbPromise = null;

  function openDatabase() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
      if (!global.indexedDB) {
        reject(new Error("This browser doesn't support IndexedDB — photos and in-app plant creation aren't available here."));
        return;
      }

      const request = global.indexedDB.open(DB_NAME, DB_VERSION);

      // Runs once, the very first time (or when DB_VERSION goes up).
      // This is where object stores ("tables") get created.
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(PHOTOS_STORE)) {
          db.createObjectStore(PHOTOS_STORE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(LOCAL_PLANTS_STORE)) {
          db.createObjectStore(LOCAL_PLANTS_STORE, { keyPath: "id" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return dbPromise;
  }

  // Wrap a single IndexedDB request in a Promise. Almost every
  // operation below is "start a request, wait for onsuccess/onerror".
  function promisifyRequest(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function withStore(storeName, mode, fn) {
    const db = await openDatabase();
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const result = await fn(store);
    // Wait for the whole transaction to finish, not just our request,
    // so callers can rely on the write having actually landed.
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error("Transaction aborted"));
    });
    return result;
  }

  // ── Photos ───────────────────────────────────────────────────
  // Stored as { id: "<plant id>", blob: <JPEG Blob>, updatedAt: <timestamp> }.
  // `id` is the plant's stable slug from plants.js (e.g. "monstera-deliciosa"),
  // never its Latin name — ids don't change if a record is edited, so a
  // photo never gets orphaned by a wording tweak.

  async function savePhoto(plantId, blob) {
    await requestPersistenceOnce(); // see below — ask the browser to protect this data
    await withStore(PHOTOS_STORE, "readwrite", store =>
      promisifyRequest(store.put({ id: plantId, blob, updatedAt: Date.now() }))
    );
  }

  async function getPhoto(plantId) {
    const record = await withStore(PHOTOS_STORE, "readonly", store =>
      promisifyRequest(store.get(plantId))
    );
    return record ? record.blob : undefined;
  }

  async function deletePhoto(plantId) {
    await withStore(PHOTOS_STORE, "readwrite", store =>
      promisifyRequest(store.delete(plantId))
    );
  }

  async function getAllPhotos() {
    // Returns every stored photo as [{ id, blob }, …]. Used for backups.
    const records = await withStore(PHOTOS_STORE, "readonly", store =>
      promisifyRequest(store.getAll())
    );
    return records || [];
  }

  // ── Locally-added plants ─────────────────────────────────────
  // Each stored record is the plant object itself (same shape as an
  // entry in plants.js — see new-plant-prompt.md for the schema),
  // plus one internal bookkeeping field, `_createdAt`, used only to
  // remember the order plants were added in. It's stripped back out
  // before a record is shown to the rest of the app or exported.

  async function saveLocalPlant(record) {
    if (!record || !record.id) throw new Error("A local plant record needs an id.");
    const existing = await withStore(LOCAL_PLANTS_STORE, "readonly", store =>
      promisifyRequest(store.get(record.id))
    );
    const stored = Object.assign({}, record, {
      _createdAt: existing ? existing._createdAt : Date.now()
    });
    await withStore(LOCAL_PLANTS_STORE, "readwrite", store =>
      promisifyRequest(store.put(stored))
    );
  }

  function stripBookkeeping(stored) {
    const { _createdAt, ...record } = stored;
    return record;
  }

  async function getLocalPlant(plantId) {
    const stored = await withStore(LOCAL_PLANTS_STORE, "readonly", store =>
      promisifyRequest(store.get(plantId))
    );
    return stored ? stripBookkeeping(stored) : undefined;
  }

  async function getAllLocalPlants() {
    // Returned in the order they were added (oldest first), which is
    // how the app lists them after the repo's own plants.js records.
    const stored = await withStore(LOCAL_PLANTS_STORE, "readonly", store =>
      promisifyRequest(store.getAll())
    );
    return (stored || [])
      .sort((a, b) => a._createdAt - b._createdAt)
      .map(stripBookkeeping);
  }

  async function deleteLocalPlant(plantId) {
    await withStore(LOCAL_PLANTS_STORE, "readwrite", store =>
      promisifyRequest(store.delete(plantId))
    );
  }

  // ── Storage persistence ─────────────────────────────────────
  // Browsers are allowed to quietly delete "best-effort" site data
  // (including IndexedDB) under storage pressure. Asking for
  // "persistent" storage makes that much less likely. It's not a
  // permission prompt in most browsers — it's usually granted
  // automatically for installed PWAs — so we just ask once and note
  // the answer; see app.js for where the result is shown to you.
  //
  // We only ever ask once per device (tracked in localStorage, which
  // is a fine use for it — it's one boolean, not user data) so this
  // doesn't re-run on every single photo you add.

  const PERSIST_ASKED_KEY = "encyclopediabotanica:persist-asked";
  let persistResultPromise = null;

  function requestPersistenceOnce() {
    if (persistResultPromise) return persistResultPromise;

    let alreadyAsked = false;
    try { alreadyAsked = global.localStorage.getItem(PERSIST_ASKED_KEY) === "1"; }
    catch (err) { /* localStorage unavailable — just ask again, it's harmless */ }

    if (alreadyAsked || !global.navigator || !global.navigator.storage || !global.navigator.storage.persist) {
      persistResultPromise = Promise.resolve(null); // nothing to report
      return persistResultPromise;
    }

    persistResultPromise = global.navigator.storage.persist()
      .then(granted => {
        try { global.localStorage.setItem(PERSIST_ASKED_KEY, "1"); } catch (err) {}
        return granted;
      })
      .catch(() => null);

    return persistResultPromise;
  }

  // ── Blob ⇄ data URL conversion ──────────────────────────────
  // Used when packing photos into a JSON backup file, and when the
  // print view's "Save frozen copy" needs to embed photos directly
  // into a standalone HTML file (a data URL is just the photo's
  // bytes written out as text, so it survives inside plain HTML/JSON
  // with no separate image file needed).

  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  async function dataURLToBlob(dataUrl) {
    // fetch() can decode a data: URL directly into a Blob — simpler
    // and more reliable than hand-parsing the base64 ourselves.
    const response = await fetch(dataUrl);
    return response.blob();
  }

  // ── Backup / restore ─────────────────────────────────────────
  // Bundles everything IndexedDB holds into plain objects/arrays
  // that JSON.stringify can handle (photos become base64 data URLs,
  // which does make the backup file noticeably bigger than the raw
  // photos — often several MB for a full photo set — but keeps the
  // backup a single, ordinary JSON file with no extra libraries).

  async function exportAll() {
    const [localPlants, photos] = await Promise.all([getAllLocalPlants(), getAllPhotos()]);
    const photosWithDataUrls = await Promise.all(
      photos.map(async p => ({ id: p.id, dataUrl: await blobToDataURL(p.blob) }))
    );
    return { localPlants, photos: photosWithDataUrls };
  }

  async function importAll({ localPlants, photos } = {}) {
    if (Array.isArray(localPlants)) {
      for (const record of localPlants) await saveLocalPlant(record);
    }
    if (Array.isArray(photos)) {
      for (const p of photos) {
        if (p && p.id && p.dataUrl) await savePhoto(p.id, await dataURLToBlob(p.dataUrl));
      }
    }
  }

  global.PlantDB = {
    savePhoto, getPhoto, deletePhoto, getAllPhotos,
    saveLocalPlant, getLocalPlant, getAllLocalPlants, deleteLocalPlant,
    requestPersistenceOnce,
    blobToDataURL, dataURLToBlob,
    exportAll, importAll
  };
})(window);
