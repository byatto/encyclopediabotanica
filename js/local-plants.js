// =============================================================
// local-plants.js — the in-app "add a plant" workflow
// =============================================================
// This file has three jobs:
//
//   1. Hold a copy of the new-plant-prompt.md instructions, so the
//      app can show/copy them without needing a network request.
//   2. Turn whatever an AI assistant replies with (pasted back in)
//      into a real plant record, safely — checking it thoroughly
//      before it's trusted, and never running the pasted text as
//      code.
//   3. Turn a set of locally-added records back into text formatted
//      like plants.js, so they can be exported and folded into that
//      file for good.
//
// KEEPING THE PROMPT IN SYNC
// ---------------------------
// PROMPT_TEMPLATE below is a plain copy of new-plant-prompt.md's
// content. The app can't fetch and read the .md file at runtime
// (that would be an extra moving part for no real benefit — this
// text barely ever changes), so it's pasted in directly instead.
// If you ever edit new-plant-prompt.md, copy your changes into
// PROMPT_TEMPLATE too — nothing keeps them in sync automatically.
// (new-plant-prompt.md has the same note pointing back here.)
// =============================================================

(function (global) {
  "use strict";

  // ── 1. The prompt template ──────────────────────────────────
  // Everything from new-plant-prompt.md except its very last line
  // (the "Please generate a record for: …" line), which gets the
  // plant's name/description appended onto the end instead — see
  // assemblePrompt() below. This avoids replacing the mention of
  // "[PLANT NAME OR DESCRIPTION]" earlier in the instructions by
  // mistake.
  const PROMPT_TEMPLATE = `# New Plant Prompt

Copy everything below this line and paste it into any AI (Claude, Gemini, ChatGPT, etc.).
Replace **[PLANT NAME OR DESCRIPTION]** at the bottom with the name of your plant,
or attach/describe a photo of it.

---

I'm adding a plant to a personal houseplant care catalogue. I need you to generate one JavaScript object literal for my \`plants.js\` file. Follow every instruction below exactly.

---

## Record schema

Use this exact structure. Every field is a string unless stated otherwise.

\`\`\`
{
  id:        "",          // short, unique, url-safe slug of the latin
                          // name: lowercase, spaces/punctuation → "-".
                          // e.g. "Monstera deliciosa" → "monstera-deliciosa"
  family:    "",          // botanical family name, e.g. "Araceae"
  latin:     "",          // full Latin name, e.g. "Monstera deliciosa"
  common:    "",          // common name, e.g. "Swiss Cheese Plant"
  qualifier: "",          // optional suffix: synonyms, "×2" for multiples, etc.
                          // Use "" to omit.
  photo:     "",          // always "" — I will add the photo path myself
  glance: {
    light:      "",
    water:      "",
    humidity:   "",
    temp:       "",       // always in °C, e.g. "18–27°C"
    toxicity:   "",
    difficulty: ""
  },
  about:    "",           // one short paragraph
  cycle:    "",           // "Growing Cycle" — one short paragraph
  watering: "",           // one short paragraph
  feeding:  "",           // one short paragraph
  pests:    ["", "", ""], // array of 3–5 short strings, each a bullet point
  origins:  "",           // "Origins & Notes" — one short paragraph
  log: {
    acquired:    "",      // always ""
    source:      "",      // always ""
    location:    "",      // always ""
    repotted:    "",      // always ""
    potSoil:     "",      // always ""
    propagation: ""       // pre-fill with the typical method, e.g. "Division"
  }
}
\`\`\`

---

## Style rules — follow these precisely

- **id:** lowercase slug derived from the Latin name only — letters, numbers and single hyphens, no spaces or punctuation. Must be different from every id already in plants.js.
- **Language:** UK English throughout (e.g. "centre" not "center", "colour" not "color").
- **Tone:** Concise and practical. Written for a home grower, not a botanist.
- **Sentence case:** Section text uses sentence case, not title case.
- **Units:** Metric only. Temperatures in °C. Lengths in cm/mm.
- **Length:** One short paragraph per prose section (about, cycle, watering, feeding, origins).
  Aim for 2–4 sentences each. The pests array: 3–5 short strings.
- **Pests format:** Each string is a short diagnostic note, e.g.
  \`"Spider mites — check undersides"\` or \`"Yellow leaves = overwatering"\`.
  No full stops at the end of bullet strings.
- **No HTML** in any field. Plain text only.
- **Quotes inside strings:** Use escaped double quotes \`\\"like this\\"\` or
  rephrase to avoid them.

---

## Glance vocabulary — use these values for consistency

**light:**
- \`"Low–bright indirect"\`
- \`"Medium, indirect"\`
- \`"Bright indirect"\`
- \`"Medium–bright indirect"\`

**water:**
- \`"Sparingly"\`
- \`"Keep moist"\`
- \`"When top dries"\`
- \`"Weekly soak"\` (orchids)

**humidity:**
- \`"Any"\`
- \`"Any–moderate"\`
- \`"Moderate"\`
- \`"Moderate–high"\`
- \`"High"\`

**difficulty:**
- \`"Very easy"\`
- \`"Easy"\`
- \`"Easy–moderate"\`
- \`"Moderate"\`
- \`"Moderate–fussy"\`
- \`"Fussy"\`

---

## Filled example — match this style and length

\`\`\`
{
  id:        "monstera-deliciosa",
  family:    "Araceae",
  latin:     "Monstera deliciosa",
  common:    "Swiss Cheese Plant",
  qualifier: "",
  photo:     "",
  glance: {
    light:      "Bright indirect",
    water:      "When top dries",
    humidity:   "Moderate–high",
    temp:       "18–27°C",
    toxicity:   "Toxic to pets",
    difficulty: "Easy"
  },
  about:    "Iconic glossy leaves that develop holes and splits (fenestrations) as the plant matures. A climbing aroid that benefits from a moss pole for support and larger leaves.",
  cycle:    "Fast in spring–summer with the right light. Juvenile leaves are solid; fenestration increases with maturity and light. Sends out aerial roots — guide them to the pole or pot.",
  watering: "Water when the top 3–5cm of soil is dry, then drain fully — roughly weekly in summer, less in winter. Dislikes soggy roots.",
  feeding:  "Balanced feed monthly in spring and summer.",
  pests: [
    "Spider mites, mealybugs, scale",
    "No holes / small leaves = too little light",
    "Yellow leaves = overwatering",
    "Brown crispy edges = low humidity / underwatered",
    "Weeping droplets = normal, often overwatered"
  ],
  origins: "From rainforests of southern Mexico and Central America, where it climbs tree trunks toward light. \\"deliciosa\\" refers to its edible ripe fruit, tasting like a fruit-salad blend — though unripe fruit and all other parts are irritant. The holes likely help it withstand downpours and dappled light.",
  log: {
    acquired:    "",
    source:      "",
    location:    "",
    repotted:    "",
    potSoil:     "",
    propagation: "Stem cutting w/ node"
  }
},
\`\`\`

---

## Output format

Return **only** the JavaScript object literal — no markdown code fences, no
explanation, no commentary before or after. The output should be ready to paste
directly before the closing \`];\` in my \`plants.js\` file.

Remember to include a trailing comma after the closing \`}\`, because it will be
followed by \`];\`.

---`;

  // Build the full prompt for a specific plant name/description.
  function assemblePrompt(nameOrDescription) {
    const name = (nameOrDescription || "").trim() || "[PLANT NAME OR DESCRIPTION]";
    return PROMPT_TEMPLATE + "\n\nPlease generate a record for: **" + name + "**";
  }

  // ── 2. Turning a pasted reply into a plant record ───────────
  //
  // The pasted text is meant to be one JavaScript object literal —
  // the same shape you'd hand-write into plants.js. We never run it
  // as code (no eval, no `new Function`): instead we do some light,
  // predictable text cleanup and then parse it as JSON, which is a
  // safe, standard, well-tested parser with no way to execute code.
  //
  // HONEST LIMITS of this approach: JSON is stricter than a JS
  // object literal. It requires double-quoted keys and double-quoted
  // strings, and doesn't allow trailing commas or single quotes. The
  // steps below fix up the two differences the AI is actually likely
  // to produce (unquoted keys, a trailing comma) because the prompt
  // asks for exactly that shape. If the AI's reply uses single quotes
  // for strings, or anything more exotic, parsing will fail — you'll
  // get a plain-language error rather than a wrong or silently
  // mangled record, which is the trade-off this app deliberately
  // makes: never guess, never run untrusted text as code.

  function stripCodeFences(text) {
    let t = text.trim();
    // Remove a leading ```optional-language-tag line, if present.
    t = t.replace(/^```[a-zA-Z]*\s*\n/, "");
    // Remove a trailing ``` line, if present.
    t = t.replace(/\n?```\s*$/, "");
    return t.trim();
  }

  function stripTrailingComma(text) {
    let t = text.trim();
    if (t.endsWith(",")) t = t.slice(0, -1);
    return t.trim();
  }

  function quoteBareKeys(text) {
    // Turns  { family:  →  { "family":  and  , latin:  →  , "latin":
    // Deliberately simple: it only looks for "word followed by a
    // colon, right after a { or ,". It doesn't try to understand
    // string contents, so in principle a value containing the exact
    // text `, someWord:` could confuse it — vanishingly unlikely in
    // plain-English plant descriptions, and the schema validation
    // step afterwards would catch the resulting mess anyway.
    return text.replace(/([{,]\s*)([A-Za-z_$][A-Za-z0-9_$]*)(\s*:)/g, '$1"$2"$3');
  }

  function removeInteriorTrailingCommas(text) {
    // Turns  "x",\n}  into  "x"\n}  (and the same before `]`).
    // Handles every trailing comma EXCEPT the one at the very end of
    // the whole paste, which stripTrailingComma() already removed.
    return text.replace(/,(\s*[}\]])/g, "$1");
  }

  /**
   * Parse a pasted AI reply into a plant record object.
   * Returns { ok: true, record } or { ok: false, error } — "error"
   * is a short, plain-language string, never a raw stack trace.
   */
  function parseRecordPaste(pastedText) {
    if (!pastedText || !pastedText.trim()) {
      return { ok: false, error: "Paste the AI's reply into the box first." };
    }

    let text = stripCodeFences(pastedText);
    text = stripTrailingComma(text);
    text = removeInteriorTrailingCommas(text);
    text = quoteBareKeys(text);

    let record;
    try {
      record = JSON.parse(text);
    } catch (err) {
      return {
        ok: false,
        error: "Couldn't read that as a plant record. Make sure you pasted the AI's entire reply, unedited, with nothing added before or after it."
      };
    }

    if (!record || typeof record !== "object" || Array.isArray(record)) {
      return { ok: false, error: "That doesn't look like a single plant record (expected one { …} object)." };
    }

    return { ok: true, record };
  }

  // ── 3. Validating the record against the schema ─────────────
  // Every field new-plant-prompt.md asks for, checked for presence
  // and type. `existingIds` is every id already in use (repo records
  // + other local records) so we can catch duplicates before they
  // cause confusing mix-ups later.

  const REQUIRED_TEXT_FIELDS = ["id", "family", "latin", "common", "about", "cycle", "watering", "feeding", "origins"];
  const OPTIONAL_TEXT_FIELDS = ["qualifier", "photo"];
  const GLANCE_FIELDS = ["light", "water", "humidity", "temp", "toxicity", "difficulty"];
  const LOG_FIELDS = ["acquired", "source", "location", "repotted", "potSoil", "propagation"];
  const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

  function validateRecord(record, existingIds) {
    const errors = [];
    const idsLower = new Set((existingIds || []).map(id => String(id).toLowerCase()));

    REQUIRED_TEXT_FIELDS.forEach(field => {
      const value = record[field];
      if (typeof value !== "string" || value.trim() === "") {
        errors.push('"' + field + '" is missing or empty.');
      }
    });

    OPTIONAL_TEXT_FIELDS.forEach(field => {
      if (field in record && typeof record[field] !== "string") {
        errors.push('"' + field + '" should be text (use "" if there isn\'t one).');
      }
    });

    // id: format + uniqueness (only checked if it's at least a string,
    // so we don't pile a confusing second error on top of the first).
    if (typeof record.id === "string" && record.id.trim() !== "") {
      if (!ID_PATTERN.test(record.id)) {
        errors.push('"id" should be lowercase letters, numbers and single hyphens only (e.g. "philodendron-birkin").');
      } else if (idsLower.has(record.id.toLowerCase())) {
        errors.push('"id" "' + record.id + '" is already used by another plant — try "' + record.id + '-2" instead.');
      }
    }

    // glance
    if (!record.glance || typeof record.glance !== "object" || Array.isArray(record.glance)) {
      errors.push('"glance" is missing (it should be an object with light, water, humidity, temp, toxicity, difficulty).');
    } else {
      GLANCE_FIELDS.forEach(field => {
        const value = record.glance[field];
        if (typeof value !== "string" || value.trim() === "") {
          errors.push('"glance.' + field + '" is missing or empty.');
        }
      });
    }

    // pests
    if (!Array.isArray(record.pests)) {
      errors.push('"pests" should be a list of 3–5 short strings.');
    } else if (record.pests.length < 3 || record.pests.length > 5) {
      errors.push('"pests" should have between 3 and 5 items (found ' + record.pests.length + ').');
    } else if (record.pests.some(p => typeof p !== "string" || p.trim() === "")) {
      errors.push('"pests" has an empty or non-text item — every entry should be a short string.');
    }

    // log
    if (!record.log || typeof record.log !== "object" || Array.isArray(record.log)) {
      errors.push('"log" is missing (it should be an object with acquired, source, location, repotted, potSoil, propagation).');
    } else {
      LOG_FIELDS.forEach(field => {
        if (typeof record.log[field] !== "string") {
          errors.push('"log.' + field + '" should be text (use "" if unknown).');
        }
      });
    }

    return errors;
  }

  // ── 4. Formatting a local record back into plants.js style ──
  // Used by the "Export plants.js" button. This intentionally uses
  // simple, consistent single-space-after-colon formatting rather
  // than trying to reproduce the hand-aligned columns you'll see in
  // the original file's records — matching that by eye, field by
  // field, isn't something worth automating. Indentation, field
  // order, and the numbered comment separator all match; the exact
  // column alignment is a cosmetic difference only, and easy to
  // tidy up by hand afterwards if you want to.
  //
  // Every string value goes through JSON.stringify, which is what
  // correctly turns things like a stray `"` or `\` inside your text
  // into safe, valid JavaScript — the same reason it's used for
  // parsing above.

  function q(value) {
    return JSON.stringify(value == null ? "" : String(value));
  }

  function serializeLocalRecord(record, number) {
    const lines = [];
    const title = (record.common || record.latin || record.id || "Untitled").trim();
    lines.push("  // ── " + number + ". " + title + " " + "─".repeat(20));
    lines.push("  {");
    lines.push("    id: " + q(record.id) + ",");
    lines.push("    family: " + q(record.family) + ",");
    lines.push("    latin: " + q(record.latin) + ",");
    lines.push("    common: " + q(record.common) + ",");
    lines.push("    qualifier: " + q(record.qualifier || "") + ",");
    lines.push("    photo: " + q(record.photo || "") + ",");
    lines.push("    glance: {");
    GLANCE_FIELDS.forEach((field, i) => {
      lines.push("      " + field + ": " + q(record.glance[field]) + (i < GLANCE_FIELDS.length - 1 ? "," : ""));
    });
    lines.push("    },");
    lines.push("    about: " + q(record.about) + ",");
    lines.push("    cycle: " + q(record.cycle) + ",");
    lines.push("    watering: " + q(record.watering) + ",");
    lines.push("    feeding: " + q(record.feeding) + ",");
    lines.push("    pests: [");
    record.pests.forEach((pest, i) => {
      lines.push("      " + q(pest) + (i < record.pests.length - 1 ? "," : ""));
    });
    lines.push("    ],");
    lines.push("    origins: " + q(record.origins) + ",");
    lines.push("    log: {");
    LOG_FIELDS.forEach((field, i) => {
      lines.push("      " + field + ": " + q(record.log[field] || "") + (i < LOG_FIELDS.length - 1 ? "," : ""));
    });
    lines.push("    }");
    lines.push("  },");
    return lines.join("\n");
  }

  // ── 5. Merging local records into the real plants.js text ───
  // Fetches the actual, current js/plants.js (so the repo records
  // are copied through byte-for-byte — "verbatim", not regenerated)
  // and inserts the local records just before the file's own
  // end-of-array marker line.

  const END_MARKER = "]; // ← end of plants array. Paste new records before this line.";
  const NUMBER_PATTERN = /\/\/ ── (\d+)\./g;

  function mergePlantsJsSource(originalText, localRecords) {
    const markerIndex = originalText.indexOf(END_MARKER);
    if (markerIndex === -1) {
      throw new Error("Couldn't find the end-of-array marker in plants.js — has the file's structure changed? Export isn't safe to continue automatically.");
    }

    let prefix = originalText.slice(0, markerIndex).replace(/\s+$/, ""); // trim trailing blank lines
    const suffix = originalText.slice(markerIndex); // the marker line onward, untouched

    if (!prefix.endsWith(",")) prefix += ",";

    // Continue the "// ── N. Name ──" numbering from whatever's
    // already in the file, rather than assuming it starts at 1.
    let highestNumber = 0;
    let match;
    NUMBER_PATTERN.lastIndex = 0;
    while ((match = NUMBER_PATTERN.exec(originalText))) {
      highestNumber = Math.max(highestNumber, parseInt(match[1], 10));
    }

    const blocks = localRecords.map((record, i) => serializeLocalRecord(record, highestNumber + i + 1));

    return prefix + "\n\n" + blocks.join("\n\n") + "\n\n" + suffix;
  }

  global.LocalPlants = {
    assemblePrompt,
    parseRecordPaste,
    validateRecord,
    serializeLocalRecord,
    mergePlantsJsSource
  };
})(window);
