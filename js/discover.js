/* --------------------------------------------------
   ORBIT Discover page

   D3.1 — Quiet ORBIT Interaction

   Discover remains presentation-led.
   Search, Details and Save/Saved belong to Explore.

   The signature ORBIT object is intentionally calm:

   - the sphere itself never tilts or accumulates rotation
   - pointer movement shifts only internal light slightly
   - the orbital ring moves by only a few pixels
   - click / Enter / Space runs one short visual response
   - every response returns completely to the resting state
   - prefers-reduced-motion receives static feedback only
-------------------------------------------------- */

const orbitControl = document.querySelector("#discover-orbit-control");

if (orbitControl) {
  initialiseOrbitObject(orbitControl);
}

/* --------------------------------------------------
   Initialise quiet ORBIT interaction
-------------------------------------------------- */

function initialiseOrbitObject(control) {
  const reducedMotionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );

  const state = {
    pointerFrame: null,
    responseTimeout: null,
    reducedResponseTimeout: null,
  };

  control.addEventListener("pointermove", (event) => {
    if (reducedMotionQuery.matches || event.pointerType === "touch") {
      return;
    }

    schedulePointerResponse(control, event, state);
  });

  control.addEventListener("pointerleave", () => {
    resetPointerResponse(control, state);
  });

  /*
    A native button already maps Enter and Space to click,
    so pointer and keyboard users receive the same response.
  */

  control.addEventListener("click", () => {
    resetPointerResponse(control, state);

    if (reducedMotionQuery.matches) {
      showReducedMotionResponse(control, state);
      return;
    }

    playOrbitResponse(control, state);
  });

  reducedMotionQuery.addEventListener("change", (event) => {
    resetPointerResponse(control, state);

    control.classList.remove(
      "is-orbit-responding",
      "is-orbit-reduced-response",
    );

    if (event.matches) {
      clearResponseTimers(state);
    }
  });
}

/* --------------------------------------------------
   Subtle pointer lighting
-------------------------------------------------- */

function schedulePointerResponse(control, event, state) {
  const clientX = event.clientX;
  const clientY = event.clientY;

  if (state.pointerFrame !== null) {
    window.cancelAnimationFrame(state.pointerFrame);
  }

  state.pointerFrame = window.requestAnimationFrame(() => {
    state.pointerFrame = null;

    const rect = control.getBoundingClientRect();

    if (!rect.width || !rect.height) {
      return;
    }

    const normalisedX = ((clientX - rect.left) / rect.width - 0.5) * 2;

    const normalisedY = ((clientY - rect.top) / rect.height - 0.5) * 2;

    /*
      The highlight moves only a few percentage points.
      The sphere silhouette never changes.
    */

    const lightX = clamp(33 + normalisedX * 4.5, 28.5, 37.5);
    const lightY = clamp(27 + normalisedY * 4, 23, 31);

    /*
      The ring shifts by at most two pixels to suggest
      separation from the sphere without looking animated.
    */

    const ringShiftX = clamp(normalisedX * 2, -2, 2);
    const ringShiftY = clamp(normalisedY * 1.5, -1.5, 1.5);

    control.style.setProperty("--orbit-light-x", `${lightX.toFixed(2)}%`);

    control.style.setProperty("--orbit-light-y", `${lightY.toFixed(2)}%`);

    control.style.setProperty(
      "--orbit-ring-shift-x",
      `${ringShiftX.toFixed(2)}px`,
    );

    control.style.setProperty(
      "--orbit-ring-shift-y",
      `${ringShiftY.toFixed(2)}px`,
    );
  });
}

/* --------------------------------------------------
   Return fully to canonical resting state
-------------------------------------------------- */

function resetPointerResponse(control, state) {
  if (state.pointerFrame !== null) {
    window.cancelAnimationFrame(state.pointerFrame);
    state.pointerFrame = null;
  }

  control.style.setProperty("--orbit-light-x", "33%");
  control.style.setProperty("--orbit-light-y", "27%");
  control.style.setProperty("--orbit-ring-shift-x", "0px");
  control.style.setProperty("--orbit-ring-shift-y", "0px");
}

/* --------------------------------------------------
   Click / keyboard response

   No value accumulates between activations.
   Every activation restarts the same short response.
-------------------------------------------------- */

function playOrbitResponse(control, state) {
  control.classList.remove("is-orbit-responding");

  /*
    Force style recalculation so rapid repeated activation
    restarts the same controlled response from the beginning.
  */

  void control.offsetWidth;

  control.classList.add("is-orbit-responding");

  if (state.responseTimeout !== null) {
    window.clearTimeout(state.responseTimeout);
  }

  state.responseTimeout = window.setTimeout(() => {
    control.classList.remove("is-orbit-responding");
    state.responseTimeout = null;
  }, 950);
}

/* --------------------------------------------------
   Reduced-motion response
-------------------------------------------------- */

function showReducedMotionResponse(control, state) {
  control.classList.remove("is-orbit-reduced-response");

  void control.offsetWidth;

  control.classList.add("is-orbit-reduced-response");

  if (state.reducedResponseTimeout !== null) {
    window.clearTimeout(state.reducedResponseTimeout);
  }

  state.reducedResponseTimeout = window.setTimeout(() => {
    control.classList.remove("is-orbit-reduced-response");
    state.reducedResponseTimeout = null;
  }, 450);
}

/* --------------------------------------------------
   Cleanup helpers
-------------------------------------------------- */

function clearResponseTimers(state) {
  if (state.responseTimeout !== null) {
    window.clearTimeout(state.responseTimeout);
    state.responseTimeout = null;
  }

  if (state.reducedResponseTimeout !== null) {
    window.clearTimeout(state.reducedResponseTimeout);
    state.reducedResponseTimeout = null;
  }
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}
