import type { Cell, Mode, Rule } from "@/rules/types";
import { matches } from "@/rules/match";
import { generateBoard, type GenConfig } from "@/rules/generate";

export const COLS = 6;
export const ROWS = 5;
export const BOARD_SIZE = 30;

export type Dir = "up" | "down" | "left" | "right";
export type Phase = "title" | "playing" | "level-clear" | "game-over" | "paused";
export type PlayerPos = { col: number; row: number };

export type GameState = {
  phase: Phase;
  mode: Mode;
  level: number;
  score: number;
  lives: number;
  reserveLives: number;
  streak: number;
  nextLifeThreshold: number;
  rule: Rule;
  board: Cell[];
  playerPos: PlayerPos;
};

export type Action =
  | { type: "start"; mode: Mode }
  | { type: "move"; dir: Dir }
  | { type: "eat" }
  | { type: "tick"; dt: number }
  | { type: "next-level" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "restart" };

const GEN_CONFIG: GenConfig = {
  numMin: 1,
  numMax: 60,
  exprOps: ["+", "−", "×", "÷"],
  exprMin: 0,
  exprMax: 12,
};

let lcgState = 1;
function defaultRng(): number {
  lcgState = (lcgState * 16807) % 2147483647;
  return (lcgState - 1) / 2147483646;
}

function randomInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function genRule(mode: Mode, rng: () => number): Rule {
  const k = randomInt(rng, 2, 12);
  switch (mode) {
    case "primes":
      return { mode };
    case "multiples":
      return { mode, k };
    case "factors":
      return { mode, k };
    case "equality":
      return { mode, k };
    case "inequality":
      return { mode, k };
  }
}

function cellIndex(pos: PlayerPos): number {
  return pos.row * COLS + pos.col;
}

const CENTER: PlayerPos = { col: 2, row: 2 };

function freshBoard(): Cell[] {
  return Array.from({ length: BOARD_SIZE }, () => ({ kind: "empty" as const }));
}

export function createInitialState(): GameState {
  return {
    phase: "title",
    mode: "multiples",
    level: 1,
    score: 0,
    lives: 3,
    reserveLives: 0,
    streak: 0,
    nextLifeThreshold: 1000,
    rule: { mode: "multiples", k: 3 },
    board: freshBoard(),
    playerPos: CENTER,
  };
}

function startGame(state: GameState, mode: Mode, rng: () => number): GameState {
  const rule = genRule(mode, rng);
  const board = generateBoard(rule, rng, GEN_CONFIG);
  return {
    ...state,
    phase: "playing",
    mode,
    level: 1,
    score: 0,
    lives: 3,
    reserveLives: 0,
    streak: 0,
    nextLifeThreshold: 1000,
    rule,
    board,
    playerPos: CENTER,
  };
}

function handleMove(state: GameState, dir: Dir): GameState {
  let { col, row } = state.playerPos;
  switch (dir) {
    case "up":
      row -= 1;
      break;
    case "down":
      row += 1;
      break;
    case "left":
      col -= 1;
      break;
    case "right":
      col += 1;
      break;
  }
  col = Math.max(0, Math.min(COLS - 1, col));
  row = Math.max(0, Math.min(ROWS - 1, row));
  return { ...state, playerPos: { col, row } };
}

function handleEat(state: GameState): GameState {
  const idx = cellIndex(state.playerPos);
  const cell = state.board[idx];
  if (cell.kind === "empty") return state;

  const board = [...state.board];
  board[idx] = { kind: "empty" };

  if (matches(state.rule, cell)) {
    const points = state.streak >= 3 ? 15 : 10;
    let score = state.score + points;
    let streak = state.streak + 1;
    let lives = state.lives;
    let reserveLives = state.reserveLives;
    let nextLifeThreshold = state.nextLifeThreshold;
    let phase: Phase = state.phase;

    const hasRemaining = board.some((c) => matches(state.rule, c));
    if (!hasRemaining) {
      score += 25 + 5 * state.level;
      phase = "level-clear";
    }

    if (score >= nextLifeThreshold) {
      reserveLives = Math.min(reserveLives + 1, 2);
      nextLifeThreshold += 1000;
    }

    return { ...state, board, score, streak, lives, reserveLives, nextLifeThreshold, phase };
  }

  const lives = state.lives - 1;
  const phase: Phase = lives <= 0 ? "game-over" : state.phase;
  return { ...state, board, lives, streak: 0, phase };
}

export function reduce(state: GameState, action: Action, rng?: () => number): GameState {
  const r = rng ?? defaultRng;

  switch (action.type) {
    case "start":
      return startGame(state, action.mode, r);
    case "move":
      if (state.phase !== "playing") return state;
      return handleMove(state, action.dir);
    case "eat":
      if (state.phase !== "playing") return state;
      return handleEat(state);
    case "tick":
      return state;
    case "next-level": {
      if (state.phase !== "level-clear") return state;
      const rule = genRule(state.mode, r);
      const board = generateBoard(rule, r, GEN_CONFIG);
      return {
        ...state,
        phase: "playing",
        level: state.level + 1,
        rule,
        board,
        playerPos: CENTER,
        streak: 0,
      };
    }
    case "pause":
      if (state.phase !== "playing") return state;
      return { ...state, phase: "paused" };
    case "resume":
      if (state.phase !== "paused") return state;
      return { ...state, phase: "playing" };
    case "restart":
      return startGame(state, state.mode, r);
  }
}
