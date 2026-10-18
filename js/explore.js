import { SEARCH_MODES, searchNasaImages } from "./api.js";

/* --------------------------------------------------
   ORBIT Explore
   Curated NASA image discovery
-------------------------------------------------- */

const searchForm = document.querySelector("#explore-search-form");
const searchInput = document.querySelector("#explore-search");
const searchGuidance = document.querySelector("#search-guidance");
const topicButtons = document.querySelectorAll(".topic-chip");

const initialState = document.querySelector("#state-initial");
const loadingState = document.querySelector("#state-loading");
const emptyState = document.querySelector("#state-empty");
const errorState = document.querySelector("#state-error");

const loadingTitle = loadingState.querySelector(".search-state__title");
const emptyTitle = emptyState.querySelector(".search-state__title");
const errorMessage = errorState.querySelector(".search-state__message");
const retryButton = document.querySelector("#retry-search");

const resultsHeader = document.querySelector("#results-header");
const resultsCount = document.querySelector("#results-count");
const resultsContainer = document.querySelector("#search-results");

/* --------------------------------------------------
   Search states
-------------------------------------------------- */

const SEARCH_STATES = Object.freeze({
  INITIAL: "initial",
  LOADING: "loading",
  EMPTY: "empty",
  ERROR: "error",
  RESULTS: "results",
});

/* --------------------------------------------------
   General constants
-------------------------------------------------- */

const REQUEST_TIMEOUT_MS = 20000;
const IMAGE_PREFLIGHT_TIMEOUT_MS = 6500;

const STANDARD_RESULT_LIMIT = 24;
const CURATED_RESULTS_PER_QUERY = 36;
const MAX_DISPLAY_RESULTS = 24;
const MAX_CURATED_RANKED_CANDIDATES = 80;
const IMAGE_PREFLIGHT_BATCH_SIZE = 8;

const MIN_PREVIEW_WIDTH = 320;
const MIN_PREVIEW_HEIGHT = 180;

/*
  Mars gets a slightly stronger image-size gate.

  We are not reading pixels with Canvas because
  NASA's image host does not reliably provide the
  CORS headers required for that.
*/

const MARS_MIN_PREVIEW_WIDTH = 420;
const MARS_MIN_PREVIEW_HEIGHT = 220;

const MARS_MIN_ASPECT_RATIO = 0.72;
const MARS_MAX_ASPECT_RATIO = 2.8;

const MAX_CARD_TITLE_CHARACTERS = 110;
const PRIMARY_TITLE_CHARACTER_LIMIT = 220;

const GENERIC_ARCHIVE_TITLE_PATTERN = /^[A-Z]{2,8}-\d{4}-\d+(?:-\d+)?$/i;

/* --------------------------------------------------
   Global curated rejection terms
-------------------------------------------------- */

const GLOBAL_REJECT_TERMS = [
  "kennedy space center",
  "kennedy space centre",
  "cape canaveral",

  "launch complex",
  "launch pad",
  "launch tower",
  "launch vehicle",
  "rocket launch",
  "liftoff",
  "lift-off",
  "launch preparation",
  "vehicle assembly building",

  "clean room",
  "cleanroom",
  "laboratory",
  "test facility",
  "integration facility",
  "processing facility",
  "spacecraft assembly",
  "spacecraft integration",
  "instrument testing",

  "mission control",
  "control room",
  "aircraft hangar",

  "press conference",
  "press briefing",
  "public event",
  "school event",
  "outreach",
  "group photo",
  "team photo",

  "scientific figure",
  "research figure",
  "technical figure",

  "graph",
  "chart",
  "diagram",
  "schematic",
  "infographic",
  "histogram",

  "spectrogram",
  "spectrum plot",
  "frequency plot",
  "measurement plot",

  "research panel",
  "comparison panel",

  "texture legend",
  "tactile legend",

  "mineral map",
  "gravity map",
  "temperature map",
  "thermal map",

  "route map",
  "path map",

  "research map",
  "scientific map",
  "data map",

  "artist concept",
  "artist's concept",
  "artist rendering",
  "artist's rendering",

  "promotional graphic",
  "educational legend",
];

/* --------------------------------------------------
   Earth
-------------------------------------------------- */

const EARTH_REJECT_TERMS = [
  "temperature from space",
  "temperature data",
  "temperature analysis",

  "temperature visualization",
  "temperature visualisation",

  "brightness temperature",
  "surface temperature",
  "sea surface temperature",

  "thermal data",
  "thermal analysis",

  "heat map",
  "heatmap",

  "instrument data",
  "measurement data",

  "scientific overlay",
  "measurement overlay",
  "data overlay",

  "annotated hurricane",

  "multi-panel",
  "multi panel",

  "methane",
  "emissions",

  "hydrology",
  "water storage",

  "subsidence",
  "uplift",

  "research data",
  "data reveal",

  "concentration",

  "study shows",
  "research study",

  "sulfur dioxide",
  "carbon dioxide",

  "air quality",

  "vegetation index",

  "temperature anomaly",

  "false color",
  "false-color",
  "false colour",
  "false-colour",

  "map of",
  "mapped by",
];

/* --------------------------------------------------
   Moon
-------------------------------------------------- */

const MOON_REJECT_TERMS = [
  "aircraft hangar",
  "hangar",

  "flight research center",
  "flight research centre",

  "building",
  "facility",

  "observe the moon night",
  "international observe the moon night",

  "postflight",

  "robotic arm",

  "hardware",
  "integration",

  "astronaut edwin aldrin egresses",
  "astronaut edwin aldrin walks",

  "egresses lunar module",
  "next leg of lunar module",

  "guardians of traffic",
];

const KNOWN_BAD_MOON_TITLES = new Set(["guardians of traffic supermoon"]);

/* --------------------------------------------------
   Mars — verified visual failures

   This remains deliberately small.

   General categories are handled by the Mars rules
   below. These entries are only used where NASA
   metadata cannot communicate that the actual
   preview itself is visually unsuitable.
-------------------------------------------------- */

const KNOWN_BAD_MARS_NASA_IDS = new Set([
  "pia20852",
  "pia22209",
  "pia21492",
  "pia23727",
  "pia12980",
  "pia21718",
  "pia19807",
  "pia26042",
  "pia00382",
  "pia20850",
]);

