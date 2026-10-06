# T-005: Board Generator

Phase: 2
Depends on: T-004 (match, types)
Round: 1

## Goal

Implement a deterministic board generator that produces a valid 30-cell grid (6×5) with the correct mix of matching and non-matching cells.

## Files (create, all new)

- `src/rules/generate.ts`
- `test/rules/generate.test.ts`

Do not create or modify files outside this list. Do not modify `src/rules/match.ts`, `src/rules/types.ts`, `src/rules/primes.ts`, or `src/rules/expr.ts`.

## Requirements

### `src/rules/generate.ts`

- Export: `export function generateBoard(rule: Rule, rng: () => number, config: GenConfig): Cell[]`
- Returns an array of exactly 30 `Cell` objects (all occupied, no empty cells on a fresh board).
- `rng` is a `() => number` function returning [0, 1). The caller provides a seeded rng for testability. Never call `Math.random` inside this module.
- `GenConfig` type (define and export in this file):
  ```ts
  export type GenConfig = {
    numMin: number;
    numMax: number;
    exprOps: Array<"+" | "−" | "×" | "÷">;
    exprMin: number;
    exprMax: number;
  };
  ```
- Cell kind selection:
  - If rule mode is `equality` or `inequality`: all 30 cells are `{ kind: "expr" }`.
  - Otherwise: all 30 cells are `{ kind: "number" }`.
- Generation strategy:
  1. Decide the target match count: a random integer in [4, 10].
  2. For number modes: generate `numMin`..`numMax` integers. For each, check `matches(rule, cell)`. Collect matches and non-matches separately.
  3. For expression modes: generate random expressions using `config.exprOps` and operands in `[exprMin, exprMax]`. Evaluate with `evalExpr`. If null, retry. Check `matches(rule, cell)`.
  4. Fill the board: place exactly the target number of matches and (30 − target) non-matches, in random positions (shuffle using rng).
- Constraints (must all hold on the returned board):
  - At least 4 matching cells.
  - At least 4 non-matching cells (i.e., at most 26 matches, which is guaranteed by cap of 10).
  - At most 10 matching cells.
  - No cell has value 0 for number modes (numMin is always ≥ 1 in practice).
  - All cells are integers (no floats).
  - For expressions: all use display glyphs, all divide evenly, all subtraction results non-negative.
- No `any` type. No default exports. File must be under 250 lines.

## Tests to write

Use a simple seeded rng for determinism:
```ts
function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
```

| Test name | Behavior proved |
|-----------|-----------------|
| `returns exactly 30 cells` | generateBoard(...).length === 30 |
| `always 4 to 10 matches (multiples)` | For 50 different seeds, count matches, assert 4 ≤ count ≤ 10 |
| `always at least 4 non-matches (multiples)` | For 50 seeds, non-match count ≥ 4 |
| `never more than 60% matches` | For 50 seeds, match count / 30 ≤ 0.6 |
| `equality board is all expressions` | Every cell has kind "expr" |
| `inequality board is all expressions` | Every cell has kind "expr" |
| `multiples board is all numbers` | Every cell has kind "number" |
| `deterministic: same seed produces same board` | Two calls with same seed and config produce identical arrays (deep equal) |
| `different seeds produce different boards` | Two calls with different seeds produce different arrays |
| `no zero values on number boards` | All number cells have value ≥ 1 |
| `expression cells have valid text` | Every expr cell's text passes evalExpr and returns non-null |
| `expression results are integers` | No fractional values in expr cells |

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm test` | All generate tests pass (plus all prior tests still pass). |
| 2 | `npm run typecheck` | Exit 0. |
| 3 | `npm run build` | Exit 0. |

## Edges

- The generator must handle all five modes. Test at least multiples, factors, primes, equality, and inequality.
- For factors mode with small k (e.g., k=2, factors are {1,2}), there are very few possible matching values. The generator must still produce 4+ matches by repeating values if necessary (the board can have duplicate numbers).
- For primes mode, matching values are primes in the range. The generator picks random numbers and checks if they're prime.

## Out of scope

- No game state, no rendering, no enemy interaction, no band content tables.
- The `GenConfig` parameters come from the caller. The band tables (which config for which band) are a Phase 5 concern.
