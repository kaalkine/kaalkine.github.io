const HERO_LOTTIE_PATH = "assets/hero/kaalkine-hero.json?v=1781416039400";

function initHeroLottie() {
  const container = document.querySelector(".hero-lottie");
  if (!container) return;
  if (typeof lottie === "undefined") {
    console.error("lottie-web failed to load");
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const anim = lottie.loadAnimation({
    container,
    renderer: "svg",
    loop: false,
    autoplay: !reduceMotion,
    path: HERO_LOTTIE_PATH,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid meet",
      progressiveLoad: true,
    },
  });

  const freezeOnLastFrame = () => {
    anim.goToAndStop(anim.totalFrames - 1, true);
  };

  if (reduceMotion) {
    anim.addEventListener("DOMLoaded", freezeOnLastFrame);
  } else {
    anim.addEventListener("complete", freezeOnLastFrame);
  }

  window.addEventListener(
    "pagehide",
    () => {
      anim.destroy();
    },
    { once: true }
  );
}

function scheduleHeroLottie() {
  if (!document.querySelector(".hero-lottie")) return;

  runWhenIdle(() => {
    loadLottieWeb()
      .then(() => initHeroLottie())
      .catch((err) => console.error(err));
  });
}

window.initHeroLottie = initHeroLottie;
window.scheduleHeroLottie = scheduleHeroLottie;
