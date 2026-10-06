import type { GameState } from "@/game/state";
import { COLS, ROWS } from "@/game/state";
import type { Cell, Rule } from "@/rules/types";
import { matches } from "@/rules/match";
import { drawPlayer, drawEnemy, drawRefuge } from "./sprites";

export function createBoardCanvas(canvas: HTMLCanvasElement): void {
  canvas.width = 960;
  canvas.height = 600;
  const ctx = canvas.getContext("2d");
  if (ctx === null) {
    return;
  }
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

const CANVAS_W = 960;
const CANVAS_H = 600;
const GRID_X = 180;
const GRID_Y = 50;
const CELL = 100;
const BG = "#0d1110";
const GRID_LINE = "#2a3a32";
const TEXT = "#f4f1e8";
const MATCH_BORDER = "#1a3a2a";

function cellRect(col: number, row: number): { x: number; y: number } {
  return { x: GRID_X + col * CELL, y: GRID_Y + row * CELL };
}

function drawGrid(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = GRID_LINE;
  ctx.lineWidth = 1;
  const w = COLS * CELL;
  const h = ROWS * CELL;
  for (let c = 0; c <= COLS; c++) {
    const x = Math.round(GRID_X + c * CELL) + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, GRID_Y);
    ctx.lineTo(x, GRID_Y + h);
    ctx.stroke();
  }
  for (let r = 0; r <= ROWS; r++) {
    const y = Math.round(GRID_Y + r * CELL) + 0.5;
    ctx.beginPath();
    ctx.moveTo(GRID_X, y);
    ctx.lineTo(GRID_X + w, y);
    ctx.stroke();
  }
}

function drawCell(ctx: CanvasRenderingContext2D, rule: Rule, cell: Cell, col: number, row: number): void {
  const { x, y } = cellRect(col, row);
  const cx = x + CELL / 2;
  const cy = y + CELL / 2;

  if (matches(rule, cell)) {
    ctx.strokeStyle = MATCH_BORDER;
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 2.5, y + 2.5, CELL - 5, CELL - 5);
  }

  ctx.fillStyle = TEXT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (cell.kind === "number") {
    ctx.font = "28px monospace";
    ctx.fillText(String(cell.value), cx, cy);
  } else if (cell.kind === "expr") {
    ctx.font = "24px monospace";
    ctx.fillText(cell.text, cx, cy);
  }
}

export function renderBoard(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  drawGrid(ctx);
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = state.board[row * COLS + col];
      if (cell.kind === "empty") continue;
      drawCell(ctx, state.rule, cell, col, row);
    }
  }
  const { x, y } = cellRect(state.playerPos.col, state.playerPos.row);
  drawPlayer(ctx, x, y, CELL);
  for (const enemy of state.enemies) {
    const er = cellRect(enemy.pos.col, enemy.pos.row);
    drawEnemy(ctx, enemy.kind, er.x, er.y, CELL);
  }
  if (state.refuge) {
    const rr = cellRect(state.refuge.pos.col, state.refuge.pos.row);
    drawRefuge(ctx, rr.x, rr.y, CELL);
  }
}
