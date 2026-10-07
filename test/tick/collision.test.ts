import { describe, it, expect } from "vitest";
import { sameCell, type Enemy } from "@/game/enemies";
import { COLS, ROWS, type GameState } from "@/game/state";
import { handleTick } from "@/game/tick";
import { enemyCap } from "@/game/spawn";
import { makeEnemy, makeState, seededRng } from "../test-helpers";

describe("tick", () => {
  it("enemy and player land on the same cell in one tick → hit", () => {
    const enemy = makeEnemy({ pos: { col: 4, row: 2 }, dir: "left", stepTimer: 420 });
    const s = makeState({ enemies: [enemy], playerPos: { col: 2, row: 2 } });
    const moving: GameState = { ...s, pendingDir: "right", stepTimer: 140 };
    const after = handleTick(moving, { type: "tick", dt: 0.5 }, seededRng(1));
    expect(after.lives).toBe(2);
    expect(sameCell(after.playerPos, { col: 3, row: 2 })).toBe(false);
  });

  it("collision: player and enemy same cell triggers enemy-hit", () => {
    const enemy = makeEnemy({ pos: { col: 2, row: 2 }, dir: "right", stepTimer: 420 });
    const s = makeState({ enemies: [enemy], playerPos: { col: 2, row: 2 }, lives: 3 });
    const after = handleTick(s, { type: "tick", dt: 0.001 }, seededRng(1));
    expect(after.lives).toBe(2);
  });

  it("collision: last life triggers game-over", () => {
    const enemy = makeEnemy({ pos: { col: 2, row: 2 }, dir: "right", stepTimer: 420 });
    const s = makeState({ enemies: [enemy], playerPos: { col: 2, row: 2 }, lives: 1 });
    const after = handleTick(s, { type: "tick", dt: 0.001 }, seededRng(1));
    expect(after.phase).toBe("game-over");
  });

  it("collision: respawn to non-enemy cell", () => {
    const enemy = makeEnemy({ pos: { col: 2, row: 2 }, dir: "right", stepTimer: 420 });
    const s = makeState({ enemies: [enemy], playerPos: { col: 2, row: 2 } });
    const after = handleTick(s, { type: "tick", dt: 0.001 }, seededRng(1));
    const onEnemy = after.enemies.some((e) => sameCell(e.pos, after.playerPos));
    expect(onEnemy).toBe(false);
  });

  it("two enemies same cell: arriving removes resident", () => {
    // Resident sits in cooldown (999 - 500 > 0) so it never leaves (1,1).
    const resident = makeEnemy({ id: 1, kind: "straight", pos: { col: 1, row: 1 }, stepTimer: 999 });
    // Arriver steps down onto the resident's cell (1,1).
    const arriver = makeEnemy({ id: 2, kind: "straight", pos: { col: 1, row: 0 }, dir: "down", stepTimer: 420 });
    const s = makeState({ enemies: [resident, arriver] });
    const after = handleTick(s, { type: "tick", dt: 0.5 }, seededRng(1));
    const atCell = after.enemies.filter((e) => sameCell(e.pos, { col: 1, row: 1 }));
    expect(atCell).toHaveLength(1);
    expect(atCell[0].id).toBe(2);
  });

  it("dedup survivor is independent of array order: arriving still eats resident", () => {
    const resident = makeEnemy({ id: 1, kind: "straight", pos: { col: 1, row: 1 }, stepTimer: 999 });
    const arriver = makeEnemy({ id: 2, kind: "straight", pos: { col: 1, row: 0 }, dir: "down", stepTimer: 420 });
    const s = makeState({ enemies: [arriver, resident] });
    const after = handleTick(s, { type: "tick", dt: 0.5 }, seededRng(1));
    const atCell = after.enemies.filter((e) => sameCell(e.pos, { col: 1, row: 1 }));
    expect(atCell).toHaveLength(1);
    expect(atCell[0].id).toBe(2);
  });

  it("two arrivers on a shared empty cell: first in array survives", () => {
    const a = makeEnemy({ id: 1, kind: "straight", pos: { col: 0, row: 1 }, dir: "right", stepTimer: 420 });
    const b = makeEnemy({ id: 2, kind: "straight", pos: { col: 1, row: 0 }, dir: "down", stepTimer: 420 });
    const s = makeState({ enemies: [a, b] });
    const after = handleTick(s, { type: "tick", dt: 0.5 }, seededRng(1));
    const atCell = after.enemies.filter((e) => sameCell(e.pos, { col: 1, row: 1 }));
    expect(atCell).toHaveLength(1);
    expect(atCell[0].id).toBe(1);
  });

  it("enemy spawn respects cap", () => {
    const enemies: Enemy[] = [];
    const cap = enemyCap(1);
    for (let i = 0; i < cap; i++) {
      enemies.push(makeEnemy({ id: i + 1, pos: { col: 0, row: i } }));
    }
    const s = makeState({ enemies, level: 1 });
    const after = handleTick(s, { type: "tick", dt: 0.5 }, seededRng(999));
    expect(after.enemies.length).toBeLessThanOrEqual(cap);
  });

  it("enemy spawn from edge", () => {
    const s = makeState({ enemies: [], level: 1 });
    // Use a rng that will trigger spawn (0.002 threshold)
    const spawnRng = seededRng(7);
    let after = s;
    for (let i = 0; i < 200; i++) {
      after = handleTick(after, { type: "tick", dt: 0.016 }, spawnRng);
      if (after.enemies.length > 0) break;
    }
    if (after.enemies.length > 0) {
      const e = after.enemies[0];
      const isEdge =
        e.pos.col === 0 ||
        e.pos.col === COLS - 1 ||
        e.pos.row === 0 ||
        e.pos.row === ROWS - 1;
      expect(isEdge).toBe(true);
    }
  });

  it("collision schedules a replacement spawn", () => {
    const a = makeEnemy({ id: 1, kind: "straight", pos: { col: 0, row: 0 }, dir: "down", stepTimer: 0 });
    const b = makeEnemy({ id: 2, kind: "straight", pos: { col: 0, row: 2 }, dir: "up", stepTimer: 0 });
    const s = makeState({ level: 4, enemies: [a, b] });
    const after = handleTick(s, { type: "tick", dt: 1 }, () => 0.5);
    expect(after.enemies).toHaveLength(1);
    expect(after.pendingSpawnAt).not.toBeNull();
    if (after.pendingSpawnAt !== null) {
      expect(after.pendingSpawnAt).toBeGreaterThanOrEqual(after.simTime + 2000);
      expect(after.pendingSpawnAt).toBeLessThanOrEqual(after.simTime + 4000);
    }
  });

  it("a scheduled replacement spawns after the delay and clears the timer", () => {
    const e = makeEnemy({ id: 1, kind: "straight", pos: { col: 3, row: 3 }, dir: "up", stepTimer: 0 });
    const s = makeState({ level: 4, enemies: [e], pendingSpawnAt: 100, simTime: 100 });
    const after = handleTick(s, { type: "tick", dt: 1 }, () => 0.5);
    expect(after.enemies).toHaveLength(2);
    expect(after.pendingSpawnAt).toBeNull();
  });

  it("a scheduled spawn does not exceed the cap", () => {
    const e1 = makeEnemy({ id: 1, kind: "straight", pos: { col: 3, row: 3 }, dir: "up", stepTimer: 0 });
    const e2 = makeEnemy({ id: 2, kind: "straight", pos: { col: 4, row: 3 }, dir: "up", stepTimer: 0 });
    const s = makeState({ level: 4, enemies: [e1, e2], pendingSpawnAt: 100, simTime: 100 });
    const after = handleTick(s, { type: "tick", dt: 1 }, () => 0.5);
    expect(after.enemies).toHaveLength(2);
    expect(after.pendingSpawnAt).toBeNull();
  });

  it("no second schedule while one is pending", () => {
    const a = makeEnemy({ id: 1, kind: "straight", pos: { col: 0, row: 0 }, dir: "down", stepTimer: 0 });
    const b = makeEnemy({ id: 2, kind: "straight", pos: { col: 0, row: 2 }, dir: "up", stepTimer: 0 });
    const s = makeState({ level: 4, enemies: [a, b], pendingSpawnAt: 5000, simTime: 0 });
    const after = handleTick(s, { type: "tick", dt: 1 }, () => 0.5);
    expect(after.pendingSpawnAt).toBe(5000);
  });
});
