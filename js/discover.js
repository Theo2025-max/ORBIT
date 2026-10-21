/* --------------------------------------------------
   ORBIT Discover Page

   Milestone 10.1A
   Quiet passive ORBIT atmosphere.

   The signature ORBIT object is decorative rather
   than functional.

   Fine-pointer users receive only:
   - subtle internal-light movement
   - tiny orbital-ring parallax
   - smooth return to the canonical resting state

   There is intentionally:
   - no click behaviour
   - no accumulated state
   - no rotation
   - no keyboard interaction
   - no touch interaction
   - no essential information in the object

   Reduced-motion users receive a fully static object.
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

  const state = {
    pointerFrame: null,
  };

  field.addEventListener("pointermove", (event) => {
    /*
        Touch receives the calm static composition.

        Pointer movement is decorative enhancement,
        not required functionality.
      */

    if (reducedMotionQuery.matches || event.pointerType === "touch") {
      return;
    }

    schedulePointerResponse(field, event, state);
  });

  field.addEventListener("pointerleave", () => {
    resetOrbitField(field, state);
  });

  /*
    If the user's motion preference changes while
    ORBIT is already open, immediately restore the
    exact resting state.
  */

  reducedMotionQuery.addEventListener("change", () => {
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
          Deliberately restrained.

          Lighting moves only three percentage points
          away from the resting position.

          This should be felt more than consciously
          watched.
        */

    const lightX = clamp(33 + normalisedX * 3, 30, 36);

    const lightY = clamp(27 + normalisedY * 2.5, 24.5, 29.5);

    /*
          Ring parallax is capped around one pixel.

          It creates just enough depth to separate
          foreground and background without becoming
          an animation feature.
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
   Number helper
-------------------------------------------------- */

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}
