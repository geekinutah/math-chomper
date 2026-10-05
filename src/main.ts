import { createBoardCanvas } from "@/render/canvas";

const canvas = document.querySelector<HTMLCanvasElement>("canvas");
if (canvas !== null) {
  createBoardCanvas(canvas);
}
