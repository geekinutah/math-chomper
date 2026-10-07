import { describe, it, expect } from "vitest";
import type { Cell, Rule } from "@/rules/types";
import { BOARD_SIZE, COLS, ROWS, type GameState } from "@/game/state";
import type { Enemy } from "@/game/enemies";
import { renderBoard } from "@/render/canvas";

type Call = { method: string; args: unknown[] };

class FakeCtx {
  calls: Call[] = [];
  fillStyle = "";
  strokeStyle = "";
  lineWidth = 1;
  font = "";
  textAlign = "";
  textBaseline = "";

  record(method: string, ...args: unknown[]): void {
    this.calls.push({ method, args });
  }

  fillRect(...args: unknown[]): void {
    this.record("fillRect", ...args);
  }

  beginPath(): void {
    this.record("beginPath");
  }

  moveTo(...args: unknown[]): void {
    this.record("moveTo", ...args);
  }

  lineTo(...args: unknown[]): void {
    this.record("lineTo", ...args);
  }

  stroke(): void {
    this.record("stroke");
  }

  arc(...args: unknown[]): void {
    this.record("arc", ...args);
  }

  fill(): void {
    this.record("fill");
  }

  // Used by the chaser branch in sprites.ts.
  closePath(): void {
    this.record("closePath");
  }

  fillText(...args: unknown[]): void {
    this.record("fillText", ...args);
  }

  strokeRect(...args: unknown[]): void {
    this.record("strokeRect", ...args);
  }
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
    playerPos: { col: 3, row: 0 },
    enemies: [],
    refuge: null,
    simTime: 0,
    freezeTimer: 0,
    stepTimer: 0,
    pendingDir: null,
    queuedDir: null,
    ...overrides,
  };
}

function setCell(board: Cell[], col: number, row: number, cell: Cell): Cell[] {
  const b = [...board];
  b[row * COLS + col] = cell;
  return b;
}

describe("render", () => {
  it("renderBoard never calls strokeRect", () => {
    let board = emptyBoard();
    board = setCell(board, 0, 0, { kind: "number", value: 12 });
    board = setCell(board, 1, 0, { kind: "number", value: 7 });
    board = setCell(board, 2, 0, { kind: "expr", text: "3×2", value: 6 });
    const enemy: Enemy = {
      id: 1,
      kind: "straight",
      pos: { col: 4, row: 0 },
      dir: "right",
      stepTimer: 0,
    };
    const state = makeState({
      board,
      enemies: [enemy],
      refuge: { pos: { col: 5, row: 0 }, expiresAt: 5000 },
    });
    const fake = new FakeCtx();
    renderBoard(fake as unknown as CanvasRenderingContext2D, state);
    expect(fake.calls.filter((c) => c.method === "strokeRect")).toHaveLength(0);
  });

  it("cell rendering is independent of the rule", () => {
    let board = emptyBoard();
    board = setCell(board, 0, 0, { kind: "number", value: 12 });
    board = setCell(board, 1, 0, { kind: "number", value: 7 });
    board = setCell(board, 2, 0, { kind: "expr", text: "3×2", value: 6 });

    const render = (rule: Rule): Call[] => {
      const state = makeState({ board: [...board], rule });
      const fake = new FakeCtx();
      renderBoard(fake as unknown as CanvasRenderingContext2D, state);
      return fake.calls;
    };

    expect(render({ mode: "multiples", k: 6 })).toEqual(render({ mode: "multiples", k: 7 }));
  });

  it("occupied cells still draw their content", () => {
    let board = emptyBoard();
    board = setCell(board, 0, 0, { kind: "number", value: 12 });
    board = setCell(board, 1, 0, { kind: "expr", text: "3×2", value: 6 });
    const state = makeState({ board, playerPos: { col: 5, row: 4 } });
    const fake = new FakeCtx();
    renderBoard(fake as unknown as CanvasRenderingContext2D, state);

    const texts = fake.calls.filter((c) => c.method === "fillText").map((c) => c.args[0]);
    expect(texts).toContain("12");
    expect(texts).toContain("3×2");

    // Cell (col 2, row 0) is empty; its center is (430, 100).
    const emptyCellText = fake.calls.filter(
      (c) => c.method === "fillText" && c.args[1] === 430 && c.args[2] === 100,
    );
    expect(emptyCellText).toHaveLength(0);
  });

  it("all-empty board still draws grid and actors", () => {
    const enemy: Enemy = {
      id: 1,
      kind: "straight",
      pos: { col: 1, row: 1 },
      dir: "right",
      stepTimer: 0,
    };
    const state = makeState({
      board: emptyBoard(),
      playerPos: { col: 2, row: 2 },
      enemies: [enemy],
      refuge: { pos: { col: 4, row: 3 }, expiresAt: 5000 },
    });
    const fake = new FakeCtx();
    renderBoard(fake as unknown as CanvasRenderingContext2D, state);

    // Grid alone contributes (COLS + 1) vertical + (ROWS + 1) horizontal strokes.
    expect(fake.calls.filter((c) => c.method === "stroke").length).toBeGreaterThanOrEqual(
      COLS + 1 + ROWS + 1,
    );
    expect(fake.calls.filter((c) => c.method === "fill").length).toBeGreaterThanOrEqual(3);
    expect(fake.calls.filter((c) => c.method === "fillText")).toHaveLength(0);
  });
});
