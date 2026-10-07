import { describe, it, expect } from "vitest";
import type { Cell, Rule } from "@/rules/types";
import type { Enemy } from "@/game/enemies";
import { sameCell, chebyshev } from "@/game/enemies";
import { COLS, ROWS, BOARD_SIZE, type GameState } from "@/game/state";
import { handleTick } from "@/game/tick";
import { enemyCap } from "@/game/spawn";
import { generateBoardForRule } from "@/game/board";
import { HARD } from "@/content/bands";

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
    band: "standard",
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
    stepTimer: 0,
    pendingDir: null,
    queuedDir: null,
    pendingSpawnAt: null,
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

  it("tick at level 20 resets stepTimer to 258", () => {
    const enemy = makeEnemy({ pos: { col: 0, row: 0 }, dir: "right", stepTimer: 420 });
    const s = makeState({ enemies: [enemy], level: 20 });
    // 0.002 equals the enemy-spawn threshold (fails it) and the ramped refuge threshold (fails it)
    const noSpawns = () => 0.002;
    const after = handleTick(s, { type: "tick", dt: 0.5 }, noSpawns);
    expect(after.enemies[0].stepTimer).toBe(258);
  });

  it("refuge roll 0.002 spawns at L17, not at L18", () => {
    // constant 0.002 rng: below 0.003 (L17) but above 0.0015 (L18); equals the 0.002 enemy-spawn threshold so no enemy spawns
    const constant = () => 0.002;
    const after17 = handleTick(makeState({ level: 17 }), { type: "tick", dt: 1 }, constant);
    expect(after17.refuge).not.toBeNull();
    const after18 = handleTick(makeState({ level: 18 }), { type: "tick", dt: 1 }, constant);
    expect(after18.refuge).toBeNull();
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
    const enemy = makeEnemy({ pos: { col: 3, row: 4 }, dir: "right", stepTimer: 420 });
    const s = makeState({ enemies: [enemy], playerPos: { col: 5, row: 4 }, refuge: null, simTime: 0 });
    // 0.001 < 0.003 triggers spawn; 0.9999 picks index 28 = (4,4) (last non-player cell); 0.5 >= 0.002 skips enemy spawn
    const seq = [0.001, 0.9999, 0.5];
    let i = 0;
    const rng = () => (i < seq.length ? seq[i++] : 0.5);
    const after = handleTick(s, { type: "tick", dt: 0.5 }, rng);
    expect(after.refuge).not.toBeNull();
    if (after.refuge) {
      const onRefuge = after.enemies.filter((e) => sameCell(e.pos, after.refuge!.pos));
      expect(onRefuge).toHaveLength(0);
    }
  });

  it("player step freezes while freezeTimer > 0", () => {
    const s = makeState({ freezeTimer: 500, stepTimer: 100, pendingDir: "right" });
    const after = handleTick(s, { type: "tick", dt: 0.1 }, seededRng(1));
    expect(after.stepTimer).toBe(100);
    expect(after.pendingDir).toBe("right");
    expect(after.queuedDir).toBeNull();
    expect(after.playerPos).toEqual({ col: 2, row: 2 });
    expect(after.freezeTimer).toBe(400);
  });

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
    const e1 = makeEnemy({ id: 1, kind: "straight", pos: { col: 0, row: 1 }, dir: "right", stepTimer: 420 });
    const e2 = makeEnemy({ id: 2, kind: "straight", pos: { col: 1, row: 0 }, dir: "down", stepTimer: 420 });
    const s = makeState({ enemies: [e1, e2] });
    const after = handleTick(s, { type: "tick", dt: 0.5 }, seededRng(1));
    const atCell = after.enemies.filter((e) => sameCell(e.pos, { col: 1, row: 1 }));
    expect(atCell).toHaveLength(1);
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

  it("rewriter in equality mode writes an expression", () => {
    const pos = { col: 0, row: 0 };
    const board = boardWith(pos, { kind: "expr", text: "3+3", value: 6 });
    const enemy = makeEnemy({ kind: "rewriter", pos, dir: "right", stepTimer: 420 });
    const s = makeState({ enemies: [enemy], board, rule: { mode: "equality", k: 6 } });
    const after = handleTick(s, { type: "tick", dt: 0.5 }, seededRng(1));
    const leftIdx = pos.row * COLS + pos.col;
    expect(after.board[leftIdx].kind).toBe("expr");
  });

  it("rewriter in inequality mode writes an expression", () => {
    const pos = { col: 0, row: 0 };
    const board = boardWith(pos, { kind: "expr", text: "3+3", value: 6 });
    const enemy = makeEnemy({ kind: "rewriter", pos, dir: "right", stepTimer: 420 });
    const s = makeState({ enemies: [enemy], board, rule: { mode: "inequality", k: 6 } });
    const after = handleTick(s, { type: "tick", dt: 0.5 }, seededRng(1));
    const leftIdx = pos.row * COLS + pos.col;
    expect(after.board[leftIdx].kind).toBe("expr");
  });

  it("rewriter in multiples mode writes a number", () => {
    const pos = { col: 0, row: 0 };
    const board = boardWith(pos, { kind: "number", value: 6 });
    const enemy = makeEnemy({ kind: "rewriter", pos, dir: "right", stepTimer: 420 });
    const s = makeState({ enemies: [enemy], board, rule: { mode: "multiples", k: 6 } });
    const after = handleTick(s, { type: "tick", dt: 0.5 }, seededRng(1));
    const leftIdx = pos.row * COLS + pos.col;
    expect(after.board[leftIdx].kind).toBe("number");
  });

  it("rewriter uses band range: easy numbers ≤ 30", () => {
    const pos = { col: 0, row: 0 };
    const board = boardWith(pos, { kind: "number", value: 6 });
    const enemy = makeEnemy({ kind: "rewriter", pos, dir: "right", stepTimer: 420 });
    const s = makeState({ enemies: [enemy], board, rule: { mode: "multiples", k: 6 }, band: "easy" });
    const after = handleTick(s, { type: "tick", dt: 0.5 }, seededRng(1));
    const leftIdx = pos.row * COLS + pos.col;
    const cell = after.board[leftIdx];
    expect(cell.kind).toBe("number");
    if (cell.kind === "number") {
      expect(cell.value).toBeGreaterThanOrEqual(1);
      expect(cell.value).toBeLessThanOrEqual(30);
    }
  });

  it("rewriter uses band range: hard numbers can be > 60", () => {
    const pos = { col: 0, row: 0 };
    const board = boardWith(pos, { kind: "number", value: 6 });
    const enemy = makeEnemy({ kind: "rewriter", pos, dir: "right", stepTimer: 420 });
    const s = makeState({ enemies: [enemy], board, rule: { mode: "multiples", k: 6 }, band: "hard" });
    const rng = () => 0.99;
    const after = handleTick(s, { type: "tick", dt: 0.5 }, rng);
    const leftIdx = pos.row * COLS + pos.col;
    const cell = after.board[leftIdx];
    expect(cell.kind).toBe("number");
    if (cell.kind === "number") {
      expect(cell.value).toBeLessThanOrEqual(100);
      expect(cell.value).toBeGreaterThan(60);
    }
  });

  it("rewriter clearing last match triggers level-clear", () => {
    const pos = { col: 0, row: 0 };
    const board = boardWith(pos, { kind: "number", value: 6 });
    const enemy = makeEnemy({ kind: "rewriter", pos, dir: "right", stepTimer: 420 });
    const s = makeState({ enemies: [enemy], board, rule: { mode: "multiples", k: 6 } });
    const rng = () => 0.5;
    const after = handleTick(s, { type: "tick", dt: 0.5 }, rng);
    expect(after.phase).toBe("level-clear");
  });

  it("rewriter writing a match does not clear", () => {
    const pos = { col: 0, row: 0 };
    const board = boardWith(pos, { kind: "number", value: 6 });
    const enemy = makeEnemy({ kind: "rewriter", pos, dir: "right", stepTimer: 420 });
    const s = makeState({ enemies: [enemy], board, rule: { mode: "multiples", k: 6 } });
    const rng = () => 0.09;
    const after = handleTick(s, { type: "tick", dt: 0.5 }, rng);
    expect(after.phase).toBe("playing");
  });

  it("rewriter on a hard equality board rewrites to a cell ≥ 13", () => {
    const rule: Rule = { mode: "equality", k: 13 };
    const board = generateBoardForRule(rule, seededRng(5), HARD);
    const pos = { col: 0, row: 0 };
    const enemy = makeEnemy({ kind: "rewriter", pos, dir: "right", stepTimer: 420 });
    const s = makeState({
      enemies: [enemy],
      board,
      rule,
      band: "hard",
      playerPos: { col: 5, row: 4 },
    });
    const rewritten: Array<Extract<Cell, { kind: "expr" }>> = [];
    let state = s;
    for (let i = 0; i < 30; i += 1) {
      if (state.phase !== "playing") break;
      const rewriter = state.enemies.find((e) => e.kind === "rewriter");
      if (!rewriter) break;
      const oldPos = { ...rewriter.pos };
      const next = handleTick(state, { type: "tick", dt: 0.5 }, seededRng(100 + i));
      const after = next.enemies.find((e) => e.kind === "rewriter");
      if (after && !sameCell(oldPos, after.pos)) {
        const cell = next.board[oldPos.row * COLS + oldPos.col];
        if (cell.kind === "expr") rewritten.push(cell);
      }
      state = next;
    }
    expect(rewritten.length).toBeGreaterThan(0);
    for (const cell of rewritten) {
      expect(cell.value).toBeGreaterThanOrEqual(13);
    }
  });

  it("shy targets the resolved player position", () => {
    const enemy = makeEnemy({ kind: "shy", pos: { col: 4, row: 3 }, dir: "right", stepTimer: 0 });
    const s = makeState({ enemies: [enemy], playerPos: { col: 2, row: 2 }, stepTimer: 10, pendingDir: "right" });
    const after = handleTick(s, { type: "tick", dt: 0.016 }, () => 0.5);
    expect(after.playerPos).toEqual({ col: 3, row: 2 });
    expect(after.enemies[0].pos).toEqual({ col: 4, row: 4 });
    expect(after.lives).toBe(3);
  });

  it("chaser targets the resolved player position", () => {
    const enemy = makeEnemy({ kind: "chaser", pos: { col: 4, row: 0 }, dir: "right", stepTimer: 0 });
    const s = makeState({ enemies: [enemy], playerPos: { col: 2, row: 2 }, stepTimer: 10, pendingDir: "right" });
    const after = handleTick(s, { type: "tick", dt: 0.016 }, () => 0.5);
    expect(after.playerPos).toEqual({ col: 3, row: 2 });
    expect(after.enemies[0].pos).toEqual({ col: 4, row: 1 });
    expect(after.lives).toBe(3);
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
