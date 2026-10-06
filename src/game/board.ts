import type { Cell, Mode, Rule } from "@/rules/types";
import { matches } from "@/rules/match";
import { generateBoard, type GenConfig } from "@/rules/generate";
import { getGenConfig, getKRange, type Band } from "@/content/bands";

const DEFAULT_CONFIG: GenConfig = {
  numMin: 1,
  numMax: 60,
  exprOps: ["+", "−", "×", "÷"],
  exprMin: 0,
  exprMax: 12,
};

const DEFAULT_K: { min: number; max: number } = { min: 2, max: 12 };

export function generateRule(mode: Mode, level: number, rng: () => number, band?: Band): Rule {
  const kRange = band ? getKRange(band) : DEFAULT_K;
  // Multiples widens by one per level, capped at the band's k max.
  const top = mode === "multiples" ? Math.min(kRange.max, kRange.min + level + 1) : kRange.max;
  const k = kRange.min + Math.floor(rng() * (top - kRange.min + 1));
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

export function generateBoardForRule(rule: Rule, rng: () => number, band?: Band): Cell[] {
  const config = band ? getGenConfig(band) : DEFAULT_CONFIG;
  return generateBoard(rule, rng, config);
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
