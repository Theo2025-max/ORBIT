const resultsContainer = document.querySelector("#search-results");

if (resultsContainer) {
  initialiseSaveFeedback(resultsContainer);
}

function initialiseSaveFeedback(container) {
  const feedback = createFeedback();
  let hideTimer = null;

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      const button = mutation.target;

      if (!(button instanceof Element)) {
        return;
      }

      if (!button.matches(".media-card__save[data-nasa-id]")) {
        return;
      }

      const previousState = mutation.oldValue;
      const currentState = button.getAttribute("aria-pressed");

      if (
        previousState === currentState ||
        (previousState !== "true" && previousState !== "false") ||
        (currentState !== "true" && currentState !== "false")
      ) {
        return;
      }

      const title = getDisplayTitle(button.dataset.title);

      if (currentState === "true") {
        showFeedback(`Saved “${title}”`, "saved");
      } else {
        showFeedback(`Removed “${title}” from Saved`, "removed");
      }
    });
  });

  observer.observe(container, {
    subtree: true,
    attributes: true,
    attributeFilter: ["aria-pressed"],
    attributeOldValue: true,
  });

  function showFeedback(message, kind) {
    if (hideTimer !== null) {
      window.clearTimeout(hideTimer);
    }

    feedback.element.dataset.kind = kind;
    feedback.icon.textContent = kind === "saved" ? "✓" : "−";
    feedback.message.textContent = message;
    feedback.element.dataset.visible = "true";

    hideTimer = window.setTimeout(() => {
      feedback.element.dataset.visible = "false";
      hideTimer = null;
    }, 2600);
  }
}

function createFeedback() {
  const element = document.createElement("div");
  element.className = "save-feedback";
  element.dataset.visible = "false";
  element.dataset.kind = "saved";

  element.setAttribute("role", "status");
  element.setAttribute("aria-live", "polite");
  element.setAttribute("aria-atomic", "true");

  const icon = document.createElement("span");
  icon.className = "save-feedback__icon";
  icon.setAttribute("aria-hidden", "true");

  const message = document.createElement("span");
  message.className = "save-feedback__message";

  element.append(icon, message);
  document.body.append(element);

  return {
    element,
    icon,
    message,
  };
}

function getDisplayTitle(value) {
  const title =
    typeof value === "string" && value.trim() ? value.trim() : "NASA image";

  if (title.length <= 70) {
    return title;
  }

  return `${title.slice(0, 69).trimEnd()}…`;
}
