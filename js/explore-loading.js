/* --------------------------------------------------
   ORBIT Explore Loading Experience

   Milestone 10.2A.1

   Progressive enhancement for Explore loading.

   This module deliberately does NOT own search logic.
   It observes the existing loading state produced by
   explore.js and adds:

   - immediate local busy feedback on the Search button
   - aria-busy state on the search/results regions
   - delayed skeleton cards for slower requests
   - static placeholders for reduced-motion users

   Search, NASA API requests, curation, cancellation,
   stale-response protection, Details and Saved state
   remain owned by explore.js.
-------------------------------------------------- */

const loadingState = document.querySelector("#state-loading");

const resultsSection = document.querySelector("#explore-results-section");

const resultsContainer = document.querySelector("#search-results");

const searchForm = document.querySelector("#explore-search-form");

const searchButton = document.querySelector(".explore-search__button");

const SKELETON_DELAY_MS = 160;

const SKELETON_COUNT = 6;

/* --------------------------------------------------
   Guard
-------------------------------------------------- */

if (
  loadingState &&
  resultsSection &&
  resultsContainer &&
  searchForm &&
  searchButton
) {
  initialiseExploreLoadingExperience();
}

/* --------------------------------------------------
   Initialise
-------------------------------------------------- */

function initialiseExploreLoadingExperience() {
  let skeletonTimer = null;

  let loadingActive = false;

  const observer = new MutationObserver(() => {
    syncLoadingExperience();
  });

  observer.observe(loadingState, {
    attributes: true,

    attributeFilter: ["hidden"],
  });

  /*
    Important for URL-driven searches.

    If explore.js has already entered Loading before
    this enhancement finishes initialising, we still
    detect the current state correctly.
  */

  syncLoadingExperience();

  /* ------------------------------------------------
     Synchronise with Explore's real state
  ------------------------------------------------ */

  function syncLoadingExperience() {
    const isLoading = !loadingState.hidden;

    if (isLoading) {
      if (!loadingActive) {
        loadingActive = true;

        beginLoadingExperience();

        return;
      }

      /*
        Rapid second searches are allowed.

        explore.js may:
        - abort the old request
        - briefly reset its state
        - clear old skeletons/results
        - immediately start the new request

        If Loading is still authoritative, ensure the
        skeletons are scheduled again rather than
        leaving a blank results area.
      */

      ensureSkeletonsScheduled();

      return;
    }

    if (!loadingActive) {
      return;
    }

    loadingActive = false;

    endLoadingExperience();
  }

  /* ------------------------------------------------
     Begin visual loading feedback
  ------------------------------------------------ */

  function beginLoadingExperience() {
    setBusyState(true);

    setSearchButtonLoading(true);

    ensureSkeletonsScheduled();
  }

  /* ------------------------------------------------
     Skeleton delay

     A short delay avoids flashing skeleton cards for
     extremely fast NASA responses while still giving
     slower searches meaningful spatial feedback.
  ------------------------------------------------ */

  function ensureSkeletonsScheduled() {
    if (
      skeletonTimer !== null ||
      resultsContainer.querySelector('[data-loading-skeleton="true"]')
    ) {
      return;
    }

    skeletonTimer = window.setTimeout(() => {
      skeletonTimer = null;

      if (!loadingActive || loadingState.hidden) {
        return;
      }

      renderSkeletonCards();
    }, SKELETON_DELAY_MS);
  }

  /* ------------------------------------------------
     End loading feedback
  ------------------------------------------------ */

  function endLoadingExperience() {
    if (skeletonTimer !== null) {
      window.clearTimeout(skeletonTimer);

      skeletonTimer = null;
    }

    setBusyState(false);

    setSearchButtonLoading(false);

    removeSkeletonCards();
  }
}

/* --------------------------------------------------
   Accessible busy state
-------------------------------------------------- */

