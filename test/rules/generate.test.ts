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
