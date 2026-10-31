const STORAGE_KEY = "orbit:saved:v1";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normaliseId(value) {
  return cleanString(value).toLowerCase();
}

function normaliseKeywords(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const uniqueKeywords = new Set();

  for (const keyword of value) {
    const cleaned = cleanString(keyword);

    if (cleaned) {
      uniqueKeywords.add(cleaned);
    }
  }

  return [...uniqueKeywords];
}

function getTimestamp(value) {
  const cleaned = cleanString(value);

  if (!cleaned) {
    return 0;
  }

  const timestamp = Date.parse(cleaned);

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function normaliseStoredItem(item) {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return null;
  }

  const nasaId = cleanString(item.nasaId ?? item.nasa_id);
  const title = cleanString(item.title);

  if (!nasaId || !title) {
    return null;
  }

  return {
    nasaId,
    title,
    imageUrl: cleanString(item.imageUrl),
    center: cleanString(item.center) || "NASA",
    dateCreated: cleanString(
      item.dateCreated ?? item.date_created ?? item.date,
    ),
    description: cleanString(
      item.description ?? item.description508 ?? item.description_508,
    ),
    keywords: normaliseKeywords(item.keywords),
    savedAt: cleanString(item.savedAt),
  };
}

function createSavedRecord(item) {
  const stored = normaliseStoredItem(item);

  if (!stored) {
    return null;
  }

  return {
    ...stored,
    savedAt: new Date().toISOString(),
  };
}

function sortNewestFirst(items) {
  return [...items].sort((first, second) => {
    return getTimestamp(second.savedAt) - getTimestamp(first.savedAt);
  });
}

function deduplicateSavedItems(items) {
  const sorted = sortNewestFirst(items);
  const seenIds = new Set();
  const unique = [];

  for (const item of sorted) {
    const id = normaliseId(item.nasaId);

    if (!id || seenIds.has(id)) {
      continue;
    }

    seenIds.add(id);
    unique.push(item);
  }

  return unique;
}

function getLocalStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readStorage() {
  const storage = getLocalStorage();

  if (!storage) {
    return {
      ok: false,
      items: [],
    };
  }

  let rawValue = null;

  try {
    rawValue = storage.getItem(STORAGE_KEY);
  } catch {
    return {
      ok: false,
      items: [],
    };
  }

  if (!rawValue) {
    return {
      ok: true,
      items: [],
    };
  }

  let parsedValue;

  try {
    parsedValue = JSON.parse(rawValue);
  } catch {
    return {
      ok: true,
      items: [],
    };
  }

  if (!Array.isArray(parsedValue)) {
    return {
      ok: true,
      items: [],
    };
  }

  const validItems = parsedValue.map(normaliseStoredItem).filter(Boolean);

  return {
    ok: true,
    items: deduplicateSavedItems(validItems),
  };
}

function writeStorage(items) {
  const storage = getLocalStorage();

  if (!storage) {
    return false;
  }

  const safeItems = deduplicateSavedItems(
    items.map(normaliseStoredItem).filter(Boolean),
  );

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(safeItems));

    window.dispatchEvent(
      new CustomEvent("orbit:saved-changed", {
        detail: {
          count: safeItems.length,
        },
      }),
    );

    return true;
  } catch {
    return false;
  }
}

export function getSavedItems() {
  const result = readStorage();

  return result.items;
}

export function isItemSaved(nasaId) {
  const targetId = normaliseId(nasaId);

  if (!targetId) {
    return false;
  }

  return getSavedItems().some((item) => {
    return normaliseId(item.nasaId) === targetId;
  });
}

export function saveItem(item) {
  const record = createSavedRecord(item);

  if (!record) {
    return {
      ok: false,
      saved: false,
      added: false,
      item: null,
      reason: "invalid-item",
    };
  }

  const stored = readStorage();

  if (!stored.ok) {
    return {
      ok: false,
      saved: false,
      added: false,
      item: null,
      reason: "storage-unavailable",
    };
  }

  const targetId = normaliseId(record.nasaId);

  const existing = stored.items.find((savedItem) => {
    return normaliseId(savedItem.nasaId) === targetId;
  });

  if (existing) {
    return {
      ok: true,
      saved: true,
      added: false,
      item: existing,
    };
  }

  const nextItems = [record, ...stored.items];
  const written = writeStorage(nextItems);

  if (!written) {
    return {
      ok: false,
      saved: false,
      added: false,
      item: null,
      reason: "storage-write-failed",
    };
  }

  return {
    ok: true,
    saved: true,
    added: true,
    item: record,
  };
}

export function removeSavedItem(nasaId) {
  const targetId = normaliseId(nasaId);

  if (!targetId) {
    return {
      ok: false,
      removed: false,
      item: null,
      reason: "invalid-id",
    };
  }

  const stored = readStorage();

  if (!stored.ok) {
    return {
      ok: false,
      removed: false,
      item: null,
      reason: "storage-unavailable",
    };
  }

  const existing = stored.items.find((item) => {
    return normaliseId(item.nasaId) === targetId;
  });

  if (!existing) {
    return {
      ok: true,
      removed: false,
      item: null,
    };
  }

  const nextItems = stored.items.filter((item) => {
    return normaliseId(item.nasaId) !== targetId;
  });

  const written = writeStorage(nextItems);

  if (!written) {
    return {
      ok: false,
      removed: false,
      item: null,
      reason: "storage-write-failed",
    };
  }

  return {
    ok: true,
    removed: true,
    item: existing,
  };
}

export function toggleSavedItem(item) {
  const nasaId = cleanString(item?.nasaId ?? item?.nasa_id);

  if (!nasaId) {
    return {
      ok: false,
      saved: false,
      item: null,
      reason: "invalid-item",
    };
  }

  if (isItemSaved(nasaId)) {
    const removal = removeSavedItem(nasaId);

    if (!removal.ok) {
      return {
        ok: false,
        saved: true,
        item: removal.item,
        reason: removal.reason ?? "storage-write-failed",
      };
    }

    return {
      ok: true,
      saved: false,
      item: null,
    };
  }

  const saved = saveItem(item);

  return {
    ok: saved.ok,
    saved: saved.saved,
    item: saved.item,
    ...(saved.reason
      ? {
          reason: saved.reason,
        }
      : {}),
  };
}
