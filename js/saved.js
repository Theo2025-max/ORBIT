/* --------------------------------------------------
   ORBIT Saved Page

   Renders and manages NASA images stored locally
   in the current browser/device.
-------------------------------------------------- */

import { getSavedItems, removeSavedItem } from "./storage.js";

/* --------------------------------------------------
   DOM references
-------------------------------------------------- */

const savedIntro = document.querySelector("#saved-intro");
const savedCount = document.querySelector("#saved-count");
const savedStatus = document.querySelector("#saved-status");
const emptyState = document.querySelector("#saved-empty-state");
const resultsSection = document.querySelector("#saved-results-section");
const savedGrid = document.querySelector("#saved-grid");

/* --------------------------------------------------
   Saved Details references
-------------------------------------------------- */

const detailsPanel = document.querySelector("#saved-details-panel");
const detailsBackButton = document.querySelector("#saved-details-back-button");
const detailsImage = document.querySelector("#saved-details-image");
const detailsImageFallback = document.querySelector(
  "#saved-details-image-fallback",
);
const detailsTitle = document.querySelector("#saved-details-title");
const detailsSource = document.querySelector("#saved-details-source");
const detailsDate = document.querySelector("#saved-details-date");
const detailsNasaId = document.querySelector("#saved-details-nasa-id");
const detailsDescription = document.querySelector("#saved-details-description");
const detailsSourceLink = document.querySelector("#saved-details-source-link");
const detailsRemoveButton = document.querySelector(
  "#saved-details-remove-button",
);

/* --------------------------------------------------
   Page state
-------------------------------------------------- */

let currentDetailsItem = null;
let detailsReturnTrigger = null;
let detailsReturnNasaId = "";
let detailsReturnIndex = 0;
let savedViewScrollY = 0;

/* --------------------------------------------------
   Local image fallback
-------------------------------------------------- */

const IMAGE_FALLBACK_URL = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="960"
    height="600"
    viewBox="0 0 960 600"
  >
    <rect width="960" height="600" fill="#17243a" />

    <circle
      cx="480"
      cy="240"
      r="78"
      fill="none"
      stroke="#2ee6d6"
      stroke-width="3"
      opacity="0.45"
    />

    <circle
      cx="480"
      cy="240"
      r="112"
      fill="none"
      stroke="#2ee6d6"
      stroke-width="2"
      opacity="0.2"
    />

    <text
      x="480"
      y="395"
      fill="#9aa7b8"
      font-family="Arial, sans-serif"
      font-size="30"
      text-anchor="middle"
    >
      Image unavailable
    </text>
  </svg>
`)}`;

/* --------------------------------------------------
   Helpers
-------------------------------------------------- */

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normaliseId(value) {
  return cleanString(value).toLowerCase();
}

function isDetailsOpen() {
  return Boolean(detailsPanel && !detailsPanel.hidden && currentDetailsItem);
}

function focusWithoutScroll(element) {
  if (!element) {
    return;
  }

  try {
    element.focus({ preventScroll: true });
  } catch {
    element.focus();
  }
}

function getSafeImageUrl(value) {
  const cleaned = cleanString(value);

  if (!cleaned) {
    return "";
  }

  try {
    const url = new URL(cleaned, window.location.href);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return "";
    }

    return url.href;
  } catch {
    return "";
  }
}

function formatSavedCount(count) {
  return count === 1 ? "1 saved image" : `${count} saved images`;
}

