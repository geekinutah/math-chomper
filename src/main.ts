import { createInitialState, reduce, type Action, type GameState } from "@/game/state";
import { createLoop } from "@/game/loop";
import { attachKeyboard } from "@/input/keyboard";
import { renderBoard, createBoardCanvas } from "@/render/canvas";
import { renderHud } from "@/ui/hud";
import { renderScreens } from "@/ui/screens";

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

const dispatch = (action: Action): void => {
  state = reduce(state, action, rng);
};

const renderAll = (s: GameState): void => {
  renderBoard(ctx, s);
  renderHud(hudEl, s);
  renderScreens(screensEl, s, dispatch);
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
