import type { Cell, Mode, Rule } from "@/rules/types";
import { matches } from "@/rules/match";
import { generateBoard } from "@/rules/generate";
import type { Enemy, Refuge } from "@/game/enemies";
import { handleTick } from "@/game/tick";
import { playerStepDelay } from "@/game/player";
import { getBand, getGenConfig, getKRange, type Band, type BandName } from "@/content/bands";

export const COLS = 6;
export const ROWS = 5;
export const BOARD_SIZE = 30;

export type Dir = "up" | "down" | "left" | "right";
export type Phase = "title" | "playing" | "level-clear" | "game-over" | "paused";
export type PlayerPos = { col: number; row: number };
export type GameMode = Mode | "challenge";

export const CHALLENGE_MODES: readonly Mode[] = ["multiples", "factors", "primes", "equality", "inequality"];

export type GameState = {
  phase: Phase;
  mode: GameMode;
  band: BandName;
  level: number;
  score: number;
  lives: number;
  reserveLives: number;
  streak: number;
  nextLifeThreshold: number;
  rule: Rule;
  board: Cell[];
  playerPos: PlayerPos;
  enemies: Enemy[];
  refuge: Refuge | null;
  simTime: number;
  freezeTimer: number;
  stepTimer: number;
  pendingDir: Dir | null;
  queuedDir: Dir | null;
};

export type Action =
  | { type: "start"; mode: GameMode; band: BandName }
  | { type: "move"; dir: Dir }
  | { type: "eat" }
  | { type: "tick"; dt: number }
  | { type: "enemy-hit" }
  | { type: "next-level" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "restart" };

let lcgState = 1;
function defaultRng(): number {
  lcgState = (lcgState * 16807) % 2147483647;
  return (lcgState - 1) / 2147483646;
}

function randomInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function nextChallengeMode(rule: Rule): Mode {
  const idx = CHALLENGE_MODES.indexOf(rule.mode);
  return CHALLENGE_MODES[(idx + 1) % CHALLENGE_MODES.length];
}

function genRule(mode: Mode, level: number, rng: () => number, band: Band): Rule {
  const { min: kMin, max: kMax } = getKRange(band);
  // Multiples widens by one per level, capped at the band's k max.
  const top = mode === "multiples" ? Math.min(kMax, kMin + level + 1) : kMax;
  // Hard floors expressions at 13; a lower equality/inequality key could never match.
  const floor = mode === "equality" || mode === "inequality" ? Math.max(kMin, band.exprMinResult ?? 0) : kMin;
  const k = randomInt(rng, floor, top);
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
const IDLE_STEP = { stepTimer: 0, pendingDir: null, queuedDir: null };

function freshBoard(): Cell[] {
  return Array.from({ length: BOARD_SIZE }, () => ({ kind: "empty" as const }));
}

export function createInitialState(): GameState {
  return {
    phase: "title",
    mode: "multiples",
    band: "standard",
    level: 1,
    score: 0,
    lives: 3,
    reserveLives: 0,
    streak: 0,
    nextLifeThreshold: 1000,
    rule: { mode: "multiples", k: 3 },
    board: freshBoard(),
    playerPos: CENTER,
    enemies: [],
    refuge: null,
    simTime: 0,
    freezeTimer: 0,
    stepTimer: 0,
    pendingDir: null,
    queuedDir: null,
  };
}

function startGame(mode: GameMode, bandName: BandName, rng: () => number): GameState {
  const band = getBand(bandName);
  const ruleMode = mode === "challenge" ? CHALLENGE_MODES[0] : mode;
  const rule = genRule(ruleMode, 1, rng, band);
  const board = generateBoard(rule, rng, getGenConfig(band));
  return {
    ...createInitialState(),
    phase: "playing",
    mode,
    band: bandName,
    rule,
    board,
  };
}

function handleMove(state: GameState, dir: Dir): GameState {
  if (state.stepTimer === 0) {
    return { ...state, pendingDir: dir, stepTimer: playerStepDelay(state.level) };
  }
  return { ...state, queuedDir: dir };
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

export function handleEnemyHit(state: GameState, rng: () => number): GameState {
  const lives = state.lives - 1;
  if (lives <= 0) {
    return { ...state, ...IDLE_STEP, lives: 0, streak: 0, freezeTimer: 700, phase: "game-over" };
  }
  const blocked = new Set<string>();
  for (const e of state.enemies) blocked.add(`${e.pos.col},${e.pos.row}`);
  if (state.refuge) blocked.add(`${state.refuge.pos.col},${state.refuge.pos.row}`);
  const cells: PlayerPos[] = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (!blocked.has(`${c},${r}`)) cells.push({ col: c, row: r });
  const pos = cells.length > 0 ? cells[Math.floor(rng() * cells.length)] : CENTER;
  return { ...state, ...IDLE_STEP, lives, streak: 0, freezeTimer: 700, playerPos: pos };
}

export function reduce(state: GameState, action: Action, rng?: () => number): GameState {
  const r = rng ?? defaultRng;

  switch (action.type) {
    case "start":
      return startGame(action.mode, action.band, r);
    case "move":
      if (state.phase !== "playing") return state;
      return handleMove(state, action.dir);
    case "eat":
      if (state.phase !== "playing") return state;
      return handleEat(state);
    case "tick":
      return handleTick(state, action, r);
    case "enemy-hit":
      if (state.phase !== "playing") return state;
      return handleEnemyHit(state, r);
    case "next-level": {
      if (state.phase !== "level-clear") return state;
      const band = getBand(state.band);
      const nextMode: Mode = state.mode === "challenge" ? nextChallengeMode(state.rule) : state.mode;
      const rule = genRule(nextMode, state.level + 1, r, band);
      const board = generateBoard(rule, r, getGenConfig(band));
      return {
        ...state,
        ...IDLE_STEP,
        phase: "playing",
        level: state.level + 1,
        rule,
        board,
        playerPos: CENTER,
        streak: 0,
        enemies: [],
        refuge: null,
      };
    }
    case "pause":
      if (state.phase !== "playing") return state;
      return { ...state, phase: "paused" };
    case "resume":
      if (state.phase !== "paused") return state;
      return { ...state, phase: "playing" };
    case "restart":
      return startGame(state.mode, state.band, r);
  }
}
