import { describe, it, expect } from "vitest";
import type { Mode } from "@/rules/types";
import type { BandName } from "@/content/bands";
import { createInitialState, reduce, type GameState, type GameMode } from "@/game/state";
import { seededRng } from "../test-helpers";

describe("modes and bands", () => {
  function start(mode: GameMode, band: BandName, seed = 42): GameState {
    return reduce(createInitialState(), { type: "start", mode, band }, seededRng(seed));
  }

  it("start with factors mode", () => {
    const after = start("factors", "standard");
    expect(after.mode).toBe("factors");
    expect(after.rule.mode).toBe("factors");
    for (const cell of after.board) expect(cell.kind).toBe("number");
  });

  it("start with primes mode", () => {
    const after = start("primes", "standard");
    expect(after.mode).toBe("primes");
    expect(after.rule).toEqual({ mode: "primes" });
  });

  it("start with equality mode", () => {
    const after = start("equality", "standard");
    expect(after.mode).toBe("equality");
    expect(after.rule.mode).toBe("equality");
    for (const cell of after.board) expect(cell.kind).toBe("expr");
  });

  it("start with inequality mode", () => {
    const after = start("inequality", "standard");
    expect(after.mode).toBe("inequality");
    expect(after.rule.mode).toBe("inequality");
    for (const cell of after.board) expect(cell.kind).toBe("expr");
  });

  it("start with easy band", () => {
    expect(start("multiples", "easy").band).toBe("easy");
  });

  it("start with hard band", () => {
    expect(start("multiples", "hard").band).toBe("hard");
  });

  it("challenge: level 1 is first mode", () => {
    const after = start("challenge", "standard");
    expect(after.mode).toBe("challenge");
    expect(after.level).toBe(1);
    expect(after.rule.mode).toBe("multiples");
  });

  it("challenge: next-level rotates mode", () => {
    const s: GameState = { ...start("challenge", "standard"), phase: "level-clear" };
    const after = reduce(s, { type: "next-level" }, seededRng(7));
    expect(after.mode).toBe("challenge");
    expect(after.rule.mode).toBe("factors");
  });

  it("challenge: rotates through all 5", () => {
    let s: GameState = { ...start("challenge", "standard"), phase: "level-clear" };
    const modes: Mode[] = [];
    for (let i = 0; i < 5; i += 1) {
      s = reduce(s, { type: "next-level" }, seededRng(7 + i));
      modes.push(s.rule.mode);
      s = { ...s, phase: "level-clear" };
    }
    expect(modes).toEqual(["factors", "primes", "equality", "inequality", "multiples"]);
  });

  it("band affects board: easy has smaller numbers", () => {
    const after = start("factors", "easy");
    for (const cell of after.board) {
      expect(cell.kind).toBe("number");
      if (cell.kind === "number") expect(cell.value).toBeLessThanOrEqual(30);
    }
  });

  it("band affects board: hard has larger numbers", () => {
    const after = start("multiples", "hard", 913);
    const values = after.board.flatMap((c) => (c.kind === "number" ? [c.value] : []));
    expect(values.length).toBeGreaterThan(0);
    expect(Math.max(...values)).toBeGreaterThan(30);
  });

  it("band affects k: easy k ≤ 9", () => {
    const after = start("factors", "easy", 93001);
    if (after.rule.mode === "factors") {
      expect(after.rule.k).toBeGreaterThanOrEqual(2);
      expect(after.rule.k).toBeLessThanOrEqual(9);
    }
  });

  it("band affects k: hard k can be 20", () => {
    let saw20 = false;
    for (let i = 0; i < 100; i += 1) {
      const after = start("factors", "hard", 121000 + i);
      if (after.rule.mode === "factors") {
        expect(after.rule.k).toBeGreaterThanOrEqual(2);
        expect(after.rule.k).toBeLessThanOrEqual(20);
        saw20 = saw20 || after.rule.k === 20;
      }
    }
    expect(saw20).toBe(true);
  });

  it("state: start hard equality keeps k in 13–20 through next-level", () => {
    let s = start("equality", "hard", 31337);
    if (s.rule.mode === "equality") {
      expect(s.rule.k).toBeGreaterThanOrEqual(13);
      expect(s.rule.k).toBeLessThanOrEqual(20);
    }
    for (let i = 0; i < 10; i += 1) {
      s = reduce({ ...s, phase: "level-clear" }, { type: "next-level" }, seededRng(40000 + i));
      if (s.rule.mode === "equality") {
        expect(s.rule.k).toBeGreaterThanOrEqual(13);
        expect(s.rule.k).toBeLessThanOrEqual(20);
      }
    }
  });

  it("level-scaled k: level 1 has smaller range", () => {
    const kAtLevel = (level: number, seed: number): number => {
      let s = start("multiples", "standard", seed);
      while (s.level < level) {
        s = reduce({ ...s, phase: "level-clear" }, { type: "next-level" }, seededRng(seed + 1000));
      }
      return s.rule.mode === "multiples" ? s.rule.k : -1;
    };
    let maxLevel1 = 0;
    let maxLevel10 = 0;
    for (let i = 0; i < 40; i += 1) {
      const seed = 100000 + i * 137;
      maxLevel1 = Math.max(maxLevel1, kAtLevel(1, seed));
      maxLevel10 = Math.max(maxLevel10, kAtLevel(10, seed));
    }
    expect(maxLevel1).toBeLessThanOrEqual(4);
    expect(maxLevel10).toBeGreaterThan(maxLevel1);
  });
});
