"use strict";

const jacketSizes = ["S", "M", "L", "XL"];
const productCatalog = {
  kabuk: { name: "Shell jacket", image: "assets/shell-jacket.webp", sizes: jacketSizes },
  "kabuk-canta": { name: "Shell + bag", image: "assets/model-visor-off-mobile.webp", sizes: jacketSizes },
  "tam-set": { name: "Full AKINTI kit", image: "assets/model-visor-on-mobile.webp", sizes: jacketSizes },
  canta: { name: "Crossbody bag", image: "assets/crossbody-bag.webp", sizes: [] },
  siper: { name: "Visor and face cover", image: "assets/visor-and-face-cover.webp", sizes: [] }
};

const weatherOptions = {
  drizzle: { count: 55, angle: 4, speed: 255, shell: "Light shell", face: "Visor optional" },
  downpour: { count: 140, angle: 8, speed: 465, shell: "Hooded shell", face: "Visor + face cover" },
  wind: { count: 95, angle: 32, speed: 380, shell: "Adjusted hood", face: "Face cover" }
};

const notes = {
  layers: {
    title: "Layering for a rainy day",
    image: "assets/rain-street-mobile.webp",
    paragraphs: [
      "Think about which parts of your route are indoors and outdoors. If you’ll spend a while inside, pick layers you can take off and carry easily.",
      "Keep the same shell and add the visor and face cover as the weather changes."
    ]
  },
  "visor-care": {
    title: "Taking care of your visor",
    image: "assets/visor-detail.webp",
    paragraphs: [
      "After the commute, blot away water with a soft microfiber cloth. Follow the care label for the lens coating.",
      "Carry the visor in a separate pocket so keys and other hard objects won't scratch it."
    ]
  },
  carry: {
    title: "Keeping your bag close",
    image: "assets/crossbody-bag.webp",
    paragraphs: [
      "Adjust the strap over your jacket and place the bag where you can reach it comfortably.",
      "Keep the things you use most close to the zipper, so they’re easy to grab at a stop."
    ]
  }
};

const menuButton = document.querySelector("#menu-toggle");
const menu = document.querySelector("#primary-nav");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function setMenu(open) {
  menu.classList.toggle("open", open);
  menuButton.setAttribute("aria-expanded", String(open));
}

menuButton.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
menu.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false);
});

const heroComposition = document.querySelector("#hero-composition");
const heroVisor = document.querySelector("#hero-visor-toggle");
heroVisor.addEventListener("click", () => {
  const covered = heroVisor.getAttribute("aria-pressed") !== "true";
  heroVisor.setAttribute("aria-pressed", String(covered));
  heroComposition.dataset.visor = covered ? "fitted" : "open";
  document.querySelector("#hero-visor-label").textContent = covered ? "Take the visor off" : "Put the visor on";
});

if (window.matchMedia("(pointer: fine)").matches) {
  heroComposition.addEventListener("pointermove", (event) => {
    if (reducedMotion.matches || event.pointerType !== "mouse") return;
    const area = heroComposition.getBoundingClientRect();
    const x = (event.clientX - area.left) / area.width - 0.5;
    const y = (event.clientY - area.top) / area.height - 0.5;
    heroComposition.style.setProperty("--hero-x", (x * 13).toFixed(2) + "px");
    heroComposition.style.setProperty("--hero-y", (y * 9).toFixed(2) + "px");
  });
  heroComposition.addEventListener("pointerleave", () => {
    heroComposition.style.removeProperty("--hero-x");
    heroComposition.style.removeProperty("--hero-y");
  });
}

const ticker = document.querySelector("#gear-ticker");
const tickerToggle = document.querySelector("#ticker-toggle");
tickerToggle.addEventListener("click", () => {
  const pause = tickerToggle.getAttribute("aria-pressed") !== "true";
  ticker.dataset.paused = String(pause);
  tickerToggle.setAttribute("aria-pressed", String(pause));
  tickerToggle.setAttribute("aria-label", pause ? "Resume the scrolling strip" : "Pause the scrolling strip");
});

const storySteps = [...document.querySelectorAll("[data-story]")];
const storyLinks = [...document.querySelectorAll("[data-story-link]")];
const storyFrame = document.querySelector("#story-frame");
const storyVisual = document.querySelector(".story-visual");
const storyLabel = document.querySelector("#story-label");
const storyIndex = document.querySelector("#story-index");
const siteHeader = document.querySelector(".site-header");
const mobileStory = window.matchMedia("(max-width: 760px)");

