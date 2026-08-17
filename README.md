# Encyclopedia Botanica

A personal, offline-first houseplant care catalogue. Installable as an app on
Android (or any phone/desktop), with a searchable plant list, an editable
on-device care log, and an A4/PDF export view for paper copies.

## What's here

```
encyclopediabotanica/
├── index.html               ← the app (install this as the PWA)
├── print.html                ← A4 print / PDF export view
├── manifest.webmanifest      ← PWA metadata (name, icons, colours)
├── sw.js                     ← service worker (offline caching)
├── js/
│   ├── plants.js             ← plant data — edit this to add/change plants
│   ├── store.js               ← on-device care-log storage (localStorage)
│   ├── app.js                  ← mobile app logic (search, routing, editing)
│   └── print-render.js         ← renders plants.js into A4 pages
├── css/
│   └── app.css                ← styles for the mobile app
├── fonts/                    ← self-hosted fonts (Inter, Newsreader italic)
├── icons/                    ← PWA install icons + editable source SVG
├── photos/                   ← your plant photos go here
├── legacy/                   ← archived v2 of the catalogue (superseded)
└── new-plant-prompt.md       ← paste into an AI to generate a new record
```

`js/plants.js` is the single source of truth for plant data. Both
`index.html` (the app) and `print.html` (the PDF view) read from it, so a
plant only needs to be added once.

## Install it on your Android phone

The install prompt (and offline support) needs the app served over **HTTPS**
— it won't work by opening the file directly from your phone's storage.
The easiest way is GitHub Pages, since this is already a GitHub repo:

1. On GitHub: **Settings → Pages → Deploy from a branch**, pick the branch
   this app lives on (e.g. `main`) and the root folder, then save.
2. GitHub gives you a URL like `https://<you>.github.io/encyclopediabotanica/`.
   Open it in Chrome on your phone.
3. Tap the **⋮** menu → **Install app** (or **Add to Home screen**). You can
   also use the "Install" banner the app shows itself the first time you
   visit, once it detects the browser supports it.
4. Once installed, it opens full-screen from your home screen and works
   with no signal at all — the app shell, fonts, and every plant you've
   viewed at least once are cached on-device.

## Adding a plant

1. Open `new-plant-prompt.md`, copy everything below the line, paste it
   into any AI assistant (Claude, ChatGPT, Gemini…), and either describe
   the plant or attach a photo.
2. Give the returned object an `id` — the prompt file explains this: a
   short slug made from the Latin name, e.g. `"philodendron-birkin"`. It
   must be unique across `js/plants.js`.
3. Paste the object into `js/plants.js`, just before the closing `];`.
   Add a comma after the previous record's closing `}`.
4. Save, then reload the app (or `print.html`).

## Adding photos

Drop image files into `photos/`, then set the matching plant's `photo`
field in `js/plants.js`, e.g. `photo: "photos/my-plant.jpg"`. Leave it as
`""` to show the quiet placeholder icon instead. Photos aren't precached
up front (to keep the initial install small) — each one is cached
automatically the first time you view it while online, and stays available
offline after that.

## Your care log & notes

Tapping into a plant in the app shows an editable **Care Log**: acquired
date, source, location, last repotted, pot/soil, propagation, and free-text
notes. These save automatically to this browser's local storage as you
type — they're personal to your plants, not shared data, so they're kept
separate from `js/plants.js`.

This means log data lives **on this one device/browser only**. From the
app's **⋯ menu → About & settings** you can:

- **Export data** — downloads a `.json` backup of everything you've logged.
- **Import data** — merges a previously exported backup back in (e.g. after
  reinstalling, or moving to a new phone).
- **Clear all saved data** — wipes on-device logs (the reference data in
  `js/plants.js` is never touched).

Export a backup occasionally, especially before clearing your browser data
or switching devices.

## Printing / PDF export

Open `print.html` (linked from the app's About screen) for the original
A4-per-plant layout. Chrome/Edge → Print → Save as PDF → paper size A4 →
tick "Background graphics". It reflects any on-device log edits and notes
you've made in the app. "Save frozen copy" downloads a static, script-free
HTML snapshot for archiving.

## Running it locally

Service workers (and the PWA install prompt) require a real HTTP server —
opening `index.html` directly as a `file://` URL won't register `sw.js`.
From the project folder:

```sh
python3 -m http.server 8080
# or: npx http-server -p 8080
```

Then visit `http://localhost:8080/index.html`. `localhost` is treated as
secure by browsers, so the full offline/install behaviour works there even
without HTTPS. To actually install on your phone, though, you still need a
real HTTPS deployment (see above) — a local server on your laptop isn't
reachable as `https://` from your phone.

## Updating the app shell

If you change `app.css`, `app.js`, `plants.js`, or anything else listed in
`sw.js`'s `APP_SHELL` array, bump `CACHE_VERSION` at the top of `sw.js`.
That forces a fresh cache; visitors with the app already installed get a
toast the next time it updates in the background, and the new version
takes over on their next reload.

## Regenerating the icons

`icons/icon-source.svg` is the editable leaf mark. After changing it,
re-export four PNGs into `icons/`:

- `icon-192.png`, `icon-512.png` — the source SVG on a solid `#fcfcf9`
  background, square corners (the OS applies its own shape).
- `icon-maskable-192.png`, `icon-maskable-512.png` — the same, but the
  leaf scaled down to fit inside the inner ~80% "safe zone" (Android
  crops maskable icons to a shape that can clip the outer edges).

Any SVG-to-PNG tool works (a browser, Inkscape, an online converter) — or
ask an AI coding assistant to render it via a headless browser screenshot,
which is how the current set was produced.
