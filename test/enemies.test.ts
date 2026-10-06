import { describe, it, expect } from "vitest";
import type { Dir, PlayerPos, GameState } from "@/game/state";
import type { Cell } from "@/rules/types";
import {
  stepEnemy,
  legalMoves,
  chebyshev,
  sameCell,
  type Enemy,
  type EnemyKind,
  type Refuge,
} from "@/game/enemies";

function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function emptyBoard(): Cell[] {
  return Array.from({ length: 30 }, () => ({ kind: "empty" as const }));
}

type TestState = GameState & { refuge?: Refuge };

function makeState(overrides: Partial<GameState> = {}): TestState {
  return {
    phase: "playing",
    mode: "multiples",
    level: 1,
    score: 0,
    lives: 3,
    reserveLives: 0,
    streak: 0,
    nextLifeThreshold: 1000,
    rule: { mode: "multiples", k: 3 },
    board: emptyBoard(),
    playerPos: { col: 2, row: 2 },
    ...overrides,
  };
}

function makeEnemy(
  kind: EnemyKind,
  pos: PlayerPos,
  dir: Dir = "right",
): Enemy {
  return { id: 1, kind, pos, dir, stepTimer: 0 };
}

describe("sameCell", () => {
  it("sameCell true/false", () => {
    expect(sameCell({ col: 2, row: 3 }, { col: 2, row: 3 })).toBe(true);
    expect(sameCell({ col: 2, row: 3 }, { col: 2, row: 4 })).toBe(false);
    expect(sameCell({ col: 1, row: 1 }, { col: 5, row: 5 })).toBe(false);
  });
});

describe("chebyshev", () => {
  it("chebyshev distance correct", () => {
    expect(chebyshev({ col: 0, row: 0 }, { col: 3, row: 4 })).toBe(4);
    expect(chebyshev({ col: 0, row: 0 }, { col: 0, row: 0 })).toBe(0);
    expect(chebyshev({ col: 0, row: 0 }, { col: 5, row: 4 })).toBe(5);
    expect(chebyshev({ col: 1, row: 1 }, { col: 4, row: 2 })).toBe(3);
  });
});

describe("legalMoves", () => {
  it("legalMoves excludes out-of-bounds", () => {
    const state = makeState();
    const corner = legalMoves({ col: 0, row: 0 }, state);
    expect(corner).toHaveLength(2);
    const center = legalMoves({ col: 2, row: 2 }, state);
    expect(center).toHaveLength(4);
    const edgeMid = legalMoves({ col: 0, row: 2 }, state);
    expect(edgeMid).toHaveLength(3);
  });

  it("legalMoves excludes refuge", () => {
    const state = makeState() as TestState;
    state.refuge = { pos: { col: 3, row: 2 }, expiresAt: 100 };
    const moves = legalMoves({ col: 2, row: 2 }, state);
    expect(moves).toHaveLength(3);
    expect(moves.some((m) => sameCell(m, { col: 3, row: 2 }))).toBe(false);
  });
});

describe("straight", () => {
  it("straight moves in its direction", () => {
    const state = makeState();
    const enemy = makeEnemy("straight", { col: 2, row: 2 }, "right");
    const next = stepEnemy(enemy, state, seededRng(1));
    expect(next).toEqual({ col: 3, row: 2 });
  });

  it("straight turns at wall", () => {
    const state = makeState();
    const enemy = makeEnemy("straight", { col: 5, row: 2 }, "right");
    const next = stepEnemy(enemy, state, seededRng(1));
    expect(next.col).toBe(5);
    expect(next.row).not.toBe(2);
    expect(enemy.dir).not.toBe("right");
  });

  it("straight prefers turn over reverse", () => {
    const state = makeState();
    const enemy = makeEnemy("straight", { col: 5, row: 2 }, "right");
    stepEnemy(enemy, state, seededRng(1));
    expect(enemy.dir).not.toBe("left");
  });
});

