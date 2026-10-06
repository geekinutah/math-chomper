import type { GameState, Phase } from "./state";
import { COLS, handleEnemyHit } from "./state";
import type { Enemy, EnemyKind } from "./enemies";
import { stepEnemy, sameCell } from "./enemies";
import { spawnEnemy, spawnRefuge, enemyCap, enemyStepDelay, refugeSpawnChance } from "./spawn";
import { allMatchesCleared } from "./board";
import { matches } from "@/rules/match";
import type { Cell, Rule } from "@/rules/types";
import { getBand, getGenConfig, getEnemyKinds, type BandName } from "@/content/bands";
import { formatExpr, evalExpr } from "@/rules/expr";
import type { GenConfig } from "@/rules/generate";

function cellIdx(pos: { col: number; row: number }): number {
  return pos.row * COLS + pos.col;
}

function genRewriteNumber(config: GenConfig, rng: () => number): Cell {
  const value = Math.max(1, config.numMin + Math.floor(rng() * (config.numMax - config.numMin + 1)));
  return { kind: "number", value };
}

function genRewriteExpr(config: GenConfig, rng: () => number): Cell {
  for (let i = 0; i < 4; i++) {
    const op = config.exprOps[Math.floor(rng() * config.exprOps.length)];
    const a = config.exprMin + Math.floor(rng() * (config.exprMax - config.exprMin + 1));
    const b = config.exprMin + Math.floor(rng() * (config.exprMax - config.exprMin + 1));
    const text = formatExpr(a, op, b);
    const value = evalExpr(text);
    if (value !== null) return { kind: "expr", text, value };
  }
  const a = config.exprMin + Math.floor(rng() * (config.exprMax - config.exprMin + 1));
  const b = config.exprMin + Math.floor(rng() * (config.exprMax - config.exprMin + 1));
  const text = formatExpr(a, "+", b);
  return { kind: "expr", text, value: a + b };
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

  if (!refuge && rng() < refugeSpawnChance(state.level)) {
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
    const kind = pickEnemyKind(state.band, state.level, rng);
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
    score,
    board: newBoard,
    enemies: deduped,
    refuge,
  };
}
