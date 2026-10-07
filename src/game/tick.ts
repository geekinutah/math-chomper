import type { GameState, Phase } from "./state";
import { COLS, handleEnemyHit } from "./state";
import { playerStepDelay, stepPos } from "./player";
import type { Enemy, EnemyKind } from "./enemies";
import { stepEnemy, sameCell } from "./enemies";
import { spawnEnemy, spawnRefuge, enemyCap, enemyStepDelay, refugeSpawnChance } from "./spawn";
import { allMatchesCleared } from "./board";
import { matches } from "@/rules/match";
import type { Cell, Rule } from "@/rules/types";
import { getBand, getGenConfig, getEnemyKinds, type BandName } from "@/content/bands";
import { generateExprCell, type GenConfig } from "@/rules/generate";

function cellIdx(pos: { col: number; row: number }): number {
  return pos.row * COLS + pos.col;
}

function genRewriteNumber(config: GenConfig, rng: () => number): Cell {
  const value = Math.max(1, config.numMin + Math.floor(rng() * (config.numMax - config.numMin + 1)));
  return { kind: "number", value };
}

function genRewriteExpr(config: GenConfig, rng: () => number): Cell {
  // Shared with board generation so rewrites obey the band's exprMinResult too.
  return generateExprCell(config, rng);
}

function genRewriteCell(rule: Rule, config: GenConfig, rng: () => number): Cell {
  const wantMatch = rng() < 0.3;
  const useExpr = rule.mode === "equality" || rule.mode === "inequality";
  for (let i = 0; i < 3; i++) {
    const cell = useExpr ? genRewriteExpr(config, rng) : genRewriteNumber(config, rng);
    if (matches(rule, cell) === wantMatch) return cell;
  }
  return useExpr ? genRewriteExpr(config, rng) : genRewriteNumber(config, rng);
}

function pickEnemyKind(bandName: BandName, level: number, rng: () => number): EnemyKind {
  const kinds = getEnemyKinds(getBand(bandName), level);
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
  let score = state.score;
  let newBoard = state.board;
  let refuge = state.refuge;
  let pendingSpawnAt = state.pendingSpawnAt;

  if (freezeTimer > 0) {
    freezeTimer = Math.max(0, freezeTimer - dtMs);
    if (freezeTimer > 0) {
      return { ...state, simTime, freezeTimer };
    }
  }

  let playerPos = state.playerPos;
  let stepTimer = state.stepTimer;
  let pendingDir = state.pendingDir;
  let queuedDir = state.queuedDir;

  if (stepTimer > 0 && pendingDir !== null) {
    stepTimer -= dtMs;
    if (stepTimer <= 0) {
      playerPos = stepPos(playerPos, pendingDir);
      if (queuedDir !== null) {
        pendingDir = queuedDir;
        queuedDir = null;
        stepTimer = playerStepDelay(state.level);
      } else {
        pendingDir = null;
        stepTimer = 0;
      }
    }
  }

  const ctx = toStepCtx({ ...state, playerPos });
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
          score += 25 + 5 * state.level;
        }
      }
    }

    if (e.kind === "rewriter" && !sameCell(oldPos, newPos)) {
      const idx = cellIdx(oldPos);
      newBoard = [...newBoard];
      const config = getGenConfig(getBand(state.band));
      newBoard[idx] = genRewriteCell(state.rule, config, rng);
      if (allMatchesCleared(newBoard, state.rule)) {
        phase = "level-clear";
        score += 25 + 5 * state.level;
      }
    }

    if (refuge && sameCell(newPos, refuge.pos)) {
      e.pos = oldPos;
    } else {
      e.pos = newPos;
    }
    e.stepTimer = enemyStepDelay(state.level);
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

  const cap = enemyCap(state.level);
  const removedCount = newEnemies.length - deduped.length;

  // Fire a replacement that was scheduled 2-4 s after an earlier collision.
  if (pendingSpawnAt !== null && simTime >= pendingSpawnAt) {
    pendingSpawnAt = null;
    if (deduped.length < cap) {
      const kind = pickEnemyKind(state.band, state.level, rng);
      const ne = spawnEnemy(kind, { ...state, playerPos }, rng);
      if (ne) { ne.id = nextId(deduped); deduped.push(ne); }
    }
  }

  // Schedule a replacement when a collision removed an enemy and we are under cap.
  if (removedCount > 0 && deduped.length < cap && pendingSpawnAt === null) {
    pendingSpawnAt = simTime + 2000 + rng() * 2000;
  }

  if (phase === "playing") {
    for (const e of deduped) {
      if (sameCell(e.pos, playerPos)) {
        return handleEnemyHit(
          { ...state, simTime, enemies: deduped, refuge, board: newBoard, phase, playerPos, pendingSpawnAt },
          rng
        );
      }
    }
  }

  if (refuge && simTime >= refuge.expiresAt) {
    refuge = null;
  }

  if (!refuge && rng() < refugeSpawnChance(state.level)) {
    const newRefuge = spawnRefuge({ ...state, playerPos }, simTime, rng);
    if (newRefuge) {
      refuge = newRefuge;
      for (let i = deduped.length - 1; i >= 0; i--) {
        if (sameCell(deduped[i].pos, newRefuge.pos)) {
          deduped.splice(i, 1);
        }
      }
    }
  }

  if (deduped.length < cap && rng() < 0.002) {
    const kind = pickEnemyKind(state.band, state.level, rng);
    const newEnemy = spawnEnemy(kind, { ...state, playerPos }, rng);
    if (newEnemy) {
      newEnemy.id = nextId(deduped);
      deduped.push(newEnemy);
    }
  }

  if (phase !== "playing") {
    stepTimer = 0;
    pendingDir = null;
    queuedDir = null;
  }

  return {
    ...state,
    simTime,
    freezeTimer,
    phase,
    score,
    board: newBoard,
    playerPos,
    enemies: deduped,
    refuge,
    stepTimer,
    pendingDir,
    queuedDir,
    pendingSpawnAt,
  };
}
