import { describe, it, expect } from "vitest";
import { createRng, seedFromTime } from "@/game/rng";

describe("createRng", () => {
  it("same seed produces identical sequences", () => {
    const a = createRng(42);
    const b = createRng(42);
    const drawsA: number[] = [];
    const drawsB: number[] = [];
    for (let i = 0; i < 100; i++) {
      drawsA.push(a());
      drawsB.push(b());
    }
    expect(drawsA).toEqual(drawsB);
  });

  it("different seeds produce different first draws", () => {
    const first = createRng(1)();
    const second = createRng(2)();
    expect(first).not.toBe(second);
  });

  it("outputs stay in [0,1)", () => {
    const rng = createRng(42);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("seed 0 normalizes to a live stream", () => {
    const rng = createRng(0);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("seedFromTime", () => {
  it("0 → 1, 1 → 2", () => {
    expect(seedFromTime(0)).toBe(1);
    expect(seedFromTime(1)).toBe(2);
  });

  it("result always in 1..2147483646", () => {
    const inputs = [0, 1, 2147483644, 2147483645, 2147483646, 2 * 2147483646 + 3];
    for (const now of inputs) {
      const s = seedFromTime(now);
      expect(s).toBeGreaterThanOrEqual(1);
      expect(s).toBeLessThanOrEqual(2147483646);
    }
  });
});
