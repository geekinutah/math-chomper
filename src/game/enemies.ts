import type { Dir, PlayerPos, GameState } from "./state";

export type EnemyKind = "straight" | "shy" | "eater" | "rewriter" | "chaser";

export type Enemy = {
  id: number;
  kind: EnemyKind;
  pos: PlayerPos;
  dir: Dir;
  stepTimer: number;
};

export type Refuge = {
  pos: PlayerPos;
  expiresAt: number;
};

export const COLS = 6;
export const ROWS = 5;

const DIR_DELTAS: Record<Dir, { dc: number; dr: number }> = {
  up: { dc: 0, dr: -1 },
  down: { dc: 0, dr: 1 },
  left: { dc: -1, dr: 0 },
  right: { dc: 1, dr: 0 },
};

const OPPOSITE: Record<Dir, Dir> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

const ALL_DIRS: readonly Dir[] = ["up", "down", "left", "right"];

export function sameCell(a: PlayerPos, b: PlayerPos): boolean {
  return a.col === b.col && a.row === b.row;
}

export function chebyshev(a: PlayerPos, b: PlayerPos): number {
  return Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row));
}

function inBounds(p: PlayerPos): boolean {
  return p.col >= 0 && p.col < COLS && p.row >= 0 && p.row < ROWS;
}

function isRefuge(p: PlayerPos, state: GameState): boolean {
  return state.refuge !== null && sameCell(p, state.refuge.pos);
}

export function legalMoves(pos: PlayerPos, state: GameState): PlayerPos[] {
  const result: PlayerPos[] = [];
  for (const dir of ALL_DIRS) {
    const { dc, dr } = DIR_DELTAS[dir];
    const next = { col: pos.col + dc, row: pos.row + dr };
    if (inBounds(next) && !isRefuge(next, state)) {
      result.push(next);
    }
  }
  return result;
}

function pick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function stepStraight(enemy: Enemy, state: GameState, rng: () => number): PlayerPos {
  const { dc, dr } = DIR_DELTAS[enemy.dir];
  const fwd = { col: enemy.pos.col + dc, row: enemy.pos.row + dr };
  if (inBounds(fwd) && !isRefuge(fwd, state)) return fwd;

  const turns = ALL_DIRS.filter((d) => d !== enemy.dir && d !== OPPOSITE[enemy.dir]);
  const candidates = turns.length > 0 ? turns : [OPPOSITE[enemy.dir]];
  enemy.dir = pick(candidates, rng);

  const { dc: dc2, dr: dr2 } = DIR_DELTAS[enemy.dir];
  const turned = { col: enemy.pos.col + dc2, row: enemy.pos.row + dr2 };
  if (inBounds(turned) && !isRefuge(turned, state)) return turned;

  return enemy.pos;
}

function stepShy(enemy: Enemy, state: GameState, rng: () => number): PlayerPos {
  const moves = legalMoves(enemy.pos, state);
  if (moves.length === 0) return enemy.pos;

  if (chebyshev(enemy.pos, state.playerPos) <= 2) {
    let best = moves[0];
    let bestD = chebyshev(best, state.playerPos);
    for (let i = 1; i < moves.length; i++) {
      const d = chebyshev(moves[i], state.playerPos);
      if (d > bestD) {
        best = moves[i];
        bestD = d;
      }
    }
    return best;
  }
  return pick(moves, rng);
}

function randomStep(enemy: Enemy, state: GameState, rng: () => number): PlayerPos {
  const moves = legalMoves(enemy.pos, state);
  if (moves.length === 0) return enemy.pos;
  return pick(moves, rng);
}

function stepChaser(enemy: Enemy, state: GameState, rng: () => number): PlayerPos {
  const moves = legalMoves(enemy.pos, state);
  if (moves.length === 0) return enemy.pos;

  let bestD = Infinity;
  let best: PlayerPos[] = [];
  for (const m of moves) {
    const d = chebyshev(m, state.playerPos);
    if (d < bestD) {
      bestD = d;
      best = [m];
    } else if (d === bestD) {
      best.push(m);
    }
  }
  return pick(best, rng);
}

export function stepEnemy(enemy: Enemy, state: GameState, rng: () => number): PlayerPos {
  switch (enemy.kind) {
    case "straight":
      return stepStraight(enemy, state, rng);
    case "shy":
      return stepShy(enemy, state, rng);
    case "eater":
      return randomStep(enemy, state, rng);
    case "rewriter":
      return randomStep(enemy, state, rng);
    case "chaser":
      return stepChaser(enemy, state, rng);
  }
}
