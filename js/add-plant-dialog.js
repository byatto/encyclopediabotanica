// =============================================================
// add-plant-dialog.js — the "Add plant" step-by-step dialog
// =============================================================
// Wires up the <dialog id="add-plant-dialog"> in index.html into a
// four-step flow:
//
//   1. photo (optional)  — uses js/photo-intake.js
//   2. name               — one text field
//   3. prompt             — shows + copies the prompt from
//                           js/local-plants.js
//   4. paste back         — parses + validates the AI's reply
//                           (js/local-plants.js again), then saves
//                           the new plant + photo via js/db.js
//
// Every step's content is built with createElement/textContent, the
// same rule the rest of this app follows for anything that might
// contain plant text — including, here, text an AI generated, which
// is exactly the kind of content this rule exists to protect against.
// =============================================================

(function () {
  "use strict";

  const dialogEl = document.getElementById("add-plant-dialog");
  if (!dialogEl) return; // markup missing — nothing to wire up

  const stepEl = document.getElementById("add-plant-step");
  const btnClose = document.getElementById("add-plant-close");

  // ── State for the current run through the dialog ────────────
  // Reset every time the dialog is opened.
  let state = {
    step: 1,
    photoBlob: null,
    photoPreviewUrl: null, // tracked so we can revoke it later
    name: "",
    pastedText: ""
  };

  function resetState() {
    if (state.photoPreviewUrl) URL.revokeObjectURL(state.photoPreviewUrl);
    state = { step: 1, photoBlob: null, photoPreviewUrl: null, name: "", pastedText: "" };
  }

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

  function open() {
    if (!window.PhotoIntake || !window.LocalPlants || !window.PlantDB) {
      alert("The add-plant flow isn't available in this browser (a required feature is missing).");
      return;
    }
    resetState();
    renderStep();
    if (typeof dialogEl.showModal === "function") {
      dialogEl.showModal();
    } else {
      // Very old browsers without <dialog> support — fall back to
      // just showing it as a normal, non-modal block.
      dialogEl.setAttribute("open", "");
    }
  }

  function close() {
    if (typeof dialogEl.close === "function" && dialogEl.open) dialogEl.close();
    else dialogEl.removeAttribute("open");
    resetState();
  }

  btnClose.addEventListener("click", close);
  // Let a background click / Esc (native <dialog> behaviour) clean up state too.
  dialogEl.addEventListener("close", () => {
    if (state.photoPreviewUrl) URL.revokeObjectURL(state.photoPreviewUrl);
  });

  function renderStep() {
    stepEl.innerHTML = "";
    if (state.step === 1) renderPhotoStep();
    else if (state.step === 2) renderNameStep();
    else if (state.step === 3) renderPromptStep();
    else renderPasteStep();
  }

  function stepHeading(number, title) {
    const wrap = el("div", null, "add-plant-step-heading");
    wrap.appendChild(el("div", "Step " + number + " of 4", "add-plant-step-count"));
    wrap.appendChild(el("h3", title));
    return wrap;
  }

  function actionsRow(...buttons) {
    const row = el("div", null, "add-plant-actions");
    buttons.forEach(b => b && row.appendChild(b));
    return row;
  }

  function primaryButton(text, onClick) {
    const b = el("button", text, "btn", "btn-primary");
    b.type = "button";
    b.addEventListener("click", onClick);
    return b;
  }
  function secondaryButton(text, onClick) {
    const b = el("button", text, "btn");
    b.type = "button";
    b.addEventListener("click", onClick);
    return b;
  }

  // ── Step 1: photo (optional) ─────────────────────────────────

  function renderPhotoStep() {
    append(stepEl, stepHeading(1, "Add a photo (optional)"));

    const preview = el("div", null, "add-plant-photo-preview");
    if (state.photoPreviewUrl) {
      const img = document.createElement("img");
      img.src = state.photoPreviewUrl;
      img.alt = "";
      preview.appendChild(img);
    } else {
      preview.appendChild(el("span", "No photo chosen yet — this step is optional.", "add-plant-photo-empty"));
    }
    stepEl.appendChild(preview);

    const pickBtn = secondaryButton(state.photoBlob ? "Choose a different photo" : "Take or choose a photo", async () => {
      let blob;
      try {
        blob = await window.PhotoIntake.pickAndResizePhoto();
      } catch (err) {
        alert("Couldn't read that photo: " + err.message);
        return;
      }
      if (!blob) return; // cancelled
      if (state.photoPreviewUrl) URL.revokeObjectURL(state.photoPreviewUrl);
      state.photoBlob = blob;
      state.photoPreviewUrl = URL.createObjectURL(blob);
      renderStep();
    });

    const controlsRow = el("div", null, "add-plant-photo-controls");
    controlsRow.appendChild(pickBtn);
    if (state.photoBlob) {
      controlsRow.appendChild(secondaryButton("Remove photo", () => {
        if (state.photoPreviewUrl) URL.revokeObjectURL(state.photoPreviewUrl);
        state.photoBlob = null;
        state.photoPreviewUrl = null;
        renderStep();
      }));
    }
    stepEl.appendChild(controlsRow);

    stepEl.appendChild(actionsRow(
      primaryButton("Next", () => { state.step = 2; renderStep(); })
    ));
  }

  // ── Step 2: name ──────────────────────────────────────────────

  function renderNameStep() {
    append(stepEl, stepHeading(2, "Name the plant"));
    stepEl.appendChild(el("p", "Enter the plant's name, or a short description if you don't know it — e.g. “Monstera deliciosa” or “the tall spiky one from the garden centre”.", "add-plant-hint"));

    const input = document.createElement("input");
    input.type = "text";
    input.className = "add-plant-name-input";
    input.value = state.name;
    input.placeholder = "Plant name or description";
    stepEl.appendChild(input);

    const errorEl = el("p", "", "add-plant-inline-error");
    errorEl.hidden = true;
    stepEl.appendChild(errorEl);

    stepEl.appendChild(actionsRow(
      secondaryButton("Back", () => { state.step = 1; renderStep(); }),
      primaryButton("Next", () => {
        const value = input.value.trim();
        if (!value) {
          errorEl.textContent = "Enter a name or description to continue.";
          errorEl.hidden = false;
          input.focus();
          return;
        }
        state.name = value;
        state.step = 3;
        renderStep();
      })
    ));

    input.focus();
  }

  // ── Step 3: prompt ────────────────────────────────────────────

  function renderPromptStep() {
    append(stepEl, stepHeading(3, "Copy this prompt"));
    stepEl.appendChild(el("p", "Paste this into Claude or any AI, then copy its entire reply (nothing added before or after it).", "add-plant-hint"));

    const promptText = window.LocalPlants.assemblePrompt(state.name);

    const textarea = document.createElement("textarea");
    textarea.className = "add-plant-prompt-box";
    textarea.readOnly = true;
    textarea.value = promptText;
    stepEl.appendChild(textarea);

    const copyStatus = el("span", "", "add-plant-copy-status");

    const copyBtn = secondaryButton("Copy prompt", async () => {
      let copied = false;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(promptText);
          copied = true;
        } catch (err) {
          copied = false; // fall through to the select-all fallback below
        }
      }
      if (copied) {
        copyStatus.textContent = "Copied!";
      } else {
        // Fallback: select the text so the person can copy it manually
        // (Ctrl/Cmd+C) — the clipboard API isn't available or was denied.
        textarea.focus();
        textarea.select();
        copyStatus.textContent = "Selected — press Ctrl/Cmd+C to copy.";
      }
      setTimeout(() => { copyStatus.textContent = ""; }, 3000);
    });

    stepEl.appendChild(append(el("div", null, "add-plant-copy-row"), copyBtn, copyStatus));

    stepEl.appendChild(actionsRow(
      secondaryButton("Back", () => { state.step = 2; renderStep(); }),
      primaryButton("Next", () => { state.step = 4; renderStep(); })
    ));
  }

  // ── Step 4: paste back, validate, save ───────────────────────

  function renderPasteStep() {
    append(stepEl, stepHeading(4, "Paste the AI's reply"));
    stepEl.appendChild(el("p", "Paste the whole reply below, exactly as the AI gave it to you.", "add-plant-hint"));

    const textarea = document.createElement("textarea");
    textarea.className = "add-plant-paste-box";
    textarea.value = state.pastedText;
    textarea.placeholder = "Paste the AI's reply here…";
    textarea.addEventListener("input", () => { state.pastedText = textarea.value; });
    stepEl.appendChild(textarea);

    const errorBox = el("div", null, "notice", "warn", "add-plant-errors");
    errorBox.hidden = true;
    stepEl.appendChild(errorBox);

    function showErrors(messages) {
      errorBox.innerHTML = "";
      errorBox.appendChild(el("strong", "This can't be added yet:"));
      const ul = document.createElement("ul");
      messages.forEach(m => ul.appendChild(el("li", m)));
      errorBox.appendChild(ul);
      errorBox.hidden = false;
    }

    const addBtn = primaryButton("Add to catalogue", async () => {
      const parsed = window.LocalPlants.parseRecordPaste(textarea.value);
      if (!parsed.ok) {
        showErrors([parsed.error]);
        return;
      }

      addBtn.disabled = true;
      try {
        const repoIds = (typeof plants !== "undefined" ? plants : []).map(p => p.id);
        const existingLocal = await window.PlantDB.getAllLocalPlants();
        const existingIds = repoIds.concat(existingLocal.map(p => p.id));

        const errors = window.LocalPlants.validateRecord(parsed.record, existingIds);
        if (errors.length > 0) {
          showErrors(errors);
          return;
        }

        errorBox.hidden = true;
        const record = parsed.record;

        await window.PlantDB.saveLocalPlant(record);
        if (state.photoBlob) {
          await window.PlantDB.savePhoto(record.id, state.photoBlob);
          await window.PlantDB.requestPersistenceOnce();
        }

        close();
        await window.AppRefresh.refresh("#/plant/" + encodeURIComponent(record.id));
        if (window.showAppToast) window.showAppToast("Plant added");
      } catch (err) {
        showErrors(["Something went wrong saving this plant: " + err.message]);
      } finally {
        addBtn.disabled = false;
      }
    });

    stepEl.appendChild(actionsRow(
      secondaryButton("Back", () => { state.step = 3; renderStep(); }),
      addBtn
    ));
  }

  window.AddPlantDialog = { open, close };
})();
