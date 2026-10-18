/* --------------------------------------------------
   ORBIT Discover page

   Handles the Discover hero search.

   Behaviour:
   - Blank search stays on Discover.
   - Blank search shows clear guidance.
   - Valid search opens Explore with ?q=
   - Start Exploring remains separate and unchanged.
-------------------------------------------------- */

/* --------------------------------------------------
   DOM references
-------------------------------------------------- */

const searchForm = document.querySelector(".hero-search");
const searchInput = document.querySelector("#discover-search");

/* --------------------------------------------------
   Guard

   If this script is accidentally loaded on another
   page, do nothing instead of causing an error.
-------------------------------------------------- */

if (searchForm && searchInput) {
  initialiseDiscoverSearch();
}

/* --------------------------------------------------
   Initialise
-------------------------------------------------- */

function initialiseDiscoverSearch() {
  const message = createSearchMessage();

  searchForm.addEventListener("submit", (event) => {
    handleSearchSubmit(event, message);
  });

  searchInput.addEventListener("input", () => {
    handleSearchInput(message);
  });
}

/* --------------------------------------------------
   Create inline search message

   We create this with JavaScript so you do not need
   to modify index.html.

   The message is placed directly below the search
   form and is announced to screen readers.
-------------------------------------------------- */

function createSearchMessage() {
  const existingMessage = document.querySelector("#discover-search-message");

  if (existingMessage) {
    return existingMessage;
  }

  const message = document.createElement("p");

  message.id = "discover-search-message";
  message.className = "hero-search__message";

  message.hidden = true;

  message.setAttribute("role", "status");
  message.setAttribute("aria-live", "polite");

  searchForm.insertAdjacentElement("afterend", message);

  searchInput.setAttribute("aria-describedby", "discover-search-message");

  return message;
}

/* --------------------------------------------------
   Query cleaning
-------------------------------------------------- */

function normaliseQuery(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ");
}

/* --------------------------------------------------
   Search submission
-------------------------------------------------- */

function handleSearchSubmit(event, message) {
  event.preventDefault();

  const query = normaliseQuery(searchInput.value);

  /* ----------------------------------------------
     Blank search

     Important:
     Do NOT send the user to Explore.

     Keep them on Discover and explain what they
     need to do.
  ---------------------------------------------- */

  if (!query) {
    showSearchError(message, "Enter a keyword before searching.");

    searchInput.focus();

    return;
  }

  /* ----------------------------------------------
     Valid search

     Clear any previous error first.
  ---------------------------------------------- */

  clearSearchError(message);

  searchInput.value = query;

  /* ----------------------------------------------
     Build Explore URL safely

     Examples:

     Mars
     -> explore.html?q=Mars

     Great Red Spot
     -> explore.html?q=Great+Red+Spot
  ---------------------------------------------- */

  const params = new URLSearchParams();

  params.set("q", query);

  window.location.href = `explore.html?${params.toString()}`;
}

/* --------------------------------------------------
   Input editing

   Once the user starts typing after a blank-search
   error, remove the error state.
-------------------------------------------------- */

function handleSearchInput(message) {
  const query = normaliseQuery(searchInput.value);

  if (query) {
    clearSearchError(message);
  }
}

/* --------------------------------------------------
   Error state
-------------------------------------------------- */

function showSearchError(message, text) {
  message.textContent = text;

  message.hidden = false;

  message.dataset.state = "error";

  searchInput.setAttribute("aria-invalid", "true");
}

/* --------------------------------------------------
   Clear error state
-------------------------------------------------- */

function clearSearchError(message) {
  message.textContent = "";

  message.hidden = true;

  delete message.dataset.state;

  searchInput.removeAttribute("aria-invalid");
}