function showStoryStep(stepIndex) {
  const step = storySteps[stepIndex];
  const key = step.dataset.story;
  storyFrame.dataset.part = key;
  storyLabel.textContent = step.querySelector("h3").textContent;
  storyIndex.textContent = (stepIndex + 1) + " / " + storySteps.length;
  storySteps.forEach((article) => { article.dataset.active = String(article === step); });
  storyLinks.forEach((link) => {
    if (link.dataset.storyLink === key) link.setAttribute("aria-current", "step");
    else link.removeAttribute("aria-current");
  });
}

let scrollUpdatePending = false;

function updateScroll() {
  scrollUpdatePending = false;
  const viewportHeight = window.innerHeight;
  const pageHeight = document.documentElement.scrollHeight - viewportHeight;
  const progress = Math.min(1, Math.max(0, window.scrollY / Math.max(1, pageHeight)));
  siteHeader.style.setProperty("--page-progress", progress.toFixed(4));

  const readingLine = mobileStory.matches
    ? Math.max(viewportHeight * 0.63, storyVisual.getBoundingClientRect().bottom + 58)
    : viewportHeight * 0.51;
  let activeIndex = 0;
  for (let index = 1; index < storySteps.length; index += 1) {
    if (storySteps[index].getBoundingClientRect().top > readingLine) break;
    activeIndex = index;
  }
  if (storySteps[activeIndex].dataset.active !== "true") showStoryStep(activeIndex);
}

function queueScrollUpdate() {
  if (scrollUpdatePending) return;
  scrollUpdatePending = true;
  window.requestAnimationFrame(updateScroll);
}

window.addEventListener("scroll", queueScrollUpdate, { passive: true });
window.addEventListener("resize", queueScrollUpdate);
window.addEventListener("pageshow", queueScrollUpdate);
queueScrollUpdate();

const hotspotButtons = [...document.querySelectorAll("[data-spot]")];
const hotspotDetail = document.querySelector("#hotspot-detail");
const hotspotLink = document.querySelector("#hotspot-link");

function showHotspot(key) {
  hotspotButtons.forEach((button) => {
    button.setAttribute("aria-expanded", String(button.dataset.spot === key));
  });
  hotspotDetail.hidden = !key;
  if (!key) return;

  const step = storySteps.find((article) => article.dataset.story === key);
  document.querySelector("#hotspot-title").textContent = step.querySelector("h3").textContent;
  document.querySelector("#hotspot-copy").textContent = step.querySelector("h3 + p").textContent;
  hotspotLink.href = "#" + step.id;
}

hotspotButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const isOpen = button.getAttribute("aria-expanded") === "true";
    showHotspot(isOpen ? null : button.dataset.spot);
  });
});

hotspotLink.addEventListener("click", () => showHotspot(null));

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || document.querySelector("dialog[open]")) return;
  if (menu.classList.contains("open")) {
    setMenu(false);
    menuButton.focus();
  } else {
    const active = hotspotButtons.find((button) => button.getAttribute("aria-expanded") === "true");
    if (active) {
      showHotspot(null);
      active.focus({ preventScroll: true });
    }
  }
});

const compareRange = document.querySelector("#compare-range");
const compareStage = document.querySelector("#compare-stage");
const compareButtons = [...document.querySelectorAll("[data-compare]")];

function updateComparison() {
  const value = Number(compareRange.value);
  compareStage.style.setProperty("--split", value + "%");

  let label = "Visor and face cover on across " + value + "% of the image";
  if (value === 0) label = "Visor and face cover off";
  if (value === 100) label = "Visor and face cover on";
  compareRange.setAttribute("aria-valuetext", label);

  compareButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(Number(button.dataset.compare) === value));
  });
  compareStage.dataset.state = value === 0 ? "open" : value === 100 ? "covered" : "split";
}

compareRange.addEventListener("input", updateComparison);
compareButtons.forEach((button) => {
  button.addEventListener("click", () => {
    compareRange.value = button.dataset.compare;
    updateComparison();
  });
});
updateComparison();

