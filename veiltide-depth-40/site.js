"use strict";

document.documentElement.classList.add("js-enabled");

const menuButton = document.querySelector(".menu-button");
const menu = document.querySelector("#site-nav");
const siteHeader = document.querySelector(".site-header");

function setMenuOpen(isOpen) {
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menu.dataset.open = String(isOpen);
}

menuButton.hidden = false;
menuButton.addEventListener("click", () => {
  setMenuOpen(menuButton.getAttribute("aria-expanded") === "false");
});
menu.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenuOpen(false);
});
document.addEventListener("click", (event) => {
  if (!siteHeader.contains(event.target)) setMenuOpen(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menu.dataset.open === "true") {
    setMenuOpen(false);
    menuButton.focus();
  }
});

const galleryControls = document.querySelector("#gallery-controls");
const galleryViews = Array.from(galleryControls.querySelectorAll("button"), (button) => ({
  button,
  photo: document.getElementById(button.getAttribute("aria-controls"))
}));

for (const view of galleryViews) {
  view.button.addEventListener("click", () => {
    for (const candidate of galleryViews) {
      const isSelected = candidate === view;
      candidate.button.setAttribute("aria-pressed", String(isSelected));
      candidate.photo.hidden = !isSelected;
    }
  });
}
galleryControls.hidden = false;

const watchVariants = {
  green: {
    name: "Deep Green",
    asset: "water",
    studio: "depth-40-studio.webp",
    wrist: "depth-40-underwater.webp",
    intro: "A brushed-steel dive-watch concept with a deep green dial and an automatic movement.",
    description: "A compact 40 mm case, a three-link steel bracelet and luminous hour markers. The dark green dial shifts from near-black to green as the light moves across it.",
    dial: "Deep green with luminous markers"
  },
  cobalt: {
    name: "Cobalt Blue",
    asset: "cobalt",
    intro: "A cobalt-blue sunburst dial in brushed steel, with an automatic movement.",
    description: "A midnight-blue bezel frames the sunburst dial and luminous hour markers. A three-link steel bracelet matches the brushed case.",
    dial: "Cobalt blue sunburst with luminous markers"
  },
  burgundy: {
    name: "Burgundy",
    asset: "burgundy",
    intro: "A wine-red dial paired with rose-tone steel and an automatic movement.",
    description: "A wine-red sunburst dial and matching bezel sit in a warm rose-tone steel case. Pale markers pick out the hours in low light.",
    caseMaterial: "Rose-tone brushed stainless steel",
    bracelet: "Rose-tone three-link stainless steel",
    dial: "Burgundy sunburst with luminous markers"
  },
  silver: {
    name: "Ice Silver",
    asset: "silver",
    intro: "A frost-silver dial, an anthracite bezel and an automatic movement in brushed steel.",
    description: "Dark outlines give the luminous hands and batons definition on the light silver dial. An anthracite bezel frames the brushed-steel case.",
    dial: "Ice silver with gunmetal-edged luminous markers"
  }
};
let activeWatch = "green";

const inquiryDialog = document.querySelector("#inquiry-dialog");
const inquiryOpen = document.querySelector("#inquiry-open");
const inquiryForm = document.querySelector("#inquiry-form");
const inquiryStatus = document.querySelector("#inquiry-status");
const inquiryDraft = document.querySelector("#inquiry-draft");

if (typeof inquiryDialog.showModal === "function") {
  inquiryOpen.hidden = false;
  inquiryOpen.addEventListener("click", () => {
    inquiryDialog.showModal();
    inquiryForm.elements.name.focus();
  });
  inquiryDialog.addEventListener("close", () => inquiryOpen.focus());
}

inquiryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = inquiryForm.elements.name.value.trim();
  const email = inquiryForm.elements.email.value.trim();
  const message = inquiryForm.elements.message.value.trim();

  inquiryDraft.hidden = true;
  if (!name || !message) {
    inquiryStatus.textContent = "Enter your name and a message to prepare the inquiry.";
    (name ? inquiryForm.elements.message : inquiryForm.elements.name).focus();
    return;
  }

  const draft = [`Depth 40 ${watchVariants[activeWatch].name} inquiry`, "", message, "", name, email].join("\n");

  try {
    await navigator.clipboard.writeText(draft);
    inquiryStatus.textContent = "Inquiry copied.";
  } catch {
    inquiryDraft.value = draft;
    inquiryDraft.hidden = false;
    inquiryStatus.textContent = "Select and copy the inquiry below.";
    inquiryDraft.focus();
    inquiryDraft.select();
  }
});

const visual = document.querySelector("#hero-visual");
const waterVideo = document.querySelector("#water-video");
const motionControls = document.querySelector("#motion-controls");
const replayButton = document.querySelector("#motion-replay");
const motionToggle = document.querySelector("#motion-toggle");
const motionLabel = motionToggle.querySelector(".motion-label");
const heroPhoto = document.querySelector("#hero-photo");
const hero = visual.closest(".hero");
const designPhoto = document.querySelector("#design-watch-photo");
const watchChoices = document.querySelectorAll("[data-watch-choice]");
const collectionPlay = document.querySelector("#watch-selected-dive");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let playRequested = !reducedMotion.matches;
let isOnScreen = true;

