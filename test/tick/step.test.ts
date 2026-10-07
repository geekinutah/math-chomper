import { describe, it, expect } from "vitest";
import type { Cell, Rule } from "@/rules/types";
import { sameCell, chebyshev } from "@/game/enemies";
import { COLS } from "@/game/state";
import { handleTick } from "@/game/tick";
import { generateBoardForRule } from "@/game/board";
import { HARD } from "@/content/bands";
import { boardWithCell, makeEnemy, makeState, seededRng } from "../test-helpers";

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
    const board = boardWithCell(pos, { kind: "number", value: 6 });
    const enemy = makeEnemy({ kind: "eater", pos, dir: "right", stepTimer: 420 });
    const s = makeState({ enemies: [enemy], board });
    const after = handleTick(s, { type: "tick", dt: 0.5 }, seededRng(1));
    const leftIdx = pos.row * COLS + pos.col;
    expect(after.board[leftIdx]).toEqual({ kind: "empty" });
  });

  it("eater clearing last match triggers level-clear", () => {
    const pos = { col: 0, row: 0 };
    const board = boardWithCell(pos, { kind: "number", value: 6 });
    const enemy = makeEnemy({ kind: "eater", pos, dir: "right", stepTimer: 420 });
    const s = makeState({ enemies: [enemy], board, rule: { mode: "multiples", k: 6 } });
    const after = handleTick(s, { type: "tick", dt: 0.5 }, seededRng(1));
    expect(after.phase).toBe("level-clear");
  });

  it("rewriter writes new value in left cell", () => {
    const pos = { col: 0, row: 0 };
    const board = boardWithCell(pos, { kind: "empty" });
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

  it("player step freezes while freezeTimer > 0", () => {
    const s = makeState({ freezeTimer: 500, stepTimer: 100, pendingDir: "right" });
    const after = handleTick(s, { type: "tick", dt: 0.1 }, seededRng(1));
    expect(after.stepTimer).toBe(100);
    expect(after.pendingDir).toBe("right");
    expect(after.queuedDir).toBeNull();
    expect(after.playerPos).toEqual({ col: 2, row: 2 });
    expect(after.freezeTimer).toBe(400);
  });

  it("rewriter in equality mode writes an expression", () => {
    const pos = { col: 0, row: 0 };
    const board = boardWithCell(pos, { kind: "expr", text: "3+3", value: 6 });
    const enemy = makeEnemy({ kind: "rewriter", pos, dir: "right", stepTimer: 420 });
    const s = makeState({ enemies: [enemy], board, rule: { mode: "equality", k: 6 } });
    const after = handleTick(s, { type: "tick", dt: 0.5 }, seededRng(1));
    const leftIdx = pos.row * COLS + pos.col;
    expect(after.board[leftIdx].kind).toBe("expr");
  });

  it("rewriter in inequality mode writes an expression", () => {
    const pos = { col: 0, row: 0 };
    const board = boardWithCell(pos, { kind: "expr", text: "3+3", value: 6 });
    const enemy = makeEnemy({ kind: "rewriter", pos, dir: "right", stepTimer: 420 });
    const s = makeState({ enemies: [enemy], board, rule: { mode: "inequality", k: 6 } });
    const after = handleTick(s, { type: "tick", dt: 0.5 }, seededRng(1));
    const leftIdx = pos.row * COLS + pos.col;
    expect(after.board[leftIdx].kind).toBe("expr");
  });

  it("rewriter in multiples mode writes a number", () => {
    const pos = { col: 0, row: 0 };
    const board = boardWithCell(pos, { kind: "number", value: 6 });
    const enemy = makeEnemy({ kind: "rewriter", pos, dir: "right", stepTimer: 420 });
    const s = makeState({ enemies: [enemy], board, rule: { mode: "multiples", k: 6 } });
    const after = handleTick(s, { type: "tick", dt: 0.5 }, seededRng(1));
    const leftIdx = pos.row * COLS + pos.col;
    expect(after.board[leftIdx].kind).toBe("number");
  });

  it("rewriter uses band range: easy numbers ≤ 30", () => {
    const pos = { col: 0, row: 0 };
    const board = boardWithCell(pos, { kind: "number", value: 6 });
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
    const board = boardWithCell(pos, { kind: "number", value: 6 });
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
    const board = boardWithCell(pos, { kind: "number", value: 6 });
    const enemy = makeEnemy({ kind: "rewriter", pos, dir: "right", stepTimer: 420 });
    const s = makeState({ enemies: [enemy], board, rule: { mode: "multiples", k: 6 } });
    const rng = () => 0.5;
    const after = handleTick(s, { type: "tick", dt: 0.5 }, rng);
    expect(after.phase).toBe("level-clear");
  });

  it("rewriter writing a match does not clear", () => {
    const pos = { col: 0, row: 0 };
    const board = boardWithCell(pos, { kind: "number", value: 6 });
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
});