const rainRoom = document.querySelector("#rain-chamber");
const rainCanvas = document.querySelector("#rain-canvas");
const rainContext = rainCanvas.getContext("2d");
let weather = weatherOptions.downpour;
let rainDrops = [];
let rainWidth = 0;
let rainHeight = 0;
let rainVisible = false;
let rainFrame = 0;
let lastRainTime = 0;

function drawRain(delta) {
  if (!rainContext || !rainWidth || !rainHeight) return;
  const slope = Math.tan(weather.angle * Math.PI / 180);
  rainContext.clearRect(0, 0, rainWidth, rainHeight);
  for (const drop of rainDrops) {
    const displacement = weather.speed * drop.factor * delta;
    drop.x += displacement * slope;
    drop.y += displacement;
    if (drop.y > rainHeight + 24) {
      drop.y = -24;
      drop.x = Math.random() * rainWidth;
    }
    if (drop.x > rainWidth + 20) drop.x = -20;
    rainContext.strokeStyle = "rgba(195,215,225," + drop.opacity + ")";
    rainContext.lineWidth = drop.factor * 0.85;
    rainContext.beginPath();
    rainContext.moveTo(drop.x, drop.y);
    rainContext.lineTo(drop.x - drop.length * slope, drop.y - drop.length);
    rainContext.stroke();
  }
}

function resetDrops() {
  rainDrops = Array.from({ length: weather.count }, () => ({
    x: Math.random() * rainWidth,
    y: Math.random() * rainHeight,
    length: 5 + Math.random() * 16,
    factor: 0.6 + Math.random() * 0.8,
    opacity: (0.13 + Math.random() * 0.34).toFixed(2)
  }));
  drawRain(0);
}

function sizeRain() {
  if (!rainContext) return;
  const bounds = rainCanvas.getBoundingClientRect();
  rainWidth = bounds.width;
  rainHeight = bounds.height;
  const ratio = Math.min(window.devicePixelRatio || 1, 1.6);
  rainCanvas.width = Math.round(rainWidth * ratio);
  rainCanvas.height = Math.round(rainHeight * ratio);
  rainContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  resetDrops();
}

function requestRain() {
  if (!rainContext || rainFrame || !rainVisible || reducedMotion.matches || document.hidden) return;
  rainFrame = window.requestAnimationFrame((time) => {
    rainFrame = 0;
    const elapsed = lastRainTime ? Math.min(36, time - lastRainTime) / 1000 : 0;
    lastRainTime = time;
    drawRain(elapsed);
    requestRain();
  });
}

if (rainContext) {
  sizeRain();
  if ("ResizeObserver" in window) new ResizeObserver(sizeRain).observe(rainRoom);
  else window.addEventListener("resize", sizeRain);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      rainVisible = entry.isIntersecting;
      lastRainTime = 0;
      requestRain();
    }).observe(rainRoom);
  } else {
    rainVisible = true;
    requestRain();
  }
  document.addEventListener("visibilitychange", requestRain);
  reducedMotion.addEventListener("change", requestRain);
}

document.querySelector(".weather-controls").addEventListener("change", (event) => {
  const key = event.target.value;
  weather = weatherOptions[key];
  rainRoom.dataset.weather = key;
  document.querySelector("#weather-density").textContent = weather.count;
  document.querySelector("#weather-angle").textContent = weather.angle + "°";
  document.querySelector("#weather-shell").textContent = weather.shell;
  document.querySelector("#weather-face").textContent = weather.face;
  resetDrops();
});

const selectionKey = "akinti-selection-v1";
const interestKey = "akinti-interest-v1";
const selectionDialog = document.querySelector("#selection-dialog");
const selectionToggle = document.querySelector("#selection-toggle");
const selectionItems = document.querySelector("#selection-items");
const selectionStatus = document.querySelector("#selection-status");
const feedbackTimers = new WeakMap();

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function readSelection() {
  try {
    const stored = JSON.parse(readStorage(selectionKey) || "[]");
    if (!Array.isArray(stored)) return [];
    return stored.filter((item) => {
      if (!item || !Object.hasOwn(productCatalog, item.id)) return false;
      if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) return false;
      const product = productCatalog[item.id];
      return product.sizes.length ? product.sizes.includes(item.size) : item.size === "";
    });
  } catch {
    return [];
  }
}

let selection = readSelection();

