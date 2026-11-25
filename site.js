const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector("#site-nav");
const mobile = window.matchMedia("(max-width: 680px)");

function closeMenu(returnFocus = false) {
  menuButton.setAttribute("aria-expanded", "false");
  nav.hidden = mobile.matches;
  if (returnFocus) menuButton.focus();
}

function syncMenu() {
  menuButton.hidden = !mobile.matches;
  closeMenu();
}

syncMenu();
mobile.addEventListener("change", syncMenu);

menuButton.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  if (isOpen) {
    closeMenu();
  } else {
    menuButton.setAttribute("aria-expanded", "true");
    nav.hidden = false;
  }
});

nav.addEventListener("click", event => {
  const link = event.target.closest("a");
  if (!link || !mobile.matches) return;
  closeMenu();
  const target = document.querySelector(link.hash);
  if (target) {
    target.tabIndex = -1;
    target.focus({ preventScroll: true });
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
    closeMenu(true);
  }
});

const form = document.querySelector(".quote-form");
const service = document.querySelector("#service");
const isArabic = document.documentElement.lang === "ar";
const message = isArabic
  ? { greeting: "مرحباً كاربون، أود طلب عرض سعر.", service: "الخدمة", vehicle: "السيارة", notes: "ملاحظات" }
  : { greeting: "Hi Carbon! I’d like a quote.", service: "Service", vehicle: "Vehicle", notes: "Notes" };
form.hidden = false;

document.querySelectorAll("[data-service]").forEach(link => {
  link.addEventListener("click", () => {
    service.value = link.dataset.service;
  });
});

form.addEventListener("submit", event => {
  event.preventDefault();
  const fields = new FormData(form);
  const notes = String(fields.get("notes")).trim();
  const vehicle = String(fields.get("vehicle")).trim();
  if (!vehicle) {
    const vehicleInput = form.elements.namedItem("vehicle");
    vehicleInput.value = "";
    vehicleInput.reportValidity();
    return;
  }
  const lines = [
    message.greeting,
    `${message.service}: ${fields.get("service")}`,
    `${message.vehicle}: ${vehicle}`,
  ];
  if (notes) lines.push(`${message.notes}: ${notes}`);
  const destination = new URL(form.action);
  destination.searchParams.set("text", lines.join("\n"));
  window.location.assign(destination);
});

const heroCanvas = document.querySelector(".hero-media canvas");
const heroMotion = window.matchMedia("(prefers-reduced-motion: no-preference)");
const heroContext = heroCanvas.getContext("2d", { alpha: false });

if (heroContext && "IntersectionObserver" in window) {
  const framesPerSheet = 12;
  const framesPerSecond = 12;
  const columns = 4;
  const sheetCount = 4;
  const loopDuration = sheetCount * framesPerSheet * 1000 / framesPerSecond;
  const sheets = new Map();
  const sheetBlobs = new Map();
  const loadingSheets = new Set();
  const { width, height } = heroCanvas;
  const initialSection = document.getElementById(location.hash.slice(1));
  let waitingForAnchor = initialSection?.matches("section[id]") ?? false;
  let inView = false;
  let animationFrame = 0;
  let elapsed = 0;
  let previousTime = null;
  let renderedFrame = -1;
  let playbackFailed = false;

  function scheduleHeroFrame() {
    if (waitingForAnchor || !inView || !heroMotion.matches || document.hidden || animationFrame || playbackFailed) return;
    animationFrame = requestAnimationFrame(drawHeroFrame);
  }

  async function loadHeroSheet(index) {
    if (sheets.has(index) || loadingSheets.has(index)) return;
    loadingSheets.add(index);
    let imageUrl;
    try {
      let blob = sheetBlobs.get(index);
      if (!blob) {
        const response = await fetch(`/assets/carbon-hero-${index + 1}.webp`);
        if (!response.ok) throw new Error("Could not load hero footage.");
        blob = await response.blob();
        sheetBlobs.set(index, blob);
      }
      const image = new Image();
      imageUrl = URL.createObjectURL(blob);
      image.src = imageUrl;
      await image.decode();
      sheets.set(index, image);
      scheduleHeroFrame();
    } catch {
      playbackFailed = true;
      heroObserver.disconnect();
    } finally {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      loadingSheets.delete(index);
    }
  }

  function drawHeroFrame(time) {
    animationFrame = 0;
    if (!inView || !heroMotion.matches || document.hidden || playbackFailed) return;
    if (previousTime !== null) elapsed = (elapsed + Math.min(time - previousTime, 120)) % loopDuration;
    const frame = Math.floor(elapsed * framesPerSecond / 1000);
    const index = Math.floor(frame / framesPerSheet);
    const sheet = sheets.get(index);

    if (!sheet) {
      loadHeroSheet(index);
      elapsed = index * framesPerSheet * 1000 / framesPerSecond;
      previousTime = null;
      return;
    }

    if (frame !== renderedFrame) {
      const tile = frame % framesPerSheet;
      heroContext.drawImage(sheet, (tile % columns) * width, Math.floor(tile / columns) * height, width, height, 0, 0, width, height);
      if (renderedFrame === -1) heroCanvas.hidden = false;
      const previousIndex = Math.floor(renderedFrame / framesPerSheet);
      if (previousIndex !== index) {
        sheets.delete(previousIndex);
        loadHeroSheet((index + 1) % sheetCount);
      }
      renderedFrame = frame;
    }

    previousTime = time;
    scheduleHeroFrame();
  }

  function syncHeroMotion() {
    previousTime = null;
    scheduleHeroFrame();
  }

  const visibleThreshold = 0.15;
  const heroObserver = new IntersectionObserver(([entry]) => {
    inView = entry.intersectionRatio >= visibleThreshold;
    if (!inView) waitingForAnchor = false;
    syncHeroMotion();
  }, { threshold: visibleThreshold });
  heroObserver.observe(heroCanvas.closest(".hero"));
  heroMotion.addEventListener("change", syncHeroMotion);
  document.addEventListener("visibilitychange", syncHeroMotion);
  window.addEventListener("hashchange", () => {
    if (location.hash === "#top" || location.hash === "#main" || !location.hash) {
      waitingForAnchor = false;
      syncHeroMotion();
    }
  });
}

if (!CSS.supports("animation-timeline: view()") && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("has-entered");
      revealObserver.unobserve(entry.target);
    }
  }, { threshold: 0.18 });

  revealObserver.observe(document.querySelector(".studio"));
  revealObserver.observe(form);
}
