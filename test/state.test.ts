import { describe, it, expect } from "vitest";
import type { Cell } from "@/rules/types";
import {
  createInitialState,
  reduce,
  COLS,
  BOARD_SIZE,
  type GameState,
} from "@/game/state";

function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
const rng = seededRng(42);

function emptyBoard(): Cell[] {
  return Array.from({ length: BOARD_SIZE }, () => ({ kind: "empty" as const }));
}

function makePlayingState(overrides: Partial<GameState> = {}): GameState {
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
    ...overrides,
  };
}

function boardWithCell(pos: { col: number; row: number }, cell: Cell, base?: Cell[]): Cell[] {
  const b = base ? [...base] : emptyBoard();
  b[pos.row * COLS + pos.col] = cell;
  return b;
}

describe("state", () => {
  it("start sets initial state", () => {
    const s = createInitialState();
    const after = reduce(s, { type: "start", mode: "multiples" }, rng);
    expect(after.phase).toBe("playing");
    expect(after.mode).toBe("multiples");
    expect(after.level).toBe(1);
    expect(after.score).toBe(0);
    expect(after.lives).toBe(3);
    expect(after.reserveLives).toBe(0);
    expect(after.streak).toBe(0);
    expect(after.nextLifeThreshold).toBe(1000);
    expect(after.board.length).toBe(30);
    expect(after.playerPos).toEqual({ col: 2, row: 2 });
  });

  it("move right increases col", () => {
    const s = makePlayingState();
    const after = reduce(s, { type: "move", dir: "right" }, rng);
    expect(after.playerPos.col).toBe(3);
    expect(after.playerPos.row).toBe(2);
  });

  it("move left decreases col", () => {
    const s = makePlayingState();
    const after = reduce(s, { type: "move", dir: "left" }, rng);
    expect(after.playerPos.col).toBe(1);
    expect(after.playerPos.row).toBe(2);
  });

  it("move up decreases row", () => {
    const s = makePlayingState();
    const after = reduce(s, { type: "move", dir: "up" }, rng);
    expect(after.playerPos.col).toBe(2);
    expect(after.playerPos.row).toBe(1);
  });

  it("move down increases row", () => {
    const s = makePlayingState();
    const after = reduce(s, { type: "move", dir: "down" }, rng);
    expect(after.playerPos.col).toBe(2);
    expect(after.playerPos.row).toBe(3);
  });

  it("move clamps at right edge", () => {
    const s = makePlayingState({ playerPos: { col: 5, row: 2 } });
    const after = reduce(s, { type: "move", dir: "right" }, rng);
    expect(after.playerPos.col).toBe(5);
  });

  it("move clamps at left edge", () => {
    const s = makePlayingState({ playerPos: { col: 0, row: 2 } });
    const after = reduce(s, { type: "move", dir: "left" }, rng);
    expect(after.playerPos.col).toBe(0);
  });

  it("move clamps at top edge", () => {
    const s = makePlayingState({ playerPos: { col: 2, row: 0 } });
    const after = reduce(s, { type: "move", dir: "up" }, rng);
    expect(after.playerPos.row).toBe(0);
  });

  it("move clamps at bottom edge", () => {
    const s = makePlayingState({ playerPos: { col: 2, row: 4 } });
    const after = reduce(s, { type: "move", dir: "down" }, rng);
    expect(after.playerPos.row).toBe(4);
  });

  it("move during pause does nothing", () => {
    const s = makePlayingState({ phase: "paused" });
    const after = reduce(s, { type: "move", dir: "right" }, rng);
    expect(after.playerPos).toEqual({ col: 2, row: 2 });
  });

  it("eating a match scores +10", () => {
    const pos = { col: 2, row: 2 };
    const board = boardWithCell(pos, { kind: "number", value: 6 });
    board[pos.row * COLS + pos.col + 1] = { kind: "number", value: 12 };
    const s = makePlayingState({ board });
    const after = reduce(s, { type: "eat" }, rng);
    expect(after.score).toBe(10);
    expect(after.board[pos.row * COLS + pos.col]).toEqual({ kind: "empty" });
  });

  it("eating a match at streak 3 scores +15", () => {
    const pos = { col: 2, row: 2 };
    const board = boardWithCell(pos, { kind: "number", value: 12 });
    board[pos.row * COLS + pos.col + 1] = { kind: "number", value: 18 };
    const s = makePlayingState({ board, streak: 3 });
    const after = reduce(s, { type: "eat" }, rng);
    expect(after.score).toBe(15);
  });

  it("eating a match increments streak", () => {
    const pos = { col: 2, row: 2 };
    const board = boardWithCell(pos, { kind: "number", value: 6 });
    const s = makePlayingState({ board, streak: 1 });
    const after = reduce(s, { type: "eat" }, rng);
    expect(after.streak).toBe(2);
  });

  it("eating a non-match costs a life", () => {
    const pos = { col: 2, row: 2 };
    const board = boardWithCell(pos, { kind: "number", value: 7 });
    const s = makePlayingState({ board, score: 50, streak: 2 });
    const after = reduce(s, { type: "eat" }, rng);
    expect(after.lives).toBe(2);
    expect(after.streak).toBe(0);
    expect(after.board[pos.row * COLS + pos.col]).toEqual({ kind: "empty" });
    expect(after.score).toBe(50);
  });

  it("eating a non-match at 1 life triggers game over", () => {
    const pos = { col: 2, row: 2 };
    const board = boardWithCell(pos, { kind: "number", value: 7 });
    const s = makePlayingState({ board, lives: 1 });
    const after = reduce(s, { type: "eat" }, rng);
    expect(after.phase).toBe("game-over");
    expect(after.lives).toBe(0);
  });

  it("eating empty does nothing", () => {
    const s = makePlayingState({ score: 20, streak: 1, lives: 3 });
    const after = reduce(s, { type: "eat" }, rng);
    expect(after.score).toBe(20);
    expect(after.lives).toBe(3);
    expect(after.streak).toBe(1);
  });

  it("eating during pause does nothing", () => {
    const pos = { col: 2, row: 2 };
    const board = boardWithCell(pos, { kind: "number", value: 6 });
    const s = makePlayingState({ board, phase: "paused" });
    const after = reduce(s, { type: "eat" }, rng);
    expect(after.phase).toBe("paused");
    expect(after.score).toBe(0);
    expect(after.board[pos.row * COLS + pos.col]).toEqual({ kind: "number", value: 6 });
  });

  it("last match cleared triggers level-clear", () => {
    const pos = { col: 2, row: 2 };
    const board = boardWithCell(pos, { kind: "number", value: 6 });
    const s = makePlayingState({ board, level: 4 });
    const after = reduce(s, { type: "eat" }, rng);
    expect(after.phase).toBe("level-clear");
    expect(after.score).toBe(10 + 25 + 5 * 4);
  });

  it("next-level advances level and generates new board", () => {
    const s = makePlayingState({ phase: "level-clear", level: 3, streak: 5 });
    const after = reduce(s, { type: "next-level" }, rng);
    expect(after.level).toBe(4);
    expect(after.phase).toBe("playing");
    expect(after.streak).toBe(0);
    expect(after.board.length).toBe(30);
    expect(after.playerPos).toEqual({ col: 2, row: 2 });
  });

  it("extra life at 1000 points", () => {
    const pos = { col: 2, row: 2 };
    const board = boardWithCell(pos, { kind: "number", value: 6 });
    board[pos.row * COLS + pos.col + 1] = { kind: "number", value: 12 };
    const s = makePlayingState({ board, score: 995 });
    const after = reduce(s, { type: "eat" }, rng);
    expect(after.score).toBe(1005);
    expect(after.reserveLives).toBe(1);
  });

  it("extra life does not exceed reserve cap 2", () => {
    const pos = { col: 2, row: 2 };
    const board = boardWithCell(pos, { kind: "number", value: 6 });
    const s = makePlayingState({ board, score: 995, reserveLives: 2 });
    const after = reduce(s, { type: "eat" }, rng);
    expect(after.reserveLives).toBe(2);
  });

  it("extra life triggers once per threshold", () => {
    const pos = { col: 2, row: 2 };
    const board = boardWithCell(pos, { kind: "number", value: 6 });
    board[pos.row * COLS + pos.col + 1] = { kind: "number", value: 12 };
    const s2 = makePlayingState({ board, score: 985, streak: 50 });
    const after = reduce(s2, { type: "eat" }, rng);
    expect(after.reserveLives).toBe(1);
    expect(after.nextLifeThreshold).toBe(2000);

    const s3 = makePlayingState({ board, score: 1995, reserveLives: 0, nextLifeThreshold: 2000, streak: 50 });
    const after3 = reduce(s3, { type: "eat" }, rng);
    // 1995 + 15 = 2010, crosses 2000 threshold once
    expect(after3.reserveLives).toBe(1);
    expect(after3.nextLifeThreshold).toBe(3000);
  });

  it("pause then resume", () => {
    const s = makePlayingState();
    const paused = reduce(s, { type: "pause" }, rng);
    expect(paused.phase).toBe("paused");
    const resumed = reduce(paused, { type: "resume" }, rng);
    expect(resumed.phase).toBe("playing");
  });

  it("restart resets but keeps mode", () => {
    const s = makePlayingState({ mode: "factors", score: 500, level: 5, lives: 1 });
    const after = reduce(s, { type: "restart" }, rng);
    expect(after.score).toBe(0);
    expect(after.level).toBe(1);
    expect(after.lives).toBe(3);
    expect(after.mode).toBe("factors");
    expect(after.phase).toBe("playing");
  });

  it("tick is a no-op in phase 3", () => {
    const s = makePlayingState({ score: 42, streak: 2, lives: 3 });
    const after = reduce(s, { type: "tick", dt: 16 }, rng);
    expect(after.score).toBe(42);
    expect(after.streak).toBe(2);
    expect(after.lives).toBe(3);
    expect(after.phase).toBe("playing");
  });
});
