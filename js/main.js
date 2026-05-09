// ============================================================
// main.js — エントリポイント
// ============================================================

import { state, pauseTime, resumeTime } from "./state.js";
import { initI18n, setLang, getLang, applyDataI18n, t } from "./i18n.js";
import {
  TICK_INTERVAL_MS,
  SECONDS_PER_WEEK,
  WEEKS_PER_MONTH,
  MONTHS_PER_YEAR,
} from "./constants.js";

const HERO_PLACEHOLDER_COUNT = 10;

// ============================================================
// DOM helpers
// ============================================================
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// ============================================================
// Init
// ============================================================
async function init() {
  pauseTime();   // ← 起動 splash 中は時間停止

  await initI18n();

  // ロード完了 → splash dismiss
  $("#splash")?.classList.add("hidden");
  $("#titleScreen")?.classList.remove("hidden");

  resumeTime();   // ← splash 終了

  setupTitleScreen();
  setupHelpOverlay();
  setupLangToggle();
  setupHeroSelectStub();

  // タイトル画面表示中は時間が進むが、 onTick は state.activeXxx が無いので何も起きない
  startTimeLoop();
}

// ============================================================
// Title screen
// ============================================================
function setupTitleScreen() {
  $("#btnPressStart")?.addEventListener("click", dismissTitle);
}

function dismissTitle() {
  $("#titleScreen")?.classList.add("hidden");
  $("#app")?.classList.remove("hidden");
  // BGM 開始は audio.js の startBgm をここで呼ぶ
  // import("./audio.js").then(({ startBgm }) => startBgm("Audio/bgm_home.mp3"));
}

// ============================================================
// Lang toggle
// ============================================================
function setupLangToggle() {
  // タイトル画面の lang toggle
  $("#langToggle")?.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-lang]");
    if (!btn) return;
    setLang(btn.getAttribute("data-lang"));
    refreshLangButtonState();
  });
  refreshLangButtonState();

  // ヘッダーボタン (= 1 クリックで toggle)
  $("#btnLangToggle")?.addEventListener("click", () => {
    setLang(getLang() === "en" ? "ja" : "en");
    refreshLangButtonState();
  });
}

function refreshLangButtonState() {
  $$(".lang-btn").forEach((b) => {
    b.classList.toggle(
      "lang-btn--active",
      b.getAttribute("data-lang") === getLang()
    );
  });
}

// ============================================================
// Help overlay
// ============================================================
function setupHelpOverlay() {
  const overlay = $("#helpOverlay");
  if (!overlay) return;

  $("#btnHelpOpen")?.addEventListener("click", openHelp);
  $("#btnHelpClose")?.addEventListener("click", closeHelp);
  overlay.addEventListener("click", (e) => {
    if (e.target.id === "helpOverlay") closeHelp();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.classList.contains("hidden")) {
      closeHelp();
    }
  });
}

function openHelp() {
  pauseTime();
  $("#helpOverlay")?.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeHelp() {
  $("#helpOverlay")?.classList.add("hidden");
  document.body.style.overflow = "";
  resumeTime();
}

// ============================================================
// Hero select stub (= Day 1 mock, SPEC-001)
// ============================================================
function setupHeroSelectStub() {
  $("#btnOpenHeroSelect")?.addEventListener("click", openHeroSelect);
  $("#btnHeroSelectClose")?.addEventListener("click", closeHeroSelect);

  const modal = $("#heroSelectModal");
  modal?.addEventListener("click", (e) => {
    if (e.target.id === "heroSelectModal") closeHeroSelect();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && !modal.classList.contains("hidden")) {
      closeHeroSelect();
    }
  });
}

function openHeroSelect() {
  pauseTime();
  $("#heroSelectModal")?.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  renderHeroSelectStub();
}

function closeHeroSelect() {
  $("#heroSelectModal")?.classList.add("hidden");
  document.body.style.overflow = "";
  resumeTime();
}

function renderHeroSelectStub() {
  const grid = $("#heroGrid");
  if (!grid) return;
  grid.innerHTML = "";
  const label = t("hero.placeholderLabel");
  for (let i = 1; i <= HERO_PLACEHOLDER_COUNT; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "hero-tile";
    btn.dataset.heroIdx = String(i);
    btn.setAttribute("aria-label", `${label} #${String(i).padStart(2, "0")}`);

    const num = document.createElement("span");
    num.className = "hero-tile__num";
    num.textContent = `#${String(i).padStart(2, "0")}`;

    const lbl = document.createElement("span");
    lbl.className = "hero-tile__label";
    lbl.textContent = label;

    btn.appendChild(num);
    btn.appendChild(lbl);
    btn.addEventListener("click", () => pickHeroPlaceholder(i));
    grid.appendChild(btn);
  }
}

function pickHeroPlaceholder(idx) {
  showStubToast(t("hero.comingSoonToast"));
}

// ============================================================
// Notifications (= ephemeral toast in #notifLayer)
// ============================================================
const NOTIF_TTL_MS = 2400;

function showStubToast(message) {
  const layer = $("#notifLayer");
  if (!layer) return;
  const tile = document.createElement("div");
  tile.className = "notification";
  tile.textContent = message;
  layer.appendChild(tile);
  setTimeout(() => tile.remove(), NOTIF_TTL_MS);
}

// ============================================================
// Time loop
// ============================================================
let _tickHandle = null;

function startTimeLoop() {
  if (_tickHandle) return;
  _tickHandle = setInterval(onTick, currentTickInterval());
}

function stopTimeLoop() {
  if (_tickHandle) {
    clearInterval(_tickHandle);
    _tickHandle = null;
  }
}

function currentTickInterval() {
  if (state.timeSpeed20x) return Math.round(TICK_INTERVAL_MS / 20);
  if (state.timeSpeed2x) return Math.round(TICK_INTERVAL_MS / 2);
  return TICK_INTERVAL_MS;
}

function onTick() {
  if (state.pauseFlags > 0) return;
  state.tickCount++;
  state.weekProgress++;
  if (state.weekProgress >= SECONDS_PER_WEEK) advanceWeek();

  // ... 各 feature の tick はここから呼ぶ ...
  // tickActiveCraft();
  // tickActiveQuest();

  renderHeader();
}

function advanceWeek() {
  state.weekProgress = 0;
  state.week++;
  if (state.week > WEEKS_PER_MONTH) {
    state.week = 1;
    state.month++;
    if (state.month > MONTHS_PER_YEAR) {
      state.month = 1;
      state.year++;
    }
  }
  // checkMonthlyEvents() をここから呼ぶ
}

function renderHeader() {
  const el = $("#dateLabel");
  if (el) el.textContent = `${state.year} 年 ${state.month} 月 ${state.week} 週`;
}

// ============================================================
// Boot
// ============================================================
window.addEventListener("DOMContentLoaded", () => {
  init().catch((e) => console.error("init failed", e));
});

// ============================================================
// Global で覗くため (= デバッグ用)
// ============================================================
if (typeof window !== "undefined") {
  window.__state = state;
  window.__pauseTime = pauseTime;
  window.__resumeTime = resumeTime;
}
