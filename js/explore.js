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
   Details DOM
-------------------------------------------------- */

const exploreHero = document.querySelector(".explore-hero");

const exploreResultsSection = document.querySelector(
  "#explore-results-section",
);

const detailsPanel = document.querySelector("#details-panel");

const detailsBackButton = document.querySelector("#details-back-button");

const detailsImage = document.querySelector("#details-image");

const detailsImageFallback = document.querySelector("#details-image-fallback");

const detailsTitle = document.querySelector("#details-title");
const detailsSource = document.querySelector("#details-source");
const detailsDate = document.querySelector("#details-date");
const detailsNasaId = document.querySelector("#details-nasa-id");

const detailsDescription = document.querySelector("#details-description");

const detailsSourceLink = document.querySelector("#details-source-link");

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

const MARS_MIN_PREVIEW_WIDTH = 420;
const MARS_MIN_PREVIEW_HEIGHT = 220;

const MARS_MIN_ASPECT_RATIO = 0.72;
const MARS_MAX_ASPECT_RATIO = 2.8;

const MAX_CARD_TITLE_CHARACTERS = 110;
const PRIMARY_TITLE_CHARACTER_LIMIT = 220;

const GENERIC_ARCHIVE_TITLE_PATTERN = /^[A-Z]{2,8}-\d{4}-\d+(?:-\d+)?$/i;

/*
  Step 8.2

  A search must contain at least one Unicode letter
  or number.

  This prevents punctuation-only searches such as
  "!!!!!!!!" from being interpreted by NASA as a
  broad/empty search that returns thousands of
  unrelated records.

  Unicode property escapes also mean legitimate
  non-English letters remain searchable.
*/

const SEARCHABLE_CHARACTER_PATTERN = /[\p{L}\p{N}]/u;

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

  "curiosity rover on mount sharp, seen from mars orbit",

  "curiosity rover on mount sharp seen from mars orbit",

  "seen from mars orbit",

  "curiosity sends a postcard",

  "postcard from mount sharp",

  "curiosity's view of sand ridges and bolivar",

  "view of sand ridges and bolivar",

  /* Step 5A.2 */

  "crater rim and plain at head of 'perseverance valley'",

  "crater rim and plain at head of perseverance valley",

  "rock stripes pattern in mars' 'perseverance valley'",

  "rock stripes pattern in mars' perseverance valley",

  "rock stripes pattern",

  "rendering of mars hill in death valley national park",

  "murray ridge on rim of endeavour crater",

  "shadows draw attention to features of mars landscape sand ripples",

  "high-resolution mosaic",

  "high resolution mosaic",

  "micro-imager view",

  "micro imager view",

  "researchers test mars drone software",

  /* Step 5A.3 */

  "oblique view of gale crater",

  "with vertical exaggeration",

  "simulated view of gale crater lake",

  "simulated view of gale crater",

  "jezero crater as seen by esa's mars express orbiter",

  "jezero crater as seen by esas mars express orbiter",

  "gale crater, the selected landing site for curiosity",

  "gale crater the selected landing site for curiosity",

  "curiosity cradled by gale crater",

  "curiosity's chemcam views summit and cliffs beyond gale crater",

  "curiositys chemcam views summit and cliffs beyond gale crater",

  "perseverance's landing spot in jezero crater",

  "perseverances landing spot in jezero crater",

  /* Step 5A.4 */

  "perseverance's location at the base of jezero crater's rim",

  "perseverances location at the base of jezero craters rim",

  "location at the base of jezero crater's rim",

  "location at the base of jezero craters rim",

  "perseverance drills a rock on jezero crater rim",

  "drills a rock on jezero crater rim",

  "drills a rock",

  "perseverance rover landing ellipse in jezero crater",

  "rover landing ellipse in jezero crater",

  "landing ellipse in jezero crater",

  "curiosity gif shows drifting clouds over mars' mount sharp",

  "curiosity gif shows drifting clouds over mars mount sharp",

  "gif shows drifting clouds",

  "curiosity progress on route from glenelg to mount sharp",

  "progress on route from glenelg to mount sharp",

  "progress on route",

  "curiosity's proposed path up mount sharp",

  "curiositys proposed path up mount sharp",

  "proposed path up mount sharp",

  /* ----------------------------------------------
     Step 5A.5

     Final rover-arm / target documentation.
  ---------------------------------------------- */

  "curiosity arm over marimba target on mount sharp",

  "curiosity arm over marimba target",

  "arm over marimba target",

  "marimba target on mount sharp",

  "marimba target",
];

