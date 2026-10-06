import { evalExpr, formatExpr } from "./expr";
import { matches } from "./match";
import type { Cell, Rule } from "./types";

export type GenConfig = {
  numMin: number;
  numMax: number;
  exprOps: Array<"+" | "−" | "×" | "÷">;
  exprMin: number;
  exprMax: number;
};

const BOARD_SIZE = 30;
const MIN_MATCHES = 4;
const MAX_MATCHES = 10;

function randomInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function genNumber(rng: () => number, config: GenConfig): Cell {
  // 0 never appears on the board, so the range is clamped to start at 1.
  const value = Math.max(1, randomInt(rng, config.numMin, config.numMax));
  return { kind: "number", value };
}

function genExpr(rng: () => number, config: GenConfig): Cell {
  for (;;) {
    const op = config.exprOps[randomInt(rng, 0, config.exprOps.length - 1)];
    const a = randomInt(rng, config.exprMin, config.exprMax);
    const b = randomInt(rng, config.exprMin, config.exprMax);
    const text = formatExpr(a, op, b);
    const value = evalExpr(text);
    // Retry while eval rejects: divide-by-zero, inexact division, negative subtraction.
    if (value !== null) {
      return { kind: "expr", text, value };
    }
  }
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = randomInt(rng, 0, i);
    const tmp = result[i];
    result[i] = result[j];
    result[j] = tmp;
  }
  return result;
}

export function generateBoard(rule: Rule, rng: () => number, config: GenConfig): Cell[] {
  const useExpr = rule.mode === "equality" || rule.mode === "inequality";
  const target = randomInt(rng, MIN_MATCHES, MAX_MATCHES);
  const needNonMatches = BOARD_SIZE - target;

  const cells: Cell[] = [];
  let gotMatches = 0;
  let gotNonMatches = 0;

  while (gotMatches < target || gotNonMatches < needNonMatches) {
    const cell = useExpr ? genExpr(rng, config) : genNumber(rng, config);
    if (matches(rule, cell)) {
      if (gotMatches < target) {
        cells.push(cell);
        gotMatches += 1;
      }
    } else if (gotNonMatches < needNonMatches) {
      cells.push(cell);
      gotNonMatches += 1;
    }
  }

  return shuffle(cells, rng);
}
