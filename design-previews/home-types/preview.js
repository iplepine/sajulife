"use strict";

const variants = {
  a: { title: "A · 현재 모습", description: "A · 현재 모습 — 한 사람 안에 겹쳐진 두 가지 시선" },
  b: { title: "B · 입체 명식", description: "B · 입체 명식 — 태어난 구조를 빛과 재질로" },
  c: { title: "C · 나를 읽는 분석서", description: "C · 나를 읽는 분석서 — 나를 이해하는 한 권의 기록" },
};
const seasons = ["spring", "summer", "autumn", "winter"];
let selectionVersion = 0;

function syncControls() {
  const { type, season } = document.documentElement.dataset;
  document.querySelectorAll("button[data-type]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.type === type)));
  document.querySelectorAll("button[data-season]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.season === season)));
  document.querySelectorAll(".hero-art").forEach((art) => art.setAttribute("aria-hidden", String(!art.classList.contains(`art-${type}`))));
  document.getElementById("type-description").textContent = variants[type].description;
  document.title = `${variants[type].title} — sajulife 홈 비교`;
}

function syncUrl() {
  const url = new URL(location.href);
  url.searchParams.set("type", document.documentElement.dataset.type);
  url.searchParams.set("season", document.documentElement.dataset.season);
  history.replaceState({}, "", url);
}

async function setType(type) {
  if (!Object.hasOwn(variants, type)) return;
  const version = ++selectionVersion;
  const image = document.querySelector(`.art-${type}`);
  // Keep the last artwork visible while the next asset decodes, even on slow connections.
  try { await image.decode(); } catch { /* A failed asset remains detectable in browser QA. */ }
  if (version !== selectionVersion) return;
  document.documentElement.dataset.type = type;
  syncControls();
  syncUrl();
  document.getElementById("switch-status").textContent = `${variants[type].title} 미리보기`;
}

document.querySelectorAll("button[data-type]").forEach((button) => button.addEventListener("click", () => setType(button.dataset.type)));
document.querySelectorAll("button[data-season]").forEach((button) => button.addEventListener("click", () => {
  if (!seasons.includes(button.dataset.season)) return;
  document.documentElement.dataset.season = button.dataset.season;
  syncControls();
  syncUrl();
}));

const dialog = document.querySelector("dialog");
document.querySelectorAll("[data-demo]").forEach((button) => button.addEventListener("click", () => {
  document.getElementById("preview-title").textContent = button.dataset.demo;
  dialog.showModal();
}));
document.getElementById("close-dialog").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
syncControls();
