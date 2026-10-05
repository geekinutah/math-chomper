import { describe, expect, it } from "vitest";
import { createBoardCanvas } from "@/render/canvas";

describe("arithmetic sanity", () => {
  it("1 + 1 === 2", () => {
    expect(1 + 1).toBe(2);
    expect(typeof createBoardCanvas).toBe("function");
  });
});
