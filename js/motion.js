const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;

if (gsap) {
  initialiseMotionSystem();
}

function initialiseMotionSystem() {
  if (ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  const motionContext = gsap.matchMedia();

  motionContext.add("(prefers-reduced-motion: no-preference)", (context) => {
    initialiseDiscoverHeroMotion();
    initialiseDiscoverVisualMotion();

    const cleanupSectionReveal = initialiseSectionRevealMotion(context);
    const cleanupDetailsMotion = initialiseExploreDetailsMotion(context);

    return () => {
      cleanupSectionReveal?.();
      cleanupDetailsMotion?.();
    };
  });
}

function initialiseDiscoverHeroMotion() {
  const heroContent = document.querySelector(".discover-hero__content");

  if (!heroContent) {
    return;
  }

  const eyebrow = heroContent.querySelector(".eyebrow");
  const title = heroContent.querySelector(".discover-hero__title");
  const description = heroContent.querySelector(".discover-hero__description");
  const button = heroContent.querySelector(".button");

  if (!eyebrow || !title || !description || !button) {
    return;
  }

  const timeline = gsap.timeline({
    defaults: {
      duration: 0.65,
      ease: "power2.out",
    },
  });

  timeline
    .from(eyebrow, {
      opacity: 0,
      y: 16,
      clearProps: "opacity,transform",
    })
    .from(
      title,
      {
        opacity: 0,
        y: 16,
        clearProps: "opacity,transform",
      },
      "-=0.54",
    )
    .from(
      description,
      {
        opacity: 0,
        y: 16,
        clearProps: "opacity,transform",
      },
      "-=0.54",
    )
    .from(
      button,
      {
        opacity: 0,
        y: 16,
        clearProps: "opacity,transform",
      },
      "-=0.54",
    );
}

function initialiseDiscoverVisualMotion() {
  const visual = document.querySelector(".discover-hero__visual");

  if (!visual) {
    return;
  }

  gsap.from(visual, {
    opacity: 0,
    scale: 0.96,
    duration: 0.8,
    ease: "power2.out",
    clearProps: "opacity,transform",
  });
}

function initialiseSectionRevealMotion(context) {
  if (!ScrollTrigger) {
    return null;
  }

  initialiseDiscoverSectionReveal();

  return initialiseExploreResultsReveal(context);
}

function initialiseDiscoverSectionReveal() {
  const sectionHeading = document.querySelector(
    ".featured-section .section-heading",
  );

  if (!sectionHeading) {
    return;
  }

  gsap.from(sectionHeading, {
    opacity: 0,
    y: 16,
    duration: 0.5,
    ease: "power2.out",
    clearProps: "opacity,transform",
    scrollTrigger: {
      trigger: sectionHeading,
      start: "top 85%",
      once: true,
    },
  });
}

function initialiseExploreResultsReveal(context) {
  const resultsHeader = document.querySelector("#results-header");
  const resultsContainer = document.querySelector("#search-results");

  if (!resultsHeader || !resultsContainer) {
    return null;
  }

  let revealCreated = false;

  context.add("revealExploreResults", () => {
    if (
      revealCreated ||
      resultsHeader.hidden ||
      resultsContainer.children.length === 0
    ) {
      return;
    }

    revealCreated = true;

    const targets = [
      resultsHeader,
      ...resultsContainer.querySelectorAll(".media-card"),
    ];

    gsap.from(targets, {
      opacity: 0,
      y: 16,
      duration: 0.5,
      stagger: 0.06,
      ease: "power2.out",
      clearProps: "opacity,transform",
      scrollTrigger: {
        trigger: resultsHeader,
        start: "top 85%",
        once: true,
      },
    });

    ScrollTrigger.refresh();
  });

  const observer = new MutationObserver(() => {
    context.revealExploreResults();
  });

  observer.observe(resultsHeader, {
    attributes: true,
    attributeFilter: ["hidden"],
  });

  observer.observe(resultsContainer, {
    childList: true,
  });

  context.revealExploreResults();

  return () => {
    observer.disconnect();
  };
}

function initialiseExploreDetailsMotion(context) {
  const detailsPanel = document.querySelector("#details-panel");

  if (!detailsPanel) {
    return null;
  }

  const backButton = detailsPanel.querySelector(".details-panel__back");
  const media = detailsPanel.querySelector(".details-panel__media");
  const content = detailsPanel.querySelector(".details-panel__content");

  const targets = [backButton, media, content].filter(Boolean);

  if (!targets.length) {
    return null;
  }

  let detailsTimeline = null;

  context.add("revealExploreDetails", () => {
    if (detailsPanel.hidden) {
      return;
    }

    detailsTimeline?.kill();

    gsap.set(targets, {
      clearProps: "opacity,transform",
    });

    detailsTimeline = gsap.timeline({
      defaults: {
        ease: "power2.out",
      },
    });

    if (backButton) {
      detailsTimeline.from(backButton, {
        opacity: 0,
        y: 12,
        duration: 0.35,
        clearProps: "opacity,transform",
      });
    }

    if (media) {
      detailsTimeline.from(
        media,
        {
          opacity: 0,
          y: 16,
          scale: 0.98,
          duration: 0.6,
          clearProps: "opacity,transform",
        },
        "-=0.18",
      );
    }

    if (content) {
      detailsTimeline.from(
        content,
        {
          opacity: 0,
          x: 20,
          duration: 0.55,
          clearProps: "opacity,transform",
        },
        "-=0.42",
      );
    }
  });

  const observer = new MutationObserver(() => {
    if (detailsPanel.hidden) {
      detailsTimeline?.kill();

      gsap.set(targets, {
        clearProps: "opacity,transform",
      });

      return;
    }

    context.revealExploreDetails();
  });

  observer.observe(detailsPanel, {
    attributes: true,
    attributeFilter: ["hidden"],
  });

  if (!detailsPanel.hidden) {
    context.revealExploreDetails();
  }

  return () => {
    observer.disconnect();
    detailsTimeline?.kill();

    gsap.set(targets, {
      clearProps: "opacity,transform",
    });
  };
}
