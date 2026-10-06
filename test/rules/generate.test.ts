import { describe, expect, it } from "vitest";
import { evalExpr } from "@/rules/expr";
import { generateBoard, type GenConfig } from "@/rules/generate";
import { matches } from "@/rules/match";
import type { Cell, Rule } from "@/rules/types";

function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const config: GenConfig = {
  numMin: 1,
  numMax: 60,
  exprOps: ["+", "−", "×", "÷"],
  exprMin: 0,
  exprMax: 12,
};

const MULTIPLES: Rule = { mode: "multiples", k: 6 };
const FACTORS: Rule = { mode: "factors", k: 2 };
const PRIMES: Rule = { mode: "primes" };
const EQUALITY: Rule = { mode: "equality", k: 6 };
const INEQUALITY: Rule = { mode: "inequality", k: 6 };

function matchCount(rule: Rule, cells: Cell[]): number {
  return cells.filter((c) => matches(rule, c)).length;
}

describe("generateBoard", () => {
  it("returns exactly 30 cells", () => {
    const board = generateBoard(MULTIPLES, seededRng(1), config);
    expect(board).toHaveLength(30);
  });

  it("always 4 to 10 matches (multiples)", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const board = generateBoard(MULTIPLES, seededRng(seed), config);
      const count = matchCount(MULTIPLES, board);
      expect(count).toBeGreaterThanOrEqual(4);
      expect(count).toBeLessThanOrEqual(10);
    }
  });

  it("always at least 4 non-matches (multiples)", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const board = generateBoard(MULTIPLES, seededRng(seed), config);
      const nonMatches = 30 - matchCount(MULTIPLES, board);
      expect(nonMatches).toBeGreaterThanOrEqual(4);
    }
  });

  it("never more than 60% matches", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const board = generateBoard(MULTIPLES, seededRng(seed), config);
      const ratio = matchCount(MULTIPLES, board) / 30;
      expect(ratio).toBeLessThanOrEqual(0.6);
    }
  });

  it("equality board is all expressions", () => {
    const board = generateBoard(EQUALITY, seededRng(1), config);
    for (const cell of board) {
      expect(cell.kind).toBe("expr");
    }
  });

  it("inequality board is all expressions", () => {
    const board = generateBoard(INEQUALITY, seededRng(1), config);
    for (const cell of board) {
      expect(cell.kind).toBe("expr");
    }
  });

  it("multiples board is all numbers", () => {
    const board = generateBoard(MULTIPLES, seededRng(1), config);
    for (const cell of board) {
      expect(cell.kind).toBe("number");
    }
  });

  it("deterministic: same seed produces same board", () => {
    const a = generateBoard(MULTIPLES, seededRng(42), config);
    const b = generateBoard(MULTIPLES, seededRng(42), config);
    expect(a).toEqual(b);
  });

  it("different seeds produce different boards", () => {
    const a = generateBoard(MULTIPLES, seededRng(42), config);
    const b = generateBoard(MULTIPLES, seededRng(43), config);
    expect(a).not.toEqual(b);
  });

  it("no zero values on number boards", () => {
    const board = generateBoard(MULTIPLES, seededRng(1), config);
    for (const cell of board) {
      if (cell.kind === "number") {
        expect(cell.value).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("expression cells have valid text", () => {
    const board = generateBoard(EQUALITY, seededRng(1), config);
    for (const cell of board) {
      if (cell.kind === "expr") {
        expect(evalExpr(cell.text)).not.toBeNull();
      }
    }
  });

  it("expression results are integers", () => {
    const board = generateBoard(INEQUALITY, seededRng(1), config);
    for (const cell of board) {
      if (cell.kind === "expr") {
        expect(Number.isInteger(cell.value)).toBe(true);
      }
    }
  });

  describe("all five modes", () => {
    it("factors board is all numbers with a valid match count", () => {
      const board = generateBoard(FACTORS, seededRng(1), config);
      for (const cell of board) {
        expect(cell.kind).toBe("number");
      }
      const count = matchCount(FACTORS, board);
      expect(count).toBeGreaterThanOrEqual(4);
      expect(count).toBeLessThanOrEqual(10);
    });

    it("factors with small k still reaches 4+ matches by repeating values", () => {
      for (let seed = 1; seed <= 50; seed++) {
        const board = generateBoard(FACTORS, seededRng(seed), config);
        const count = matchCount(FACTORS, board);
        expect(count).toBeGreaterThanOrEqual(4);
        expect(count).toBeLessThanOrEqual(10);
      }
    });

    it("primes board is all numbers with a valid match count", () => {
      const board = generateBoard(PRIMES, seededRng(1), config);
      for (const cell of board) {
        expect(cell.kind).toBe("number");
      }
      const count = matchCount(PRIMES, board);
      expect(count).toBeGreaterThanOrEqual(4);
      expect(count).toBeLessThanOrEqual(10);
    });

    it("equality match count is in range", () => {
      const board = generateBoard(EQUALITY, seededRng(1), config);
      const count = matchCount(EQUALITY, board);
      expect(count).toBeGreaterThanOrEqual(4);
      expect(count).toBeLessThanOrEqual(10);
    });

    it("inequality match count is in range", () => {
      const board = generateBoard(INEQUALITY, seededRng(1), config);
      const count = matchCount(INEQUALITY, board);
      expect(count).toBeGreaterThanOrEqual(4);
      expect(count).toBeLessThanOrEqual(10);
    });
  });
});
