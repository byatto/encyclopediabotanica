# New Plant Prompt

Copy everything below this line and paste it into any AI (Claude, Gemini, ChatGPT, etc.).
Replace **[PLANT NAME OR DESCRIPTION]** at the bottom with the name of your plant,
or attach/describe a photo of it.

---

I'm adding a plant to a personal houseplant care catalogue. I need you to generate one JavaScript object literal for my `plants.js` file. Follow every instruction below exactly.

---

## Record schema

Use this exact structure. Every field is a string unless stated otherwise.

```
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
```

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
  `"Spider mites — check undersides"` or `"Yellow leaves = overwatering"`.
  No full stops at the end of bullet strings.
- **No HTML** in any field. Plain text only.
- **Quotes inside strings:** Use escaped double quotes `\"like this\"` or
  rephrase to avoid them.

---

## Glance vocabulary — use these values for consistency

**light:**
- `"Low–bright indirect"`
- `"Medium, indirect"`
- `"Bright indirect"`
- `"Medium–bright indirect"`

**water:**
- `"Sparingly"`
- `"Keep moist"`
- `"When top dries"`
- `"Weekly soak"` (orchids)

**humidity:**
- `"Any"`
- `"Any–moderate"`
- `"Moderate"`
- `"Moderate–high"`
- `"High"`

**difficulty:**
- `"Very easy"`
- `"Easy"`
- `"Easy–moderate"`
- `"Moderate"`
- `"Moderate–fussy"`
- `"Fussy"`

---

## Filled example — match this style and length

```
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
  origins: "From rainforests of southern Mexico and Central America, where it climbs tree trunks toward light. \"deliciosa\" refers to its edible ripe fruit, tasting like a fruit-salad blend — though unripe fruit and all other parts are irritant. The holes likely help it withstand downpours and dappled light.",
  log: {
    acquired:    "",
    source:      "",
    location:    "",
    repotted:    "",
    potSoil:     "",
    propagation: "Stem cutting w/ node"
  }
},
```

---

## Output format

Return **only** the JavaScript object literal — no markdown code fences, no
explanation, no commentary before or after. The output should be ready to paste
directly before the closing `];` in my `plants.js` file.

Remember to include a trailing comma after the closing `}`, because it will be
followed by `];`.

---

Please generate a record for: **[PLANT NAME OR DESCRIPTION]**
