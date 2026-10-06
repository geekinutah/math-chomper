import type { Cell, Mode, Rule } from "@/rules/types";
import { matches } from "@/rules/match";
import { generateBoard, type GenConfig } from "@/rules/generate";

const STANDARD_CONFIG: GenConfig = {
  numMin: 1,
  numMax: 60,
  exprOps: ["+", "−", "×", "÷"],
  exprMin: 0,
  exprMax: 12,
};

export function generateRule(mode: Mode, _level: number, rng: () => number): Rule {
  const k = 2 + Math.floor(rng() * 11);
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

export function generateBoardForRule(rule: Rule, rng: () => number): Cell[] {
  return generateBoard(rule, rng, STANDARD_CONFIG);
}

export function countMatches(board: Cell[], rule: Rule): number {
  let count = 0;
  for (const cell of board) {
    if (matches(rule, cell)) count += 1;
  }
  return count;
}

export function allMatchesCleared(board: Cell[], rule: Rule): boolean {
  return countMatches(board, rule) === 0;
}
