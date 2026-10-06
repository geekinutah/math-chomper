import { describe, it, expect } from "vitest";
import { createInitialState, COLS, ROWS, type GameState, type PlayerPos } from "@/game/state";
import {
  enemyCap,
  enemyStepDelay,
  spawnEnemy,
  spawnRefuge,
  refugeDuration,
  refugeSpawnChance,
  edgeCells,
  type EnemyKind,
  type SpawnState,
} from "@/game/spawn";

function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function isEdge(pos: PlayerPos): boolean {
  return pos.col === 0 || pos.col === COLS - 1 || pos.row === 0 || pos.row === ROWS - 1;
}

function makeState(overrides: Partial<GameState> = {}, extra: Partial<SpawnState> = {}): SpawnState {
  const base = createInitialState();
  const partial = { ...base, ...overrides };
  const s = {
    ...partial,
    enemies: extra.enemies ?? [],
    refuge: extra.refuge ?? null,
    blockedCells: extra.blockedCells ?? [],
  };
  return s as SpawnState;
}

function isSame(a: PlayerPos, b: PlayerPos): boolean {
  return a.col === b.col && a.row === b.row;
}

describe("enemyCap", () => {
  it("level 1-3 -> 1", () => {
    expect(enemyCap(1)).toBe(1);
    expect(enemyCap(2)).toBe(1);
    expect(enemyCap(3)).toBe(1);
  });

  it("level 4-7 -> 2", () => {
    expect(enemyCap(4)).toBe(2);
    expect(enemyCap(5)).toBe(2);
    expect(enemyCap(6)).toBe(2);
    expect(enemyCap(7)).toBe(2);
  });

  it("level 8+ -> 3", () => {
    expect(enemyCap(8)).toBe(3);
    expect(enemyCap(9)).toBe(3);
    expect(enemyCap(20)).toBe(3);
  });
});

describe("enemyStepDelay", () => {
  it("levels 1-17 -> 420", () => {
    for (let level = 1; level <= 17; level++) {
      expect(enemyStepDelay(level)).toBe(420);
    }
  });

  it("level 18 -> 357", () => {
    expect(enemyStepDelay(18)).toBe(357);
  });

  it("19 -> 303, 20 -> 258, 21 -> 219, 22 -> 186", () => {
    expect(enemyStepDelay(19)).toBe(303);
    expect(enemyStepDelay(20)).toBe(258);
    expect(enemyStepDelay(21)).toBe(219);
    expect(enemyStepDelay(22)).toBe(186);
  });

  it("level 23+ -> 180", () => {
    expect(enemyStepDelay(23)).toBe(180);
    expect(enemyStepDelay(30)).toBe(180);
    expect(enemyStepDelay(100)).toBe(180);
  });
});

describe("refugeSpawnChance", () => {
  it("17 -> 0.003, 18 -> 0.0015", () => {
    expect(refugeSpawnChance(17)).toBe(0.003);
    expect(refugeSpawnChance(18)).toBe(0.0015);
  });
});

describe("edgeCells", () => {
  it("returns 18 perimeter cells (6×5 grid)", () => {
    const cells = edgeCells();
    expect(cells).toHaveLength(18);
  });

  it("includes all four sides", () => {
    const cells = edgeCells();
    const hasTop = cells.some((c) => c.row === 0 && c.col === 3);
    const hasBottom = cells.some((c) => c.row === ROWS - 1 && c.col === 3);
    const hasLeft = cells.some((c) => c.col === 0 && c.row === 2);
    const hasRight = cells.some((c) => c.col === COLS - 1 && c.row === 2);
    expect(hasTop).toBe(true);
    expect(hasBottom).toBe(true);
    expect(hasLeft).toBe(true);
    expect(hasRight).toBe(true);
  });

  it("all returned cells are on the perimeter", () => {
    const cells = edgeCells();
    for (const c of cells) {
      expect(isEdge(c)).toBe(true);
    }
  });

  it("no duplicates", () => {
    const cells = edgeCells();
    const keys = new Set(cells.map((c) => `${c.col},${c.row}`));
    expect(keys.size).toBe(18);
  });
});

