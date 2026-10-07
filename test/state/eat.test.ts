import { describe, it, expect } from "vitest";
import { createInitialState, reduce, COLS } from "@/game/state";
import { boardWithCell, makeState, seededRng } from "../test-helpers";

const rng = seededRng(42);

describe("state", () => {
  it("start sets initial state", () => {
    const s = createInitialState();
    const after = reduce(s, { type: "start", mode: "multiples", band: "standard" }, rng);
    expect(after.phase).toBe("playing");
    expect(after.mode).toBe("multiples");
    expect(after.band).toBe("standard");
    expect(after.level).toBe(1);
    expect(after.score).toBe(0);
    expect(after.lives).toBe(3);
    expect(after.reserveLives).toBe(0);
    expect(after.streak).toBe(0);
    expect(after.nextLifeThreshold).toBe(1000);
    expect(after.board.length).toBe(30);
    expect(after.playerPos).toEqual({ col: 2, row: 2 });
  });

  it("eating a match scores +10", () => {
    const pos = { col: 2, row: 2 };
    const board = boardWithCell(pos, { kind: "number", value: 6 });
    board[pos.row * COLS + pos.col + 1] = { kind: "number", value: 12 };
    const s = makeState({ board });
    const after = reduce(s, { type: "eat" }, rng);
    expect(after.score).toBe(10);
    expect(after.board[pos.row * COLS + pos.col]).toEqual({ kind: "empty" });
  });

  it("eating a match at streak 3 scores +15", () => {
    const pos = { col: 2, row: 2 };
    const board = boardWithCell(pos, { kind: "number", value: 12 });
    board[pos.row * COLS + pos.col + 1] = { kind: "number", value: 18 };
    const s = makeState({ board, streak: 3 });
    const after = reduce(s, { type: "eat" }, rng);
    expect(after.score).toBe(15);
  });

  it("eating a match increments streak", () => {
    const pos = { col: 2, row: 2 };
    const board = boardWithCell(pos, { kind: "number", value: 6 });
    const s = makeState({ board, streak: 1 });
    const after = reduce(s, { type: "eat" }, rng);
    expect(after.streak).toBe(2);
  });

  it("eating a non-match costs a life", () => {
    const pos = { col: 2, row: 2 };
    const board = boardWithCell(pos, { kind: "number", value: 7 });
    const s = makeState({ board, score: 50, streak: 2 });
    const after = reduce(s, { type: "eat" }, rng);
    expect(after.lives).toBe(2);
    expect(after.streak).toBe(0);
    expect(after.board[pos.row * COLS + pos.col]).toEqual({ kind: "empty" });
    expect(after.score).toBe(50);
  });

  it("eating a non-match at 1 life triggers game over", () => {
    const pos = { col: 2, row: 2 };
    const board = boardWithCell(pos, { kind: "number", value: 7 });
    const s = makeState({ board, lives: 1 });
    const after = reduce(s, { type: "eat" }, rng);
    expect(after.phase).toBe("game-over");
    expect(after.lives).toBe(0);
  });

  it("eating empty does nothing", () => {
    const s = makeState({ score: 20, streak: 1, lives: 3 });
    const after = reduce(s, { type: "eat" }, rng);
    expect(after.score).toBe(20);
    expect(after.lives).toBe(3);
    expect(after.streak).toBe(1);
  });

  it("eating during pause does nothing", () => {
    const pos = { col: 2, row: 2 };
    const board = boardWithCell(pos, { kind: "number", value: 6 });
    const s = makeState({ board, phase: "paused" });
    const after = reduce(s, { type: "eat" }, rng);
    expect(after.phase).toBe("paused");
    expect(after.score).toBe(0);
    expect(after.board[pos.row * COLS + pos.col]).toEqual({ kind: "number", value: 6 });
  });

  it("last match cleared triggers level-clear", () => {
    const pos = { col: 2, row: 2 };
    const board = boardWithCell(pos, { kind: "number", value: 6 });
    const s = makeState({ board, level: 4 });
    const after = reduce(s, { type: "eat" }, rng);
    expect(after.phase).toBe("level-clear");
    expect(after.score).toBe(10 + 25 + 5 * 4);
  });

  it("next-level advances level and generates new board", () => {
    const s = makeState({ phase: "level-clear", level: 3, streak: 5 });
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
    const s = makeState({ board, score: 995 });
    const after = reduce(s, { type: "eat" }, rng);
    expect(after.score).toBe(1005);
    expect(after.reserveLives).toBe(1);
  });

  it("extra life does not exceed reserve cap 2", () => {
    const pos = { col: 2, row: 2 };
    const board = boardWithCell(pos, { kind: "number", value: 6 });
    const s = makeState({ board, score: 995, reserveLives: 2 });
    const after = reduce(s, { type: "eat" }, rng);
    expect(after.reserveLives).toBe(2);
  });

  it("extra life triggers once per threshold", () => {
    const pos = { col: 2, row: 2 };
    const board = boardWithCell(pos, { kind: "number", value: 6 });
    board[pos.row * COLS + pos.col + 1] = { kind: "number", value: 12 };
    const s2 = makeState({ board, score: 985, streak: 50 });
    const after = reduce(s2, { type: "eat" }, rng);
    expect(after.reserveLives).toBe(1);
    expect(after.nextLifeThreshold).toBe(2000);

    const s3 = makeState({ board, score: 1995, reserveLives: 0, nextLifeThreshold: 2000, streak: 50 });
    const after3 = reduce(s3, { type: "eat" }, rng);
    expect(after3.reserveLives).toBe(1);
    expect(after3.nextLifeThreshold).toBe(3000);
  });

  it("pause then resume", () => {
    const s = makeState();
    const paused = reduce(s, { type: "pause" }, rng);
    expect(paused.phase).toBe("paused");
    const resumed = reduce(paused, { type: "resume" }, rng);
    expect(resumed.phase).toBe("playing");
  });

  it("restart resets but keeps mode", () => {
    const s = makeState({ mode: "factors", score: 500, level: 5, lives: 1 });
    const after = reduce(s, { type: "restart" }, rng);
    expect(after.score).toBe(0);
    expect(after.level).toBe(1);
    expect(after.lives).toBe(3);
    expect(after.mode).toBe("factors");
    expect(after.phase).toBe("playing");
  });

  it("title resets to the title screen from game-over", () => {
    const s = makeState({
      phase: "game-over",
      mode: "factors",
      band: "hard",
      level: 7,
      score: 500,
      lives: 0,
      streak: 0,
      reserveLives: 1,
      nextLifeThreshold: 3000,
      refuge: { pos: { col: 4, row: 4 }, expiresAt: 0 },
    });
    const after = reduce(s, { type: "title" }, rng);
    expect(after).toEqual(createInitialState());
  });

  it("tick is a no-op in phase 3", () => {
    const s = makeState({ score: 42, streak: 2, lives: 3 });
    const after = reduce(s, { type: "tick", dt: 16 }, rng);
    expect(after.score).toBe(42);
    expect(after.streak).toBe(2);
    expect(after.lives).toBe(3);
    expect(after.phase).toBe("playing");
  });
});
