import type { GameState, Phase } from "./state";
import { COLS, handleEnemyHit } from "./state";
import type { Enemy, EnemyKind } from "./enemies";
import { stepEnemy, sameCell } from "./enemies";
import { spawnEnemy, spawnRefuge, enemyCap } from "./spawn";
import { allMatchesCleared } from "./board";
import { matches } from "@/rules/match";
import type { Cell, Rule } from "@/rules/types";

const STEP_MS = 420;

function cellIdx(pos: { col: number; row: number }): number {
  return pos.row * COLS + pos.col;
}

function genRewriteCell(rule: Rule, rng: () => number): Cell {
  const wantMatch = rng() < 0.3;
  for (let i = 0; i < 20; i++) {
    const value = 1 + Math.floor(rng() * 60);
    const cell: Cell = { kind: "number", value };
    if (matches(rule, cell) === wantMatch) return cell;
  }
  return { kind: "number", value: 1 + Math.floor(rng() * 60) };
}

function pickEnemyKind(level: number, rng: () => number): EnemyKind {
  if (level < 4) return "straight";
  if (level < 8) return rng() < 0.5 ? "straight" : "shy";
  const kinds: EnemyKind[] = ["straight", "shy", "eater", "rewriter", "chaser"];
  return kinds[Math.floor(rng() * kinds.length)];
}

function nextId(enemies: Enemy[]): number {
  let max = 0;
  for (const e of enemies) if (e.id > max) max = e.id;
  return max + 1;
}

type StepCtx = Parameters<typeof stepEnemy>[1];

function toStepCtx(s: GameState): StepCtx {
  return { ...s, refuge: s.refuge ?? undefined } as StepCtx;
}

export function handleTick(
  state: GameState,
  action: { type: "tick"; dt: number },
  rng: () => number
): GameState {
  if (state.phase !== "playing") return state;

  const dtMs = action.dt * 1000;
  let simTime = state.simTime + dtMs;
  let freezeTimer = state.freezeTimer;
  let phase: Phase = state.phase;
  let newBoard = state.board;
  let refuge = state.refuge;

  if (freezeTimer > 0) {
    freezeTimer = Math.max(0, freezeTimer - dtMs);
    if (freezeTimer > 0) {
      return { ...state, simTime, freezeTimer };
    }
  }

  const ctx = toStepCtx(state);
  const newEnemies: Enemy[] = [];

  for (const enemy of state.enemies) {
    const e: Enemy = { ...enemy, stepTimer: enemy.stepTimer - dtMs };
    if (e.stepTimer > 0) {
      newEnemies.push(e);
      continue;
    }

    const oldPos = e.pos;
    const newPos = stepEnemy(e, ctx, rng);

    if (e.kind === "eater" && !sameCell(oldPos, newPos)) {
      const idx = cellIdx(oldPos);
      if (newBoard[idx].kind !== "empty") {
        newBoard = [...newBoard];
        newBoard[idx] = { kind: "empty" };
        if (allMatchesCleared(newBoard, state.rule)) {
          phase = "level-clear";
        }
      }
    }

    if (e.kind === "rewriter" && !sameCell(oldPos, newPos)) {
      const idx = cellIdx(oldPos);
      newBoard = [...newBoard];
      newBoard[idx] = genRewriteCell(state.rule, rng);
    }

    if (refuge && sameCell(newPos, refuge.pos)) {
      e.pos = oldPos;
    } else {
      e.pos = newPos;
    }
    e.stepTimer = STEP_MS;
    newEnemies.push(e);
  }

  // Remove residents when two enemies share a cell (keep first occurrence)
  const seen = new Set<string>();
  const deduped: Enemy[] = [];
  for (const e of newEnemies) {
    const key = `${e.pos.col},${e.pos.row}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(e);
    }
  }

  if (phase === "playing") {
    for (const e of deduped) {
      if (sameCell(e.pos, state.playerPos)) {
        return handleEnemyHit(
          { ...state, simTime, enemies: deduped, refuge, board: newBoard, phase },
          rng
        );
      }
    }
  }

  if (refuge && simTime >= refuge.expiresAt) {
    refuge = null;
  }

  if (!refuge && rng() < 0.003) {
    const newRefuge = spawnRefuge(state, simTime, rng);
    if (newRefuge) {
      refuge = newRefuge;
      for (let i = deduped.length - 1; i >= 0; i--) {
        if (sameCell(deduped[i].pos, newRefuge.pos)) {
          deduped.splice(i, 1);
        }
      }
    }
  }

  const cap = enemyCap(state.level);
  if (deduped.length < cap && rng() < 0.002) {
    const kind = pickEnemyKind(state.level, rng);
    const newEnemy = spawnEnemy(kind, state, rng);
    if (newEnemy) {
      newEnemy.id = nextId(deduped);
      deduped.push(newEnemy);
    }
  }

  return {
    ...state,
    simTime,
    freezeTimer,
    phase,
    board: newBoard,
    enemies: deduped,
    refuge,
  };
}
