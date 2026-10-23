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

    return () => {
      cleanupSectionReveal?.();
    };
  });
}

function initialiseDiscoverHeroMotion() {
  const heroContent = document.querySelector(".discover-hero__content");

  if (!heroContent) {
    return;
  }

  const elements = [
    heroContent.querySelector(".eyebrow"),
    heroContent.querySelector(".discover-hero__title"),
    heroContent.querySelector(".discover-hero__description"),
    heroContent.querySelector(".button"),
  ].filter(Boolean);

  if (!elements.length) {
    return;
  }

  gsap.from(elements, {
    opacity: 0,
    y: 20,
    duration: 0.65,
    stagger: 0.11,
    ease: "power2.out",
    clearProps: "opacity,transform",
  });
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