const KNOWN_BAD_MARS_TITLE_FRAGMENTS = [
  "first color landscape image of mars from curiosity",

  "detailed panorama of mars' jezero crater delta",

  "curiosity mars rover approach to pahrump hills",

  "rover panorama of entrance to murray buttes",

  "rover panorama taken amid murray buttes",

  "panorama taken amid murray buttes",

  "panorama with active linear dune",

  "active linear dune in gale crater",

  "wharton ridge",

  "marathon valley enhanced color",

  "marathon valley enhanced colour",

  "textures where curiosity rover studied",

  "bagnold dunes campaign",

  "two types of dunes",

  "steep knudsen ridge",

  "view down 'perseverance valley'",

  "view down perseverance valley",

  "tracks tell tale",

  "drives backward up jezero",

  "sample return landing site",

  "potential mars sample return landing site",

  "pico turquino hills",

  "opportunity's surroundings after 25 miles",

  "panorama from curiosity sol 1000",

  "teal ridge",

  "clouds sailing above martian horizon",

  "perseverance rover's view up crater",

  "crossbedded martian sandstone",

  "color view of martian dune after crossing it",

  "colour view of martian dune after crossing it",

  "curiosity traverses into different terrain",

  "dust devil passes near martian sand dune",

  "rover track in sand sheet",

  "change observed in martian sand dune",

  "spreading the delta of mars' jezero crater",

  /*
    Final Mars cleanup.

    These are the remaining weak cards we identified
    after the wider filtering system was already
    working.
  */

  "curiosity rover on mount sharp, seen from mars orbit",

  "curiosity rover on mount sharp seen from mars orbit",

  "seen from mars orbit",

  "curiosity sends a postcard",

  "postcard from mount sharp",

  "curiosity's view of sand ridges and bolivar",

  "view of sand ridges and bolivar",
];

/* --------------------------------------------------
   Mars — category rejections
-------------------------------------------------- */

const MARS_REJECT_TERMS = [
  /* ----------------------------------------------
     Older archive families
  ---------------------------------------------- */

  "opportunity",
  "spirit",
  "pathfinder",
  "phoenix",

  /* ----------------------------------------------
     Navigation / routes
  ---------------------------------------------- */

  "ground track",
  "ground tracks",

  "route map",
  "path map",

  "locator map",
  "feature map",
  "map for features",

  "curiosity route",
  "rover route",

  "navigation route",
  "traverse route",

  "may be curiosity route",

  "route toward",

  "traverse",
  "traverses",
  "traversing",

  /* ----------------------------------------------
     Scientific mapping
  ---------------------------------------------- */

  "mineral map",
  "minerals map",

  "mineral distribution",

  "hydrated mineral",
  "hydrated minerals",

  "crustal thickness",
  "crust thickness",

  "silicon map",

  "topographic map",
  "topography map",

  "elevation map",

  "gravity map",

  "temperature map",
  "thermal map",

  "geologic map",
  "geological map",

  "scientific map",
  "research map",
  "data map",
  "measurement map",

  /* ----------------------------------------------
     Scientific presentation
  ---------------------------------------------- */

  "research panel",
  "comparison panel",

  "scientific figure",
  "research figure",

  "two types of",

  "campaign:",

  "annotated",

  /* ----------------------------------------------
     Processed / constructed image products
  ---------------------------------------------- */

  "stereo",

  "anaglyph",

  "polar projection",

  "round-horizon",
  "round horizon",

  "360-degree",
  "360 degree",

  "full-circle",
  "full circle",

  "navigation mosaic",
  "science mosaic",
  "technical mosaic",
  "frame mosaic",

  "navcam mosaic",
  "mastcam mosaic",
  "mastcam-z mosaic",

  "projection map",

  "stitched mosaic",
  "image mosaic",

  "composite image",
  "image composite",

  "multi-image",
  "multi image",

  "split view",

  "montage",

  "equirectangular",

  "fisheye",

  "false color",
  "false-color",

  "false colour",
  "false-colour",

  /* ----------------------------------------------
     Too close / technical
  ---------------------------------------------- */

  "microscopic",
  "microscope",

  "soil close-up",
  "soil closeup",

  "close-up of",
  "close up of",

  "telephoto",

  /* ----------------------------------------------
     Rover-documentation imagery
  ---------------------------------------------- */

  "self-portrait",
  "self portrait",

  "selfie",

  "photobomb",

  "rover portrait",

  "rover wheel",

  "wheel track",
  "wheel tracks",

  "tire track",
  "tire tracks",

  "tyre track",
  "tyre tracks",

  "rover track",
  "rover tracks",

  "drives backward",

  "tracks tell tale",

  "drill hole",

  "drilling site",

  "rover hardware",

  "lander hardware",

  "landing hardware",

  "heat shield",

  "backshell",

  "parachute",

  "airbag",

  "rover ramp",

  /* ----------------------------------------------
     Engineering
  ---------------------------------------------- */

  "instrument test",

  "calibration",

  "engineering model",

  "science target",

  "workspace",

  "checkout",

  "initial surface checkout",

  "briefing",

  /* ----------------------------------------------
     Planning
  ---------------------------------------------- */

  "sample return landing site",

  "potential landing site",

  "will study",

  "will visit",

  /* ----------------------------------------------
     Media / documentary products
  ---------------------------------------------- */

  "movie",

  "animation",

  "timelapse",

  "time-lapse",

  "postcard",

  "sends a postcard",

  /* ----------------------------------------------
     Orbital views

     This is a surface-exploration gallery.

     Important:
     Do NOT ban the word "orbiter" because the good
     result "Curiosity Captures Mars Landscape While
     Talking to an Orbiter" is still visually a real
     Martian landscape.
  ---------------------------------------------- */

  "seen from mars orbit",

  "seen from orbit",

  "from mars orbit",

  "view from mars orbit",

  "orbital view",

  "orbital image",

  /* ----------------------------------------------
     Wrong primary subject
  ---------------------------------------------- */

  "asteroid",

  /* ----------------------------------------------
     Remaining false-positive categories
  ---------------------------------------------- */

  "crossbedded",

  "sandstone",

  "after crossing it",

  "studied a martian dune",

  "change observed",

  "changes observed",

  "spreading the delta",

  "dust devil",
];

/* --------------------------------------------------
   Mars — strong environment signals
-------------------------------------------------- */

