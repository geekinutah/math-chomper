import { describe, it, expect } from "vitest";
import { createInitialState, reduce, COLS } from "@/game/state";
import type { Enemy } from "@/game/enemies";
import { boardWithCell, makeState, seededRng } from "../test-helpers";

const rng = seededRng(42);

describe("state", () => {
  it("enemy-hit reduces lives", () => {
    const enemy: Enemy = { id: 1, kind: "straight", pos: { col: 3, row: 2 }, dir: "right", stepTimer: 420 };
    const s = makeState({ lives: 3, enemies: [enemy] });
    const after = reduce(s, { type: "enemy-hit" }, rng);
    expect(after.lives).toBe(2);
  });

  it("enemy-hit resets streak", () => {
    const enemy: Enemy = { id: 1, kind: "straight", pos: { col: 3, row: 2 }, dir: "right", stepTimer: 420 };
    const s = makeState({ streak: 5, enemies: [enemy] });
    const after = reduce(s, { type: "enemy-hit" }, rng);
    expect(after.streak).toBe(0);
  });

  it("enemy-hit at 0 lives triggers game-over", () => {
    const enemy: Enemy = { id: 1, kind: "straight", pos: { col: 3, row: 2 }, dir: "right", stepTimer: 420 };
    const s = makeState({ lives: 1, enemies: [enemy] });
    const after = reduce(s, { type: "enemy-hit" }, rng);
    expect(after.phase).toBe("game-over");
    expect(after.lives).toBe(0);
  });

  it("enemy-hit sets freezeTimer to 700", () => {
    const enemy: Enemy = { id: 1, kind: "straight", pos: { col: 3, row: 2 }, dir: "right", stepTimer: 420 };
    const s = makeState({ enemies: [enemy] });
    const after = reduce(s, { type: "enemy-hit" }, rng);
    expect(after.freezeTimer).toBe(700);
  });

  it("enemy-hit respawns player to non-enemy cell", () => {
    const enemy: Enemy = { id: 1, kind: "straight", pos: { col: 3, row: 2 }, dir: "right", stepTimer: 420 };
    const s = makeState({ playerPos: { col: 3, row: 2 }, enemies: [enemy] });
    const after = reduce(s, { type: "enemy-hit" }, rng);
    expect(after.playerPos).not.toEqual({ col: 3, row: 2 });
  });

  it("initial state has empty enemies", () => {
    const s = createInitialState();
    expect(s.enemies).toHaveLength(0);
  });

  it("initial state has no refuge", () => {
    const s = createInitialState();
    expect(s.refuge).toBeNull();
  });

  it("wrong eat: life lost, streak reset, 700 ms freeze", () => {
    const pos = { col: 2, row: 2 };
    const board = boardWithCell(pos, { kind: "number", value: 7 });
    const s = makeState({ board, streak: 5 });
    const after = reduce(s, { type: "eat" }, rng);
    expect(after.lives).toBe(2);
    expect(after.streak).toBe(0);
    expect(after.freezeTimer).toBe(700);
    expect(after.phase).toBe("playing");
  });

  it("wrong eat: player respawns off enemy and refuge cells", () => {
    const pos = { col: 2, row: 2 };
    const board = boardWithCell(pos, { kind: "number", value: 7 });
    const enemy: Enemy = { id: 1, kind: "straight", pos, dir: "right", stepTimer: 420 };
    const refuge = { pos: { col: 3, row: 2 }, expiresAt: 0 };
    // 61537..61736 (not 1..200): the LCG's first draw from a low seed s is
    // ~16807*s/2^31, so seeds 1..200 all yield v<0.002 -> floor(v*28)=floor(v*30)=0,
    // i.e. the respawn always lands on cell (0,0) and the exclusions are never
    // exercised. This window's first draws land on index 13 (safe) for correct
    // code and index 14 (= the enemy / refuge cell) once an exclusion is dropped.
    for (let seed = 61537; seed <= 61736; seed++) {
      const s = makeState({ board, enemies: [enemy], refuge });
      const after = reduce(s, { type: "eat" }, seededRng(seed));
      expect(after.playerPos).not.toEqual(enemy.pos);
      expect(after.playerPos).not.toEqual(refuge.pos);
    }
  });

  it("wrong eat on last life: game over, no respawn", () => {
    const pos = { col: 2, row: 2 };
    const board = boardWithCell(pos, { kind: "number", value: 7 });
    const enemy: Enemy = { id: 1, kind: "straight", pos: { col: 3, row: 2 }, dir: "right", stepTimer: 420 };
    const s = makeState({ board, lives: 1, enemies: [enemy] });
    const after = reduce(s, { type: "eat" }, rng);
    expect(after.phase).toBe("game-over");
    expect(after.lives).toBe(0);
    expect(after.freezeTimer).toBe(700);
    expect(after.playerPos).toEqual(pos);
  });

  it("wrong eat: eaten cell is empty", () => {
    const pos = { col: 2, row: 2 };
    const board = boardWithCell(pos, { kind: "number", value: 7 });
    const s = makeState({ board });
    const after = reduce(s, { type: "eat" }, rng);
    expect(after.board[pos.row * COLS + pos.col]).toEqual({ kind: "empty" });
  });

  it("correct eat: no freeze, no teleport", () => {
    const pos = { col: 2, row: 2 };
    const board = boardWithCell(pos, { kind: "number", value: 6 });
    board[pos.row * COLS + pos.col + 1] = { kind: "number", value: 12 };
    const enemy: Enemy = { id: 1, kind: "straight", pos: { col: 4, row: 2 }, dir: "right", stepTimer: 420 };
    const s = makeState({ board, enemies: [enemy] });
    const after = reduce(s, { type: "eat" }, rng);
    expect(after.playerPos).toEqual(pos);
    expect(after.freezeTimer).toBe(0);
    expect(after.lives).toBe(3);
  });
});