/* --------------------------------------------------
   Mars — category rejections
-------------------------------------------------- */

const MARS_REJECT_TERMS = [
  /* Older surface missions */

  "opportunity",
  "spirit",
  "pathfinder",
  "phoenix",

  /* Opportunity-era geography */

  "perseverance valley",
  "endeavour crater",
  "murray ridge",
  "cape byron",
  "winnemucca",

  /* Orbital missions */

  "mars odyssey",
  "odyssey all stars",
  "mars express",
  "mars express orbiter",
  "esa mars express",
  "esa's mars express",

  /* Earth test imagery */

  "death valley national park",
  "death valley",
  "drone software",
  "researchers test",
  "field testing",
  "field test",
  "rendering of mars",

  /* Simulated / reconstructed environments */

  "simulated view",
  "simulation",
  "simulated lake",
  "simulated crater",
  "computer-generated",
  "computer generated",
  "reconstruction",
  "reconstructed view",

  /* Oblique / exaggerated scientific views */

  "oblique view",
  "vertical exaggeration",
  "vertically exaggerated",
  "exaggerated relief",
  "perspective view",
  "perspective rendering",

  /* Landing-site documentation */

  "landing site",
  "landing-site",
  "landing spot",
  "landing zone",
  "selected landing site",
  "candidate landing site",
  "proposed landing site",
  "landing ellipse",
  "rover landing ellipse",

  /* Navigation / routes */

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

  "progress on route",

  "proposed path",

  "planned path",

  "route progress",

  /* Scientific mapping */

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

  /* Models */

  "terrain model",

  "digital terrain model",

  "digital elevation model",

  "elevation model",

  "topographic model",

  "3d terrain model",

  "3-d terrain model",

  /* Scientific presentation */

  "research panel",
  "comparison panel",

  "scientific figure",
  "research figure",

  "two types of",

  "campaign:",

  "annotated",

  /* Processed products */

  "stereo",

  "anaglyph",

  "polar projection",

  "round-horizon",
  "round horizon",

  "360-degree",
  "360 degree",

  "full-circle",
  "full circle",

  "mosaic",

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

  /* Instrument / close-detail products */

  "microscopic",
  "microscope",

  "micro-imager",
  "micro imager",

  "chemcam",

  "chem cam",

  "remote micro-imager",

  "remote micro imager",

  "soil close-up",
  "soil closeup",

  "close-up of",
  "close up of",

  "telephoto",

  "rock stripes pattern",

  "shadows draw attention to features",

  /* ----------------------------------------------
     Rover activity / hardware

     Step 5A.5 additions are deliberately narrow.
  ---------------------------------------------- */

  "curiosity arm over",

  "arm over marimba",

  "marimba target",

  "rover arm",

  "rover's arm",

  "robotic arm",

  "instrument arm",

  "drills a rock",

  "drilling a rock",

  "drilling rock",

  "location at the base",

  "rover location",

  "rover's location",

  "rover position",

  "rover's position",

  /* GIF/media products */

  "gif shows",

  "animated gif",

  "gif animation",

  /* Orbital / overhead products */

  "as seen by mars express",

  "as seen by esa",

  "seen by esa",

  "seen by mars express",

  "overhead view",

  "orbital perspective",

  "cradled by gale crater",

  /* Rover documentation */

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

  "curiosity tracks",

  "perseverance tracks",

  "tracks in hidden valley",

  "tracks across",

  "tracks on mars",

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

  /* Engineering */

  "instrument test",

  "calibration",

  "engineering model",

  "science target",

  "workspace",

  "checkout",

  "initial surface checkout",

  "briefing",

  /* Planning */

  "sample return landing site",

  "potential landing site",

  "will study",

  "will visit",

  /* Media */

  "movie",

  "animation",

  "timelapse",

  "time-lapse",

  "postcard",

  "sends a postcard",

  /* Orbital views */

  "seen from mars orbit",

  "seen from orbit",

  "from mars orbit",

  "view from mars orbit",

  "orbital view",

  "orbital image",

  /* Wrong subject */

  "asteroid",

  /* Remaining false positives */

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
   Mars — older / orbital mission metadata
-------------------------------------------------- */

const MARS_NON_SURFACE_DESCRIPTION_TERMS = [
  "mars exploration rover opportunity",

  "nasa's mars exploration rover opportunity",

  "nasa mars exploration rover opportunity",

  "opportunity rover",

  "opportunity's",

  "mars exploration rover spirit",

  "nasa's mars exploration rover spirit",

  "nasa mars exploration rover spirit",

  "spirit rover",

  "mars pathfinder",

  "pathfinder mission",

  "phoenix mars lander",

  "phoenix lander",

  "2001 mars odyssey",

  "mars odyssey spacecraft",

  "mars odyssey orbiter",

  "mars reconnaissance orbiter",

  "high resolution imaging science experiment",

  "high-resolution imaging science experiment",

  "mars global surveyor",

  "thermal emission imaging system",

  "mars express",

  "mars express orbiter",

  "esa's mars express",

  "european space agency's mars express",

  "high resolution stereo camera",

  "high-resolution stereo camera",
];

const MARS_NON_SURFACE_KEYWORD_TERMS = [
  "opportunity",
  "spirit",
  "pathfinder",
  "phoenix",

  "mars odyssey",

  "mars reconnaissance orbiter",

  "hirise",

  "mars global surveyor",

  "themis",

  "mars express",

  "hrsc",
];

/* --------------------------------------------------
   Mars — Earth-test metadata
-------------------------------------------------- */

const MARS_EARTH_TEST_TERMS = [
  "death valley",

  "death valley national park",

  "earth analog",

  "earth analogue",

  "mars analog",

  "mars analogue",

  "field test",

  "field testing",

  "test site",

  "drone software",

  "researchers test mars",

  "testing mars technology",
];

/* --------------------------------------------------
   Mars — technical / activity metadata
-------------------------------------------------- */

const MARS_TECHNICAL_METADATA_TERMS = [
  "vertical exaggeration",

  "vertically exaggerated",

  "simulated view",

  "simulation of",

  "computer-generated view",

  "computer generated view",

  "digital terrain model",

  "digital elevation model",

  "perspective view",

  "oblique perspective",

  "landing site",

  "landing-site",

  "landing spot",

  "selected landing site",

  "candidate landing site",

  "landing ellipse",

  "remote micro-imager",

  "remote micro imager",

  "chemcam",

  "chem cam",

  "progress on route",

  "proposed path",

  "planned path",

  "drills a rock",

  "drilling a rock",

  "rover location",

  "location at the base",

  "animated gif",

  "gif animation",

  /* Step 5A.5 */

  "curiosity arm over",

  "arm over marimba",

  "marimba target",

  "rover arm",

  "robotic arm",

  "instrument arm",
];

/* --------------------------------------------------
   Mars — Opportunity geography
-------------------------------------------------- */

const MARS_OPPORTUNITY_GEOGRAPHY = [
  "perseverance valley",

  "endeavour crater",

  "murray ridge",

  "cape byron",

  "winnemucca",
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

  [
    "mars",
    {
      canonical: "Mars",

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

      pageSize: 28,

      subject: ["mars", "martian", "curiosity", "perseverance"],

      scene: [...MARS_STRONG_SCENE_TERMS, "navcam", "mastcam", "mastcam-z"],

      reject: MARS_REJECT_TERMS,

      minScore: 22,

      maxResults: 12,
    },
  ],

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

let detailsReturnScrollY = 0;

let detailsReturnTrigger = null;

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

/* --------------------------------------------------
   Step 8.2 — meaningful search validation
-------------------------------------------------- */

function hasSearchableCharacters(value) {
  const query = normaliseQuery(value);

  return SEARCHABLE_CHARACTER_PATTERN.test(query);
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
  if (KNOWN_BAD_MARS_NASA_IDS.has(context.nasaId)) {
    return false;
  }

  if (includesAny(context.title, KNOWN_BAD_MARS_TITLE_FRAGMENTS)) {
    return false;
  }

  if (includesAny(context.title, MARS_REJECT_TERMS)) {
    return false;
  }

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

  const combinedMetadata = [
    context.primaryTitle,
    context.description,
    context.keywordText,
  ]
    .filter(Boolean)
    .join(" ");

  if (includesAny(combinedMetadata, MARS_OPPORTUNITY_GEOGRAPHY)) {
    return false;
  }

  if (includesAny(combinedMetadata, MARS_EARTH_TEST_TERMS)) {
    return false;
  }

  if (includesAny(combinedMetadata, MARS_TECHNICAL_METADATA_TERMS)) {
    return false;
  }

  const titleHasCuriosity = includesAny(context.primaryTitle, ["curiosity"]);

  const titleHasPerseverance = includesAny(context.primaryTitle, [
    "perseverance",
  ]);

  const modernRover = titleHasCuriosity || titleHasPerseverance;

  const titleHasMars = includesAny(context.primaryTitle, ["mars", "martian"]);

  const marsKeywords = includesAny(context.keywordText, [
    "mars",
    "martian",
    "mars surface",
    "mars science laboratory",
  ]);

  if (!titleHasMars && !(modernRover && marsKeywords)) {
    return false;
  }

  const nonSurfaceDescription = includesAny(
    context.description,
    MARS_NON_SURFACE_DESCRIPTION_TERMS,
  );

  const nonSurfaceKeywords = includesAny(
    context.keywordText,
    MARS_NON_SURFACE_KEYWORD_TERMS,
  );

  if (!modernRover && (nonSurfaceDescription || nonSurfaceKeywords)) {
    return false;
  }

  const landscapeEvidence = countMatches(
    context.primaryTitle,
    MARS_STRONG_SCENE_TERMS,
  );

  const namedTerrain = includesAny(context.primaryTitle, MARS_NAMED_TERRAIN);

  if (landscapeEvidence === 0 && !namedTerrain) {
    return false;
  }

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

  score += countMatches(context.primaryTitle, rule.subject) * 26;

  score += countMatches(context.primaryTitle, rule.scene) * 14;

  score += Math.min(countMatches(context.keywordText, rule.subject), 3) * 4;

  score += Math.min(countMatches(context.keywordText, rule.scene), 3) * 2;

  if (topicKey === "mars") {
    const landscapeSignals = countMatches(
      context.primaryTitle,
      MARS_STRONG_SCENE_TERMS,
    );

    score += Math.min(landscapeSignals, 4) * 10;

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

    if (includesAny(context.primaryTitle, ["curiosity", "perseverance"])) {
      score += 4;
    }

    if (includesAny(context.primaryTitle, ["panorama", "panoramic"])) {
      score -= 8;
    }

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
   NASA description HTML -> safe plain text
-------------------------------------------------- */

function htmlToPlainText(value) {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  const parser = new DOMParser();

  const documentFragment = parser.parseFromString(value, "text/html");

  documentFragment
    .querySelectorAll("script, style, noscript, template, svg")
    .forEach((element) => {
      element.remove();
    });

  documentFragment.querySelectorAll("br").forEach((element) => {
    element.replaceWith(documentFragment.createTextNode("\n"));
  });

  documentFragment
    .querySelectorAll(
      "p, div, section, article, li, h1, h2, h3, h4, h5, h6, blockquote",
    )
    .forEach((element) => {
      element.append(documentFragment.createTextNode("\n"));
    });

  const text = documentFragment.body.textContent ?? "";

  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* --------------------------------------------------
   Details helpers
-------------------------------------------------- */

function getResultTitle(result) {
  return typeof result?.title === "string" && result.title.trim()
    ? result.title.trim()
    : "Untitled NASA image";
}

function getResultDescription(result) {
  const candidates = [
    result?.description,
    result?.description508,
    result?.description_508,
  ];

  const description = candidates.find((value) => {
    return typeof value === "string" && value.trim();
  });

  if (!description) {
    return "No description is available for this NASA image.";
  }

  const cleaned = htmlToPlainText(description);

  return cleaned || "No description is available for this NASA image.";
}

function formatNasaDate(value) {
  if (typeof value !== "string" || !value.trim()) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.trim();
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function getNasaDetailsUrl(nasaId) {
  const id = typeof nasaId === "string" ? nasaId.trim() : "";

  if (!id) {
    return null;
  }

  return `https://images.nasa.gov/details/${encodeURIComponent(id)}`;
}

function resetDetailsImage() {
  detailsImage.onerror = null;

  detailsImage.removeAttribute("src");

  detailsImage.alt = "";

  detailsImage.hidden = true;

  detailsImage.style.display = "none";

  detailsImageFallback.hidden = true;
}

function setDetailsImage(result, fullTitle) {
  resetDetailsImage();

  const imageUrl = getSafeRemoteUrl(result?.imageUrl);

  detailsImageFallback.setAttribute(
    "aria-label",
    `Image unavailable for ${fullTitle}`,
  );

  if (!imageUrl) {
    detailsImageFallback.hidden = false;

    return;
  }

  detailsImage.alt = fullTitle;

  detailsImage.hidden = false;

  detailsImage.style.removeProperty("display");

  detailsImage.onerror = () => {
    detailsImage.hidden = true;

    detailsImage.style.display = "none";

    detailsImageFallback.hidden = false;
  };

  detailsImage.src = imageUrl;
}

/* --------------------------------------------------
   Step 5B.2
   Safe focus helper
-------------------------------------------------- */

function focusWithoutScroll(element) {
  if (!element || typeof element.focus !== "function") {
    return;
  }

  try {
    element.focus({
      preventScroll: true,
    });
  } catch {
    element.focus();
  }
}

/* --------------------------------------------------
   Step 5B.2
   Details panel accessibility setup
-------------------------------------------------- */

function configureDetailsPanel() {
  detailsPanel.setAttribute("tabindex", "-1");

  detailsPanel.setAttribute("aria-labelledby", "details-title");
}

/* --------------------------------------------------
   Populate Details
-------------------------------------------------- */

function populateDetails(result) {
  const fullTitle = getResultTitle(result);

  detailsTitle.textContent = fullTitle;

  detailsSource.textContent =
    typeof result?.center === "string" && result.center.trim()
      ? result.center.trim()
      : "NASA";

  detailsDate.textContent = formatNasaDate(
    result?.dateCreated ?? result?.date_created ?? result?.date ?? "",
  );

  const nasaId =
    typeof result?.nasaId === "string" && result.nasaId.trim()
      ? result.nasaId.trim()
      : "";

  detailsNasaId.textContent = nasaId || "Not available";

  detailsDescription.textContent = getResultDescription(result);

  setDetailsImage(result, fullTitle);

  const sourceUrl = getNasaDetailsUrl(nasaId);

  if (sourceUrl) {
    detailsSourceLink.href = sourceUrl;

    detailsSourceLink.hidden = false;
  } else {
    detailsSourceLink.removeAttribute("href");

    detailsSourceLink.hidden = true;
  }
}

/* --------------------------------------------------
   Step 5B.2
   Open Details
-------------------------------------------------- */

function openDetails(result, trigger) {
  if (!result || detailsPanel.hidden === false) {
    return;
  }

  /*
    Remember exactly where the user was before
    entering the Details view.
  */

  detailsReturnScrollY = window.scrollY;

  detailsReturnTrigger = trigger instanceof HTMLElement ? trigger : null;

  populateDetails(result);

  /*
    Hide the search/results view completely.
    The hidden attribute also removes those sections
    from the keyboard tab order and accessibility tree.
  */

  exploreHero.hidden = true;

  exploreResultsSection.hidden = true;

  detailsPanel.hidden = false;

  document.title = `${getResultTitle(result)} | ORBIT`;

  /*
    Details is a new in-page view.

    Start from the top without smooth scrolling so the
    user never lands halfway through the Details panel.
  */

  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "auto",
  });

  /*
    Move keyboard/screen-reader focus into the Details
    view after the browser has rendered it.
  */

  window.requestAnimationFrame(() => {
    focusWithoutScroll(detailsPanel);
  });
}

/* --------------------------------------------------
   Step 5B.2
   Close Details and restore previous state
-------------------------------------------------- */

function closeDetails() {
  if (detailsPanel.hidden) {
    return;
  }

  /*
    Keep local copies before clearing the stored state.
  */

  const returnScrollY = detailsReturnScrollY;

  const returnTrigger = detailsReturnTrigger;

  detailsReturnTrigger = null;

  detailsPanel.hidden = true;

  exploreHero.hidden = false;

  exploreResultsSection.hidden = false;

  document.title = "ORBIT | Explore";

  resetDetailsImage();

  /*
    Wait until the results layout is visible again,
    restore the previous scroll location, then restore
    keyboard focus to the exact Details link that
    opened the panel.
  */

  window.requestAnimationFrame(() => {
    window.scrollTo({
      top: returnScrollY,
      left: 0,
      behavior: "auto",
    });

    window.requestAnimationFrame(() => {
      if (returnTrigger?.isConnected) {
        focusWithoutScroll(returnTrigger);

        return;
      }

      /*
            Safe fallback if the original card was ever
            removed before Details closes.
          */

      focusWithoutScroll(searchInput);
    });
  });
}

/* --------------------------------------------------
   Step 5B.2
   Details Back control
-------------------------------------------------- */

function handleDetailsBack(event) {
  /*
    Prevent an accidental hash/page jump if the
    control is ever changed from a button to a link.
  */

  event.preventDefault();

  closeDetails();
}

/* --------------------------------------------------
   Step 5B.2
   Escape closes Details
-------------------------------------------------- */

function handleDetailsKeydown(event) {
  if (event.key !== "Escape" || detailsPanel.hidden) {
    return;
  }

  event.preventDefault();

  closeDetails();
}

/* --------------------------------------------------
   Image preflight
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

    const batch = rankedItems.slice(start, start + IMAGE_PREFLIGHT_BATCH_SIZE);

    const checked = await Promise.all(
      batch.map(async (result) => {
        return {
          result,

          usable: await verifyImagePreview(result, signal, topicKey),
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
   Topic state
-------------------------------------------------- */

function updateTopicSelection(query) {
  const selectedTopic = getCanonicalTopic(query);

  topicButtons.forEach((button) => {
    const topic = normaliseQuery(button.dataset.topic);

    const selected =
      selectedTopic !== null &&
      topic.toLowerCase() === selectedTopic.toLowerCase();

    button.setAttribute("aria-pressed", String(selected));
  });
}

/* --------------------------------------------------
   Image fallback
-------------------------------------------------- */

function createImageFallback(title) {
  const fallback = document.createElement("div");

  fallback.className = "media-card__image-fallback";

  fallback.setAttribute("role", "img");

  fallback.setAttribute("aria-label", `Image unavailable for ${title}`);

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

  const fullTitle = getResultTitle(result);

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

  /*
    Full title remains available to assistive
    technology without creating the browser-native
    title tooltip removed in Step 5B.1.
  */

  title.setAttribute("aria-label", fullTitle);

  const source = document.createElement("p");

  source.className = "media-card__source";

  source.textContent = result.center || "NASA";

  info.append(title, source);

  const actions = document.createElement("div");

  actions.className = "media-card__actions";

  const detailsLink = document.createElement("a");

  detailsLink.className = "media-card__details";

  detailsLink.href = "#details-panel";

  detailsLink.textContent = "Details";

  /*
    Tell assistive technology which in-page region
    this link opens.
  */

  detailsLink.setAttribute("aria-controls", "details-panel");

  detailsLink.setAttribute("aria-label", `View details for ${fullTitle}`);

  detailsLink.addEventListener("click", (event) => {
    /*
        Prevent the href="#details-panel" fallback
        from changing the hash or causing an unwanted
        browser jump.
      */

    event.preventDefault();

    openDetails(result, detailsLink);
  });

  actions.append(detailsLink);

  body.append(info, actions);

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
   Step 8.2
   Symbol-only / meaningless search
-------------------------------------------------- */

function handleInvalidSearch(query) {
  const cleanedQuery = normaliseQuery(query);

  currentSearchTerm = "";

  updateTopicSelection("");

  /*
    Cancel any previous request so stale NASA results
    cannot appear after this validation state.
  */

  if (activeController) {
    activeController.abort();

    activeController = null;
  }

  /*
    Invalidate any request that may already be
    completing in the background.
  */

  latestRequestId += 1;

  /*
    Invalid searches are not stored in the URL.

    The typed text stays in the input so the user can
    understand what needs to be corrected.
  */

  updateUrlQuery("");

  searchInput.value = cleanedQuery;

  setGuidance(
    "Enter at least one letter or number to search NASA images.",
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

  /*
    Step 8.2

    Do not send symbol-only searches to NASA.

    Examples blocked:
    !!!!!!!!
    @#$%^&*()
    ---
    ...

    Examples still allowed:
    Mars
    Mars???
    Mars 2026
    Apollo 11
    NGC 1300
    Mars🌌
    <script>alert(1)</script>

    The final example remains plain text because ORBIT
    renders returned/user-facing strings with
    textContent rather than innerHTML.
  */

  if (!hasSearchableCharacters(cleanedQuery)) {
    handleInvalidSearch(cleanedQuery);

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

  const timeoutId = window.setTimeout(() => {
    requestTimedOut = true;

    controller.abort();
  }, REQUEST_TIMEOUT_MS);

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

    if (topicRule) {
      const candidates = await searchCuratedCandidates(
        topicRule,
        controller.signal,
      );

      if (requestId !== latestRequestId) {
        return;
      }

      const ranked = rankCuratedResults(candidates, topicKey, topicRule);

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
      const result = await searchNasaImages(finalQuery, {
        signal: controller.signal,

        pageSize: STANDARD_RESULT_LIMIT,

        searchMode: SEARCH_MODES.TEXT,
      });

      if (requestId !== latestRequestId) {
        return;
      }

      displayItems = (result.items ?? []).slice(0, MAX_DISPLAY_RESULTS);

      totalHits = result.totalHits ?? 0;
    }

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

    renderResults(displayItems, {
      curated: Boolean(topicRule),

      totalHits,
    });

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

      console.error("ORBIT NASA search failed:", error);
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

detailsBackButton.addEventListener("click", handleDetailsBack);

document.addEventListener("keydown", handleDetailsKeydown);

/* --------------------------------------------------
   Initialise
-------------------------------------------------- */

function initialiseExplore() {
  /*
    Step 5B.2:
    Make the Details view programmatically focusable
    and associate it with its heading.
  */

  configureDetailsPanel();

  const queryFromUrl = getQueryFromUrl();

  if (queryFromUrl) {
    const topicRule = getTopicRule(queryFromUrl);

    const finalQuery = topicRule?.canonical ?? queryFromUrl;

    currentSearchTerm = finalQuery;

    searchInput.value = finalQuery;

    updateTopicSelection(finalQuery);

    runSearch(finalQuery, {
      updateUrl: false,
    });

    return;
  }

  updateTopicSelection("");

  showState(SEARCH_STATES.INITIAL);
}

initialiseExplore();
