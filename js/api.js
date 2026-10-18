/* --------------------------------------------------
   ORBIT NASA Image and Video Library API service
-------------------------------------------------- */

const NASA_IMAGES_BASE_URL = "https://images-api.nasa.gov";
const DEFAULT_PAGE_SIZE = 24;

/* --------------------------------------------------
   Search modes
-------------------------------------------------- */

export const SEARCH_MODES = Object.freeze({
  TEXT: "text",
  KEYWORD: "keyword",
});

/* --------------------------------------------------
   Custom API error
-------------------------------------------------- */

export class NasaApiError extends Error {
  constructor(message, options = {}) {
    super(message);

    this.name = "NasaApiError";
    this.status = options.status ?? null;
    this.cause = options.cause;
  }
}

/* --------------------------------------------------
   Query validation
-------------------------------------------------- */

function normaliseSearchQuery(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ");
}

/* --------------------------------------------------
   Page-size validation
-------------------------------------------------- */

function getSafePageSize(value) {
  if (!Number.isInteger(value)) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.min(Math.max(value, 1), 100);
}

/* --------------------------------------------------
   URL construction
-------------------------------------------------- */

function buildSearchUrl(
  query,
  { pageSize = DEFAULT_PAGE_SIZE, searchMode = SEARCH_MODES.TEXT } = {},
) {
  const cleanedQuery = normaliseSearchQuery(query);

  if (!cleanedQuery) {
    throw new NasaApiError("A search query is required.");
  }

  const safePageSize = getSafePageSize(pageSize);

  const url = new URL(`${NASA_IMAGES_BASE_URL}/search`);

  if (searchMode === SEARCH_MODES.KEYWORD) {
    url.searchParams.set("keywords", cleanedQuery);
  } else {
    url.searchParams.set("q", cleanedQuery);
  }

  /*
    ORBIT Explore is image-only.
  */
  url.searchParams.set("media_type", "image");

  url.searchParams.set("page_size", String(safePageSize));

  return url;
}

/* --------------------------------------------------
   NASA record helpers
-------------------------------------------------- */

function getFirstDataRecord(item) {
  if (!Array.isArray(item?.data) || item.data.length === 0) {
    return null;
  }

  return item.data[0];
}

/* --------------------------------------------------
   Preview image
-------------------------------------------------- */

function getPreviewImage(item) {
  if (!Array.isArray(item?.links)) {
    return null;
  }

  /*
    Prefer NASA links explicitly marked as
    renderable images.
  */
  const renderedImage = item.links.find((link) => {
    return (
      link?.render === "image" &&
      typeof link?.href === "string" &&
      link.href.trim()
    );
  });

  if (renderedImage) {
    return renderedImage.href.trim();
  }

  /*
    Fallback only when NASA supplies an HTTP(S)
    image link without a render property.
  */
  const fallbackImage = item.links.find((link) => {
    if (typeof link?.href !== "string") {
      return false;
    }

    const href = link.href.trim();

    return href.startsWith("https://") || href.startsWith("http://");
  });

  return fallbackImage?.href?.trim() ?? null;
}

/* --------------------------------------------------
   Description
-------------------------------------------------- */

function getDescription(data) {
  if (typeof data?.description === "string" && data.description.trim()) {
    return data.description.trim();
  }

  if (
    typeof data?.description_508 === "string" &&
    data.description_508.trim()
  ) {
    return data.description_508.trim();
  }

  return "";
}

/* --------------------------------------------------
   Keywords
-------------------------------------------------- */

function getKeywords(data) {
  if (!Array.isArray(data?.keywords)) {
    return [];
  }

  return data.keywords
    .filter((keyword) => typeof keyword === "string")
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

/* --------------------------------------------------
   String helper
-------------------------------------------------- */

function cleanString(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

/* --------------------------------------------------
   Result mapping
-------------------------------------------------- */

function mapNasaItem(item) {
  const data = getFirstDataRecord(item);

  if (!data) {
    return null;
  }

  const nasaId = cleanString(data.nasa_id);

  const title = cleanString(data.title);

  if (!nasaId || !title) {
    return null;
  }

  return {
    nasaId,

    title,

    description: getDescription(data),

    dateCreated: cleanString(data.date_created),

    center: cleanString(data.center) || "NASA",

    mediaType: cleanString(data.media_type) || "image",

    keywords: getKeywords(data),

    imageUrl: getPreviewImage(item),

    assetManifestUrl: cleanString(item?.href) || null,
  };
}

/* --------------------------------------------------
   Search-response mapping
-------------------------------------------------- */

function mapSearchResponse(payload) {
  const collection = payload?.collection;

  if (!collection || !Array.isArray(collection.items)) {
    throw new NasaApiError("NASA returned an unexpected response.");
  }

  const items = collection.items.map(mapNasaItem).filter(Boolean);

  const rawTotalHits = Number(collection?.metadata?.total_hits);

  const totalHits = Number.isFinite(rawTotalHits) ? rawTotalHits : items.length;

  return {
    items,
    totalHits,
  };
}

/* --------------------------------------------------
   Public NASA image search
-------------------------------------------------- */

export async function searchNasaImages(
  query,
  { signal, pageSize = DEFAULT_PAGE_SIZE, searchMode = SEARCH_MODES.TEXT } = {},
) {
  const url = buildSearchUrl(query, {
    pageSize,
    searchMode,
  });

  let response;

  try {
    response = await fetch(url, {
      method: "GET",

      headers: {
        Accept: "application/json",
      },

      signal,
    });
  } catch (error) {
    /*
      AbortController cancellation is expected
      during rapid searches and timeouts.
    */
    if (error?.name === "AbortError") {
      throw error;
    }

    throw new NasaApiError("Unable to connect to the NASA Image Library.", {
      cause: error,
    });
  }

  if (!response.ok) {
    throw new NasaApiError(
      `NASA Image Library request failed with status ${response.status}.`,
      {
        status: response.status,
      },
    );
  }

  let payload;

  try {
    payload = await response.json();
  } catch (error) {
    throw new NasaApiError("NASA returned a response that could not be read.", {
      status: response.status,
      cause: error,
    });
  }

  return mapSearchResponse(payload);
}