const MARS_STRONG_SCENE_TERMS = [
  "landscape",
  "landscapes",

  "horizon",

  "terrain",

  "vista",

  "dune",
  "dunes",

  "crater",
  "craters",

  "mountain",
  "mountains",

  "hill",
  "hills",

  "ridge",
  "ridges",

  "valley",
  "valleys",

  "canyon",

  "plain",
  "plains",

  "mesa",

  "outcrop",

  "butte",
  "buttes",

  "rocky terrain",

  "surroundings",
];

const MARS_NAMED_TERRAIN = [
  "gale crater",

  "jezero crater",

  "mount sharp",

  "aeolis mons",

  "vera rubin ridge",

  "namib dune",

  "bagnold dunes",

  "murray buttes",

  "kimberley",

  "yellowknife bay",

  "dingo gap",

  "pahrump hills",

  "rocknest",

  "cooperstown",

  "hidden valley",
];

/* --------------------------------------------------
   Topics
-------------------------------------------------- */

const TOPICS = new Map([
  /* ------------------------------------------------
     Nebula
  ------------------------------------------------ */

  [
    "nebula",
    {
      canonical: "Nebula",

      queries: [
        "nebula Hubble",
        "nebula Webb",
        "planetary nebula",
        "stellar nursery nebula",
        "supernova remnant nebula",
      ],

      subject: [
        "nebula",
        "nebulae",
        "pillars of creation",
        "cosmic cliffs",
        "stellar nursery",
        "supernova remnant",
      ],

      scene: [
        "nebula",
        "pillars",
        "cosmic cliffs",
        "hubble",
        "webb",
        "jwst",
        "spitzer",
      ],

      reject: [
        "by touch",
        "tactile",
        "texture legend",
        "spectrum",
        "observatory building",
      ],

      minScore: 20,

      maxResults: 24,
    },
  ],

  /* ------------------------------------------------
     Mars
  ------------------------------------------------ */

  [
    "mars",
    {
      canonical: "Mars",

      /*
        IMPORTANT CHANGE:

        Retrieval is broader now, but it is still
        completely visual-first.

        We are NOT reducing the rejection rules.

        Broad scene queries give the strict Mars
        contract a larger pool of candidates from
        which it can find clean images.
      */

      queries: [
        "Mars landscape",
        "Mars horizon",
        "Mars terrain",
        "Mars dunes",
        "Mars crater",
        "Mars valley",
        "Mars ridge",
        "Mars rocky terrain",

        "Curiosity Mars landscape",
        "Curiosity Mount Sharp",
        "Curiosity Gale Crater",
        "Curiosity Hidden Valley Mars",
        "Curiosity Mars dunes",

        "Perseverance Mars landscape",
        "Perseverance Mars horizon",
        "Perseverance Jezero Crater",
        "Perseverance Mars terrain",
        "Perseverance Mars rocky terrain",
      ],

      /*
        Mars retrieves 28 candidates per query.

        Other topics continue to use the normal
        CURATED_RESULTS_PER_QUERY value.
      */

      pageSize: 28,

      subject: ["mars", "martian", "curiosity", "perseverance"],

      scene: [...MARS_STRONG_SCENE_TERMS, "navcam", "mastcam", "mastcam-z"],

      reject: MARS_REJECT_TERMS,

      /*
        Keep the working quality threshold.

        Do NOT lower this simply to fill the grid.
      */

      minScore: 22,

      /*
        Maximum only.

        We do not force 12 results.

        6–10 excellent cards are better than
        12 cards containing weak imagery.
      */

      maxResults: 12,
    },
  ],

  /* ------------------------------------------------
     Earth
  ------------------------------------------------ */

  [
    "earth",
    {
      canonical: "Earth",

      queries: [
        "Earth from space",
        "Blue Marble Earth",
        "Earth from orbit",
        "Earth limb atmosphere",
        "Earth hurricane from space",
        "Earth aurora from space",
      ],

      subject: ["earth", "blue marble", "earthrise", "home planet"],

      scene: [
        "from space",
        "from orbit",
        "blue marble",
        "earthrise",
        "limb",
        "atmosphere",
        "hurricane",
        "aurora",
      ],

      reject: EARTH_REJECT_TERMS,

      minScore: 26,

      maxResults: 24,
    },
  ],

  /* ------------------------------------------------
     Galaxy
  ------------------------------------------------ */

  [
    "galaxy",
    {
      canonical: "Galaxy",

      queries: [
        "spiral galaxy Hubble",
        "galaxy Webb",
        "galaxy cluster Hubble",
        "deep field galaxies",
        "elliptical galaxy Hubble",
      ],

      subject: ["galaxy", "galaxies", "galactic", "milky way", "deep field"],

      scene: [
        "spiral",
        "elliptical",
        "irregular",
        "cluster",
        "deep field",
        "hubble",
        "webb",
        "jwst",
      ],

      reject: [
        "growth of",
        "statistics",
        "distribution",
        "simulation",
        "model",
        "launch",
        "mission preparation",
      ],

      minScore: 20,

      maxResults: 24,
    },
  ],

  /* ------------------------------------------------
     Moon
  ------------------------------------------------ */

  [
    "moon",
    {
      canonical: "Moon",

      queries: [
        "lunar surface Moon",
        "full Moon lunar",
        "Moon crater lunar",
        "lunar horizon Apollo",
        "lunar eclipse Moon",
        "far side Moon lunar",
      ],

      subject: ["moon", "lunar"],

      scene: [
        "lunar surface",
        "moon surface",
        "lunar horizon",
        "lunar landscape",
        "crater",
        "full moon",
        "crescent",
        "eclipse",
        "far side",
        "near side",
        "footprint",
      ],

      reject: MOON_REJECT_TERMS,

      minScore: 24,

      maxResults: 24,
    },
  ],

  /* ------------------------------------------------
     Jupiter
  ------------------------------------------------ */

  [
    "jupiter",
    {
      canonical: "Jupiter",

      queries: [
        "Jupiter planet",
        "Jupiter Great Red Spot",
        "Jupiter cloud bands",
        "Jupiter storms Juno",
        "Jupiter atmosphere Hubble",
      ],

      subject: ["jupiter", "jovian", "great red spot"],

      scene: [
        "great red spot",
        "cloud bands",
        "clouds",
        "storm",
        "cyclone",
        "atmosphere",
        "aurora",
        "vortices",
      ],

      reject: [
        "illustration",
        "slices of",
        "sizing up",
        "ammonia ice",
        "frequency",
        "spectrogram",
        "spectrum",
        "analysis",
        "model",
        "simulation",
        "measurement",
      ],

      minScore: 24,

      maxResults: 24,
    },
  ],
]);

