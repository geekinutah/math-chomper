import type { GameState, PlayerPos } from "@/game/state";
import { COLS, ROWS } from "@/game/state";
import type { Enemy, EnemyKind, Refuge } from "./enemies";

export type { Enemy, EnemyKind, Refuge };

export type SpawnState = {
  phase: GameState["phase"];
  mode: GameState["mode"];
  level: number;
  score: number;
  lives: number;
  reserveLives: number;
  streak: number;
  nextLifeThreshold: number;
  rule: GameState["rule"];
  board: GameState["board"];
  playerPos: PlayerPos;
  enemies?: Enemy[];
  refuge?: Refuge | null;
  blockedCells?: PlayerPos[];
};

const ENEMY_STEP_MS = 420;

export function enemyCap(level: number): number {
  if (level >= 8) return 3;
  if (level >= 4) return 2;
  return 1;
}

export function refugeDuration(level: number): number {
  return level >= 12 ? 2500 : 5000;
}

export function edgeCells(): PlayerPos[] {
  const cells: PlayerPos[] = [];
  for (let c = 0; c < COLS; c++) {
    cells.push({ col: c, row: 0 });
    cells.push({ col: c, row: ROWS - 1 });
  }
  for (let r = 1; r < ROWS - 1; r++) {
    cells.push({ col: 0, row: r });
    cells.push({ col: COLS - 1, row: r });
  }
  return cells;
}

function samePos(a: PlayerPos, b: PlayerPos): boolean {
  return a.col === b.col && a.row === b.row;
}

function allCells(): PlayerPos[] {
  const cells: PlayerPos[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      cells.push({ col: c, row: r });
    }
  }
  return cells;
}

function pickRandom<T>(items: T[], rng: () => number): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(rng() * items.length)];
}

export function spawnEnemy(kind: EnemyKind, state: SpawnState, rng: () => number): Enemy | null {
  const blocked = new Set<string>();
  const key = (p: PlayerPos) => `${p.col},${p.row}`;

  blocked.add(key(state.playerPos));
  if (state.refuge) blocked.add(key(state.refuge.pos));
  if (state.blockedCells) for (const p of state.blockedCells) blocked.add(key(p));

  const edges = edgeCells().filter((p) => !blocked.has(key(p)));
  const pos = pickRandom(edges, rng);
  if (!pos) return null;

  return { id: 0, kind, pos, dir: "down", stepTimer: ENEMY_STEP_MS };
}

export function spawnRefuge(state: SpawnState, simTime: number, rng: () => number): Refuge | null {
  const cells = allCells().filter((p) => !samePos(p, state.playerPos));
  const pos = pickRandom(cells, rng);
  if (!pos) return null;

  return { pos, expiresAt: simTime + refugeDuration(state.level) };
}