describe("spawnEnemy", () => {
  it("returns edge cell", () => {
    const state = makeState();
    const enemy = spawnEnemy("straight", state, seededRng(42));
    expect(enemy).not.toBeNull();
    if (enemy) {
      expect(isEdge(enemy.pos)).toBe(true);
    }
  });

  it("not on player cell", () => {
    const playerPos: PlayerPos = { col: 0, row: 0 };
    const state = makeState({ playerPos });
    const enemy = spawnEnemy("straight", state, seededRng(7));
    expect(enemy).not.toBeNull();
    if (enemy) {
      expect(isSame(enemy.pos, playerPos)).toBe(false);
    }
  });

  it("not on refuge", () => {
    const refugePos: PlayerPos = { col: 0, row: 0 };
    const state = makeState(
      { playerPos: { col: 2, row: 2 } },
      { refuge: { pos: refugePos, expiresAt: 5000 } },
    );
    const enemy = spawnEnemy("straight", state, seededRng(3));
    expect(enemy).not.toBeNull();
    if (enemy) {
      expect(isSame(enemy.pos, refugePos)).toBe(false);
    }
  });

  it("null when no valid edge (player + blocked cells cover all edges)", () => {
    const allEdges = edgeCells();
    const playerPos = allEdges[0];
    const blockedCells = allEdges.slice(1).map((p) => p);
    const state = makeState({ playerPos }, { blockedCells });
    const enemy = spawnEnemy("straight", state, seededRng(99));
    expect(enemy).toBeNull();
  });

  it("has correct kind", () => {
    const state = makeState();
    const kind: EnemyKind = "chaser";
    const enemy = spawnEnemy(kind, state, seededRng(11));
    expect(enemy).not.toBeNull();
    if (enemy) {
      expect(enemy.kind).toBe(kind);
    }
  });

  it("stepTimer is 420", () => {
    const state = makeState();
    const enemy = spawnEnemy("shy", state, seededRng(22));
    expect(enemy).not.toBeNull();
    if (enemy) {
      expect(enemy.stepTimer).toBe(420);
    }
  });

  it("stepTimer is 258 at level 20", () => {
    const state = makeState({ level: 20 });
    const enemy = spawnEnemy("shy", state, seededRng(22));
    expect(enemy).not.toBeNull();
    if (enemy) {
      expect(enemy.stepTimer).toBe(258);
    }
  });
});

describe("refugeDuration", () => {
  it("level < 12 -> 5000", () => {
    expect(refugeDuration(1)).toBe(5000);
    expect(refugeDuration(11)).toBe(5000);
  });

  it("level >= 12 -> 2500", () => {
    expect(refugeDuration(12)).toBe(2500);
    expect(refugeDuration(20)).toBe(2500);
  });
});

describe("spawnRefuge", () => {
  it("not on player cell", () => {
    const state = makeState({ playerPos: { col: 2, row: 2 } });
    const refuge = spawnRefuge(state, 0, seededRng(55));
    expect(refuge).not.toBeNull();
    if (refuge) {
      expect(isSame(refuge.pos, { col: 2, row: 2 })).toBe(false);
    }
  });

  it("expiresAt = simTime + duration (level < 12)", () => {
    const state = makeState({ level: 1, playerPos: { col: 2, row: 2 } });
    const refuge = spawnRefuge(state, 1000, seededRng(66));
    expect(refuge).not.toBeNull();
    if (refuge) {
      expect(refuge.expiresAt).toBe(1000 + 5000);
    }
  });

  it("expiresAt = simTime + duration (level >= 12)", () => {
    const state = makeState({ level: 12, playerPos: { col: 2, row: 2 } });
    const refuge = spawnRefuge(state, 2000, seededRng(66));
    expect(refuge).not.toBeNull();
    if (refuge) {
      expect(refuge.expiresAt).toBe(2000 + 2500);
    }
  });
});