/* --------------------------------------------------
   Runtime
-------------------------------------------------- */

let currentSearchTerm = "";
let activeController = null;
let latestRequestId = 0;

/* --------------------------------------------------
   Text helpers
-------------------------------------------------- */

function normaliseQuery(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function normaliseText(value) {
  return typeof value === "string"
    ? value.toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim()
    : "";
}

function includesAny(text, terms) {
  const source = normaliseText(text);

  return terms.some((term) => {
    const cleaned = normaliseText(term);

    return cleaned && source.includes(cleaned);
  });
}

function countMatches(text, terms) {
  const source = normaliseText(text);

  const seen = new Set();

  for (const term of terms) {
    const cleaned = normaliseText(term);

    if (cleaned && source.includes(cleaned)) {
      seen.add(cleaned);
    }
  }

  return seen.size;
}

function getPrimaryTitleText(title) {
  const cleaned = normaliseText(title);

  if (!cleaned) {
    return "";
  }

  const clipped = cleaned.slice(0, PRIMARY_TITLE_CHARACTER_LIMIT);

  const firstSentence = clipped.split(/(?<=[.!?])\s+/)[0]?.trim() ?? "";

  return firstSentence.length >= 28 ? firstSentence : clipped;
}

function getDisplayTitle(title) {
  const value = typeof title === "string" ? title.trim() : "";

  if (!value) {
    return "Untitled NASA image";
  }

  if (value.length <= MAX_CARD_TITLE_CHARACTERS) {
    return value;
  }

  const clipped = value.slice(0, MAX_CARD_TITLE_CHARACTERS + 1);

  const lastSpace = clipped.lastIndexOf(" ");

  const cut = lastSpace >= 70 ? lastSpace : MAX_CARD_TITLE_CHARACTERS;

  return `${value.slice(0, cut).trim()}…`;
}

/* --------------------------------------------------
   Record normalisation
-------------------------------------------------- */

function createRecordContext(result, originalIndex) {
  const rawTitle = typeof result?.title === "string" ? result.title.trim() : "";

  const keywords = Array.isArray(result?.keywords)
    ? result.keywords
        .filter((item) => typeof item === "string")
        .map(normaliseText)
        .filter(Boolean)
    : [];

  return {
    result,

    originalIndex,

    rawTitle,

    title: normaliseText(rawTitle),

    primaryTitle: getPrimaryTitleText(rawTitle),

    description: normaliseText(result?.description),

    keywordText: keywords.join(" "),

    center: normaliseText(result?.center),

    nasaId: normaliseText(result?.nasaId),
  };
}

/* --------------------------------------------------
   Topic helpers
-------------------------------------------------- */

function getTopicRule(query) {
  return TOPICS.get(normaliseText(query)) ?? null;
}

function getCanonicalTopic(query) {
  return getTopicRule(query)?.canonical ?? null;
}

/* --------------------------------------------------
   Global eligibility
-------------------------------------------------- */

function passesGlobalEligibility(context) {
  if (!context.title || !context.result?.imageUrl) {
    return false;
  }

  if (GENERIC_ARCHIVE_TITLE_PATTERN.test(context.rawTitle)) {
    return false;
  }

  return !includesAny(context.title, GLOBAL_REJECT_TERMS);
}

/* --------------------------------------------------
   Mars contract
-------------------------------------------------- */

function passesMarsContract(context) {
  /* ----------------------------------------------
     Verified preview failures
  ---------------------------------------------- */

  if (KNOWN_BAD_MARS_NASA_IDS.has(context.nasaId)) {
    return false;
  }

  if (includesAny(context.title, KNOWN_BAD_MARS_TITLE_FRAGMENTS)) {
    return false;
  }

  /* ----------------------------------------------
     Hard editorial categories
  ---------------------------------------------- */

  if (includesAny(context.title, MARS_REJECT_TERMS)) {
    return false;
  }

  /* ----------------------------------------------
     People / presentations
  ---------------------------------------------- */

  if (
    includesAny(context.title, [
      "scientist",
      "scientists",
      "engineer",
      "engineers",
      "presentation",
      "conference",
      "portrait of",
      "speaks about",
      "talks about",
    ])
  ) {
    return false;
  }

  /* ----------------------------------------------
     Mars must genuinely be the subject
  ---------------------------------------------- */

  const titleHasMars = includesAny(context.primaryTitle, ["mars", "martian"]);

  const modernRover = includesAny(context.primaryTitle, [
    "curiosity",
    "perseverance",
  ]);

  const marsKeywords = includesAny(context.keywordText, [
    "mars",
    "martian",
    "mars surface",
    "mars science laboratory",
  ]);

  if (!titleHasMars && !(modernRover && marsKeywords)) {
    return false;
  }

  /* ----------------------------------------------
     Require an actual environment

     Generic "surface" alone is NOT enough.

     A result needs proper environmental evidence:
     landscape, horizon, crater, dune, valley, etc.
  ---------------------------------------------- */

  const landscapeEvidence = countMatches(
    context.primaryTitle,
    MARS_STRONG_SCENE_TERMS,
  );

  const namedTerrain = includesAny(context.primaryTitle, MARS_NAMED_TERRAIN);

  if (landscapeEvidence === 0 && !namedTerrain) {
    return false;
  }

  /* ----------------------------------------------
     Panorama quality rule

     We are NOT banning panoramas.

     We reject the kinds of panorama titles that have
     repeatedly produced obvious stitching / geometry
     problems.

     Clean landscape panoramas can still survive.
  ---------------------------------------------- */

  const isPanorama = includesAny(context.primaryTitle, [
    "panorama",
    "panoramic",
  ]);

  if (isPanorama) {
    const technicalPanorama = includesAny(context.primaryTitle, [
      "rover panorama",
      "panorama taken",
      "panorama from",
      "panorama with",
      "stereo",
      "projection",
      "mosaic",
      "full-circle",
      "round-horizon",
    ]);

    if (technicalPanorama) {
      return false;
    }

    if (landscapeEvidence === 0 && !namedTerrain) {
      return false;
    }
  }

  return true;
}

/* --------------------------------------------------
   Earth contract
-------------------------------------------------- */

function passesEarthContract(context) {
  if (includesAny(context.title, EARTH_REJECT_TERMS)) {
    return false;
  }

  if (
    includesAny(context.primaryTitle, [
      "earth from space",
      "earth from orbit",
      "blue marble",
      "earthrise",
      "full earth",
      "earth limb",
      "earth's limb",
      "earth atmosphere",
      "earth horizon",
      "view of earth",
    ])
  ) {
    return true;
  }

  const atmosphericScene = includesAny(context.primaryTitle, [
    "hurricane",
    "aurora",
    "clouds",
  ]);

  const spaceContext = includesAny(context.primaryTitle, [
    "earth",
    "from space",
    "from orbit",
  ]);

  return atmosphericScene && spaceContext;
}

/* --------------------------------------------------
   Moon contract
-------------------------------------------------- */

function passesMoonContract(context) {
  if (KNOWN_BAD_MOON_TITLES.has(context.title)) {
    return false;
  }

  if (includesAny(context.title, MOON_REJECT_TERMS)) {
    return false;
  }

  if (
    includesAny(`${context.title} ${context.keywordText}`, [
      "europa",
      "ganymede",
      "callisto",
      "titan",
      "enceladus",
      "jupiter's moon",
      "saturn's moon",
    ])
  ) {
    return false;
  }

  return includesAny(context.primaryTitle, [
    "full moon",
    "new moon",
    "crescent moon",
    "supermoon",
    "lunar eclipse",
    "lunar surface",
    "moon surface",
    "lunar horizon",
    "lunar landscape",
    "lunar crater",
    "moon crater",
    "far side of the moon",
    "near side of the moon",
    "footprint",
    "footprints",
    "earth rising above the lunar horizon",
    "earth and lunar horizon",
  ]);
}

/* --------------------------------------------------
   Nebula contract
-------------------------------------------------- */

function passesNebulaContract(context) {
  return includesAny(context.primaryTitle, [
    "nebula",
    "nebulae",
    "pillars of creation",
    "cosmic cliffs",
    "stellar nursery",
    "supernova remnant",
  ]);
}

/* --------------------------------------------------
   Galaxy contract
-------------------------------------------------- */

function passesGalaxyContract(context) {
  return includesAny(context.primaryTitle, [
    "galaxy",
    "galaxies",
    "galactic",
    "milky way",
    "deep field",
  ]);
}

/* --------------------------------------------------
   Jupiter contract
-------------------------------------------------- */

function passesJupiterContract(context) {
  const exactPlanetTitles = [
    "jupiter",
    "planet jupiter",
    "jupiter planet",
    "portrait of jupiter",
    "jupiter portrait",
  ];

  if (exactPlanetTitles.includes(context.primaryTitle)) {
    return true;
  }

  const subject = includesAny(context.primaryTitle, [
    "jupiter",
    "jovian",
    "great red spot",
  ]);

  if (!subject) {
    return false;
  }

  return includesAny(context.primaryTitle, [
    "great red spot",
    "cloud band",
    "cloud bands",
    "clouds",
    "storm",
    "storms",
    "cyclone",
    "cyclones",
    "atmosphere",
    "aurora",
    "vortices",
    "turbulent region",
  ]);
}

/* --------------------------------------------------
   Topic contract
-------------------------------------------------- */

function passesTopicContract(context, topicKey) {
  switch (topicKey) {
    case "mars":
      return passesMarsContract(context);

    case "earth":
      return passesEarthContract(context);

    case "moon":
      return passesMoonContract(context);

    case "nebula":
      return passesNebulaContract(context);

    case "galaxy":
      return passesGalaxyContract(context);

    case "jupiter":
      return passesJupiterContract(context);

    default:
      return false;
  }
}

/* --------------------------------------------------
   Curated eligibility
-------------------------------------------------- */

function passesCuratedEligibility(context, topicKey, rule) {
  if (!passesGlobalEligibility(context)) {
    return false;
  }

  if (includesAny(context.title, rule.reject ?? [])) {
    return false;
  }

  const titleSubject = countMatches(context.primaryTitle, rule.subject);

  const keywordSubject = countMatches(context.keywordText, rule.subject);

  if (titleSubject === 0 && keywordSubject === 0) {
    return false;
  }

  return passesTopicContract(context, topicKey);
}

/* --------------------------------------------------
   Ranking
-------------------------------------------------- */

function scoreCuratedCandidate(context, topicKey, rule) {
  if (!passesCuratedEligibility(context, topicKey, rule)) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = 0;

  /* ----------------------------------------------
     Title evidence dominates
  ---------------------------------------------- */

  score += countMatches(context.primaryTitle, rule.subject) * 26;

  score += countMatches(context.primaryTitle, rule.scene) * 14;

  /* ----------------------------------------------
     Keywords only support
  ---------------------------------------------- */

  score += Math.min(countMatches(context.keywordText, rule.subject), 3) * 4;

  score += Math.min(countMatches(context.keywordText, rule.scene), 3) * 2;

  /* ----------------------------------------------
     Mars editorial ordering
  ---------------------------------------------- */

  if (topicKey === "mars") {
    const landscapeSignals = countMatches(
      context.primaryTitle,
      MARS_STRONG_SCENE_TERMS,
    );

    score += Math.min(landscapeSignals, 4) * 10;

    /*
      Clean environment words receive the highest
      extra ranking weight.
    */

    if (
      includesAny(context.primaryTitle, [
        "landscape",
        "horizon",
        "terrain",
        "vista",
      ])
    ) {
      score += 24;
    }

    /*
      Strong Martian geography.
    */

    if (
      includesAny(context.primaryTitle, [
        "dune",
        "crater",
        "ridge",
        "valley",
        "mountain",
        "hill",
        "butte",
        "plain",
        "outcrop",
      ])
    ) {
      score += 16;
    }

    /*
      Modern rover source gets only a small bonus.

      The rover should never become more important
      than the landscape itself.
    */

    if (includesAny(context.primaryTitle, ["curiosity", "perseverance"])) {
      score += 4;
    }

    /*
      Panoramas are allowed but deliberately do not
      receive an advantage.

      This pushes cleaner single-scene images higher.
    */

    if (includesAny(context.primaryTitle, ["panorama", "panoramic"])) {
      score -= 8;
    }

    /*
      Rover / mission-documentary language receives
      a small penalty.

      This still allows:

      Curiosity Captures Mars Landscape While Talking
      to an Orbiter

      because the visible landscape is genuinely
      relevant.
    */

    if (
      includesAny(context.primaryTitle, [
        "rover",
        "mission",
        "talking to an orbiter",
      ])
    ) {
      score -= 4;
    }

    if (includesAny(context.primaryTitle, ["mars", "martian"])) {
      score += 6;
    }
  }

  return score;
}

function rankCuratedResults(items, topicKey, rule) {
  return items
    .map((result, index) => {
      const context = createRecordContext(result, index);

      return {
        result,

        index,

        score: scoreCuratedCandidate(context, topicKey, rule),
      };
    })

    .filter(({ score }) => {
      return Number.isFinite(score) && score >= rule.minScore;
    })

    .sort((first, second) => {
      return second.score - first.score || first.index - second.index;
    })

    .slice(0, MAX_CURATED_RANKED_CANDIDATES)

    .map(({ result }) => result);
}

/* --------------------------------------------------
   Deduplication
-------------------------------------------------- */

function getVisualSignature(title) {
  return normaliseText(title)
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\benhanced color\b/g, "")
    .replace(/\benhanced colour\b/g, "")
    .replace(/\btrue color\b/g, "")
    .replace(/\btrue colour\b/g, "")
    .replace(/\bcolor\b/g, "")
    .replace(/\bcolour\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function deduplicateResults(items) {
  const ids = new Set();

  const urls = new Set();

  const titles = new Set();

  const visualSignatures = new Set();

  const unique = [];

  for (const item of items) {
    const id = normaliseText(item?.nasaId);

    const url = normaliseText(item?.imageUrl);

    const title = normaliseText(item?.title);

    const visualSignature = getVisualSignature(item?.title);

    const duplicate =
      (id && ids.has(id)) ||
      (url && urls.has(url)) ||
      (title && titles.has(title)) ||
      (visualSignature.length >= 18 && visualSignatures.has(visualSignature));

    if (duplicate) {
      continue;
    }

    if (id) {
      ids.add(id);
    }

    if (url) {
      urls.add(url);
    }

    if (title) {
      titles.add(title);
    }

    if (visualSignature.length >= 18) {
      visualSignatures.add(visualSignature);
    }

    unique.push(item);
  }

  return unique;
}

/* --------------------------------------------------
   Curated retrieval
-------------------------------------------------- */

async function searchCuratedCandidates(rule, signal) {
  const requests = rule.queries.map((query) => {
    return searchNasaImages(query, {
      signal,

      /*
              Important:
              Mars can now use its own candidate
              page size without changing the other
              curated topics.
            */

      pageSize: rule.pageSize ?? CURATED_RESULTS_PER_QUERY,

      searchMode: SEARCH_MODES.TEXT,
    });
  });

  const settled = await Promise.allSettled(requests);

  if (signal.aborted) {
    throw new DOMException("Search aborted", "AbortError");
  }

  const successful = settled.filter((entry) => {
    return entry.status === "fulfilled";
  });

  if (successful.length === 0) {
    const failure = settled.find((entry) => {
      return entry.status === "rejected";
    });

    throw failure?.reason ?? new Error("NASA curated search failed.");
  }

  return deduplicateResults(
    successful.flatMap((entry) => {
      return entry.value?.items ?? [];
    }),
  );
}

/* --------------------------------------------------
   Safe remote URL
-------------------------------------------------- */

function getSafeRemoteUrl(value) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}

/* --------------------------------------------------
   Image preflight

   IMPORTANT:

   Do NOT set:

   image.crossOrigin = "anonymous"

   and do NOT fetch the NASA image manually.

   NASA image assets do not consistently return the
   CORS headers needed for pixel inspection.

   That was the cause of your earlier:

   blocked by CORS policy

   errors.

   We therefore safely check:

   - URL
   - actual image load
   - natural dimensions
   - aspect ratio

   Mars receives slightly stricter values.
-------------------------------------------------- */

function verifyImagePreview(result, signal, topicKey) {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve(false);

      return;
    }

    const url = getSafeRemoteUrl(result?.imageUrl);

    if (!url) {
      resolve(false);

      return;
    }

    const image = new Image();

    let finished = false;

    let timeoutId = null;

    const finish = (usable) => {
      if (finished) {
        return;
      }

      finished = true;

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      image.onload = null;

      image.onerror = null;

      signal.removeEventListener("abort", onAbort);

      resolve(usable);
    };

    const onAbort = () => {
      finish(false);

      image.src = "";
    };

    timeoutId = window.setTimeout(() => {
      finish(false);

      image.src = "";
    }, IMAGE_PREFLIGHT_TIMEOUT_MS);

    image.onload = () => {
      const ratio = image.naturalWidth / image.naturalHeight;

      /*
          Mars gets a slightly stricter preflight.

          This will not detect every black stitched
          region because that would require reading
          cross-origin pixels, but it removes undersized
          and extreme-format previews safely.
        */

      if (topicKey === "mars") {
        const largeEnough =
          image.naturalWidth >= MARS_MIN_PREVIEW_WIDTH &&
          image.naturalHeight >= MARS_MIN_PREVIEW_HEIGHT;

        const saneRatio =
          ratio >= MARS_MIN_ASPECT_RATIO && ratio <= MARS_MAX_ASPECT_RATIO;

        finish(largeEnough && saneRatio);

        return;
      }

      const largeEnough =
        image.naturalWidth >= MIN_PREVIEW_WIDTH &&
        image.naturalHeight >= MIN_PREVIEW_HEIGHT;

      const saneRatio = ratio >= 0.55 && ratio <= 4.5;

      finish(largeEnough && saneRatio);
    };

    image.onerror = () => {
      /*
          A failed NASA preview is not an application
          error.

          Simply discard it.
        */

      finish(false);
    };

    signal.addEventListener("abort", onAbort, {
      once: true,
    });

    image.src = url;
  });
}

