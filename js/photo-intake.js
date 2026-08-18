// =============================================================
// photo-intake.js — shared "pick a photo, shrink it down" pipeline
// =============================================================
// Used in two places: the "Set photo" control on an existing plant's
// detail page, and step 1 of the "Add plant" flow. Both just need
// "get me a small JPEG blob from whatever photo the person picks",
// so that logic lives here once instead of twice.
//
// This file does NOT talk to IndexedDB (see js/db.js for that) — it
// only ever hands back a resized Blob sitting in memory. What the
// caller does with it (save it now, or hold onto it until a new
// plant is confirmed a few steps later) is up to the caller.
// =============================================================

(function (global) {
  "use strict";

  const MAX_EDGE = 1600;      // longest side, in pixels, after resizing
  const JPEG_QUALITY = 0.82;  // 0–1; 0.82 is a good size/quality balance for photos

  // ── Step 1: open the camera/gallery picker ──────────────────
  // A plain <input type="file"> is the only way to get a photo from
  // the user without any special permissions dialog beyond the
  // picker itself. `capture="environment"` hints "use the back
  // camera" on phones that support it; browsers that don't understand
  // it just ignore it and show a normal file/camera chooser.
  //
  // HONEST LIMITATION: browsers don't give web pages a reliable
  // "the user cancelled the picker" event — there's no standard
  // `oncancel` for file inputs in every browser. The trick below
  // (wait for the window to regain focus, and if no file arrived
  // shortly after, assume it was cancelled) works well in practice
  // but isn't bulletproof. Worst case, a cancelled picker takes an
  // extra moment to resolve as "no photo chosen" instead of being
  // instant — it never gets stuck.
  function pickPhotoFile() {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.capture = "environment";
      input.style.display = "none";
      document.body.appendChild(input);

      let settled = false;
      function finish(file) {
        if (settled) return;
        settled = true;
        input.remove();
        window.removeEventListener("focus", onFocusReturn);
        resolve(file || null);
      }

      input.addEventListener("change", () => {
        finish(input.files && input.files[0] ? input.files[0] : null);
      });

      // If the window regains focus (the picker closed) and no file
      // showed up soon after, treat it as a cancel.
      function onFocusReturn() {
        setTimeout(() => finish(null), 600);
      }
      window.addEventListener("focus", onFocusReturn);

      input.click();
    });
  }

  // ── Step 2: shrink it down ───────────────────────────────────
  // Full-resolution phone photos are often 10+ megapixels — far more
  // than useful for a screen or an A4-page photo box. Resizing
  // client-side (right here, in the browser, before anything is
  // stored) keeps the on-device database small.
  //
  // `createImageBitmap` is used because modern browsers automatically
  // rotate the image to match its EXIF orientation tag when decoding
  // this way — the common "photo comes out sideways" bug is avoided
  // for free. Very old browsers that lack `createImageBitmap` fall
  // back to a plain `<img>` element instead, which does NOT correct
  // orientation — a known, accepted limitation for that fallback path
  // only (current Chrome/Safari/Firefox on Android all support
  // createImageBitmap, so this fallback should rarely, if ever, run).
  async function resizeToJpegBlob(file, maxEdge = MAX_EDGE, quality = JPEG_QUALITY) {
    const source = await loadImageSource(file);
    const { width, height, draw } = source;

    const scale = Math.min(1, maxEdge / Math.max(width, height));
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    draw(ctx, targetWidth, targetHeight);

    if (source.close) source.close(); // release the decoded bitmap promptly

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error("Could not create the resized photo."))),
        "image/jpeg",
        quality
      );
    });
  }

  async function loadImageSource(file) {
    if (global.createImageBitmap) {
      const bitmap = await global.createImageBitmap(file);
      return {
        width: bitmap.width,
        height: bitmap.height,
        draw: (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h),
        close: () => bitmap.close()
      };
    }

    // Fallback for browsers without createImageBitmap (see comment above).
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("Could not read that image file."));
        el.src = url;
      });
      return {
        width: img.naturalWidth,
        height: img.naturalHeight,
        draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
        close: null
      };
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // ── Convenience: do both steps in one call ──────────────────
  // Returns a resized JPEG Blob, or null if the person cancelled.
  async function pickAndResizePhoto() {
    const file = await pickPhotoFile();
    if (!file) return null;
    return resizeToJpegBlob(file);
  }

  global.PhotoIntake = { pickPhotoFile, resizeToJpegBlob, pickAndResizePhoto };
})(window);
