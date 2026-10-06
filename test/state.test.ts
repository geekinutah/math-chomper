import { describe, it, expect } from "vitest";
import type { Cell, Mode } from "@/rules/types";
import type { Enemy } from "@/game/enemies";
import type { BandName } from "@/content/bands";
import {
  createInitialState,
  reduce,
  COLS,
  BOARD_SIZE,
  type GameState,
  type GameMode,
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

  it("enemy-hit reduces lives", () => {
    const enemy: Enemy = { id: 1, kind: "straight", pos: { col: 3, row: 2 }, dir: "right", stepTimer: 420 };
    const s = makePlayingState({ lives: 3, enemies: [enemy] });
    const after = reduce(s, { type: "enemy-hit" }, rng);
    expect(after.lives).toBe(2);
  });

  it("enemy-hit resets streak", () => {
    const enemy: Enemy = { id: 1, kind: "straight", pos: { col: 3, row: 2 }, dir: "right", stepTimer: 420 };
    const s = makePlayingState({ streak: 5, enemies: [enemy] });
    const after = reduce(s, { type: "enemy-hit" }, rng);
    expect(after.streak).toBe(0);
  });

  it("enemy-hit at 0 lives triggers game-over", () => {
    const enemy: Enemy = { id: 1, kind: "straight", pos: { col: 3, row: 2 }, dir: "right", stepTimer: 420 };
    const s = makePlayingState({ lives: 1, enemies: [enemy] });
    const after = reduce(s, { type: "enemy-hit" }, rng);
    expect(after.phase).toBe("game-over");
    expect(after.lives).toBe(0);
  });

  it("enemy-hit sets freezeTimer to 700", () => {
    const enemy: Enemy = { id: 1, kind: "straight", pos: { col: 3, row: 2 }, dir: "right", stepTimer: 420 };
    const s = makePlayingState({ enemies: [enemy] });
    const after = reduce(s, { type: "enemy-hit" }, rng);
    expect(after.freezeTimer).toBe(700);
  });

  it("enemy-hit respawns player to non-enemy cell", () => {
    const enemy: Enemy = { id: 1, kind: "straight", pos: { col: 3, row: 2 }, dir: "right", stepTimer: 420 };
    const s = makePlayingState({ playerPos: { col: 3, row: 2 }, enemies: [enemy] });
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
});

describe("modes and bands", () => {
  function start(mode: GameMode, band: BandName, seed = 42): GameState {
    return reduce(createInitialState(), { type: "start", mode, band }, seededRng(seed));
  }

  it("start with factors mode", () => {
    const after = start("factors", "standard");
    expect(after.mode).toBe("factors");
    expect(after.rule.mode).toBe("factors");
    for (const cell of after.board) expect(cell.kind).toBe("number");
  });

  it("start with primes mode", () => {
    const after = start("primes", "standard");
    expect(after.mode).toBe("primes");
    expect(after.rule).toEqual({ mode: "primes" });
  });

  it("start with equality mode", () => {
    const after = start("equality", "standard");
    expect(after.mode).toBe("equality");
    expect(after.rule.mode).toBe("equality");
    for (const cell of after.board) expect(cell.kind).toBe("expr");
  });

  it("start with inequality mode", () => {
    const after = start("inequality", "standard");
    expect(after.mode).toBe("inequality");
    expect(after.rule.mode).toBe("inequality");
    for (const cell of after.board) expect(cell.kind).toBe("expr");
  });

  it("start with easy band", () => {
    expect(start("multiples", "easy").band).toBe("easy");
  });

  it("start with hard band", () => {
    expect(start("multiples", "hard").band).toBe("hard");
  });

  it("challenge: level 1 is first mode", () => {
    const after = start("challenge", "standard");
    expect(after.mode).toBe("challenge");
    expect(after.level).toBe(1);
    expect(after.rule.mode).toBe("multiples");
  });

  it("challenge: next-level rotates mode", () => {
    const s: GameState = { ...start("challenge", "standard"), phase: "level-clear" };
    const after = reduce(s, { type: "next-level" }, seededRng(7));
    expect(after.mode).toBe("challenge");
    expect(after.rule.mode).toBe("factors");
  });

  it("challenge: rotates through all 5", () => {
    let s: GameState = { ...start("challenge", "standard"), phase: "level-clear" };
    const modes: Mode[] = [];
    for (let i = 0; i < 5; i += 1) {
      s = reduce(s, { type: "next-level" }, seededRng(7 + i));
      modes.push(s.rule.mode);
      s = { ...s, phase: "level-clear" };
    }
    expect(modes).toEqual(["factors", "primes", "equality", "inequality", "multiples"]);
  });

  it("band affects board: easy has smaller numbers", () => {
    const after = start("factors", "easy");
    for (const cell of after.board) {
      expect(cell.kind).toBe("number");
      if (cell.kind === "number") expect(cell.value).toBeLessThanOrEqual(30);
    }
  });

  it("band affects board: hard has larger numbers", () => {
    const after = start("multiples", "hard", 913);
    const values = after.board.flatMap((c) => (c.kind === "number" ? [c.value] : []));
    expect(values.length).toBeGreaterThan(0);
    expect(Math.max(...values)).toBeGreaterThan(30);
  });

  it("band affects k: easy k ≤ 9", () => {
    const after = start("factors", "easy", 93001);
    if (after.rule.mode === "factors") {
      expect(after.rule.k).toBeGreaterThanOrEqual(2);
      expect(after.rule.k).toBeLessThanOrEqual(9);
    }
  });

  it("band affects k: hard k can be 20", () => {
    let saw20 = false;
    for (let i = 0; i < 100; i += 1) {
      const after = start("factors", "hard", 121000 + i);
      if (after.rule.mode === "factors") {
        expect(after.rule.k).toBeGreaterThanOrEqual(2);
        expect(after.rule.k).toBeLessThanOrEqual(20);
        saw20 = saw20 || after.rule.k === 20;
      }
    }
    expect(saw20).toBe(true);
  });

  it("state: start hard equality keeps k in 13–20 through next-level", () => {
    let s = start("equality", "hard", 31337);
    if (s.rule.mode === "equality") {
      expect(s.rule.k).toBeGreaterThanOrEqual(13);
      expect(s.rule.k).toBeLessThanOrEqual(20);
    }
    for (let i = 0; i < 10; i += 1) {
      s = reduce({ ...s, phase: "level-clear" }, { type: "next-level" }, seededRng(40000 + i));
      if (s.rule.mode === "equality") {
        expect(s.rule.k).toBeGreaterThanOrEqual(13);
        expect(s.rule.k).toBeLessThanOrEqual(20);
      }
    }
  });

  it("level-scaled k: level 1 has smaller range", () => {
    const kAtLevel = (level: number, seed: number): number => {
      let s = start("multiples", "standard", seed);
      while (s.level < level) {
        s = reduce({ ...s, phase: "level-clear" }, { type: "next-level" }, seededRng(seed + 1000));
      }
      return s.rule.mode === "multiples" ? s.rule.k : -1;
    };
    let maxLevel1 = 0;
    let maxLevel10 = 0;
    for (let i = 0; i < 40; i += 1) {
      const seed = 100000 + i * 137;
      maxLevel1 = Math.max(maxLevel1, kAtLevel(1, seed));
      maxLevel10 = Math.max(maxLevel10, kAtLevel(10, seed));
    }
    expect(maxLevel1).toBeLessThanOrEqual(4);
    expect(maxLevel10).toBeGreaterThan(maxLevel1);
  });
});
