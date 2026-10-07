import { describe, it, expect } from "vitest";
import { reduce } from "@/game/state";
import type { Enemy } from "@/game/enemies";
import { playerStepDelay } from "@/game/player";
import { enemyStepDelay } from "@/game/spawn";
import { boardWithCell, makeState, quietRng, seededRng } from "../test-helpers";

const rng = seededRng(42);

describe("player step and buffer", () => {
  it("playerStepDelay: level 1 → 140", () => {
    expect(playerStepDelay(1)).toBe(140);
  });

  it("playerStepDelay: 2 → 119, 3 → 101, 4 → 86", () => {
    expect(playerStepDelay(2)).toBe(119);
    expect(playerStepDelay(3)).toBe(101);
    expect(playerStepDelay(4)).toBe(86);
  });

  it("playerStepDelay: level 5+ → 80", () => {
    for (const level of [5, 10, 20, 100]) {
      expect(playerStepDelay(level)).toBe(80);
    }
  });

  it("playerStepDelay < enemyStepDelay for levels 1..100", () => {
    for (let level = 1; level <= 100; level += 1) {
      expect(playerStepDelay(level), `level ${level}`).toBeLessThan(enemyStepDelay(level));
    }
  });

  it("move when idle starts a step: position unchanged, stepTimer 140, pendingDir set", () => {
    const s = makeState();
    const after = reduce(s, { type: "move", dir: "right" }, rng);
    expect(after.playerPos).toEqual({ col: 2, row: 2 });
    expect(after.stepTimer).toBe(140);
    expect(after.pendingDir).toBe("right");
    expect(after.queuedDir).toBeNull();
  });

  it("move mid-step queues: queuedDir set, stepTimer and position unchanged", () => {
    const s = makeState({ stepTimer: 100, pendingDir: "right" });
    const after = reduce(s, { type: "move", dir: "left" }, rng);
    expect(after.playerPos).toEqual({ col: 2, row: 2 });
    expect(after.stepTimer).toBe(100);
    expect(after.pendingDir).toBe("right");
    expect(after.queuedDir).toBe("left");
  });

  it("tick shorter than the step moves nothing", () => {
    const s = makeState();
    const moving = reduce(s, { type: "move", dir: "right" }, rng);
    const after = reduce(moving, { type: "tick", dt: 0.1 }, quietRng);
    expect(after.playerPos).toEqual({ col: 2, row: 2 });
    expect(after.pendingDir).toBe("right");
    expect(after.stepTimer).toBe(40);
  });

  it("tick ≥ step duration resolves one cell and idles", () => {
    const s = makeState();
    const moving = reduce(s, { type: "move", dir: "right" }, rng);
    const after = reduce(moving, { type: "tick", dt: 0.14 }, quietRng);
    expect(after.playerPos).toEqual({ col: 3, row: 2 });
    expect(after.stepTimer).toBe(0);
    expect(after.pendingDir).toBeNull();
  });

  it("queued step chains after resolution", () => {
    const s = makeState();
    const moving = reduce(s, { type: "move", dir: "right" }, rng);
    const queued = reduce(moving, { type: "move", dir: "left" }, rng);
    expect(queued.queuedDir).toBe("left");
    expect(queued.pendingDir).toBe("right");
    const t1 = reduce(queued, { type: "tick", dt: 0.14 }, quietRng);
    expect(t1.playerPos).toEqual({ col: 3, row: 2 });
    const t2 = reduce(t1, { type: "tick", dt: 0.14 }, quietRng);
    expect(t2.playerPos).toEqual({ col: 2, row: 2 });
    expect(t2.stepTimer).toBe(0);
    expect(t2.pendingDir).toBeNull();
    expect(t2.queuedDir).toBeNull();
  });

  it("move at right edge clamps after resolution", () => {
    const s = makeState({ playerPos: { col: 5, row: 2 } });
    const moving = reduce(s, { type: "move", dir: "right" }, rng);
    expect(moving.stepTimer).toBe(140);
    expect(moving.pendingDir).toBe("right");
    const after = reduce(moving, { type: "tick", dt: 0.14 }, quietRng);
    expect(after.playerPos).toEqual({ col: 5, row: 2 });
    expect(after.stepTimer).toBe(0);
  });

  it("overshooting tick resolves exactly one step", () => {
    const s = makeState();
    const moving = reduce(s, { type: "move", dir: "right" }, rng);
    const after = reduce(moving, { type: "tick", dt: 0.15 }, quietRng);
    expect(after.playerPos).toEqual({ col: 3, row: 2 });
    expect(after.stepTimer).toBe(0);
    expect(after.pendingDir).toBeNull();
  });

  it("enemy-hit clears pendingDir and queuedDir", () => {
    const enemy: Enemy = {
      id: 1,
      kind: "straight",
      pos: { col: 3, row: 2 },
      dir: "right",
      stepTimer: 420,
    };
    const s = makeState({
      enemies: [enemy],
      stepTimer: 120,
      pendingDir: "right",
      queuedDir: "left",
    });
    const after = reduce(s, { type: "enemy-hit" }, rng);
    expect(after.stepTimer).toBe(0);
    expect(after.pendingDir).toBeNull();
    expect(after.queuedDir).toBeNull();
  });

  it("level-clear during tick clears pending + queued", () => {
    const pos = { col: 0, row: 0 };
    const board = boardWithCell(pos, { kind: "number", value: 6 });
    const eater: Enemy = { id: 1, kind: "eater", pos, dir: "right", stepTimer: 420 };
    const s = makeState({
      board,
      enemies: [eater],
      rule: { mode: "multiples", k: 6 },
      stepTimer: 100,
      pendingDir: "right",
      queuedDir: "left",
    });
    const after = reduce(s, { type: "tick", dt: 1 }, quietRng);
    expect(after.phase).toBe("level-clear");
    expect(after.stepTimer).toBe(0);
    expect(after.pendingDir).toBeNull();
    expect(after.queuedDir).toBeNull();
  });

  it("next-level clears an in-flight step", () => {
    const s = makeState({ phase: "level-clear", stepTimer: 100, pendingDir: "right", queuedDir: "left" });
    const after = reduce(s, { type: "next-level" }, quietRng);
    expect(after.phase).toBe("playing");
    expect(after.stepTimer).toBe(0);
    expect(after.pendingDir).toBeNull();
    expect(after.queuedDir).toBeNull();
  });
});
