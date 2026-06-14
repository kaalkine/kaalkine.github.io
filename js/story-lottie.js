const STORY_BOBBLE_LOTTIE_PATH = "assets/story/bobble-head.json?v=1781414620310";
const STORY_PLAYBACK_SPEED = 0.88;

function initStoryLottie() {
  const container = document.querySelector(".story-bobble-lottie");
  if (!container) return;
  if (typeof lottie === "undefined") {
    console.error("lottie-web failed to load");
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const anim = lottie.loadAnimation({
    container,
    renderer: "svg",
    loop: !reduceMotion,
    autoplay: false,
    path: STORY_BOBBLE_LOTTIE_PATH,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid meet",
      progressiveLoad: false,
    },
  });

  anim.addEventListener("DOMLoaded", () => {
    anim.setSpeed(STORY_PLAYBACK_SPEED);
    if (reduceMotion) {
      anim.goToAndStop(0, true);
      return;
    }
    anim.play();
  });

  window.addEventListener(
    "pagehide",
    () => {
      anim.destroy();
    },
    { once: true }
  );
}

window.initStoryLottie = initStoryLottie;
