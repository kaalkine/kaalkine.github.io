const STORY_BOBBLE_LOTTIE_PATH = "assets/story/bobble-head.json?v=1781416040608";
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
      progressiveLoad: true,
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

function scheduleStoryLottie() {
  if (!document.querySelector(".story-bobble-lottie")) return;

  runWhenIdle(() => {
    loadLottieWeb()
      .then(() => initStoryLottie())
      .catch((err) => console.error(err));
  });
}

window.initStoryLottie = initStoryLottie;
window.scheduleStoryLottie = scheduleStoryLottie;
