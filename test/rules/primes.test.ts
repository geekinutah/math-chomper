import { describe, expect, it } from "vitest";
import { isPrime } from "@/rules/primes";

describe("isPrime", () => {
  it("1 is not prime", () => {
    expect(isPrime(1)).toBe(false);
  });

  it("2 is prime", () => {
    expect(isPrime(2)).toBe(true);
  });

  it("3 is prime", () => {
    expect(isPrime(3)).toBe(true);
  });

  it("4 is not prime", () => {
    expect(isPrime(4)).toBe(false);
  });

  it("51 is not prime", () => {
    expect(isPrime(51)).toBe(false);
  });

  it("91 is not prime", () => {
    expect(isPrime(91)).toBe(false);
  });

  it("97 is prime", () => {
    expect(isPrime(97)).toBe(true);
  });

  it("0 is not prime", () => {
    expect(isPrime(0)).toBe(false);
  });

  it("negative numbers are not prime", () => {
    expect(isPrime(-7)).toBe(false);
  });

  it("non-integers are not prime", () => {
    expect(isPrime(2.5)).toBe(false);
  });

  it("25 is not prime", () => {
    expect(isPrime(25)).toBe(false);
  });

  it("121 is not prime", () => {
    expect(isPrime(121)).toBe(false);
  });

  it("200 is not prime", () => {
    expect(isPrime(200)).toBe(false);
  });

  it("199 is prime", () => {
    expect(isPrime(199)).toBe(true);
  });
});
