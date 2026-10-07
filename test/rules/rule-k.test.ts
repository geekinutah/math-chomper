import { describe, expect, it } from "vitest";
import { ruleKRange } from "@/rules/rule-k";

describe("ruleKRange", () => {
  it("multiples widens by one per level, capped", () => {
    const at = (level: number) => ruleKRange("multiples", level, { min: 2, max: 12 }, 0);
    expect(at(1)).toEqual({ min: 2, max: 4 });
    expect(at(5)).toEqual({ min: 2, max: 8 });
    expect(at(99)).toEqual({ min: 2, max: 12 });
  });

  it("equality floors at exprMinResult", () => {
    expect(ruleKRange("equality", 1, { min: 2, max: 12 }, 13)).toEqual({ min: 13, max: 12 });
    expect(ruleKRange("equality", 1, { min: 2, max: 20 }, 13)).toEqual({ min: 13, max: 20 });
  });

  it("inequality floors at exprMinResult", () => {
    expect(ruleKRange("inequality", 1, { min: 2, max: 12 }, 13)).toEqual({ min: 13, max: 12 });
  });

  it("factors and primes use the raw kRange", () => {
    expect(ruleKRange("factors", 1, { min: 2, max: 12 }, 13)).toEqual({ min: 2, max: 12 });
    expect(ruleKRange("primes", 1, { min: 2, max: 12 }, 13)).toEqual({ min: 2, max: 12 });
  });
});
