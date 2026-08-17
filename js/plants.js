// =============================================================
// plants.js  —  Houseplant Catalogue data
// =============================================================
//
// HOW TO ADD A PLANT
// ------------------
// 1. Ask an AI to generate a record using new-plant-prompt.md.
// 2. Paste the object before the final ]; on the last line.
//    (Add a comma after the previous record's closing brace.)
// 3. Save this file and refresh index.html (or print.html) in your browser.
//
// EDITING A RECORD
// ----------------
// Find the plant by its "latin" field, change any value, save,
// refresh. Text values are plain strings — no HTML needed.
// For the degree symbol use the actual ° character (or °).
//
// FIELD NOTES
// -----------
// id         : short, unique, url-safe slug (lowercase, hyphens).
//              Used for search-engine routing (#plant/<id>) and as
//              the key for on-device log/notes storage — do not
//              rename an existing plant's id, or its saved log data
//              in the app will no longer match it.
// photo      : relative path, e.g. "photos/my-plant.jpg"
//              Leave "" for the quiet placeholder box.
// qualifier  : grey suffix after the common name — synonyms,
//              quantity notes like "×3", etc. Leave "" to omit.
// pests      : array of short strings, each becomes a bullet.
// log.*      : starting/default values. The app view lets you edit
//              these on-device (saved in the browser's local
//              storage) without touching this file.
// =============================================================