function renderSelection() {
  const count = selection.reduce((total, item) => total + item.quantity, 0);
  document.querySelector("#selection-count").textContent = count;
  selectionToggle.setAttribute("aria-label", "My kit, " + count + (count === 1 ? " item" : " items"));
  document.querySelector("#selection-empty").hidden = count > 0;

  const rows = selection.map(({ id, quantity, size }, index) => {
    const product = productCatalog[id];
    const row = document.createElement("li");
    row.className = "selection-row";

    const img = document.createElement("img");
    img.alt = "";
    img.src = product.image;

    const info = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = product.name;
    const details = document.createElement("p");
    details.textContent = [size && "Size " + size, quantity + (quantity === 1 ? " item" : " items")].filter(Boolean).join(" · ");
    info.append(name, details);

    const remove = document.createElement("button");
    remove.className = "remove-item";
    remove.type = "button";
    remove.textContent = "Remove";
    remove.dataset.remove = String(index);
    remove.setAttribute("aria-label", product.name + (size ? ", size " + size : "") + ", remove one");

    row.append(img, info, remove);
    return row;
  });

  selectionItems.replaceChildren(...rows);
}

function saveSelection() {
  const saved = writeStorage(selectionKey, JSON.stringify(selection));
  document.querySelector("#selection-storage").textContent = saved
    ? "Your kit is saved in this browser."
    : "Your kit is saved for this session.";
  renderSelection();
}

document.querySelectorAll("[data-add]").forEach((button) => {
  button.addEventListener("click", () => {
    const id = button.dataset.add;
    const selectedSize = button.closest(".product")?.querySelector(".size-picker input:checked");
    const size = selectedSize?.value ?? "";
    const existing = selection.find((item) => item.id === id && item.size === size);
    if (existing) existing.quantity += 1;
    else selection.push({ id, size, quantity: 1 });

    saveSelection();
    selectionStatus.textContent = productCatalog[id].name + " added to your kit.";
    button.firstChild.textContent = "Added";
    button.classList.add("added");
    clearTimeout(feedbackTimers.get(button));
    feedbackTimers.set(button, setTimeout(() => {
      button.firstChild.textContent = "Add to kit";
      button.classList.remove("added");
    }, 1400));
  });
});

selectionToggle.addEventListener("click", () => selectionDialog.showModal());
selectionItems.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove]");
  if (!button) return;
  const index = Number(button.dataset.remove);
  const item = selection[index];
  item.quantity -= 1;
  if (item.quantity === 0) selection.splice(index, 1);
  saveSelection();
  const nextButton = selectionItems.querySelector('[data-remove="' + index + '"]') ||
    selectionItems.querySelector(".remove-item") || selectionDialog.querySelector(".icon-button");
  nextButton.focus();
});

document.querySelector("#back-to-collection").addEventListener("click", () => selectionDialog.close());
window.addEventListener("storage", (event) => {
  if (event.key !== selectionKey) return;
  selection = readSelection();
  renderSelection();
});
renderSelection();

const noteDialog = document.querySelector("#note-dialog");
document.querySelectorAll("[data-note]").forEach((button) => {
  button.addEventListener("click", () => {
    const note = notes[button.dataset.note];
    document.querySelector("#note-dialog-title").textContent = note.title;
    document.querySelector("#note-dialog-image").src = note.image;
    const paragraphs = note.paragraphs.map((content) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = content;
      return paragraph;
    });
    document.querySelector("#note-dialog-body").replaceChildren(...paragraphs);
    noteDialog.showModal();
  });
});

[selectionDialog, noteDialog].forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    const outside = event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom;
    if (outside) dialog.close();
  });
});

const interestForm = document.querySelector("#interest-form");
const emailInput = document.querySelector("#interest-email");
const interestStatus = document.querySelector("#interest-status");

if (readStorage(interestKey)) {
  interestStatus.textContent = "You have an interest-list entry in this browser.";
}

interestForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const saved = writeStorage(interestKey, emailInput.value.trim());
  interestStatus.textContent = saved
    ? "Your interest-list entry was saved in this browser."
    : "Could not save your entry. Browser storage is unavailable.";
  if (saved) interestForm.reset();
});

if ("IntersectionObserver" in window) {
  const reveal = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("revealed");
      reveal.unobserve(entry.target);
    });
  }, { threshold: 0.13 });

  document.querySelectorAll("[data-reveal]").forEach((item) => reveal.observe(item));
}
