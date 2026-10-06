export type Mode = "multiples" | "factors" | "primes" | "equality" | "inequality";

export type Cell =
  | { kind: "empty" }
  | { kind: "number"; value: number }
  | { kind: "expr"; text: string; value: number };

export type Rule =
  | { mode: "multiples"; k: number }
  | { mode: "factors"; k: number }
  | { mode: "primes" }
  | { mode: "equality"; k: number }
  | { mode: "inequality"; k: number };