describe("shy", () => {
  it("shy flees when player within 2", () => {
    const state = makeState({ playerPos: { col: 3, row: 2 } });
    const enemy = makeEnemy("shy", { col: 1, row: 2 }, "right");
    const next = stepEnemy(enemy, state, seededRng(1));
    expect(chebyshev(next, state.playerPos)).toBeGreaterThan(
      chebyshev(enemy.pos, state.playerPos),
    );
    expect(next).toEqual({ col: 0, row: 2 });
  });

  it("shy wanders when player far", () => {
    const state = makeState({ playerPos: { col: 0, row: 0 } });
    const enemy = makeEnemy("shy", { col: 5, row: 4 }, "right");
    const next = stepEnemy(enemy, state, seededRng(42));
    const moves = legalMoves(enemy.pos, state);
    expect(moves.some((m) => sameCell(m, next))).toBe(true);
  });
});

describe("chaser", () => {
  it("chaser moves toward player", () => {
    const state = makeState({ playerPos: { col: 5, row: 2 } });
    const enemy = makeEnemy("chaser", { col: 0, row: 0 }, "right");
    const before = chebyshev(enemy.pos, state.playerPos);
    const next = stepEnemy(enemy, state, seededRng(1));
    const after = chebyshev(next, state.playerPos);
    expect(after).toBeLessThan(before);
  });

  it("chaser never increases distance when closer exists", () => {
    const positions: PlayerPos[] = [
      { col: 0, row: 0 },
      { col: 0, row: 4 },
      { col: 5, row: 0 },
      { col: 5, row: 4 },
      { col: 2, row: 0 },
      { col: 3, row: 4 },
    ];
    const playerPos: PlayerPos = { col: 2, row: 2 };
    for (const pos of positions) {
      const state = makeState({ playerPos });
      const enemy = makeEnemy("chaser", pos, "right");
      const before = chebyshev(pos, playerPos);
      const next = stepEnemy(enemy, state, seededRng(7));
      const after = chebyshev(next, playerPos);
      expect(after).toBeLessThanOrEqual(before);
    }
  });

  it("chaser does not enter refuge", () => {
    const state = makeState({ playerPos: { col: 2, row: 3 } }) as TestState;
    state.refuge = { pos: { col: 1, row: 1 }, expiresAt: 100 };
    const enemy = makeEnemy("chaser", { col: 0, row: 0 }, "right");
    const next = stepEnemy(enemy, state, seededRng(1));
    expect(sameCell(next, state.refuge!.pos)).toBe(false);
  });
});

describe("refuge blocking", () => {
  it("no enemy steps onto refuge", () => {
    const kinds: EnemyKind[] = ["straight", "shy", "eater", "rewriter", "chaser"];
    for (const kind of kinds) {
      const state = makeState({ playerPos: { col: 0, row: 0 } }) as TestState;
      state.refuge = { pos: { col: 3, row: 2 }, expiresAt: 100 };
      const enemy = makeEnemy(kind, { col: 2, row: 2 }, "right");
      const next = stepEnemy(enemy, state, seededRng(99));
      expect(sameCell(next, { col: 3, row: 2 }), `${kind} should not enter refuge`).toBe(false);
    }
  });
});

describe("eater and rewriter", () => {
  it("eater returns a legal position", () => {
    const state = makeState() as TestState;
    state.refuge = { pos: { col: 3, row: 2 }, expiresAt: 100 };
    const enemy = makeEnemy("eater", { col: 2, row: 2 }, "right");
    const next = stepEnemy(enemy, state, seededRng(5));
    expect(next.col).toBeGreaterThanOrEqual(0);
    expect(next.col).toBeLessThan(6);
    expect(next.row).toBeGreaterThanOrEqual(0);
    expect(next.row).toBeLessThan(5);
    expect(sameCell(next, { col: 3, row: 2 })).toBe(false);
  });

  it("rewriter returns a legal position", () => {
    const state = makeState() as TestState;
    state.refuge = { pos: { col: 3, row: 2 }, expiresAt: 100 };
    const enemy = makeEnemy("rewriter", { col: 2, row: 2 }, "up");
    const next = stepEnemy(enemy, state, seededRng(5));
    expect(next.col).toBeGreaterThanOrEqual(0);
    expect(next.col).toBeLessThan(6);
    expect(next.row).toBeGreaterThanOrEqual(0);
    expect(next.row).toBeLessThan(5);
    expect(sameCell(next, { col: 3, row: 2 })).toBe(false);
  });
});
