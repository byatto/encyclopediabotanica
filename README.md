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
│   ├── db.js                   ← on-device photos + added plants (IndexedDB)
│   ├── photo-intake.js          ← camera/gallery photo picker + resizing
│   ├── local-plants.js           ← "add plant" prompt, parsing, plants.js export
│   ├── add-plant-dialog.js        ← the "+ Add plant" dialog (app only)
│   ├── app.js                      ← mobile app logic (search, routing, editing)
│   └── print-render.js              ← renders plants into A4 pages
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

**In the app (easiest):** tap **+ Add plant** on the list screen. It walks
you through four short steps — an optional photo, the plant's name, a
ready-made prompt to copy into any AI assistant (Claude, ChatGPT,
Gemini…), and a box to paste its reply back into. The app checks the
reply over (and tells you plainly if something's missing or wrong) before
adding it to your catalogue, on this device, straight away.

A plant added this way is marked **Local** — it's real and fully usable
(searchable, printable, editable care log, the works), but it only exists
on this device until you publish it:

1. In **⋯ menu → About & settings**, tap **Export plants.js**.
2. This downloads a copy of `js/plants.js` with your local plants folded
   in, formatted to match the rest of the file, numbered on from wherever
   the file left off.
3. Replace `js/plants.js` in the repo with the downloaded file, and commit
   it as you normally would.
4. Once that's live, the app quietly prefers the committed record over its
   local copy — nothing is deleted automatically, so this is always safe
   to try, and the local copy stays as a backup until you clean it up
   yourself (from the plant's detail page → **Delete this local plant**).

**By hand (the original way, still works):** open `new-plant-prompt.md`,
copy everything below the line, and follow the same AI round-trip — but
paste the reply straight into `js/plants.js` yourself, just before the
closing `];` (remember the comma after the previous record's `}`), instead
of using the in-app flow. Either way, give the record a unique `id` — a
short slug from the Latin name, e.g. `"philodendron-birkin"`.

## Adding photos

**On your phone (device-local):** open a plant → **Set photo** → take a
photo or choose one from your gallery. It's resized down automatically and
saved on this device only — see "Your data" below. Works from the
add-plant flow's first step too. **Remove photo** reverts to the repo
photo (if any) or the placeholder, on this device.

**In the repo (shared, every device):** drop image files into `photos/`,
then set the matching plant's `photo` field in `js/plants.js`, e.g.
`photo: "photos/my-plant.jpg"`. A device-local photo, if you've set one,
always takes precedence over this on that device; other devices show the
repo photo. Repo photos aren't precached up front (to keep the initial
install small) — each one is cached automatically the first time it's
viewed while online, and stays available offline after that.

## Watering rounds by room

Open a plant's Care Log and fill in **Location** with wherever it actually
lives — "Living room", "Kitchen windowsill", whatever you call it. As soon
as any plant has one set, a row of room chips appears on the home screen,
just under search: tap one (e.g. **Kitchen**) to see only the plants in
that room, tap it again (or **All**) to go back to everything. An **Unset**
chip covers anything without a Location yet. Chips are grouped
case/spacing-insensitively, so "Kitchen" and "kitchen " count as the same
room — but the exact room list is entirely up to you, there's nothing to
configure. It combines with the search box too, so "kitchen" + "peace
lily" narrows to just that.

Like the rest of the Care Log, Location is saved on this device only —
back it up the same way (see "Your data" below).

## Your data

Three things live only on this device — never uploaded, never synced,
never sent anywhere (see "Privacy" below):

- **Care log & notes** — acquired date, source, location, last repotted,
  pot/soil, propagation, free-text notes. Saved as you type (browser
  local storage).
- **Photos** you've set on a plant (browser IndexedDB). The first time you
  save one, the app also asks the browser to protect this data from
  automatic cleanup under storage pressure — most browsers grant this
  quietly, with no prompt shown to you either way.
- **Locally-added plants** from the **+ Add plant** flow, until you
  publish them (see "Adding a plant" above).

All three are tied to this one device/browser — reinstalling the browser,
clearing site data, or switching phones loses them unless you've backed
up. From **⋯ menu → About & settings**:

- **Export data** — downloads a single `.json` backup of all three. With
  photos included, this can run to several MB — that's expected.
- **Import data** — merges a previously exported backup back in (e.g.
  after reinstalling, or moving to a new phone). Also accepts older
  log-only backup files from before photos/local plants existed.
- **Clear all saved data** — wipes on-device logs (the reference data in
  `js/plants.js` is never touched; photos and local plants aren't
  affected by this button — delete a local plant from its own detail page,
  or a photo via **Remove photo**).

Export a backup occasionally, especially before clearing your browser data
or switching devices.

## Privacy

Nothing you do on-device — photos, notes, locally-added plants — ever
leaves it. There's no analytics, no external API calls, no CDNs, and
nothing here asks for or stores an API key or token of any kind. The
"Add plant" AI step is deliberately copy/paste (see above) rather than a
direct API call, for the same reason. The only network requests this app
ever makes are to its own files (and, if you're using the in-app export,
to fetch `js/plants.js` from this same site) — you can check this
yourself in your browser's network tab.

## Printing / PDF export

Open `print.html` (linked from the app's About screen) for the original
A4-per-plant layout. Chrome/Edge → Print → Save as PDF → paper size A4 →
tick "Background graphics". It reflects any on-device log edits, photos,
notes, and locally-added plants from this device (each marked "Local" —
that marker is screen-only and never prints). "Save frozen copy" downloads
a static, script-free HTML snapshot for archiving, with device-local
photos embedded directly in the file so it stays viewable anywhere.

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