function formatDate(value) {
  const cleaned = cleanString(value);

  if (!cleaned) {
    return "Not available";
  }

  const date = new Date(cleaned);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function getNasaSourceUrl(nasaId) {
  const cleaned = cleanString(nasaId);

  if (!cleaned) {
    return "";
  }

  return `https://images.nasa.gov/details/${encodeURIComponent(cleaned)}`;
}

function announceStatus(message) {
  if (!savedStatus) {
    return;
  }

  savedStatus.textContent = "";

  window.requestAnimationFrame(() => {
    savedStatus.textContent = message;
  });
}

function updateSavedCount(count) {
  if (!savedCount) {
    return;
  }

  if (count === 0) {
    savedCount.textContent = "";
    savedCount.hidden = true;
    return;
  }

  savedCount.textContent = formatSavedCount(count);
  savedCount.hidden = false;
}

/* --------------------------------------------------
   Find a Saved card by NASA ID
-------------------------------------------------- */

function findCardByNasaId(nasaId) {
  if (!savedGrid) {
    return null;
  }

  const targetId = normaliseId(nasaId);

  if (!targetId) {
    return null;
  }

  const cards = savedGrid.querySelectorAll(".media-card");

  for (const card of cards) {
    if (normaliseId(card.dataset.nasaId) === targetId) {
      return card;
    }
  }

  return null;
}

/* --------------------------------------------------
   Resolve exact Details return target
-------------------------------------------------- */

function getDetailsReturnTarget() {
  if (detailsReturnTrigger && detailsReturnTrigger.isConnected) {
    return detailsReturnTrigger;
  }

  const card = findCardByNasaId(detailsReturnNasaId);

  return card?.querySelector(".media-card__details") ?? null;
}

/* --------------------------------------------------
   Card image creation
-------------------------------------------------- */

function createCardImage(item) {
  const image = document.createElement("img");

  image.className = "media-card__image";
  image.width = 640;
  image.height = 400;
  image.loading = "lazy";
  image.decoding = "async";

  const title = cleanString(item.title) || "NASA image";
  const imageUrl = getSafeImageUrl(item.imageUrl);

  image.alt = title;

  if (!imageUrl) {
    image.src = IMAGE_FALLBACK_URL;
    image.alt = `Image unavailable for ${title}`;
    return image;
  }

  image.addEventListener(
    "error",
    () => {
      if (image.src === IMAGE_FALLBACK_URL) {
        return;
      }

      image.src = IMAGE_FALLBACK_URL;
      image.alt = `Image unavailable for ${title}`;
    },
    { once: true },
  );

  image.src = imageUrl;

  return image;
}

/* --------------------------------------------------
   Details image
-------------------------------------------------- */

function showDetailsImage(item) {
  if (!detailsImage || !detailsImageFallback) {
    return;
  }

  const title = cleanString(item.title) || "NASA image";
  const imageUrl = getSafeImageUrl(item.imageUrl);

  detailsImage.onload = null;
  detailsImage.onerror = null;
  detailsImage.hidden = true;
  detailsImageFallback.hidden = true;
  detailsImage.removeAttribute("src");
  detailsImage.alt = "";

  if (!imageUrl) {
    detailsImageFallback.hidden = false;

    detailsImageFallback.setAttribute(
      "aria-label",
      `Image unavailable for ${title}`,
    );

    return;
  }

  detailsImage.onload = () => {
    detailsImageFallback.hidden = true;
    detailsImage.hidden = false;
  };

  detailsImage.onerror = () => {
    detailsImage.hidden = true;
    detailsImageFallback.hidden = false;

    detailsImageFallback.setAttribute(
      "aria-label",
      `Image unavailable for ${title}`,
    );
  };

  detailsImage.alt = title;
  detailsImage.src = imageUrl;
}

/* --------------------------------------------------
   Populate Saved Details
-------------------------------------------------- */

function populateSavedDetails(item) {
  const title = cleanString(item.title) || "Untitled NASA image";
  const source = cleanString(item.center) || "NASA";
  const nasaId = cleanString(item.nasaId);

  const description =
    cleanString(item.description) ||
    "No description is available for this image.";

  if (detailsTitle) {
    detailsTitle.textContent = title;
  }

  if (detailsSource) {
    detailsSource.textContent = source;
  }

  if (detailsDate) {
    detailsDate.textContent = formatDate(item.dateCreated);
  }

  if (detailsNasaId) {
    detailsNasaId.textContent = nasaId || "Not available";
  }

  if (detailsDescription) {
    detailsDescription.textContent = description;
  }

  showDetailsImage(item);

  if (detailsSourceLink) {
    const sourceUrl = getNasaSourceUrl(nasaId);

    if (sourceUrl) {
      detailsSourceLink.href = sourceUrl;
      detailsSourceLink.hidden = false;
    } else {
      detailsSourceLink.removeAttribute("href");
      detailsSourceLink.hidden = true;
    }
  }

  if (detailsRemoveButton) {
    detailsRemoveButton.setAttribute(
      "aria-label",
      `Remove ${title} from saved images`,
    );
  }
}

/* --------------------------------------------------
   Open Saved Details
-------------------------------------------------- */

function openSavedDetails(item, trigger, cardIndex) {
  currentDetailsItem = item;
  detailsReturnTrigger = trigger;
  detailsReturnNasaId = cleanString(item.nasaId);
  detailsReturnIndex = cardIndex;
  savedViewScrollY = window.scrollY;

  populateSavedDetails(item);

  if (trigger) {
    trigger.setAttribute("aria-expanded", "true");
  }

  if (savedIntro) {
    savedIntro.hidden = true;
  }

  if (emptyState) {
    emptyState.hidden = true;
  }

  if (resultsSection) {
    resultsSection.hidden = true;
  }

  if (detailsPanel) {
    detailsPanel.hidden = false;
  }

  window.scrollTo({
    top: 0,
    behavior: "auto",
  });

  window.requestAnimationFrame(() => {
    focusWithoutScroll(detailsPanel);
  });
}

/* --------------------------------------------------
   Restore Saved overview visibility
-------------------------------------------------- */

function restoreSavedOverview() {
  const items = getSavedItems();

  if (savedIntro) {
    savedIntro.hidden = false;
  }

  if (items.length === 0) {
    if (emptyState) {
      emptyState.hidden = false;
    }

    if (resultsSection) {
      resultsSection.hidden = true;
    }

    return;
  }

  if (emptyState) {
    emptyState.hidden = true;
  }

  if (resultsSection) {
    resultsSection.hidden = false;
  }
}

/* --------------------------------------------------
   Close Saved Details
-------------------------------------------------- */

function closeSavedDetails({ restoreFocus = true } = {}) {
  if (!isDetailsOpen()) {
    return;
  }

  const returnTarget = getDetailsReturnTarget();

  if (detailsReturnTrigger && detailsReturnTrigger.isConnected) {
    detailsReturnTrigger.setAttribute("aria-expanded", "false");
  }

  currentDetailsItem = null;

  if (detailsPanel) {
    detailsPanel.hidden = true;
  }

  restoreSavedOverview();

  window.scrollTo({
    top: savedViewScrollY,
    behavior: "auto",
  });

  if (restoreFocus && returnTarget) {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.scrollTo({
          top: savedViewScrollY,
          behavior: "auto",
        });

        focusWithoutScroll(returnTarget);
      });
    });
  }

  detailsReturnTrigger = null;
  detailsReturnNasaId = "";
}