/* --------------------------------------------------
   Image filter
-------------------------------------------------- */

async function filterUsablePreviews(rankedItems, signal, maxResults, topicKey) {
  const accepted = [];

  const limit = Math.min(
    Math.max(maxResults ?? MAX_DISPLAY_RESULTS, 1),

    MAX_DISPLAY_RESULTS,
  );

  for (
    let start = 0;
    start < rankedItems.length && accepted.length < limit;
    start += IMAGE_PREFLIGHT_BATCH_SIZE
  ) {
    if (signal.aborted) {
      throw new DOMException("Search aborted", "AbortError");
    }

    const batch = rankedItems.slice(
      start,

      start + IMAGE_PREFLIGHT_BATCH_SIZE,
    );

    const checked = await Promise.all(
      batch.map(async (result) => {
        return {
          result,

          usable: await verifyImagePreview(
            result,

            signal,

            topicKey,
          ),
        };
      }),
    );

    for (const item of checked) {
      if (item.usable) {
        accepted.push(item.result);
      }

      if (accepted.length >= limit) {
        break;
      }
    }
  }

  if (signal.aborted) {
    throw new DOMException("Search aborted", "AbortError");
  }

  return accepted;
}

/* --------------------------------------------------
   UI state
-------------------------------------------------- */

function hideAllStates() {
  initialState.hidden = true;

  loadingState.hidden = true;

  emptyState.hidden = true;

  errorState.hidden = true;

  resultsHeader.hidden = true;
}

