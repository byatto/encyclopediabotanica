// =============================================================
// sw.js — service worker for offline use
// =============================================================
// Precaches the app shell (HTML/CSS/JS/fonts/icons) so the app and
// print view load instantly and work with no network at all.
// Plant photos (the repo's own "photos/…" files) are cached the
// first time they're viewed, so browse each plant once while online
// and it stays available offline.
//
// WHAT THIS FILE DOES *NOT* CACHE
// ---------------------------------
// Your care-log text (js/store.js) and your device-local photos +
// locally-added plants (js/db.js) are never touched by this file at
// all — they live in localStorage and IndexedDB, which are
// completely separate browser storage from the Cache API used here.
// Nothing below can see, cache, or evict that data.
//
// BUMPING THE VERSION
// --------------------
// Increase CACHE_VERSION whenever you change any precached file
// (app.css, app.js, plants.js, etc.). This creates a fresh cache,
// and the app's update-available toast (js/app.js) tells you to
// reload to pick it up.
// =============================================================

const CACHE_VERSION = "v2";
const SHELL_CACHE = "eb-shell-" + CACHE_VERSION;
const PHOTO_CACHE = "eb-photos-" + CACHE_VERSION;

const APP_SHELL = [
  "./",
  "./index.html",
  "./print.html",
  "./manifest.webmanifest",
  "./css/app.css",
  "./js/plants.js",
  "./js/store.js",
  "./js/db.js",
  "./js/photo-intake.js",
  "./js/local-plants.js",
  "./js/add-plant-dialog.js",
  "./js/app.js",
  "./js/print-render.js",
  "./fonts/inter-variable.woff2",
  "./fonts/newsreader-italic-variable.woff2",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== SHELL_CACHE && key !== PHOTO_CACHE)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

function isPhotoRequest(url) {
  return url.origin === self.location.origin && url.pathname.includes("/photos/");
}

// Cache-first, falling back to network, for photos — once viewed
// while online, a photo stays available offline indefinitely.
async function handlePhoto(request) {
  const cache = await caches.open(PHOTO_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    return cached || Response.error();
  }
}

// Stale-while-revalidate for the app shell and any other same-origin
// GET request: respond from cache instantly if present, and refresh
// the cache in the background so the next load has the latest copy.
async function handleShell(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(request);
  const networkFetch = fetch(request)
    .then(response => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  return cached || (await networkFetch) || Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // let cross-origin requests pass through untouched

  if (isPhotoRequest(url)) {
    event.respondWith(handlePhoto(request));
    return;
  }

  event.respondWith(handleShell(request));
});
