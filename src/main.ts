import { createInitialState, reduce, type Action, type GameMode, type GameState } from "@/game/state";
import { createLoop } from "@/game/loop";
import { attachKeyboard } from "@/input/keyboard";
import { attachTouch } from "@/input/touch";
import { renderBoard, createBoardCanvas } from "@/render/canvas";
import { renderHud } from "@/ui/hud";
import { renderScreens, type SubScreen } from "@/ui/screens";
import {
  initAudio,
  setMuted,
  playEat,
  playWrong,
  playHit,
  playLevelClear,
  playRefuge,
} from "@/audio/beeps";
import {
  loadSettings,
  saveSettings,
  loadScores,
  saveScore,
  resetScores,
  qualifiesForScores,
  type ScoreEntry,
  type Settings,
  type TouchMode,
} from "@/storage";
import type { BandName } from "@/content/bands";

let lcg = 42;
const rng = (): number => {
  lcg = (lcg * 16807) % 2147483647;
  return (lcg - 1) / 2147483646;
};

const canvas = document.querySelector<HTMLCanvasElement>("#board");
const hudEl = document.querySelector<HTMLElement>("#hud");
const screensEl = document.querySelector<HTMLElement>("#screens");
const boardWrap = document.querySelector<HTMLElement>("#board-wrap");
const gameEl = document.querySelector<HTMLElement>("#game");
const touchControls = document.querySelector<HTMLElement>("#touch-controls");

if (canvas === null) throw new Error("Missing #board");
if (hudEl === null) throw new Error("Missing #hud");
if (screensEl === null) throw new Error("Missing #screens");
if (boardWrap === null) throw new Error("Missing #board-wrap");
if (gameEl === null) throw new Error("Missing #game");

createBoardCanvas(canvas);
const ctx = canvas.getContext("2d");
if (ctx === null) throw new Error("Canvas 2D context unavailable");
ctx.imageSmoothingEnabled = false;

let state: GameState = createInitialState();
let subScreen: SubScreen = "none";
let settings: Settings = loadSettings();
let scores: ScoreEntry[] = loadScores();
let runQualifies = false;
let runScoreSaved = false;
let detachTouch: (() => void) | null = null;

setMuted(settings.mute);

const unlockAudio = (): void => {
  initAudio();
};
window.addEventListener("pointerdown", unlockAudio, { once: true });
window.addEventListener("keydown", unlockAudio, { once: true });

if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.body.classList.add("mc-reduced-motion");
}

function playForTransition(action: Action, prev: GameState, next: GameState): void {
  if (next.phase === "level-clear" && prev.phase !== "level-clear") {
    playLevelClear();
    return;
  }
  if (next.lives < prev.lives) {
    if (action.type === "eat") playWrong();
    else playHit();
    // saveScore rejects scores <= 0, so a 0-point run can never rank.
    if (next.phase === "game-over" && next.score > 0) {
      runQualifies = qualifiesForScores(next.score);
    }
    return;
  }
  if (next.score > prev.score) {
    playEat();
  }
  if (next.refuge !== null && prev.refuge === null) {
    playRefuge();
  }
}

const dispatch = (action: Action): void => {
  const prev = state;
  const next = reduce(state, action, rng);
  state = next;
  if (next !== prev) {
    playForTransition(action, prev, next);
    if (next.phase === "playing" && prev.phase !== "playing" && prev.phase !== "paused") {
      runScoreSaved = false;
    }
  }
};

const attachTouchControls = (mode: TouchMode): void => {
  if (detachTouch !== null) detachTouch();
  detachTouch = attachTouch(dispatch, () => state.phase, mode, canvas);
  const root = document.querySelector<HTMLElement>(".mc-touch");
  if (root !== null && touchControls !== null) touchControls.appendChild(root);
};

attachTouchControls(settings.touch);

const onSettingsChange = (s: Settings): void => {
  if (s.touch !== settings.touch) attachTouchControls(s.touch);
  settings = s;
  saveSettings(s);
  setMuted(s.mute);
  renderAll(state);
};

const onResetScores = (): void => {
  resetScores();
  scores = [];
  renderAll(state);
};

const onScoreSave = (name: string): void => {
  scores = saveScore({ name, mode: state.mode, band: state.band, score: state.score, level: state.level });
  runScoreSaved = true;
  renderAll(state);
};

const renderAll = (s: GameState): void => {
  renderBoard(ctx, s);
  renderHud(hudEl, s);
  const showInitials = s.phase === "game-over" && runQualifies && !runScoreSaved;
  renderScreens(
    screensEl, s, dispatch,
    subScreen,
    settings,
    (ss: SubScreen) => { subScreen = ss; renderAll(state); },
    (mode: GameMode, band: BandName) => { subScreen = "none"; dispatch({ type: "start", mode, band }); renderAll(state); },
    onSettingsChange,
    onResetScores,
    scores,
    showInitials ? onScoreSave : undefined,
  );
  hudEl.classList.toggle("hidden", s.phase === "title");
};

renderAll(state);

attachKeyboard(dispatch, () => state.phase);

const onAdvanceKey = (e: KeyboardEvent): void => {
  if (state.phase === "level-clear" && (e.key === " " || e.key === "Enter")) {
    e.preventDefault();
    dispatch({ type: "next-level" });
  }
};
window.addEventListener("keydown", onAdvanceKey);

createLoop(
  dispatch,
  (s) => {
    state = s;
    renderAll(s);
  },
  () => state,
);

const applyScale = (): void => {
  const availW = window.innerWidth;
  const availH = window.innerHeight;
  const hudH = hudEl.classList.contains("hidden") ? 0 : hudEl.offsetHeight || 40;
  const availBoardH = availH - hudH - 20;
  const scale = Math.max(1, Math.min(Math.floor(availW / 960), Math.floor(availBoardH / 600)));
  const cssW = 960 * scale;
  const cssH = 600 * scale;
  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";
  hudEl.style.maxWidth = cssW + "px";
  boardWrap.style.width = cssW + "px";
  boardWrap.style.height = cssH + "px";
  gameEl.style.width = cssW + "px";
};

applyScale();
window.addEventListener("resize", applyScale);