function clearResults() {
  resultsContainer.replaceChildren();

  resultsCount.textContent = "";
}

function showState(state) {
  hideAllStates();

  if (state === SEARCH_STATES.INITIAL) {
    initialState.hidden = false;
  }

  if (state === SEARCH_STATES.LOADING) {
    loadingState.hidden = false;
  }

  if (state === SEARCH_STATES.EMPTY) {
    emptyState.hidden = false;
  }

  if (state === SEARCH_STATES.ERROR) {
    errorState.hidden = false;
  }

  if (state === SEARCH_STATES.RESULTS) {
    resultsHeader.hidden = false;
  }

  if (state !== SEARCH_STATES.RESULTS) {
    clearResults();
  }
}

function setGuidance(message, isError = false) {
  searchGuidance.textContent = message;

  searchGuidance.dataset.state = isError ? "error" : "default";
}

/* --------------------------------------------------
   URL state
-------------------------------------------------- */

function updateUrlQuery(query) {
  const url = new URL(window.location.href);

  if (query) {
    url.searchParams.set("q", query);
  } else {
    url.searchParams.delete("q");
  }

  window.history.replaceState({}, "", url);
}

/* --------------------------------------------------
   Topic button state
-------------------------------------------------- */

function updateTopicSelection(query) {
  const selectedTopic = getCanonicalTopic(query);

  topicButtons.forEach((button) => {
    const topic = normaliseQuery(button.dataset.topic);

    const selected =
      selectedTopic !== null &&
      topic.toLowerCase() === selectedTopic.toLowerCase();

    button.setAttribute(
      "aria-pressed",

      String(selected),
    );
  });
}

