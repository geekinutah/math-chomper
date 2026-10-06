import { describe, it, expect } from "vitest";
import type { Cell } from "@/rules/types";
import type { Enemy } from "@/game/enemies";
import { sameCell, chebyshev } from "@/game/enemies";
import { COLS, ROWS, BOARD_SIZE, type GameState } from "@/game/state";
import { handleTick } from "@/game/tick";
import { enemyCap } from "@/game/spawn";

function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function emptyBoard(): Cell[] {
  return Array.from({ length: BOARD_SIZE }, () => ({ kind: "empty" as const }));
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: "playing",
    mode: "multiples",
    level: 1,
    score: 0,
    lives: 3,
    reserveLives: 0,
    streak: 0,
    nextLifeThreshold: 1000,
    rule: { mode: "multiples", k: 6 },
    board: emptyBoard(),
    playerPos: { col: 2, row: 2 },
    enemies: [],
    refuge: null,
    simTime: 0,
    freezeTimer: 0,
    ...overrides,
  };
}

function makeEnemy(overrides: Partial<Enemy> = {}): Enemy {
  return {
    id: 1,
    kind: "straight",
    pos: { col: 0, row: 0 },
    dir: "right",
    stepTimer: 420,
    ...overrides,
  };
}

function boardWith(pos: { col: number; row: number }, cell: Cell): Cell[] {
  const b = emptyBoard();
  b[pos.row * COLS + pos.col] = cell;
  return b;
}