function setBusyState(isBusy) {
  const value = String(isBusy);

  searchForm.setAttribute("aria-busy", value);

  resultsSection.setAttribute("aria-busy", value);

  resultsContainer.setAttribute("aria-busy", value);
}

/* --------------------------------------------------
   Search button activity

   The button remains usable.

   We deliberately do NOT disable it because ORBIT's
   request architecture supports replacing an active
   search with a newer one.
-------------------------------------------------- */

function setSearchButtonLoading(isLoading) {
  if (isLoading) {
    if (!searchButton.querySelector(".explore-search__spinner")) {
      const spinner = document.createElement("span");

      spinner.className = "explore-search__spinner";

      spinner.setAttribute("aria-hidden", "true");

      searchButton.prepend(spinner);
    }

    searchButton.dataset.loading = "true";

    searchButton.setAttribute("aria-busy", "true");

    return;
  }

  searchButton.removeAttribute("data-loading");

  searchButton.setAttribute("aria-busy", "false");

  searchButton.querySelector(".explore-search__spinner")?.remove();
}

/* --------------------------------------------------
   Skeleton rendering
-------------------------------------------------- */

function renderSkeletonCards() {
  /*
    Never overwrite real results.

    explore.js clears the results container before it
    enters Loading.

    Therefore a non-empty container here means another
    authoritative state has already won the race.
  */

  if (resultsContainer.children.length > 0) {
    return;
  }

  const fragment = document.createDocumentFragment();

  for (let index = 0; index < SKELETON_COUNT; index += 1) {
    fragment.append(createSkeletonCard());
  }

  resultsContainer.append(fragment);
}

/* --------------------------------------------------
   One decorative skeleton card
-------------------------------------------------- */

function createSkeletonCard() {
  const card = document.createElement("article");

  card.className = "media-card explore-skeleton-card";

  card.dataset.loadingSkeleton = "true";

  /*
    Screen readers already receive the actual loading
    message from ORBIT's status region.

    Reading six fake cards would only create noise.
  */

  card.setAttribute("aria-hidden", "true");

  /* ------------------------------
     Media
  ------------------------------ */

  const media = document.createElement("div");

  media.className = "media-card__media explore-skeleton-card__media";

  /* ------------------------------
     Body
  ------------------------------ */

  const body = document.createElement("div");

  body.className = "media-card__body explore-skeleton-card__body";

  const information = document.createElement("div");

  information.className = "explore-skeleton-card__information";

  /* ------------------------------
     Text placeholders
  ------------------------------ */

  const titleLine = document.createElement("span");

  titleLine.className =
    "explore-skeleton-card__line explore-skeleton-card__line--title";

  const titleLineShort = document.createElement("span");

  titleLineShort.className =
    "explore-skeleton-card__line explore-skeleton-card__line--title-short";

  const sourceLine = document.createElement("span");

  sourceLine.className =
    "explore-skeleton-card__line explore-skeleton-card__line--source";

  information.append(titleLine, titleLineShort, sourceLine);

  /* ------------------------------
     Action placeholders
  ------------------------------ */

  const actions = document.createElement("div");

  actions.className = "media-card__actions explore-skeleton-card__actions";

  const detailsPlaceholder = document.createElement("span");

  detailsPlaceholder.className =
    "explore-skeleton-card__action explore-skeleton-card__action--details";

  const savePlaceholder = document.createElement("span");

  savePlaceholder.className =
    "explore-skeleton-card__action explore-skeleton-card__action--save";

  actions.append(detailsPlaceholder, savePlaceholder);

  body.append(information, actions);

  card.append(media, body);

  return card;
}

/* --------------------------------------------------
   Remove only loading placeholders

   Real NASA cards are never touched.
-------------------------------------------------- */

function removeSkeletonCards() {
  resultsContainer
    .querySelectorAll('[data-loading-skeleton="true"]')
    .forEach((card) => {
      card.remove();
    });
}
