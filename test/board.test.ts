import { describe, it, expect } from "vitest";
import type { Cell, Rule } from "@/rules/types";
import { generateRule, generateBoardForRule, countMatches, allMatchesCleared } from "@/game/board";

function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

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
});