/* --------------------------------------------------
   Image fallback
-------------------------------------------------- */

function createImageFallback(title) {
  const fallback = document.createElement("div");

  fallback.className = "media-card__image-fallback";

  fallback.setAttribute("role", "img");

  fallback.setAttribute(
    "aria-label",

    `Image unavailable for ${title}`,
  );

  const label = document.createElement("span");

  label.textContent = "Image unavailable";

  fallback.append(label);

  return fallback;
}

/* --------------------------------------------------
   Result card
-------------------------------------------------- */

function createResultCard(result) {
  const article = document.createElement("article");

  article.className = "media-card";

  article.dataset.nasaId = result.nasaId ?? "";

  const fullTitle =
    typeof result.title === "string" && result.title.trim()
      ? result.title.trim()
      : "Untitled NASA image";

  const media = document.createElement("div");

  media.className = "media-card__media";

  const imageUrl = getSafeRemoteUrl(result.imageUrl);

  if (imageUrl) {
    const image = document.createElement("img");

    image.className = "media-card__image";

    image.src = imageUrl;

    image.alt = fullTitle;

    image.width = 640;

    image.height = 400;

    image.loading = "lazy";

    image.decoding = "async";

    image.addEventListener(
      "error",

      () => {
        image.replaceWith(createImageFallback(fullTitle));
      },

      {
        once: true,
      },
    );

    media.append(image);
  } else {
    media.append(createImageFallback(fullTitle));
  }

  const body = document.createElement("div");

  body.className = "media-card__body";

  const info = document.createElement("div");

  const title = document.createElement("h3");

  title.className = "media-card__title";

  title.textContent = getDisplayTitle(fullTitle);

  title.title = fullTitle;

  title.setAttribute("aria-label", fullTitle);

  const source = document.createElement("p");

  source.className = "media-card__source";

  source.textContent = result.center || "NASA";

  info.append(title, source);

  body.append(info);

  article.append(media, body);

  return article;
}

/* --------------------------------------------------
   Render results
-------------------------------------------------- */

function renderResults(items, { curated = false, totalHits = 0 } = {}) {
  const fragment = document.createDocumentFragment();

  for (const result of items) {
    fragment.append(createResultCard(result));
  }

  resultsContainer.replaceChildren(fragment);

  const count = items.length;

  if (curated) {
    resultsCount.textContent = `${count} curated NASA ${
      count === 1 ? "image" : "images"
    }`;

    return;
  }

  const total = new Intl.NumberFormat().format(totalHits);

  resultsCount.textContent =
    totalHits > count
      ? `${count} shown of ${total} results`
      : `${count} ${count === 1 ? "result" : "results"}`;
}

/* --------------------------------------------------
   Blank search
-------------------------------------------------- */

function handleBlankSearch() {
  currentSearchTerm = "";

  updateTopicSelection("");

  if (activeController) {
    activeController.abort();

    activeController = null;
  }

  updateUrlQuery("");

  setGuidance(
    "Enter a keyword or choose one of the popular topics before searching.",

    true,
  );

  showState(SEARCH_STATES.INITIAL);

  searchInput.focus();
}

/* --------------------------------------------------
   Main search
-------------------------------------------------- */

