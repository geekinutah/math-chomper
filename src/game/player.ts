import type { Dir, PlayerPos } from "@/game/state";
import { COLS, ROWS } from "@/game/state";

const BASE_PLAYER_STEP_MS = 140;
const MIN_PLAYER_STEP_MS = 80;
const RAMP_FACTOR = 0.85;

export function playerStepDelay(level: number): number {
  const ms = BASE_PLAYER_STEP_MS * RAMP_FACTOR ** (level - 1);
  return Math.max(MIN_PLAYER_STEP_MS, Math.round(ms));
}

export function stepPos(pos: PlayerPos, dir: Dir): PlayerPos {
  let { col, row } = pos;
  switch (dir) {
    case "up":
      row -= 1;
      break;
    case "down":
      row += 1;
      break;
    case "left":
      col -= 1;
      break;
    case "right":
      col += 1;
      break;
  }
  col = Math.max(0, Math.min(COLS - 1, col));
  row = Math.max(0, Math.min(ROWS - 1, row));
  return { col, row };
}
