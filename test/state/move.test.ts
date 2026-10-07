import { describe, it, expect } from "vitest";
import { reduce } from "@/game/state";
import { makeState, quietRng, seededRng } from "../test-helpers";

const rng = seededRng(42);

describe("state", () => {
  it("move right increases col", () => {
    const s = makeState();
    const moved = reduce(s, { type: "move", dir: "right" }, rng);
    const after = reduce(moved, { type: "tick", dt: 0.14 }, quietRng);
    expect(after.playerPos.col).toBe(3);
    expect(after.playerPos.row).toBe(2);
  });

  it("move left decreases col", () => {
    const s = makeState();
    const moved = reduce(s, { type: "move", dir: "left" }, rng);
    const after = reduce(moved, { type: "tick", dt: 0.14 }, quietRng);
    expect(after.playerPos.col).toBe(1);
    expect(after.playerPos.row).toBe(2);
  });

  it("move up decreases row", () => {
    const s = makeState();
    const moved = reduce(s, { type: "move", dir: "up" }, rng);
    const after = reduce(moved, { type: "tick", dt: 0.14 }, quietRng);
    expect(after.playerPos.col).toBe(2);
    expect(after.playerPos.row).toBe(1);
  });

  it("move down increases row", () => {
    const s = makeState();
    const moved = reduce(s, { type: "move", dir: "down" }, rng);
    const after = reduce(moved, { type: "tick", dt: 0.14 }, quietRng);
    expect(after.playerPos.col).toBe(2);
    expect(after.playerPos.row).toBe(3);
  });

  it("move clamps at right edge", () => {
    const s = makeState({ playerPos: { col: 5, row: 2 } });
    const moved = reduce(s, { type: "move", dir: "right" }, rng);
    const after = reduce(moved, { type: "tick", dt: 0.14 }, quietRng);
    expect(after.playerPos.col).toBe(5);
  });

  it("move clamps at left edge", () => {
    const s = makeState({ playerPos: { col: 0, row: 2 } });
    const moved = reduce(s, { type: "move", dir: "left" }, rng);
    const after = reduce(moved, { type: "tick", dt: 0.14 }, quietRng);
    expect(after.playerPos.col).toBe(0);
  });

  it("move clamps at top edge", () => {
    const s = makeState({ playerPos: { col: 2, row: 0 } });
    const moved = reduce(s, { type: "move", dir: "up" }, rng);
    const after = reduce(moved, { type: "tick", dt: 0.14 }, quietRng);
    expect(after.playerPos.row).toBe(0);
  });

  it("move clamps at bottom edge", () => {
    const s = makeState({ playerPos: { col: 2, row: 4 } });
    const moved = reduce(s, { type: "move", dir: "down" }, rng);
    const after = reduce(moved, { type: "tick", dt: 0.14 }, quietRng);
    expect(after.playerPos.row).toBe(4);
  });

  it("move during pause starts no step", () => {
    const s = makeState({ phase: "paused" });
    const after = reduce(s, { type: "move", dir: "right" }, rng);
    expect(after.playerPos).toEqual({ col: 2, row: 2 });
    expect(after.phase).toBe("paused");
    expect(after.stepTimer).toBe(0);
    expect(after.pendingDir).toBeNull();
  });
});
