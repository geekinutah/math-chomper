import { isPrime } from "./primes";
import type { Cell, Rule } from "./types";

export function matches(rule: Rule, cell: Cell): boolean {
  if (cell.kind === "empty") return false;

  switch (rule.mode) {
    case "multiples":
      if (cell.kind !== "number") return false;
      return cell.value > 0 && cell.value % rule.k === 0;
    case "factors":
      if (cell.kind !== "number") return false;
      return cell.value >= 1 && cell.value <= rule.k && rule.k % cell.value === 0;
    case "primes":
      if (cell.kind !== "number") return false;
      return isPrime(cell.value);
    case "equality":
      if (cell.kind !== "expr") return false;
      return cell.value === rule.k;
    case "inequality":
      if (cell.kind !== "expr") return false;
      return cell.value !== rule.k;
  }
}
