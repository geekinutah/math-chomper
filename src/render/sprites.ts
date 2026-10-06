import type { EnemyKind } from "@/game/enemies";

const PLAYER_GREEN = "#3ddc6e";
const EYE_BLACK = "#0d1110";
const REFUGE_BLUE = "#4aa3ff";

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
): void {
  const cx = x + cellSize / 2;
  const cy = y + cellSize / 2;
  const r = cellSize * 0.3;

  ctx.fillStyle = PLAYER_GREEN;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = EYE_BLACK;
  const eyeR = r * 0.14;
  ctx.beginPath();
  ctx.arc(cx - r * 0.35, cy - r * 0.25, eyeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + r * 0.35, cy - r * 0.25, eyeR, 0, Math.PI * 2);
  ctx.fill();

  // Open mouth arc, facing down
  ctx.strokeStyle = EYE_BLACK;
  ctx.lineWidth = Math.max(1, r * 0.12);
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.1, r * 0.4, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
}

export function drawRefuge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
): void {
  const t = cellSize * 0.12;
  const inset = cellSize * 0.08;
  ctx.strokeStyle = REFUGE_BLUE;
  ctx.lineWidth = 2;

  const corners: Array<[number, number, number, number]> = [
    [x + inset, y + inset, 1, 1],
    [x + cellSize - inset, y + inset, -1, 1],
    [x + inset, y + cellSize - inset, 1, -1],
    [x + cellSize - inset, y + cellSize - inset, -1, -1],
  ];
  for (const [px, py, sx, sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(px + sx * t, py);
    ctx.lineTo(px, py);
    ctx.lineTo(px, py + sy * t);
    ctx.stroke();
  }
}

export function drawEnemy(
  ctx: CanvasRenderingContext2D,
  kind: EnemyKind,
  x: number,
  y: number,
  cellSize: number,
): void {
  const cx = x + cellSize / 2;
  const cy = y + cellSize / 2;

  switch (kind) {
    case "straight": {
      const r = cellSize * 0.3;
      ctx.fillStyle = "#e23d3d";
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      // single eye
      ctx.fillStyle = EYE_BLACK;
      ctx.beginPath();
      ctx.arc(cx, cy - r * 0.2, r * 0.15, 0, Math.PI * 2);
      ctx.fill();
      // flat front rectangle
      ctx.fillStyle = EYE_BLACK;
      ctx.fillRect(cx - r * 0.35, cy + r * 0.25, r * 0.7, r * 0.3);
      break;
    }
    case "shy": {
      const r = cellSize * 0.25;
      ctx.fillStyle = "#4aa3ff";
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      // two eyes
      ctx.fillStyle = EYE_BLACK;
      ctx.beginPath();
      ctx.arc(cx - r * 0.3, cy - r * 0.2, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + r * 0.3, cy - r * 0.2, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "eater": {
      const r = cellSize * 0.35;
      ctx.fillStyle = "#b06bff";
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      // wide open mouth arc
      ctx.strokeStyle = EYE_BLACK;
      ctx.lineWidth = Math.max(1, r * 0.14);
      ctx.beginPath();
      ctx.arc(cx, cy + r * 0.05, r * 0.55, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
      break;
    }
    case "rewriter": {
      const r = cellSize * 0.3;
      ctx.fillStyle = "#e0a045";
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      // pencil mark (small line)
      ctx.strokeStyle = EYE_BLACK;
      ctx.lineWidth = Math.max(1, r * 0.1);
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.25, cy - r * 0.4);
      ctx.lineTo(cx + r * 0.25, cy + r * 0.1);
      ctx.stroke();
      break;
    }
    case "chaser": {
      const r = cellSize * 0.3;
      ctx.fillStyle = "#f2e14a";
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      // two angry angled eyes
      ctx.strokeStyle = EYE_BLACK;
      ctx.lineWidth = Math.max(1, r * 0.12);
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.45, cy - r * 0.4);
      ctx.lineTo(cx - r * 0.15, cy - r * 0.15);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + r * 0.45, cy - r * 0.4);
      ctx.lineTo(cx + r * 0.15, cy - r * 0.15);
      ctx.stroke();
      // triangle nose
      ctx.fillStyle = EYE_BLACK;
      ctx.beginPath();
      ctx.moveTo(cx, cy + r * 0.1);
      ctx.lineTo(cx - r * 0.15, cy + r * 0.35);
      ctx.lineTo(cx + r * 0.15, cy + r * 0.35);
      ctx.closePath();
      ctx.fill();
      break;
    }
  }
}