describe("tick", () => {
  it("tick with no enemies does nothing except simTime", () => {
    const s = makeState({ score: 100, streak: 2, lives: 3 });
    const after = handleTick(s, { type: "tick", dt: 1 }, seededRng(1));
    expect(after.simTime).toBe(1000);
    expect(after.score).toBe(100);
    expect(after.streak).toBe(2);
    expect(after.lives).toBe(3);
    expect(after.enemies).toHaveLength(0);
    expect(after.phase).toBe("playing");
  });

  it("enemy steps after timer expires", () => {
    const enemy = makeEnemy({ pos: { col: 0, row: 0 }, dir: "right", stepTimer: 420 });
    const s = makeState({ enemies: [enemy] });
    const after = handleTick(s, { type: "tick", dt: 0.5 }, seededRng(1));
    expect(after.enemies[0].pos).not.toEqual({ col: 0, row: 0 });
  });

  it("enemy frozen during freezeTimer does not step", () => {
    const enemy = makeEnemy({ pos: { col: 0, row: 0 }, dir: "right", stepTimer: 420 });
    const s = makeState({ enemies: [enemy], freezeTimer: 500 });
    const after = handleTick(s, { type: "tick", dt: 0.1 }, seededRng(1));
    expect(after.enemies[0].pos).toEqual({ col: 0, row: 0 });
    expect(after.freezeTimer).toBe(400);
  });

  it("chaser moves toward player each step", () => {
    const enemy = makeEnemy({ kind: "chaser", pos: { col: 0, row: 0 }, dir: "right", stepTimer: 420 });
    const playerPos = { col: 4, row: 2 };
    const s = makeState({ enemies: [enemy], playerPos });
    const distBefore = chebyshev(enemy.pos, playerPos);
    const after = handleTick(s, { type: "tick", dt: 0.5 }, seededRng(1));
    const distAfter = chebyshev(after.enemies[0].pos, playerPos);
    expect(distAfter).toBeLessThan(distBefore);
  });

  it("shy flees when close", () => {
    const enemy = makeEnemy({ kind: "shy", pos: { col: 2, row: 2 }, dir: "right", stepTimer: 420 });
    const playerPos = { col: 3, row: 2 };
    const s = makeState({ enemies: [enemy], playerPos });
    const distBefore = chebyshev(enemy.pos, playerPos);
    const after = handleTick(s, { type: "tick", dt: 0.5 }, seededRng(1));
    const distAfter = chebyshev(after.enemies[0].pos, playerPos);
    expect(distAfter).toBeGreaterThan(distBefore);
  });

  it("eater empties the cell it leaves", () => {
    const pos = { col: 0, row: 0 };
    const board = boardWith(pos, { kind: "number", value: 6 });
    const enemy = makeEnemy({ kind: "eater", pos, dir: "right", stepTimer: 420 });
    const s = makeState({ enemies: [enemy], board });
    const after = handleTick(s, { type: "tick", dt: 0.5 }, seededRng(1));
    const leftIdx = pos.row * COLS + pos.col;
    expect(after.board[leftIdx]).toEqual({ kind: "empty" });
  });

  it("eater clearing last match triggers level-clear", () => {
    const pos = { col: 0, row: 0 };
    const board = boardWith(pos, { kind: "number", value: 6 });
    const enemy = makeEnemy({ kind: "eater", pos, dir: "right", stepTimer: 420 });
    const s = makeState({ enemies: [enemy], board, rule: { mode: "multiples", k: 6 } });
    const after = handleTick(s, { type: "tick", dt: 0.5 }, seededRng(1));
    expect(after.phase).toBe("level-clear");
  });

  it("rewriter writes new value in left cell", () => {
    const pos = { col: 0, row: 0 };
    const board = boardWith(pos, { kind: "empty" });
    const enemy = makeEnemy({ kind: "rewriter", pos, dir: "right", stepTimer: 420 });
    const s = makeState({ enemies: [enemy], board });
    const after = handleTick(s, { type: "tick", dt: 0.5 }, seededRng(1));
    const leftIdx = pos.row * COLS + pos.col;
    expect(after.board[leftIdx].kind).not.toBe("empty");
  });

  it("refuge expires after duration", () => {
    const s = makeState({
      refuge: { pos: { col: 0, row: 0 }, expiresAt: 100 },
      simTime: 90,
    });
    const noSpawn = () => 0.5;
    const after = handleTick(s, { type: "tick", dt: 0.2 }, noSpawn);
    expect(after.refuge).toBeNull();
  });

  it("refuge blocks enemy entry", () => {
    const enemy = makeEnemy({ pos: { col: 0, row: 0 }, dir: "right", stepTimer: 420 });
    const refuge = { pos: { col: 1, row: 0 }, expiresAt: 10000 };
    const s = makeState({ enemies: [enemy], refuge, simTime: 0 });
    const after = handleTick(s, { type: "tick", dt: 0.5 }, seededRng(1));
    expect(sameCell(after.enemies[0].pos, { col: 0, row: 0 })).toBe(true);
  });

  it("refuge removes enemy on it", () => {
    const enemy = makeEnemy({ pos: { col: 2, row: 2 }, dir: "right", stepTimer: 420 });
    const refuge = { pos: { col: 2, row: 2 }, expiresAt: 10000 };
    const s = makeState({ enemies: [enemy], refuge, simTime: 0 });
    const after = handleTick(s, { type: "tick", dt: 0.5 }, seededRng(1));
    const onRefuge = after.enemies.filter((e) => sameCell(e.pos, refuge.pos));
    expect(onRefuge).toHaveLength(0);
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
    const e1 = makeEnemy({ id: 1, kind: "straight", pos: { col: 0, row: 0 }, dir: "right", stepTimer: 420 });
    const e2 = makeEnemy({ id: 2, kind: "straight", pos: { col: 1, row: 0 }, dir: "left", stepTimer: 420 });
    const s = makeState({ enemies: [e1, e2] });
    const after = handleTick(s, { type: "tick", dt: 0.5 }, seededRng(1));
    const atCell = after.enemies.filter((e) => sameCell(e.pos, { col: 1, row: 0 }));
    expect(atCell.length).toBeLessThanOrEqual(1);
    const atCell0 = after.enemies.filter((e) => sameCell(e.pos, { col: 0, row: 0 }));
    expect(atCell0.length).toBeLessThanOrEqual(1);
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
});