/* --------------------------------------------------
   Focus after card removal
-------------------------------------------------- */

function restoreFocusAfterRemoval(removedIndex) {
  if (!savedGrid) {
    return;
  }

  const removeButtons = [...savedGrid.querySelectorAll(".saved-card__remove")];

  if (removeButtons.length > 0) {
    const targetIndex = Math.min(removedIndex, removeButtons.length - 1);

    focusWithoutScroll(removeButtons[targetIndex]);

    return;
  }

  const exploreLink = emptyState?.querySelector(".button");

  focusWithoutScroll(exploreLink);
}

/* --------------------------------------------------
   Focus after removing from Details
-------------------------------------------------- */

function restoreFocusAfterDetailsRemoval() {
  if (!savedGrid) {
    return;
  }

  const detailsButtons = [
    ...savedGrid.querySelectorAll(".media-card__details"),
  ];

  if (detailsButtons.length > 0) {
    const targetIndex = Math.min(detailsReturnIndex, detailsButtons.length - 1);

    focusWithoutScroll(detailsButtons[targetIndex]);

    return;
  }

  const exploreLink = emptyState?.querySelector(".button");

  focusWithoutScroll(exploreLink);
}

/* --------------------------------------------------
   Remove card item
-------------------------------------------------- */

function handleRemoveItem(item, cardIndex) {
  const title = cleanString(item.title) || "NASA image";

  const result = removeSavedItem(item.nasaId);

  if (!result.ok) {
    announceStatus(`"${title}" could not be removed from your saved images.`);

    return;
  }

  renderSavedItems({
    clearStatus: false,
  });

  announceStatus(`"${title}" was removed from your saved images.`);

  restoreFocusAfterRemoval(cardIndex);
}

/* --------------------------------------------------
   Saved card creation
-------------------------------------------------- */

function createSavedCard(item, cardIndex) {
  const card = document.createElement("article");

  card.className = "media-card saved-card";
  card.dataset.nasaId = item.nasaId;

  const media = document.createElement("div");

  media.className = "media-card__media";

  media.append(createCardImage(item));

  const body = document.createElement("div");

  body.className = "media-card__body";

  const information = document.createElement("div");

  const title = document.createElement("h3");

  title.className = "media-card__title";

  const titleText = cleanString(item.title) || "Untitled NASA image";

  title.textContent = titleText;

  const source = document.createElement("p");

  source.className = "media-card__source";

  source.textContent = cleanString(item.center) || "NASA";

  information.append(title, source);

  const actions = document.createElement("div");

  actions.className = "media-card__actions";

  const detailsButton = document.createElement("button");

  detailsButton.type = "button";
  detailsButton.className = "media-card__details";
  detailsButton.textContent = "Details";

  detailsButton.setAttribute("aria-label", `View details for ${titleText}`);

  detailsButton.setAttribute("aria-controls", "saved-details-panel");

  detailsButton.setAttribute("aria-expanded", "false");

  detailsButton.addEventListener("click", () => {
    openSavedDetails(item, detailsButton, cardIndex);
  });

  const removeButton = document.createElement("button");

  removeButton.type = "button";
  removeButton.className = "saved-card__remove";
  removeButton.textContent = "Remove";

  removeButton.setAttribute(
    "aria-label",
    `Remove ${titleText} from saved images`,
  );

  removeButton.addEventListener("click", () => {
    handleRemoveItem(item, cardIndex);
  });

  actions.append(detailsButton, removeButton);

  body.append(information, actions);

  card.append(media, body);

  return card;
}

