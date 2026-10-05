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
