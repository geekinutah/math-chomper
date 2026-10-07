import type { Cell, Rule } from "@/rules/types";
import type { Enemy } from "@/game/enemies";
import { BOARD_SIZE, COLS, type GameState } from "@/game/state";
import { matches } from "@/rules/match";
import type { GenConfig } from "@/rules/generate";

export function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export const quietRng = () => 0.5;

export function emptyBoard(): Cell[] {
  return Array.from({ length: BOARD_SIZE }, () => ({ kind: "empty" as const }));
}

export function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: "playing",
    mode: "multiples",
    band: "standard",
    level: 1,
    score: 0,
    lives: 3,
    reserveLives: 0,
    streak: 0,
    nextLifeThreshold: 1000,
    rule: { mode: "multiples", k: 6 },
    board: emptyBoard(),
    playerPos: { col: 2, row: 2 },
    enemies: [],
    refuge: null,
    simTime: 0,
    freezeTimer: 0,
    stepTimer: 0,
    pendingDir: null,
    queuedDir: null,
    pendingSpawnAt: null,
    ...overrides,
  };
}

export function makeEnemy(overrides: Partial<Enemy> = {}): Enemy {
  return {
    id: 1,
    kind: "straight",
    pos: { col: 0, row: 0 },
    dir: "right",
    stepTimer: 420,
    ...overrides,
  };
}

export function boardWithCell(pos: { col: number; row: number }, cell: Cell, base?: Cell[]): Cell[] {
  const b = base ? [...base] : emptyBoard();
  b[pos.row * COLS + pos.col] = cell;
  return b;
}

export const config: GenConfig = {
  numMin: 1,
  numMax: 60,
  exprOps: ["+", "−", "×", "÷"],
  exprMin: 0,
  exprMax: 12,
};

export function matchCount(rule: Rule, cells: Cell[]): number {
  return cells.filter((c) => matches(rule, c)).length;
}