/* --------------------------------------------------
   Empty / Results states
-------------------------------------------------- */

function showEmptyState() {
  if (isDetailsOpen()) {
    if (emptyState) {
      emptyState.hidden = true;
    }

    if (resultsSection) {
      resultsSection.hidden = true;
    }

    return;
  }

  if (emptyState) {
    emptyState.hidden = false;
  }

  if (resultsSection) {
    resultsSection.hidden = true;
  }
}

function showResultsState() {
  if (isDetailsOpen()) {
    if (emptyState) {
      emptyState.hidden = true;
    }

    if (resultsSection) {
      resultsSection.hidden = true;
    }

    return;
  }

  if (emptyState) {
    emptyState.hidden = true;
  }

  if (resultsSection) {
    resultsSection.hidden = false;
  }
}

/* --------------------------------------------------
   Render Saved collection
-------------------------------------------------- */

function renderSavedItems(options = {}) {
  const { clearStatus = true } = options;

  const items = getSavedItems();

  const count = items.length;

  updateSavedCount(count);

  if (clearStatus && savedStatus) {
    savedStatus.textContent = "";
  }

  if (!savedGrid) {
    return;
  }

  if (count === 0) {
    savedGrid.replaceChildren();

    showEmptyState();

    return;
  }

  const fragment = document.createDocumentFragment();

  items.forEach((item, index) => {
    fragment.append(createSavedCard(item, index));
  });

  savedGrid.replaceChildren(fragment);

  showResultsState();
}

/* --------------------------------------------------
   Details Back button
-------------------------------------------------- */

detailsBackButton?.addEventListener("click", (event) => {
  event.preventDefault();

  closeSavedDetails();
});

/* --------------------------------------------------
   Escape closes Details
-------------------------------------------------- */

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !isDetailsOpen()) {
    return;
  }

  event.preventDefault();

  closeSavedDetails();
});

/* --------------------------------------------------
   Remove directly from Details
-------------------------------------------------- */

detailsRemoveButton?.addEventListener("click", () => {
  if (!currentDetailsItem) {
    return;
  }

  const itemToRemove = currentDetailsItem;

  const title = cleanString(itemToRemove.title) || "NASA image";

  const result = removeSavedItem(itemToRemove.nasaId);

  if (!result.ok) {
    announceStatus(`"${title}" could not be removed from your saved images.`);

    return;
  }

  currentDetailsItem = null;

  if (detailsPanel) {
    detailsPanel.hidden = true;
  }

  if (detailsReturnTrigger && detailsReturnTrigger.isConnected) {
    detailsReturnTrigger.setAttribute("aria-expanded", "false");
  }

  if (savedIntro) {
    savedIntro.hidden = false;
  }

  renderSavedItems({
    clearStatus: false,
  });

  announceStatus(`"${title}" was removed from your saved images.`);

  window.scrollTo({
    top: savedViewScrollY,
    behavior: "auto",
  });

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: savedViewScrollY,
        behavior: "auto",
      });

      restoreFocusAfterDetailsRemoval();
    });
  });

  detailsReturnTrigger = null;
  detailsReturnNasaId = "";
});

/* --------------------------------------------------
   Cross-tab refresh
-------------------------------------------------- */

window.addEventListener("storage", (event) => {
  if (event.key !== "orbit:saved:v1") {
    return;
  }

  const items = getSavedItems();

  if (currentDetailsItem) {
    const currentId = normaliseId(currentDetailsItem.nasaId);

    const matchingItem = items.find(
      (item) => normaliseId(item.nasaId) === currentId,
    );

    if (!matchingItem) {
      const removedTitle =
        cleanString(currentDetailsItem.title) || "NASA image";

      currentDetailsItem = null;

      if (detailsPanel) {
        detailsPanel.hidden = true;
      }

      if (savedIntro) {
        savedIntro.hidden = false;
      }

      renderSavedItems({
        clearStatus: false,
      });

      announceStatus(`"${removedTitle}" is no longer in your saved images.`);

      window.scrollTo({
        top: savedViewScrollY,
        behavior: "auto",
      });

      window.requestAnimationFrame(() => {
        restoreFocusAfterDetailsRemoval();
      });

      detailsReturnTrigger = null;
      detailsReturnNasaId = "";

      return;
    }

    currentDetailsItem = matchingItem;

    renderSavedItems();

    return;
  }

  renderSavedItems();
});

/* --------------------------------------------------
   Initialise
-------------------------------------------------- */

renderSavedItems();
