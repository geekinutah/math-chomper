import type { EnemyKind } from "@/game/enemies";
import type { GenConfig } from "@/rules/generate";

export type BandName = "easy" | "standard" | "hard";

export type Band = {
  name: BandName;
  label: string;
  numMin: number;
  numMax: number;
  kMin: number;
  kMax: number;
  exprOps: Array<"+" | "−" | "×" | "÷">;
  exprMin: number;
  exprMax: number;
  enemyUnlocks: Array<{ level: number; kind: EnemyKind }>;
};

export const EASY: Band = {
  name: "easy",
  label: "Easy",
  numMin: 1,
  numMax: 30,
  kMin: 2,
  kMax: 9,
  exprOps: ["+", "−"],
  exprMin: 0,
  exprMax: 12,
  enemyUnlocks: [
    { level: 1, kind: "straight" },
    { level: 1, kind: "shy" },
  ],
};

export const STANDARD: Band = {
  name: "standard",
  label: "Standard",
  numMin: 1,
  numMax: 60,
  kMin: 2,
  kMax: 12,
  exprOps: ["+", "−", "×", "÷"],
  exprMin: 0,
  exprMax: 12,
  enemyUnlocks: [
    { level: 1, kind: "straight" },
    { level: 1, kind: "shy" },
    { level: 4, kind: "eater" },
    { level: 4, kind: "rewriter" },
    { level: 8, kind: "chaser" },
  ],
};

export const HARD: Band = {
  name: "hard",
  label: "Hard",
  numMin: 1,
  numMax: 100,
  kMin: 2,
  kMax: 20,
  exprOps: ["+", "−", "×", "÷"],
  exprMin: 0,
  exprMax: 12,
  enemyUnlocks: [
    { level: 1, kind: "straight" },
    { level: 1, kind: "shy" },
    { level: 3, kind: "chaser" },
    { level: 4, kind: "eater" },
    { level: 4, kind: "rewriter" },
  ],
};

const BANDS: Record<BandName, Band> = {
  easy: EASY,
  standard: STANDARD,
  hard: HARD,
};

export function getBand(name: BandName): Band {
  return BANDS[name];
}

export function getGenConfig(band: Band): GenConfig {
  return {
    numMin: band.numMin,
    numMax: band.numMax,
    exprOps: band.exprOps,
    exprMin: band.exprMin,
    exprMax: band.exprMax,
  };
}

export function getEnemyKinds(band: Band, level: number): EnemyKind[] {
  return band.enemyUnlocks
    .filter((u) => u.level <= level)
    .map((u) => u.kind);
}

export function getKRange(band: Band): { min: number; max: number } {
  return { min: band.kMin, max: band.kMax };
}
