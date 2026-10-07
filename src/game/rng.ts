const A = 16807;
const M = 2147483647; // 2^31 - 1

export function createRng(seed: number): () => number {
  // Normalize to 1..M-1. State 0 is the only degenerate LCG state (stays 0 forever),
  // so any seed is safe; in-range seeds are unchanged.
  let s = ((seed - 1) % (M - 1) + (M - 1)) % (M - 1) + 1;
  return () => {
    s = (s * A) % M;
    return (s - 1) / (M - 2);
  };
}

export function seedFromTime(nowMs: number): number {
  return 1 + (nowMs % (M - 1));
}
