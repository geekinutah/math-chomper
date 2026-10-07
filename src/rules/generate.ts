import { evalExpr, formatExpr } from "./expr";
import { matches } from "./match";
import type { Cell, Rule } from "./types";

export type GenConfig = {
  numMin: number;
  numMax: number;
  exprOps: Array<"+" | "−" | "×" | "÷">;
  exprMin: number;
  exprMax: number;
  exprMinResult?: number;
};

const BOARD_SIZE = 30;
const MIN_MATCHES = 4;
const MAX_MATCHES = 10;
// Draw cap so a degenerate rng cannot spin board generation forever (B-003).
const MAX_DRAWS = 1000;
// Per-cell retry cap before the known-valid fallback kicks in.
const MAX_EXPR_ATTEMPTS = 100;

function randomInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function genNumber(rng: () => number, config: GenConfig): Cell {
  // 0 never appears on the board, so the range is clamped to start at 1.
  const value = Math.max(1, randomInt(rng, config.numMin, config.numMax));
  return { kind: "number", value };
}

export function generateExprCell(config: GenConfig, rng: () => number): Cell {
  for (let attempt = 0; attempt < MAX_EXPR_ATTEMPTS; attempt += 1) {
    const op = config.exprOps[randomInt(rng, 0, config.exprOps.length - 1)];
    const a = randomInt(rng, config.exprMin, config.exprMax);
    const b = randomInt(rng, config.exprMin, config.exprMax);
    const text = formatExpr(a, op, b);
    const value = evalExpr(text);
    // Retry while eval rejects (÷0, inexact ÷, negative −) or the band floors the result.
    if (value !== null && (config.exprMinResult === undefined || value >= config.exprMinResult)) {
      return { kind: "expr", text, value };
    }
  }
  // Candidates in fixed order; the first that is legal for this config wins.
  const cands: Array<{ a: number; b: number; op: "+" | "−" | "×" | "÷" }> = [
    { a: config.exprMin, b: config.exprMax, op: "+" },
    { a: config.exprMax, b: config.exprMax, op: "+" },
    { a: config.exprMax, b: config.exprMax, op: "×" },
  ];
  for (const cand of cands) {
    if (!config.exprOps.includes(cand.op)) continue;
    const text = formatExpr(cand.a, cand.op, cand.b);
    const value = evalExpr(text);
    if (value !== null && (config.exprMinResult === undefined || value >= config.exprMinResult)) {
      return { kind: "expr", text, value };
    }
  }
  // For every shipped band, candidate 1 (Easy/Standard) or 2 (Hard: 12+12 = 24 ≥ 13) is
  // legal, so this tail only fires for a hand-crafted config whose floor exceeds every
  // candidate's value. The last candidate is still classifiable by matches; §7 only
  // forbids emitting a cell the engine cannot classify. ("×" never evals to null, so
  // the direct product below is what evalExpr would have returned.)
  const last = cands[cands.length - 1];
  const text = formatExpr(last.a, last.op, last.b);
  return { kind: "expr", text, value: evalExpr(text) ?? last.a * last.b };
}

function genExpr(rng: () => number, config: GenConfig): Cell {
  return generateExprCell(config, rng);
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

// Known-valid fills for when the draw cap is hit: the board must still reach its
// match minimum/max even when no generated cell can satisfy the quota.
function fillMatchCell(rule: Rule, config: GenConfig): Cell {
  switch (rule.mode) {
    case "multiples":
      // 2k is always a multiple of k; the clamp guards hand-crafted configs.
      return { kind: "number", value: Math.min(Math.max(2 * rule.k, 1), config.numMax) };
    case "factors":
      // k divides itself; k ≤ 20 ≤ every band's numMax.
      return { kind: "number", value: rule.k };
    case "primes":
      return { kind: "number", value: 7 };
    case "equality":
      // If the band floors results and k < floor, this cell breaks the floor on
      // purpose: a board with 4+ matches is valid; band aesthetics are not a level rule.
      // k ≤ 2·exprMax for all shipped bands (max k 20, exprMax 12), so b stays in range;
      // "+" is in every band's op list.
      const a = Math.min(rule.k, config.exprMax);
      const b = rule.k - a; // 0 when k ≤ exprMax; 1..12 for the shipped k range 13..20
      return { kind: "expr", text: formatExpr(a, "+", b), value: rule.k };
    case "inequality":
      // 2·exprMax = 24 differs from every shipped k (2–20), so this is a match.
      return { kind: "expr", text: formatExpr(config.exprMax, "+", config.exprMax), value: 2 * config.exprMax };
  }
}

function fillNonMatchCell(rule: Rule, config: GenConfig): Cell {
  switch (rule.mode) {
    case "multiples":
      // k+1 is between k and 2k, so it is never a multiple of k.
      return { kind: "number", value: rule.k + 1 };
    case "factors":
      // Greater than k, so it is never a factor of k.
      return { kind: "number", value: rule.k + 1 };
    case "primes":
      // 1 is not prime.
      return { kind: "number", value: 1 };
    case "equality":
      // 2·exprMax = 24 differs from every shipped k (2–20), so this is not a match.
      return { kind: "expr", text: formatExpr(config.exprMax, "+", config.exprMax), value: 2 * config.exprMax };
    case "inequality":
      // Value k = k, so this is not a match.
      // k ≤ 2·exprMax for all shipped bands (max k 20, exprMax 12), so b stays in range;
      // "+" is in every band's op list.
      const a = Math.min(rule.k, config.exprMax);
      const b = rule.k - a; // 0 when k ≤ exprMax; 1..12 for the shipped k range 13..20
      return { kind: "expr", text: formatExpr(a, "+", b), value: rule.k };
  }
}

export function generateBoard(rule: Rule, rng: () => number, config: GenConfig): Cell[] {
  const useExpr = rule.mode === "equality" || rule.mode === "inequality";
  const target = randomInt(rng, MIN_MATCHES, MAX_MATCHES);
  const needNonMatches = BOARD_SIZE - target;

  const cells: Cell[] = [];
  let gotMatches = 0;
  let gotNonMatches = 0;
  let draws = 0;

  while ((gotMatches < target || gotNonMatches < needNonMatches) && draws < MAX_DRAWS) {
    draws += 1;
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

  while (gotMatches < target) {
    cells.push(fillMatchCell(rule, config));
    gotMatches += 1;
  }
  while (gotNonMatches < needNonMatches) {
    cells.push(fillNonMatchCell(rule, config));
    gotNonMatches += 1;
  }

  return shuffle(cells, rng);
}
