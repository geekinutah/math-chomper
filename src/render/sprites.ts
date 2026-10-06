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
