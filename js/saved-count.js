import { getSavedItems } from "./storage.js";

const MAX_VISIBLE_COUNT = 99;

const savedLinks = [
  ...document.querySelectorAll('.site-nav__link[href="saved.html"]'),
];

if (savedLinks.length > 0) {
  initialiseSavedCount();
}

function initialiseSavedCount() {
  for (const link of savedLinks) {
    link.classList.add("site-nav__link--saved");

    const badge = document.createElement("span");

    badge.className = "site-nav__saved-count";
    badge.setAttribute("aria-hidden", "true");
    badge.hidden = true;

    link.append(badge);
  }

  updateSavedCount();

  window.addEventListener("orbit:saved-changed", updateSavedCount);
  window.addEventListener("storage", updateSavedCount);
  window.addEventListener("pageshow", updateSavedCount);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      updateSavedCount();
    }
  });
}

function updateSavedCount() {
  const count = getSavedItems().length;

  for (const link of savedLinks) {
    const badge = link.querySelector(".site-nav__saved-count");

    if (!badge) {
      continue;
    }

    if (count === 0) {
      badge.textContent = "";
      badge.hidden = true;

      link.setAttribute("aria-label", "Saved");

      continue;
    }

    badge.textContent =
      count > MAX_VISIBLE_COUNT ? `${MAX_VISIBLE_COUNT}+` : String(count);

    badge.hidden = false;

    link.setAttribute(
      "aria-label",
      count === 1 ? "Saved, 1 saved image" : `Saved, ${count} saved images`,
    );
  }
}
