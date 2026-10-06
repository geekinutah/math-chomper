import { describe, expect, it } from "vitest";
import { evalExpr, formatExpr } from "@/rules/expr";

describe("evalExpr", () => {
  it("12÷2 equals 6", () => {
    expect(evalExpr("12÷2")).toBe(6);
  });

  it("5÷2 is null", () => {
    expect(evalExpr("5÷2")).toBeNull();
  });

  it("0÷5 equals 0", () => {
    expect(evalExpr("0÷5")).toBe(0);
  });

  it("10÷0 is null", () => {
    expect(evalExpr("10÷0")).toBeNull();
  });

  it("4+5 equals 9", () => {
    expect(evalExpr("4+5")).toBe(9);
  });

  it("7−3 equals 4", () => {
    expect(evalExpr("7−3")).toBe(4);
  });

  it("3−7 is null", () => {
    expect(evalExpr("3−7")).toBeNull();
  });

  it("3×2 equals 6", () => {
    expect(evalExpr("3×2")).toBe(6);
  });

  it("12×12 equals 144", () => {
    expect(evalExpr("12×12")).toBe(144);
  });

  it("invalid: empty string", () => {
    expect(evalExpr("")).toBeNull();
  });

  it("invalid: single number", () => {
    expect(evalExpr("5")).toBeNull();
  });

  it("invalid: unknown operator", () => {
    expect(evalExpr("3&5")).toBeNull();
  });

  it("invalid: negative operand", () => {
    expect(evalExpr("-3+5")).toBeNull();
  });

  it("invalid: ASCII hyphen is not the minus sign", () => {
    expect(evalExpr("7-3")).toBeNull();
  });

  it("invalid: whitespace is not allowed", () => {
    expect(evalExpr(" 3+4")).toBeNull();
    expect(evalExpr("3 + 4")).toBeNull();
    expect(evalExpr("3+4 ")).toBeNull();
  });

  it("invalid: chained operators are not allowed", () => {
    expect(evalExpr("1+2+3")).toBeNull();
    expect(evalExpr("3+×4")).toBeNull();
    expect(evalExpr("+3+4")).toBeNull();
  });

  it("handles multi-digit and 0–99 operands", () => {
    expect(evalExpr("99+99")).toBe(198);
    expect(evalExpr("0+0")).toBe(0);
    expect(evalExpr("99×99")).toBe(9801);
  });
});

describe("formatExpr", () => {
  it("produces display glyphs", () => {
    expect(formatExpr(3, "×", 2)).toBe("3×2");
  });

  it("division", () => {
    expect(formatExpr(12, "÷", 2)).toBe("12÷2");
  });

  it("subtraction", () => {
    expect(formatExpr(7, "−", 3)).toBe("7−3");
  });

  it("addition", () => {
    expect(formatExpr(4, "+", 5)).toBe("4+5");
  });
});
