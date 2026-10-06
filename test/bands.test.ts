import { describe, expect, it } from "vitest";
import { EASY, HARD, STANDARD, getBand, getEnemyKinds, getGenConfig, getKRange } from "@/content/bands";

describe("getBand returns each band", () => {
  it("easy has label Easy", () => {
    const b = getBand("easy");
    expect(b.label).toBe("Easy");
    expect(b.name).toBe("easy");
  });

  it("standard has label Standard", () => {
    const b = getBand("standard");
    expect(b.label).toBe("Standard");
    expect(b.name).toBe("standard");
  });

  it("hard has label Hard", () => {
    const b = getBand("hard");
    expect(b.label).toBe("Hard");
    expect(b.name).toBe("hard");
  });

  it("returns the same constants", () => {
    expect(getBand("easy")).toBe(EASY);
    expect(getBand("standard")).toBe(STANDARD);
    expect(getBand("hard")).toBe(HARD);
  });
});

describe("easy: numMax 30, kMax 9", () => {
  it("has correct numeric ranges", () => {
    expect(EASY.numMin).toBe(1);
    expect(EASY.numMax).toBe(30);
    expect(EASY.kMin).toBe(2);
    expect(EASY.kMax).toBe(9);
  });
});

describe("easy: only + and -", () => {
  it("exprOps has exactly 2 entries", () => {
    expect(EASY.exprOps).toHaveLength(2);
    expect(EASY.exprOps).toEqual(["+", "−"]);
  });

  it("exprMin and exprMax are 0 and 12", () => {
    expect(EASY.exprMin).toBe(0);
    expect(EASY.exprMax).toBe(12);
  });
});

describe("easy: straight and shy from level 1", () => {
  it("getEnemyKinds(easy, 1) has 2 kinds", () => {
    const kinds = getEnemyKinds(EASY, 1);
    expect(kinds).toHaveLength(2);
    expect(kinds).toContain("straight");
    expect(kinds).toContain("shy");
  });
});

describe("easy: no chaser ever", () => {
  it("getEnemyKinds(easy, 20) has no chaser", () => {
    const kinds = getEnemyKinds(EASY, 20);
    expect(kinds).not.toContain("chaser");
    expect(kinds).toHaveLength(2);
  });
});

describe("standard: numMax 60, kMax 12", () => {
  it("has correct numeric ranges", () => {
    expect(STANDARD.numMin).toBe(1);
    expect(STANDARD.numMax).toBe(60);
    expect(STANDARD.kMin).toBe(2);
    expect(STANDARD.kMax).toBe(12);
  });
});

describe("standard: all 4 ops", () => {
  it("exprOps has exactly 4 entries", () => {
    expect(STANDARD.exprOps).toHaveLength(4);
    expect(STANDARD.exprOps).toEqual(["+", "−", "×", "÷"]);
  });
});

describe("standard: chaser from level 8", () => {
  it("chaser not in level 7", () => {
    const kinds = getEnemyKinds(STANDARD, 7);
    expect(kinds).not.toContain("chaser");
  });

  it("chaser in level 8", () => {
    const kinds = getEnemyKinds(STANDARD, 8);
    expect(kinds).toContain("chaser");
  });

  it("all 5 kinds at level 8", () => {
    const kinds = getEnemyKinds(STANDARD, 8);
    expect(kinds).toHaveLength(5);
    expect(kinds).toContain("straight");
    expect(kinds).toContain("shy");
    expect(kinds).toContain("eater");
    expect(kinds).toContain("rewriter");
    expect(kinds).toContain("chaser");
  });
});

describe("hard: numMax 100, kMax 20", () => {
  it("has correct numeric ranges", () => {
    expect(HARD.numMin).toBe(1);
    expect(HARD.numMax).toBe(100);
    expect(HARD.kMin).toBe(2);
    expect(HARD.kMax).toBe(20);
  });
});

describe("hard: chaser from level 3", () => {
  it("chaser not in level 2", () => {
    const kinds = getEnemyKinds(HARD, 2);
    expect(kinds).not.toContain("chaser");
  });

  it("chaser in level 3", () => {
    const kinds = getEnemyKinds(HARD, 3);
    expect(kinds).toContain("chaser");
  });

  it("all 5 kinds at level 4", () => {
    const kinds = getEnemyKinds(HARD, 4);
    expect(kinds).toHaveLength(5);
    expect(kinds).toContain("straight");
    expect(kinds).toContain("shy");
    expect(kinds).toContain("chaser");
    expect(kinds).toContain("eater");
    expect(kinds).toContain("rewriter");
  });
});

describe("getGenConfig maps correctly", () => {
  it("easy maps to GenConfig", () => {
    const cfg = getGenConfig(EASY);
    expect(cfg).toEqual({ numMin: 1, numMax: 30, exprOps: ["+", "−"], exprMin: 0, exprMax: 12 });
  });

  it("standard maps to GenConfig", () => {
    const cfg = getGenConfig(STANDARD);
    expect(cfg).toEqual({ numMin: 1, numMax: 60, exprOps: ["+", "−", "×", "÷"], exprMin: 0, exprMax: 12 });
  });

  it("hard maps to GenConfig", () => {
    const cfg = getGenConfig(HARD);
    expect(cfg).toEqual({ numMin: 1, numMax: 100, exprOps: ["+", "−", "×", "÷"], exprMin: 0, exprMax: 12 });
  });
});

describe("getKRange returns min/max", () => {
  it("easy: {min: 2, max: 9}", () => {
    expect(getKRange(EASY)).toEqual({ min: 2, max: 9 });
  });

  it("standard: {min: 2, max: 12}", () => {
    expect(getKRange(STANDARD)).toEqual({ min: 2, max: 12 });
  });

  it("hard: {min: 2, max: 20}", () => {
    expect(getKRange(HARD)).toEqual({ min: 2, max: 20 });
  });
});

describe("enemyUnlocks structure", () => {
  it("easy: 2 entries at level 1", () => {
    expect(EASY.enemyUnlocks).toHaveLength(2);
    expect(EASY.enemyUnlocks[0]).toEqual({ level: 1, kind: "straight" });
    expect(EASY.enemyUnlocks[1]).toEqual({ level: 1, kind: "shy" });
  });

  it("standard: 5 entries", () => {
    expect(STANDARD.enemyUnlocks).toHaveLength(5);
    expect(STANDARD.enemyUnlocks[0]).toEqual({ level: 1, kind: "straight" });
    expect(STANDARD.enemyUnlocks[1]).toEqual({ level: 1, kind: "shy" });
    expect(STANDARD.enemyUnlocks[2]).toEqual({ level: 4, kind: "eater" });
    expect(STANDARD.enemyUnlocks[3]).toEqual({ level: 4, kind: "rewriter" });
    expect(STANDARD.enemyUnlocks[4]).toEqual({ level: 8, kind: "chaser" });
  });

  it("hard: 5 entries", () => {
    expect(HARD.enemyUnlocks).toHaveLength(5);
    expect(HARD.enemyUnlocks[0]).toEqual({ level: 1, kind: "straight" });
    expect(HARD.enemyUnlocks[1]).toEqual({ level: 1, kind: "shy" });
    expect(HARD.enemyUnlocks[2]).toEqual({ level: 3, kind: "chaser" });
    expect(HARD.enemyUnlocks[3]).toEqual({ level: 4, kind: "eater" });
    expect(HARD.enemyUnlocks[4]).toEqual({ level: 4, kind: "rewriter" });
  });
});