const plants = [

  // ── 1. Snake Plant ──────────────────────────────────────────
  {
    id:        "dracaena-trifasciata",
    family:    "Asparagaceae",
    latin:     "Dracaena trifasciata",
    common:    "Snake Plant",
    qualifier: "syn. Sansevieria trifasciata · incl. 'Laurentii'",
    photo:     "photos/PXL_20260605_161338586.jpg",
    glance: {
      light:      "Low–bright indirect",
      water:      "Sparingly",
      humidity:   "Any",
      temp:       "15–27°C",
      toxicity:   "Mild to pets",
      difficulty: "Very easy"
    },
    about:    "Upright, stiff, sword-like leaves. The plain green form and yellow-edged 'Laurentii' share identical care — the variegation is purely cosmetic. Near-indestructible and very tolerant of neglect.",
    cycle:    "Slow grower. Active spring–summer, near-dormant in winter. Spreads by underground rhizomes and produces offsets (\"pups\") you can divide.",
    watering: "Let soil dry out fully between waterings — roughly every 2–3 weeks in summer, monthly or less in winter. Overwatering is the main killer. Use a gritty, free-draining mix.",
    feeding:  "Weak balanced feed once a month in spring and summer. None in autumn or winter.",
    pests: [
      "Mealybugs, spider mites (rare)",
      "Soft, mushy base = root rot from overwatering",
      "Wrinkled, curling leaves = underwatered",
      "Brown crispy tips = erratic watering"
    ],
    origins: "From rocky, arid regions of tropical West Africa — adapted to drought and poor soils, which is why it copes so well indoors. Uses CAM photosynthesis, releasing oxygen at night, and featured in NASA's clean-air study. Leaf fibres once made bowstrings, hence \"bowstring hemp\".",
    log: {
      acquired:    "",
      source:      "",
      location:    "",
      repotted:    "",
      potSoil:     "",
      propagation: "Division / pups"
    }
  },

  // ── 2. Peace Lily ────────────────────────────────────────────
  {
    id:        "spathiphyllum-wallisii",
    family:    "Araceae",
    latin:     "Spathiphyllum wallisii",
    common:    "Peace Lily",
    qualifier: "×3",
    photo:     "photos/PXL_20260605_161240145.jpg",
    glance: {
      light:      "Medium, indirect",
      water:      "Keep moist",
      humidity:   "Moderate–high",
      temp:       "18–27°C",
      toxicity:   "Toxic to pets",
      difficulty: "Easy"
    },
    about:    "Glossy dark leaves with elegant white \"flowers\" — actually a spathe, a modified leaf, around a central spadix. Famously communicative: droops dramatically when thirsty and recovers fast.",
    cycle:    "Grows year-round in warmth, fastest in spring–summer. Flowers most readily in good light; may rest in low winter light. Clump-forming — divide when pot-bound.",
    watering: "Keep consistently moist, not waterlogged; water when the top 2–3cm feels dry. Sensitive to fluoride/chlorine — stand tap water or use filtered/rainwater to avoid brown tips.",
    feeding:  "Balanced feed every 4–6 weeks in spring and summer; ease off in winter.",
    pests: [
      "Dramatic wilting = needs water (recovers fast)",
      "Brown tips = tap-water chemicals or dry air",
      "Yellow leaves = overwatering or age",
      "No flowers = too little light",
      "Watch mealybugs & spider mites"
    ],
    origins: "From shaded rainforest floors of Central and South America — warm, humid, low-light understorey. One of NASA's top air-purifiers, and it thrives in bathrooms thanks to the humidity.",
    log: {
      acquired:    "",
      source:      "",
      location:    "",
      repotted:    "",
      potSoil:     "",
      propagation: "Division"
    }
  },

  // ── 3. Giant Peace Lily ──────────────────────────────────────
  {
    id:        "spathiphyllum-sensation",
    family:    "Araceae",
    latin:     "Spathiphyllum 'Sensation'",
    common:    "Giant Peace Lily",
    qualifier: "",
    photo:     "photos/PXL_20260605_160442627.jpg",
    glance: {
      light:      "Medium, indirect",
      water:      "Keep moist",
      humidity:   "Moderate–high",
      temp:       "18–27°C",
      toxicity:   "Toxic to pets",
      difficulty: "Easy"
    },
    about:    "The largest peace lily cultivar, with broad, deeply ribbed leaves that can top a metre. Same care as standard peace lilies but appreciates more space, a larger pot and more water to match its size.",
    cycle:    "Vigorous in spring–summer; can become a substantial floor specimen. Flowers in good light, slows in winter.",
    watering: "Keep evenly moist; its larger leaf area transpires more, so it drinks more than smaller forms. Filtered or stood water reduces brown tips. Never leave standing in water.",
    feeding:  "Balanced feed every 4 weeks in spring and summer; ease off in winter.",
    pests: [
      "Wilting = thirsty",
      "Brown tips = water chemicals or dry air",
      "Yellowing = overwatering",
      "Wipe the big leaves to keep pores clear"
    ],
    origins: "Bred from tropical American Spathiphyllum of humid, shaded understorey. 'Sensation' is the giant of the genus and the most shade-tolerant large foliage plant commonly sold — almost architectural with its ribbed leaves.",
    log: {
      acquired:    "",
      source:      "",
      location:    "",
      repotted:    "",
      potSoil:     "",
      propagation: "Division"
    }
  },

  // ── 4. Swiss Cheese Plant ────────────────────────────────────
  {
    id:        "monstera-deliciosa",
    family:    "Araceae",
    latin:     "Monstera deliciosa",
    common:    "Swiss Cheese Plant",
    qualifier: "",
    photo:     "photos/PXL_20260605_161307639.jpg",
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

  // ── 5. Devil's Ivy ──────────────────────────────────────────
  {
    id:        "epipremnum-aureum",
    family:    "Araceae",
    latin:     "Epipremnum aureum",
    common:    "Devil's Ivy / Pothos",
    qualifier: "",
    photo:     "photos/PXL_20260605_161331098.jpg",
    glance: {
      light:      "Low–bright indirect",
      water:      "When top dries",
      humidity:   "Any",
      temp:       "15–27°C",
      toxicity:   "Toxic to pets",
      difficulty: "Very easy"
    },
    about:    "A trailing/climbing vine with heart-shaped leaves, often marbled gold or cream. Tolerant of almost any indoor spot and very forgiving.",
    cycle:    "Fast-growing year-round in warmth. Variegation increases with brighter light. Easy to propagate — cuttings root readily in water.",
    watering: "Let the top few cm dry, then water thoroughly. Very drought-tolerant; far more forgiving of under- than over-watering. Leaves go limp when genuinely thirsty.",
    feeding:  "Light balanced feed every 4–6 weeks in spring and summer.",
    pests: [
      "Mealybugs, spider mites (uncommon)",
      "Yellow leaves = overwatering",
      "Pale / all-green = too little light, losing variegation",
      "Brown crispy edges = underwatered / dry air"
    ],
    origins: "Native to the Solomon Islands; naturalised across tropical forests worldwide, climbing trees with aerial roots. Nicknamed \"devil's ivy\" because it's nearly impossible to kill and stays green even in dark spots. In the wild its leaves grow huge and split like a Monstera.",
    log: {
      acquired:    "",
      source:      "",
      location:    "",
      repotted:    "",
      potSoil:     "",
      propagation: "Water cutting"
    }
  },

  // ── 6. Weeping Fig ──────────────────────────────────────────
  {
    id:        "ficus-benjamina",
    family:    "Moraceae",
    latin:     "Ficus benjamina",
    common:    "Weeping Fig",
    qualifier: "",
    photo:     "photos/PXL_20260605_161035672.jpg",
    glance: {
      light:      "Bright indirect",
      water:      "When top dries",
      humidity:   "Moderate",
      temp:       "16–27°C",
      toxicity:   "Toxic; irritant sap",
      difficulty: "Moderate"
    },
    about:    "A small indoor tree with slender, arching branches and glossy pointed leaves, often sold braided or trained. Elegant but famously dramatic — drops leaves at the slightest change.",
    cycle:    "Steady growth in spring–summer; can become a large specimen over years. Slows in winter and responds well to light pruning.",
    watering: "Water when the top 2–3cm is dry; lightly moist in growth, drier in winter. Hates both drought and soggy roots. Don't let it sit in water.",
    feeding:  "Balanced feed every 4 weeks in spring and summer.",
    pests: [
      "Scale, mealybugs, spider mites — check often",
      "Sudden leaf drop = moving, draughts, watering change",
      "Yellow leaves = overwatering or cold",
      "Keep away from radiators, doors, draughts"
    ],
    origins: "From tropical and subtropical Asia and northern Australia, where it grows into a large tree, sometimes starting as a strangler. Once happy in a spot, leave it put — it dislikes being moved more than almost any houseplant. Another strong NASA air-purifier.",
    log: {
      acquired:    "",
      source:      "",
      location:    "",
      repotted:    "",
      potSoil:     "",
      propagation: "Stem cutting"
    }
  },

  // ── 7. Boston Fern ──────────────────────────────────────────
  {
    id:        "nephrolepis-exaltata",
    family:    "Nephrolepidaceae",
    latin:     "Nephrolepis exaltata",
    common:    "Boston Fern",
    qualifier: "",
    photo:     "photos/PXL_20260605_160737271.jpg",
    glance: {
      light:      "Bright indirect",
      water:      "Keep moist",
      humidity:   "High",
      temp:       "16–24°C",
      toxicity:   "Pet-safe",
      difficulty: "Moderate–fussy"
    },
    about:    "Lush, arching fronds of fine green leaflets — a classic hanging or pedestal fern. Beautiful but thirsty and humidity-hungry, the diva of this collection.",
    cycle:    "Grows steadily in warmth and humidity, fastest in spring–summer. Reproduces by spores in the wild; indoors, divide the clump.",
    watering: "Keep soil consistently moist — never let it dry out fully. Mist, use a humidity tray, or keep in a bathroom. Dry air is its biggest enemy.",
    feeding:  "Weak balanced feed monthly in the growing season; sensitive to overfeeding.",
    pests: [
      "Crispy brown fronds = dry air / underwatered",
      "Yellowing leaflets = inconsistent moisture",
      "Heavy frond drop = low humidity",
      "Watch for scale and mealybugs"
    ],
    origins: "From humid tropical and subtropical forests and swamps of the Americas, in dappled shade with constant moisture. One of the few popular ferns that's genuinely pet-safe, and an excellent natural humidifier. Ferns predate flowering plants by hundreds of millions of years.",
    log: {
      acquired:    "",
      source:      "",
      location:    "",
      repotted:    "",
      potSoil:     "",
      propagation: "Division"
    }
  },

  // ── 8. Alocasia zebrina ──────────────────────────────────────
  {
    id:        "alocasia-zebrina",
    family:    "Araceae",
    latin:     "Alocasia zebrina",
    common:    "Zebra Plant",
    qualifier: "",
    photo:     "photos/PXL_20260605_161417751.jpg",
    glance: {
      light:      "Bright indirect",
      water:      "When top dries",
      humidity:   "High",
      temp:       "18–27°C",
      toxicity:   "Toxic to pets",
      difficulty: "Fussy"
    },
    about:    "Prized for striking zebra-striped petioles topped with arrow-shaped leaves. Dramatic and architectural, but sensitive and demanding of stable conditions.",
    cycle:    "Active spring–summer; may go dormant in winter, dropping leaves and resting from a tuber — normal, keep barely moist and it returns. Grows from a corm and offsets.",
    watering: "Water when the top few cm dry; lightly moist in growth but never soggy. Sensitive to both rot and drying out. Use filtered/rainwater and a chunky, airy mix.",
    feeding:  "Dilute balanced feed every 2–4 weeks in spring and summer only.",
    pests: [
      "Spider mites — very prone, check undersides",
      "Yellow leaves = overwatering",
      "Drooping = thirsty or shocked",
      "Brown crispy edges = low humidity",
      "Winter leaf loss = likely dormancy"
    ],
    origins: "Endemic to the Philippines, in warm, humid, shaded tropical forest. Called the \"zebra plant\" for its banded stems, and like other Alocasia it can guttate — dripping water droplets from leaf edges in humid conditions.",
    log: {
      acquired:    "",
      source:      "",
      location:    "",
      repotted:    "",
      potSoil:     "",
      propagation: "Offsets / corms"
    }
  },

  // ── 9. Alocasia (unidentified) ───────────────────────────────
  // NOTE: species unconfirmed — do not change the hedged wording below.
  {
    id:        "alocasia-sp",
    family:    "Araceae",
    latin:     "Alocasia sp.",
    common:    "Elephant's Ear",
    qualifier: "Wentii",
    photo:     "photos/PXL_20260605_161144889.jpg",
    glance: {
      light:      "Bright indirect",
      water:      "When top dries",
      humidity:   "High",
      temp:       "18–27°C",
      toxicity:   "Toxic to pets",
      difficulty: "Fussy"
    },
    about:    "An Alocasia of unconfirmed variety. The genus shares broadly the same needs: warmth, humidity, bright indirect light and an airy, free-draining mix. Confirm the species and I'll tailor this page.",
    cycle:    "Active spring–summer, often dormant in winter (may drop leaves and rest from a corm). Produces separable offsets.",
    watering: "Water when the top few cm dry; lightly moist, never soggy. Filtered/rainwater preferred. Reduce in winter, especially if dormant.",
    feeding:  "Dilute balanced feed every 2–4 weeks in spring and summer only.",
    pests: [
      "Spider mites — common across Alocasia",
      "Yellowing = overwatering",
      "Drooping = thirst or shock",
      "Crispy edges = dry air"
    ],
    origins: "Tropical and subtropical Asia, in warm, humid, shaded forest understorey. \"Elephant ears\" describes the large, arrow- or shield-shaped leaves. Once you confirm the variety, note distinctive markings here.",
    log: {
      acquired:    "",
      source:      "",
      location:    "",
      repotted:    "",
      potSoil:     "",
      propagation: "Offsets / corms"
    }
  },

  // ── 10. Alocasia 'Polly' ─────────────────────────────────────
  {
    id:        "alocasia-x-amazonica-polly",
    family:    "Araceae",
    latin:     "Alocasia × amazonica 'Polly'",
    common:    "African Mask / Elephant's Ear",
    qualifier: "",
    photo:     "photos/PXL_20260605_160737271.jpg",
    glance: {
      light:      "Bright indirect",
      water:      "When top dries",
      humidity:   "High",
      temp:       "18–27°C",
      toxicity:   "Toxic to pets",
      difficulty: "Fussy"
    },
    about:    "Compact \"African mask\" plant with dramatic dark green, arrow-shaped leaves, bold silvery-white veins and wavy edges. A hybrid bred for indoor life but still needs stable warmth and humidity.",
    cycle:    "Active spring–summer; commonly goes semi-dormant in winter and may drop most leaves — don't panic, ease off water and it regrows from the corm. Produces offsets.",
    watering: "Water when the top 2–3cm dries; lightly moist but never waterlogged. Loves humidity — a tray, grouping or humidifier helps. Filtered/rainwater avoids leaf spotting.",
    feeding:  "Dilute balanced feed every 2–4 weeks in spring and summer only.",
    pests: [
      "Spider mites — very prone in dry air",
      "Yellow leaves = overwatering",
      "Drooping = thirsty or cold",
      "Brown crispy edges = humidity too low",
      "Winter leaf loss = likely dormancy"
    ],
    origins: "A cultivated hybrid; parent species come from humid tropical forests of Southeast Asia. The \"African mask\" name comes from the leaf shape resembling carved ceremonial masks, though the plant isn't African. Constant new growth is the sign of a happy plant.",
    log: {
      acquired:    "",
      source:      "",
      location:    "",
      repotted:    "",
      potSoil:     "",
      propagation: "Offsets / corms"
    }
  },

  // ── 11. Orchid ───────────────────────────────────────────────
  {
    id:        "phalaenopsis-sp",
    family:    "Orchidaceae",
    latin:     "Phalaenopsis sp.",
    common:    "Moth Orchid",
    qualifier: "",
    photo:     "photos/PXL_20260605_160637694.jpg",
    glance: {
      light:      "Bright indirect",
      water:      "Weekly soak",
      humidity:   "Moderate–high",
      temp:       "18–27°C",
      toxicity:   "Pet-safe",
      difficulty: "Easy–moderate"
    },
    about:    "The common white-flowered orchid, almost certainly a Phalaenopsis. An epiphyte — it grows in bark, not soil, with thick aerial roots — and produces long-lasting, elegant blooms.",
    cycle:    "Flowers can last months. After blooming it rests; a cooler night drop in autumn helps trigger a new spike. Grows new leaves and roots in the warm season.",
    watering: "Water about weekly: soak the bark, drain completely, never leave roots in water. Silvery roots = thirsty; green = well-watered. Reduce slightly in winter.",
    feeding:  "Dilute orchid feed every 2–3 waterings in growth (\"weakly, weekly\"); flush with plain water monthly.",
    pests: [
      "Mealybugs, scale",
      "Limp, wrinkled leaves = root watering issue",
      "Yellow lower leaf = often normal ageing",
      "No rebloom = more light or a night-temp dip",
      "Mushy brown roots = rot"
    ],
    origins: "From tropical Southeast Asia, growing on tree trunks and branches as an epiphyte in warm, humid, shaded forest. Moth orchids \"breathe\" and feed largely through aerial roots, which photosynthesise; with the right care one plant reblooms for many years.",
    log: {
      acquired:    "",
      source:      "",
      location:    "",
      repotted:    "",
      potSoil:     "",          // Note: label shows "Pot / Bark Mix" for orchid
      propagation: "Keiki (offshoot)"
    }
  },

  // ── 12. Ficus Ginseng ────────────────────────────────────────
  {
    id:        "ficus-microcarpa",
    family:    "Moraceae",
    latin:     "Ficus microcarpa",
    common:    "Ficus Ginseng",
    qualifier: "×2",
    photo:     "photos/PXL_20260605_161353050.jpg",
    glance: {
      light:      "Bright indirect",
      water:      "When top dries",
      humidity:   "Moderate",
      temp:       "16–27°C",
      toxicity:   "Toxic; irritant sap",
      difficulty: "Easy–moderate"
    },
    about:    "Sold as a bonsai-style tree with a fat, exposed, root-like trunk (\"ginseng\") and a canopy of small glossy leaves. Tougher and more forgiving than its cousin the weeping fig.",
    cycle:    "Grows in spring–summer; can be pruned to keep its bonsai shape and encourage a denser canopy. Slows in winter. Long-lived.",
    watering: "Water when the top 2–3cm is dry, then drain. Likes a little humidity — occasional misting helps. Avoid sudden changes in light or position, which trigger leaf drop.",
    feeding:  "Balanced feed every 4 weeks in spring and summer; dilute bonsai feed also works.",
    pests: [
      "Scale, mealybugs, spider mites",
      "Leaf drop = moving, draughts, watering change",
      "Yellow leaves = overwatering",
      "Leggy growth = needs more light"
    ],
    origins: "From tropical Asia and Australasia, where the species becomes a large banyan-type tree with dramatic aerial roots. The swollen \"ginseng\" trunk is produced by grafting a leafy top onto vigorous nursery roots — not a natural shape. Exudes milky latex when cut.",
    log: {
      acquired:    "",
      source:      "",
      location:    "",
      repotted:    "",
      potSoil:     "",
      propagation: "Cutting (no ginseng base)"
    }
  },

  // ── 13. Dragon Plant ─────────────────────────────────────────
  // NOTE: species hedged between D. marginata and D. fragrans — do not resolve.
  {
    id:        "dracaena-marginata",
    family:    "Asparagaceae",
    latin:     "Dracaena marginata",
    common:    "Dragon Plant",
    qualifier: "confirm vs. D. fragrans",
    photo:     "photos/PXL_20260605_161338586.jpg",
    glance: {
      light:      "Medium–bright indirect",
      water:      "When top dries",
      humidity:   "Any–moderate",
      temp:       "16–27°C",
      toxicity:   "Toxic to pets",
      difficulty: "Easy"
    },
    about:    "\"Dragon plant\" usually means D. marginata (slim cane, thin red-edged leaves) or D. fragrans (broader leaves, often a \"corn plant\"). Care is near-identical; confirm yours so the page is exact. Tough, upright, architectural.",
    cycle:    "Slow, steady growth, fastest in spring–summer. Forms a woody cane over time and can be cut back to encourage branching. Lower leaves naturally yellow and drop as it lengthens.",
    watering: "Let the top 3–5cm dry, then water and drain. Drought-tolerant; happier slightly dry than soggy. Sensitive to fluoride — use filtered or stood water to limit brown tips.",
    feeding:  "Balanced feed every 4–6 weeks in spring and summer.",
    pests: [
      "Spider mites, scale, mealybugs",
      "Brown leaf tips = fluoride or dry air",
      "Yellow lower leaves = usually normal; if widespread, overwatering",
      "Soft cane = root rot"
    ],
    origins: "From Madagascar and tropical Africa, in warm, semi-arid to forest-edge conditions. The \"dragon tree\" name traces to related species whose red resin was sold as \"dragon's blood\". Another reliable NASA air-purifier.",
    log: {
      acquired:    "",
      source:      "",
      location:    "",
      repotted:    "",
      potSoil:     "",
      propagation: "Cane cutting"
    }
  }

]; // ← end of plants array. Paste new records before this line.


/* =============================================================
   BLANK TEMPLATE — copy everything between the dashed lines,
   paste it before the ]; above, add a comma after the record
   that comes before it, then fill in your details.
   ---------------------------------------------------------

  {
    id:        "genus-species",
    family:    "Family name, e.g. Araceae",
    latin:     "Genus species",
    common:    "Common name",
    qualifier: "",           // "" to omit; or "×2", "syn. …" etc.
    photo:     "",           // "" for placeholder; or "photos/filename.jpg"
    glance: {
      light:      "",        // e.g. "Bright indirect"
      water:      "",        // e.g. "When top dries"
      humidity:   "",        // e.g. "Moderate–high"
      temp:       "",        // e.g. "18–27°C"
      toxicity:   "",        // e.g. "Toxic to pets" / "Pet-safe"
      difficulty: ""         // e.g. "Easy"
    },
    about:    "",
    cycle:    "",
    watering: "",
    feeding:  "",
    pests: [
      "",
      "",
      ""
    ],
    origins: "",
    log: {
      acquired:    "",
      source:      "",
      location:    "",
      repotted:    "",
      potSoil:     "",
      propagation: ""
    }
  },

   ============================================================= */
