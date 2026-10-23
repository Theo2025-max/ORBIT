/* --------------------------------------------------
   ORBIT Discover Page

   Milestone 10.2B.1
   Natural Space Atmosphere.

   The signature ORBIT object remains decorative.

   Ambient CSS motion supplies:
   - slow internal surface movement
   - gentle orbital-ring precession
   - independent starfield motion

   JavaScript supplies only fine-pointer parallax:
   - slight internal-light response
   - tiny ring displacement
   - exact return to resting state

   There is intentionally:
   - no click behaviour
   - no accumulated state
   - no sphere rotation
   - no keyboard interaction
   - no touch interaction
   - no essential information in the object

   Reduced-motion users receive a static composition.
-------------------------------------------------- */

/* --------------------------------------------------
   DOM
-------------------------------------------------- */

const orbitField = document.querySelector("#discover-orbit-field");

/* --------------------------------------------------
   Initialise
-------------------------------------------------- */

if (orbitField) {
  initialiseOrbitField(orbitField);
}

/* --------------------------------------------------
   Passive ORBIT interaction
-------------------------------------------------- */

function initialiseOrbitField(field) {
  const reducedMotionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );

  const finePointerQuery = window.matchMedia(
    "(hover: hover) and (pointer: fine)",
  );

  const state = {
    pointerFrame: null,
  };

  field.addEventListener("pointermove", (event) => {
    /*
        Pointer response is decorative enhancement.

        Do not run it for:
        - reduced-motion users
        - touch input
        - devices without a fine pointing device
      */

    if (
      reducedMotionQuery.matches ||
      !finePointerQuery.matches ||
      event.pointerType === "touch"
    ) {
      return;
    }

    schedulePointerResponse(field, event, state);
  });

  field.addEventListener("pointerleave", () => {
    resetOrbitField(field, state);
  });

  /*
    If accessibility or pointer capability changes
    while the page is open, immediately restore the
    exact canonical resting state.
  */

  reducedMotionQuery.addEventListener("change", () => {
    resetOrbitField(field, state);
  });

  finePointerQuery.addEventListener("change", () => {
    resetOrbitField(field, state);
  });
}

/* --------------------------------------------------
   Pointer response
-------------------------------------------------- */

function schedulePointerResponse(field, event, state) {
  const clientX = event.clientX;
  const clientY = event.clientY;

  if (state.pointerFrame !== null) {
    window.cancelAnimationFrame(state.pointerFrame);
  }

  state.pointerFrame = window.requestAnimationFrame(() => {
    state.pointerFrame = null;

    const rect = field.getBoundingClientRect();

    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const normalisedX = ((clientX - rect.left) / rect.width - 0.5) * 2;

    const normalisedY = ((clientY - rect.top) / rect.height - 0.5) * 2;

    /*
          Light movement remains restrained.

          The ambient surface animation now provides
          the perception of life, so pointer movement
          does not need to carry the entire effect.
        */

    const lightX = clamp(33 + normalisedX * 3, 30, 36);

    const lightY = clamp(27 + normalisedY * 2.5, 24.5, 29.5);

    /*
          Tiny foreground/background separation.

          The ring moves roughly one pixel at most.
        */

    const ringShiftX = clamp(normalisedX * 1.1, -1.1, 1.1);

    const ringShiftY = clamp(normalisedY * 0.8, -0.8, 0.8);

    field.style.setProperty("--orbit-light-x", `${lightX.toFixed(2)}%`);

    field.style.setProperty("--orbit-light-y", `${lightY.toFixed(2)}%`);

    field.style.setProperty(
      "--orbit-ring-shift-x",
      `${ringShiftX.toFixed(2)}px`,
    );

    field.style.setProperty(
      "--orbit-ring-shift-y",
      `${ringShiftY.toFixed(2)}px`,
    );
  });
}

/* --------------------------------------------------
   Canonical resting state
-------------------------------------------------- */

function resetOrbitField(field, state) {
  if (state.pointerFrame !== null) {
    window.cancelAnimationFrame(state.pointerFrame);

    state.pointerFrame = null;
  }

  field.style.setProperty("--orbit-light-x", "33%");

  field.style.setProperty("--orbit-light-y", "27%");

  field.style.setProperty("--orbit-ring-shift-x", "0px");

  field.style.setProperty("--orbit-ring-shift-y", "0px");
}

/* --------------------------------------------------
   Numeric helper
-------------------------------------------------- */

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}
