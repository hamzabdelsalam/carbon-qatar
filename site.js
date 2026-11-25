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

const video = document.querySelector(".hero-video");
const videoPlay = document.querySelector(".hero-play");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function playReel() {
  video.hidden = false;
  video.muted = true;
  video.playsInline = true;
  if (!video.getAttribute("src")) video.src = video.dataset.src;
  return video.play();
}

video.addEventListener("playing", () => {
  if (document.activeElement === videoPlay) {
    document.querySelector(".hero-actions a").focus({ preventScroll: true });
  }
  videoPlay.hidden = true;
});

video.addEventListener("error", () => {
  video.hidden = true;
  videoPlay.hidden = false;
});

reducedMotion.addEventListener("change", event => {
  if (event.matches) {
    video.autoplay = false;
    video.pause();
    video.hidden = true;
    videoPlay.hidden = false;
  }
});

videoPlay.addEventListener("click", event => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || video.error) return;
  event.preventDefault();
  playReel().catch(() => window.location.assign(videoPlay.href));
});

if (reducedMotion.matches) {
  video.autoplay = false;
  videoPlay.hidden = false;
} else {
  playReel().catch(() => {
    videoPlay.hidden = false;
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
