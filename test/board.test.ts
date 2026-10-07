import { describe, it, expect } from "vitest";
import type { Cell, Rule } from "@/rules/types";
import { EASY, HARD, STANDARD } from "@/content/bands";
import { generateRule, generateBoardForRule, countMatches, allMatchesCleared } from "@/game/board";
import { seededRng } from "./test-helpers";

describe("board", () => {
  it("generateRule multiples returns k in 2-12", () => {
    const rng = seededRng(123);
    for (let i = 0; i < 100; i++) {
      const rule = generateRule("multiples", 1, rng);
      expect(rule.mode).toBe("multiples");
      if (rule.mode === "multiples") {
        expect(rule.k).toBeGreaterThanOrEqual(2);
        expect(rule.k).toBeLessThanOrEqual(12);
      }
    }
  });

  it("generateRule factors returns k in 2-12", () => {
    const rng = seededRng(456);
    for (let i = 0; i < 100; i++) {
      const rule = generateRule("factors", 1, rng);
      expect(rule.mode).toBe("factors");
      if (rule.mode === "factors") {
        expect(rule.k).toBeGreaterThanOrEqual(2);
        expect(rule.k).toBeLessThanOrEqual(12);
      }
    }
  });

  it("generateRule equality returns k in 2-12", () => {
    const rng = seededRng(789);
    for (let i = 0; i < 100; i++) {
      const rule = generateRule("equality", 1, rng);
      expect(rule.mode).toBe("equality");
      if (rule.mode === "equality") {
        expect(rule.k).toBeGreaterThanOrEqual(2);
        expect(rule.k).toBeLessThanOrEqual(12);
      }
    }
  });

  it("generateRule inequality returns k in 2-12", () => {
    const rng = seededRng(321);
    for (let i = 0; i < 100; i++) {
      const rule = generateRule("inequality", 1, rng);
      expect(rule.mode).toBe("inequality");
      if (rule.mode === "inequality") {
        expect(rule.k).toBeGreaterThanOrEqual(2);
        expect(rule.k).toBeLessThanOrEqual(12);
      }
    }
  });

  it("generateRule primes has no k", () => {
    const rng = seededRng(1);
    const rule = generateRule("primes", 1, rng);
    expect(rule.mode).toBe("primes");
  });

  it("generateBoardForRule returns 30 cells", () => {
    const rng = seededRng(42);
    const rule: Rule = { mode: "multiples", k: 3 };
    const board = generateBoardForRule(rule, rng);
    expect(board.length).toBe(30);
  });

  it("generateBoardForRule multiples: all numbers", () => {
    const rng = seededRng(99);
    const rule: Rule = { mode: "multiples", k: 6 };
    const board = generateBoardForRule(rule, rng);
    for (const cell of board) {
      expect(cell.kind).toBe("number");
    }
  });

  it("generateBoardForRule equality: all expressions", () => {
    const rng = seededRng(77);
    const rule: Rule = { mode: "equality", k: 6 };
    const board = generateBoardForRule(rule, rng);
    for (const cell of board) {
      expect(cell.kind).toBe("expr");
    }
  });

  it("countMatches counts correctly", () => {
    const board: Cell[] = [
      { kind: "number", value: 6 },
      { kind: "number", value: 12 },
      { kind: "number", value: 7 },
      { kind: "number", value: 18 },
      { kind: "empty" },
    ];
    const rule: Rule = { mode: "multiples", k: 6 };
    expect(countMatches(board, rule)).toBe(3);
  });

  it("allMatchesCleared true when no matches remain", () => {
    const board: Cell[] = [
      { kind: "number", value: 7 },
      { kind: "number", value: 11 },
      { kind: "empty" },
      { kind: "empty" },
    ];
    const rule: Rule = { mode: "multiples", k: 6 };
    expect(allMatchesCleared(board, rule)).toBe(true);
  });

  it("allMatchesCleared false when matches exist", () => {
    const board: Cell[] = [
      { kind: "number", value: 6 },
      { kind: "number", value: 7 },
      { kind: "empty" },
      { kind: "empty" },
    ];
    const rule: Rule = { mode: "multiples", k: 6 };
    expect(allMatchesCleared(board, rule)).toBe(false);
  });

  it("generateRule with easy band: k in 2-9", () => {
    const r = seededRng(123);
    for (let i = 0; i < 100; i++) {
      const rule = generateRule("factors", 1, r, EASY);
      if (rule.mode === "factors") {
        expect(rule.k).toBeGreaterThanOrEqual(2);
        expect(rule.k).toBeLessThanOrEqual(9);
      }
    }
  });

  it("generateRule with hard band: k in 2-20", () => {
    const r = seededRng(456);
    for (let i = 0; i < 100; i++) {
      const rule = generateRule("factors", 1, r, HARD);
      if (rule.mode === "factors") {
        expect(rule.k).toBeGreaterThanOrEqual(2);
        expect(rule.k).toBeLessThanOrEqual(20);
      }
    }
  });

  it("generateRule level-scaled: level 1 k ≤ 4", () => {
    const r = seededRng(555);
    for (let i = 0; i < 100; i++) {
      const rule = generateRule("multiples", 1, r);
      if (rule.mode === "multiples") {
        expect(rule.k).toBeGreaterThanOrEqual(2);
        expect(rule.k).toBeLessThanOrEqual(4);
      }
    }
  });

  it("generateBoardForRule with easy: all numbers ≤ 30", () => {
    const r = seededRng(42);
    const rule: Rule = { mode: "multiples", k: 6 };
    const board = generateBoardForRule(rule, r, EASY);
    expect(board.length).toBe(30);
    for (const cell of board) {
      expect(cell.kind).toBe("number");
      if (cell.kind === "number") expect(cell.value).toBeLessThanOrEqual(30);
    }
  });

  it("generateBoardForRule with hard: numbers up to 100", () => {
    const r = seededRng(99);
    const rule: Rule = { mode: "multiples", k: 6 };
    const board = generateBoardForRule(rule, r, HARD);
    const values = board.flatMap((c) => (c.kind === "number" ? [c.value] : []));
    expect(values.length).toBeGreaterThan(0);
    const max = Math.max(...values);
    expect(max).toBeGreaterThan(30);
    expect(max).toBeLessThanOrEqual(100);
  });

  it("generateBoardForRule easy: only + and -", () => {
    const r = seededRng(77);
    const rule: Rule = { mode: "equality", k: 6 };
    const board = generateBoardForRule(rule, r, EASY);
    for (const cell of board) {
      expect(cell.kind).toBe("expr");
      if (cell.kind === "expr") {
        expect(cell.text).not.toContain("×");
        expect(cell.text).not.toContain("÷");
      }
    }
  });

  it("generateRule hard equality/inequality: k in 13–20", () => {
    const r = seededRng(789);
    for (let i = 0; i < 100; i++) {
      for (const mode of ["equality", "inequality"] as const) {
        const rule = generateRule(mode, 1, r, HARD);
        if (rule.mode === mode) {
          expect(rule.k).toBeGreaterThanOrEqual(13);
          expect(rule.k).toBeLessThanOrEqual(20);
        }
      }
    }
  });

  it("generateRule hard multiples/factors: k in 2–20", () => {
    const r = seededRng(321);
    for (let i = 0; i < 100; i++) {
      for (const mode of ["multiples", "factors"] as const) {
        const rule = generateRule(mode, 1, r, HARD);
        if (rule.mode === "multiples" || rule.mode === "factors") {
          expect(rule.k).toBeGreaterThanOrEqual(2);
          expect(rule.k).toBeLessThanOrEqual(20);
        }
      }
    }
  });

  it("generateRule standard equality: k in 2–12", () => {
    const r = seededRng(789);
    for (let i = 0; i < 100; i++) {
      const rule = generateRule("equality", 1, r, STANDARD);
      if (rule.mode === "equality") {
        expect(rule.k).toBeGreaterThanOrEqual(2);
        expect(rule.k).toBeLessThanOrEqual(12);
      }
    }
  });
});