function updateMotionControls() {
  const ended = waterVideo.ended;
  motionControls.hidden = Boolean(waterVideo.error);
  replayButton.hidden = ended || visual.dataset.renderer !== "video";
  motionToggle.dataset.paused = String(!playRequested || ended);

  if (ended) {
    motionLabel.textContent = "Replay dive";
  } else if (playRequested) {
    motionLabel.textContent = "Pause motion";
  } else {
    motionLabel.textContent = waterVideo.currentTime > 0 ? "Resume motion" : "Play dive";
  }
}

function syncMotion() {
  const shouldAnimate = playRequested && isOnScreen && !document.hidden && !waterVideo.ended;
  updateMotionControls();

  if (!shouldAnimate) {
    waterVideo.pause();
  } else if (waterVideo.paused && !waterVideo.error) {
    const requestedSource = waterVideo.src;
    waterVideo.play().catch((error) => {
      if (error.name === "AbortError" || waterVideo.src !== requestedSource) return;
      playRequested = false;
      updateMotionControls();
    });
  }
}

function replayDive() {
  waterVideo.currentTime = 0;
  playRequested = true;
  syncMotion();
}

function setWatchPhoto(photo, src, description) {
  photo.src = src;
  photo.alt = description;
}

function selectWatch(key) {
  if (key === activeWatch) return;
  const watch = watchVariants[key];
  activeWatch = key;
  const asset = `assets/depth-40-${watch.asset}`;
  const poster = `${asset}-still.webp`;
  const onWrist = watch.wrist ? `assets/${watch.wrist}` : poster;
  const wristAlt = `Depth 40 ${watch.name} on a submerged wrist`;
  const detailAlt = `Close-up of the Depth 40 ${watch.name} dial and bracelet`;
  const [detailView, wristView] = galleryViews;

  hero.dataset.watch = key;
  for (const button of watchChoices) {
    button.setAttribute("aria-pressed", String(button.dataset.watchChoice === key));
  }
  document.querySelector("#active-dial-name").textContent = watch.name;
  document.querySelector("#hero-description").textContent = watch.intro;
  document.querySelector("#collection-title").textContent = watch.name;
  document.querySelector("#collection-description").textContent = watch.description;
  document.querySelector("#watch-case-spec").textContent = watch.caseMaterial ?? "Brushed stainless steel";
  document.querySelector("#watch-dial-spec").textContent = watch.dial;
  document.querySelector("#watch-bracelet-spec").textContent = watch.bracelet ?? "Three-link stainless steel";

  detailView.button.textContent = watch.studio ? "Studio" : "Dial detail";
  setWatchPhoto(detailView.photo, watch.studio ? `assets/${watch.studio}` : `${asset}-detail.webp`,
    watch.studio ? "Three-quarter view of the Depth 40 on wet basalt" : detailAlt);
  setWatchPhoto(wristView.photo, onWrist, wristAlt);
  setWatchPhoto(designPhoto, watch.studio ? onWrist : `${asset}-detail.webp`, detailAlt);

  waterVideo.pause();
  visual.dataset.renderer = "photo";
  setWatchPhoto(heroPhoto, poster, wristAlt);
  waterVideo.src = `${asset}-sequence.mp4`;
  waterVideo.load();
  playRequested = !reducedMotion.matches;
  syncMotion();
}

for (const button of watchChoices) {
  button.addEventListener("click", () => selectWatch(button.dataset.watchChoice));
}
document.querySelector("#watch-picker").hidden = false;
document.querySelector("#watch-catalog").hidden = false;
collectionPlay.hidden = false;
collectionPlay.addEventListener("click", replayDive);

waterVideo.muted = true;
waterVideo.addEventListener("playing", () => {
  visual.dataset.renderer = "video";
  updateMotionControls();
});
waterVideo.addEventListener("ended", () => {
  const replayHadFocus = document.activeElement === replayButton;
  playRequested = false;
  updateMotionControls();
  if (replayHadFocus) motionToggle.focus({ preventScroll: true });
});
waterVideo.addEventListener("error", () => {
  visual.dataset.renderer = "photo";
  updateMotionControls();
});

replayButton.addEventListener("click", replayDive);
motionToggle.addEventListener("click", () => {
  if (waterVideo.ended) {
    replayDive();
  } else {
    playRequested = !playRequested;
    syncMotion();
  }
});
reducedMotion.addEventListener("change", (event) => {
  playRequested = !event.matches && !waterVideo.ended;
  syncMotion();
});
document.addEventListener("visibilitychange", syncMotion);

if ("IntersectionObserver" in window) {
  new IntersectionObserver(([entry]) => {
    isOnScreen = entry.isIntersecting;
    syncMotion();
  }).observe(visual);
}

syncMotion();
