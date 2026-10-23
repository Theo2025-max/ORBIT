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

  motionContext.add("(prefers-reduced-motion: no-preference)", () => {
    initialiseDiscoverHeroMotion();
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