async function runSearch(query, { updateUrl = true } = {}) {
  const cleanedQuery = normaliseQuery(query);

  if (!cleanedQuery) {
    handleBlankSearch();

    return;
  }

  const topicRule = getTopicRule(cleanedQuery);

  const finalQuery = topicRule?.canonical ?? cleanedQuery;

  const topicKey = topicRule ? normaliseText(topicRule.canonical) : null;

  currentSearchTerm = finalQuery;

  searchInput.value = finalQuery;

  updateTopicSelection(finalQuery);

  if (updateUrl) {
    updateUrlQuery(finalQuery);
  }

  if (activeController) {
    activeController.abort();
  }

  const controller = new AbortController();

  activeController = controller;

  const requestId = ++latestRequestId;

  let requestTimedOut = false;

  const timeoutId = window.setTimeout(
    () => {
      requestTimedOut = true;

      controller.abort();
    },

    REQUEST_TIMEOUT_MS,
  );

  loadingTitle.textContent = topicRule
    ? `Curating NASA imagery for “${finalQuery}”…`
    : `Searching NASA images for “${finalQuery}”…`;

  setGuidance(
    topicRule
      ? `Selecting visually relevant NASA imagery for “${finalQuery}”…`
      : `Searching NASA images for “${finalQuery}”…`,
  );

  showState(SEARCH_STATES.LOADING);

  try {
    let displayItems = [];

    let totalHits = 0;

    /* ----------------------------------------------
       Curated topic
    ---------------------------------------------- */

    if (topicRule) {
      const candidates = await searchCuratedCandidates(
        topicRule,

        controller.signal,
      );

      if (requestId !== latestRequestId) {
        return;
      }

      const ranked = rankCuratedResults(
        candidates,

        topicKey,

        topicRule,
      );

      displayItems = await filterUsablePreviews(
        ranked,

        controller.signal,

        topicRule.maxResults,

        topicKey,
      );

      if (requestId !== latestRequestId) {
        return;
      }
    } else {
      /* ----------------------------------------------
         Normal free-text search
      ---------------------------------------------- */

      const result = await searchNasaImages(
        finalQuery,

        {
          signal: controller.signal,

          pageSize: STANDARD_RESULT_LIMIT,

          searchMode: SEARCH_MODES.TEXT,
        },
      );

      if (requestId !== latestRequestId) {
        return;
      }

      displayItems = (result.items ?? []).slice(0, MAX_DISPLAY_RESULTS);

      totalHits = result.totalHits ?? 0;
    }

    /* ----------------------------------------------
       Empty
    ---------------------------------------------- */

    if (displayItems.length === 0) {
      emptyTitle.textContent = topicRule
        ? `No strong visual results found for “${finalQuery}”.`
        : `No images found for “${finalQuery}”.`;

      setGuidance(
        topicRule
          ? `NASA returned records for “${finalQuery}”, but none met ORBIT's visual quality threshold. Try another topic or keyword.`
          : `No NASA images were found for “${finalQuery}”. Try another keyword.`,
      );

      showState(SEARCH_STATES.EMPTY);

      return;
    }

    /* ----------------------------------------------
       Success
    ---------------------------------------------- */

    renderResults(
      displayItems,

      {
        curated: Boolean(topicRule),

        totalHits,
      },
    );

    setGuidance(
      topicRule
        ? `Showing ORBIT's curated NASA imagery for “${finalQuery}”.`
        : `Showing NASA image results for “${finalQuery}”.`,
    );

    showState(SEARCH_STATES.RESULTS);
  } catch (error) {
    if (requestId !== latestRequestId) {
      return;
    }

    if (error?.name === "AbortError" && !requestTimedOut) {
      return;
    }

    if (requestTimedOut) {
      errorMessage.textContent =
        "The NASA request took too long. Your search has been kept so you can try again.";

      setGuidance(
        `The search for “${finalQuery}” timed out. You can retry.`,

        true,
      );
    } else {
      errorMessage.textContent =
        "Your search has been kept. You can retry or edit the query.";

      setGuidance(
        `NASA could not be reached for “${finalQuery}”. You can retry.`,

        true,
      );

      console.error(
        "ORBIT NASA search failed:",

        error,
      );
    }

    showState(SEARCH_STATES.ERROR);
  } finally {
    window.clearTimeout(timeoutId);

    if (requestId === latestRequestId) {
      activeController = null;
    }
  }
}

/* --------------------------------------------------
   Form
-------------------------------------------------- */

function handleSearchSubmit(event) {
  event.preventDefault();

  const query = normaliseQuery(searchInput.value);

  if (!query) {
    handleBlankSearch();

    return;
  }

  runSearch(query);
}

/* --------------------------------------------------
   Topic click
-------------------------------------------------- */

function handleTopicSelection(event) {
  const topic = normaliseQuery(event.currentTarget.dataset.topic);

  if (!topic) {
    return;
  }

  searchInput.value = topic;

  runSearch(topic);
}

/* --------------------------------------------------
   Retry
-------------------------------------------------- */

function handleRetry() {
  if (!currentSearchTerm) {
    showState(SEARCH_STATES.INITIAL);

    searchInput.focus();

    return;
  }

  runSearch(currentSearchTerm);
}

/* --------------------------------------------------
   URL query
-------------------------------------------------- */

function getQueryFromUrl() {
  const params = new URLSearchParams(window.location.search);

  return normaliseQuery(params.get("q") ?? "");
}

/* --------------------------------------------------
   Events
-------------------------------------------------- */

searchForm.addEventListener("submit", handleSearchSubmit);

topicButtons.forEach((button) => {
  button.setAttribute("aria-pressed", "false");

  button.addEventListener("click", handleTopicSelection);
});

retryButton.addEventListener("click", handleRetry);

/* --------------------------------------------------
   Initialise
-------------------------------------------------- */

function initialiseExplore() {
  const queryFromUrl = getQueryFromUrl();

  if (queryFromUrl) {
    const topicRule = getTopicRule(queryFromUrl);

    const finalQuery = topicRule?.canonical ?? queryFromUrl;

    currentSearchTerm = finalQuery;

    searchInput.value = finalQuery;

    updateTopicSelection(finalQuery);

    runSearch(
      finalQuery,

      {
        updateUrl: false,
      },
    );

    return;
  }

  updateTopicSelection("");

  showState(SEARCH_STATES.INITIAL);
}

initialiseExplore();
