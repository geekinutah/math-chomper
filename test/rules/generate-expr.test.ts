import { describe, expect, it } from "vitest";
import { generateBoard, generateExprCell, type GenConfig } from "@/rules/generate";
import type { Rule } from "@/rules/types";
import { config, matchCount, seededRng } from "../test-helpers";

const easyConfig: GenConfig = {
  numMin: 1,
  numMax: 30,
  exprOps: ["+", "−"],
  exprMin: 0,
  exprMax: 12,
};

const hardConfig: GenConfig = {
  numMin: 1,
  numMax: 100,
  exprOps: ["+", "−", "×", "÷"],
  exprMin: 0,
  exprMax: 12,
  exprMinResult: 13,
};

describe("hard expression floor", () => {
  it("hard equality board: every expr cell has value ≥ 13", () => {
    for (let seed = 1; seed <= 8; seed++) {
      const board = generateBoard({ mode: "equality", k: 13 }, seededRng(seed), hardConfig);
      expect(board).toHaveLength(30);
      for (const cell of board) {
        expect(cell.kind).toBe("expr");
        if (cell.kind === "expr") expect(cell.value).toBeGreaterThanOrEqual(13);
      }
    }
  });

  it("standard equality board: can contain values < 13", () => {
    let sawSmall = false;
    for (let seed = 1; seed <= 50; seed++) {
      for (const cell of generateBoard({ mode: "equality", k: 6 }, seededRng(seed), config)) {
        if (cell.kind === "expr" && cell.value < 13) sawSmall = true;
      }
    }
    expect(sawSmall).toBe(true);
  });

  it("hard equality k 13, 17, 19, 20: 4–10 matches", () => {
    for (const k of [13, 17, 19, 20]) {
      const rule: Rule = { mode: "equality", k };
      for (let seed = 1; seed <= 8; seed++) {
        const board = generateBoard(rule, seededRng(seed), hardConfig);
        const count = matchCount(rule, board);
        expect(count, `k=${k} seed=${seed}`).toBeGreaterThanOrEqual(4);
        expect(count, `k=${k} seed=${seed}`).toBeLessThanOrEqual(10);
      }
    }
  });

  it("generateBoard terminates under degenerate rng", () => {
    const constant = () => 0.5;
    const configs: GenConfig[] = [easyConfig, config, hardConfig];
    const rules: Rule[] = [
      { mode: "multiples", k: 6 },
      { mode: "factors", k: 6 },
      { mode: "primes" },
      { mode: "equality", k: 6 },
      { mode: "inequality", k: 6 },
    ];
    for (const cfg of configs) {
      for (const rule of rules) {
        const board = generateBoard(rule, constant, cfg);
        expect(board).toHaveLength(30);
        const count = matchCount(rule, board);
        expect(count).toBeGreaterThanOrEqual(4);
        expect(count).toBeLessThanOrEqual(10);
      }
    }
  });

  it("hard equality k=5 (hand-crafted rule): 4+ matches", () => {
    const rule: Rule = { mode: "equality", k: 5 };
    const board = generateBoard(rule, seededRng(7), hardConfig);
    expect(board).toHaveLength(30);
    const count = matchCount(rule, board);
    expect(count).toBeGreaterThanOrEqual(4);
    expect(count).toBeLessThanOrEqual(10);
  });
});

function cycleRng(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

// Finds the op glyph in an expr text and parses both sides; texts carry no signs.
function operands(text: string): { a: number; op: string; b: number } | null {
  for (const op of ["+", "−", "×", "÷"]) {
    const i = text.indexOf(op);
    if (i > 0 && i < text.length - 1) {
      const a = Number(text.slice(0, i));
      const b = Number(text.slice(i + 1));
      if (Number.isInteger(a) && Number.isInteger(b)) {
        return { a, op, b };
      }
    }
  }
  return null;
}

describe("band-aware last-resort cells (T-034)", () => {
  it('generateExprCell fallback: easy → "0+12" (12)', () => {
    const cell = generateExprCell(easyConfig, cycleRng([0.6, 0.05, 0.99]));
    expect(cell).toEqual({ kind: "expr", text: "0+12", value: 12 });
  });

  it('generateExprCell fallback: hard → "12+12" (24), clears the floor', () => {
    const cell = generateExprCell(hardConfig, cycleRng([0.3, 0.05, 0.95]));
    expect(cell).toEqual({ kind: "expr", text: "12+12", value: 24 });
  });

  it('generateExprCell fallback: standard → "0+12" (12)', () => {
    // Standard has a 4-op list, so 0.6 would draw "×" and succeed on attempt 1;
    // 0.3 forces "−" (0−12 → eval null) so all 100 attempts fail and the fallback runs.
    const cell = generateExprCell(config, cycleRng([0.3, 0.05, 0.95]));
    expect(cell).toEqual({ kind: "expr", text: "0+12", value: 12 });
  });

  it("degenerate board: every expr cell obeys the band grammar", () => {
    const rules: Rule[] = [
      { mode: "equality", k: 13 },
      { mode: "inequality", k: 13 },
    ];
    for (const cfg of [easyConfig, config, hardConfig]) {
      for (const rule of rules) {
        const board = generateBoard(rule, cycleRng([0.6, 0.05, 0.99]), cfg);
        for (const cell of board) {
          if (cell.kind !== "expr") continue;
          const parts = operands(cell.text);
          expect(parts, cell.text).not.toBeNull();
          if (parts === null) continue;
          expect(cfg.exprOps.some((o) => o === parts.op), cell.text).toBe(true);
          expect(Number.isInteger(parts.a) && Number.isInteger(parts.b), cell.text).toBe(true);
          expect(parts.a, cell.text).toBeGreaterThanOrEqual(cfg.exprMin);
          expect(parts.a, cell.text).toBeLessThanOrEqual(cfg.exprMax);
          expect(parts.b, cell.text).toBeGreaterThanOrEqual(cfg.exprMin);
          expect(parts.b, cell.text).toBeLessThanOrEqual(cfg.exprMax);
        }
      }
    }
  });

  it("degenerate board still reaches its match quotas", () => {
    const rules: Rule[] = [
      { mode: "equality", k: 13 },
      { mode: "inequality", k: 13 },
    ];
    for (const cfg of [easyConfig, config, hardConfig]) {
      for (const rule of rules) {
        const board = generateBoard(rule, cycleRng([0.6, 0.05, 0.99]), cfg);
        const count = matchCount(rule, board);
        expect(count, rule.mode).toBeGreaterThanOrEqual(4);
        expect(count, rule.mode).toBeLessThanOrEqual(10);
      }
    }
  });
});
