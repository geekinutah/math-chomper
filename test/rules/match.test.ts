import { describe, it, expect } from "vitest";
import { matches } from "@/rules/match";

describe("matches", () => {
  describe("multiples", () => {
    it("multiples of 1 match every positive integer", () => {
      for (let n = 1; n <= 20; n++) {
        expect(matches({ mode: "multiples", k: 1 }, { kind: "number", value: n })).toBe(true);
      }
    });

    it("multiples of 6: 6 matches", () => {
      expect(matches({ mode: "multiples", k: 6 }, { kind: "number", value: 6 })).toBe(true);
    });

    it("multiples of 6: 12 matches", () => {
      expect(matches({ mode: "multiples", k: 6 }, { kind: "number", value: 12 })).toBe(true);
    });

    it("multiples of 6: 7 does not match", () => {
      expect(matches({ mode: "multiples", k: 6 }, { kind: "number", value: 7 })).toBe(false);
    });

    it("multiples of 6: 0 does not match", () => {
      expect(matches({ mode: "multiples", k: 6 }, { kind: "number", value: 0 })).toBe(false);
    });

    it("expr cell in multiples mode does not match", () => {
      expect(matches({ mode: "multiples", k: 6 }, { kind: "expr", text: "3×2", value: 6 })).toBe(false);
    });
  });

  describe("factors", () => {
    it("factors of 12: exactly {1,2,3,4,6,12}", () => {
      for (let v = 1; v <= 15; v++) {
        const expected = [1, 2, 3, 4, 6, 12].includes(v);
        expect(matches({ mode: "factors", k: 12 }, { kind: "number", value: v })).toBe(expected);
      }
    });

    it("factors of 12: 5 does not match", () => {
      expect(matches({ mode: "factors", k: 12 }, { kind: "number", value: 5 })).toBe(false);
    });

    it("factors of 12: 13 does not match", () => {
      expect(matches({ mode: "factors", k: 12 }, { kind: "number", value: 13 })).toBe(false);
    });

    it("expr cell in factors mode does not match", () => {
      expect(matches({ mode: "factors", k: 12 }, { kind: "expr", text: "3×2", value: 6 })).toBe(false);
    });
  });

  describe("primes", () => {
    it("primes: 1 is not prime", () => {
      expect(matches({ mode: "primes" }, { kind: "number", value: 1 })).toBe(false);
    });

    it("primes: 2 is prime", () => {
      expect(matches({ mode: "primes" }, { kind: "number", value: 2 })).toBe(true);
    });

    it("primes: 51 is not prime", () => {
      expect(matches({ mode: "primes" }, { kind: "number", value: 51 })).toBe(false);
    });

    it("primes: 91 is not prime", () => {
      expect(matches({ mode: "primes" }, { kind: "number", value: 91 })).toBe(false);
    });

    it("primes: 97 is prime", () => {
      expect(matches({ mode: "primes" }, { kind: "number", value: 97 })).toBe(true);
    });

    it("expr cell in primes mode does not match", () => {
      expect(matches({ mode: "primes" }, { kind: "expr", text: "3×2", value: 6 })).toBe(false);
    });
  });

  describe("equality", () => {
    it("equality: 3×2 matches k=6", () => {
      expect(matches({ mode: "equality", k: 6 }, { kind: "expr", text: "3×2", value: 6 })).toBe(true);
    });

    it("equality: 4+5 does not match k=6", () => {
      expect(matches({ mode: "equality", k: 6 }, { kind: "expr", text: "4+5", value: 9 })).toBe(false);
    });

    it("equality: number cell does not match", () => {
      expect(matches({ mode: "equality", k: 6 }, { kind: "number", value: 6 })).toBe(false);
    });
  });

  describe("inequality", () => {
    it("inequality: 3×2 (6) does not match not-equal-6", () => {
      expect(matches({ mode: "inequality", k: 6 }, { kind: "expr", text: "3×2", value: 6 })).toBe(false);
    });

    it("inequality: 4+5 (9) matches not-equal-6", () => {
      expect(matches({ mode: "inequality", k: 6 }, { kind: "expr", text: "4+5", value: 9 })).toBe(true);
    });

    it("inequality: number cell does not match", () => {
      expect(matches({ mode: "inequality", k: 6 }, { kind: "number", value: 9 })).toBe(false);
    });
  });

  describe("empty cell", () => {
    it("empty cell never matches", () => {
      expect(matches({ mode: "multiples", k: 6 }, { kind: "empty" })).toBe(false);
      expect(matches({ mode: "factors", k: 12 }, { kind: "empty" })).toBe(false);
      expect(matches({ mode: "primes" }, { kind: "empty" })).toBe(false);
      expect(matches({ mode: "equality", k: 6 }, { kind: "empty" })).toBe(false);
      expect(matches({ mode: "inequality", k: 6 }, { kind: "empty" })).toBe(false);
    });
  });
});
