# T-029: Hard Band Larger Expression Results

Phase: 6
Depends on: T-017 (bands), T-018 (state), **T-028** (owns `tick.ts` — run after it merges)
Round: 1

## Goal

Give the Hard band the expression difference spec §8 requires: "operands to 12, larger results". Per Mike's 2026-10-06 decision: all four ops, operands 0–12, generated expressions must evaluate to **≥ 13** (bounded retry, known-valid fallback). Two consequences are in scope because they are required for correctness:

1. **k range**: on Hard, equality/inequality `k` draws from **13–20**, not 2–20. A `k` below 13 can never equal a ≥ 13 expression, so an equality board could not reach the 4-match minimum (level would soft-lock).
2. **Termination**: the new constraint makes the generator's unbounded retries a real risk (a degenerate rng can produce only small results). Board generation must always terminate — this resolves backlog B-003.

Easy and Standard bands are unchanged.

## Files

- `src/content/bands.ts` (modify)
- `src/rules/generate.ts` (modify)
- `src/game/state.ts` (modify)
- `src/game/board.ts` (modify)
- `src/game/tick.ts` (modify — the rewriter expression path only)
- `test/bands.test.ts`, `test/rules/generate.test.ts`, `test/state.test.ts`, `test/board.test.ts`, `test/tick.test.ts` (modify — add tests)

Do not create or modify files outside this list. No spec edit (the spec's "larger results" is now implemented as specified below).

## Requirements

### `src/content/bands.ts`

- `Band` gains optional `exprMinResult?: number`; `HARD` sets `13`; `EASY`/`STANDARD` omit it.
- `GenConfig` (in `rules/generate.ts`) gains optional `exprMinResult?: number`; `getGenConfig` passes it through.

### `src/rules/generate.ts`

- New exported `generateExprCell(config: GenConfig, rng: () => number): Cell`: up to 100 attempts — draw op from `config.exprOps` and both operands from `[exprMin, exprMax]`; accept when `evalExpr` is non-null **and** (`exprMinResult` is unset or `value >= exprMinResult`). On exhausting attempts, fall back to `formatExpr(2, "×", 7)` → `"2×7"`, value 14 (valid on every band, satisfies the constraint). `genExpr` becomes a call to this function.
- `generateBoard`: cap total cell draws at 1000. When the cap is hit, stop discarding and fill the remaining slots with known-valid cells of the needed kind (see table below). The finished board always has 30 cells and satisfies the match minimum/maximum as far as the table allows.

Known-valid fill cells (deterministic, no rng):

| Mode | Needing a match | Needing a non-match |
|------|----------------|---------------------|
| multiples | number `2k` (≤ `numMax` on every band; clamp to `[1, numMax]` as a guard) | number `k + 1` (between k and 2k, never a multiple) |
| factors | number `k` (k divides k; `k ≤ 20 ≤ numMax` on every band) | number `k + 1` (larger than k, never a factor) |
| primes | number `7` (prime, ≤ 30 ≤ every band's `numMax`) | number `1` (1 is not prime) |
| equality | expr `formatExpr(k, "÷", 1)` — value k, exact. If `exprMinResult` is set and k < 13 the constraint is dropped: board validity beats band aesthetics, comment why. | expr `formatExpr(k, "÷", 1)` is a *match*, so use a value ≠ k: `formatExpr(k, "×", 2)` (2k ≠ k for k ≥ 2; on Hard k ≥ 13 so 2k ≥ 26 ≥ 13) |
| inequality | expr `formatExpr(k, "×", 2)` (2k ≠ k) | expr `formatExpr(k, "÷", 1)` (value k = k, not a match) |

### `src/game/state.ts` and `src/game/board.ts`

In `genRule` (state.ts) and `generateRule` (board.ts) — which currently duplicate the k logic — for equality and inequality modes only: effective `kMin = max(kRange.min, band.exprMinResult ?? 0)`. Hard → 13–20; all other bands/modes unchanged (multiples/factors keep 2–20 on Hard; the level-scaled widening applies to multiples only, as today).

### `src/game/tick.ts`

- Replace the body of `genRewriteExpr` (its 4-attempt loop and `"+"` fallback) with a call to `generateExprCell(config, rng)`, so rewritten cells honor `exprMinResult` too (spec: regenerated cells obey the same constraints).

## Tests to add

`test/bands.test.ts`:

| Test name | Behavior proved |
|-----------|-----------------|
| `HARD has exprMinResult 13` | The band table carries the constraint |
| `EASY/STANDARD have no exprMinResult` | Unchanged bands stay unfiltered |
| `getGenConfig(HARD) passes exprMinResult` | Config plumbing |

`test/rules/generate.test.ts` (through the public `generateBoard`):

| Test name | Behavior proved |
|-----------|-----------------|
| `hard equality board: every expr cell has value ≥ 13` | 8 seeded boards, all 30 cells checked |
| `standard equality board: can contain values < 13` | Guard against over-filtering: 50 seeded boards yield at least one cell < 13 |
| `hard equality k 13, 17, 19, 20: 4–10 matches` | Matchable k values: 13/17/19 only via `+` combos, 20 via `+`/`×` |
| `generateBoard terminates under degenerate rng` | `() => 0.5` (a well-known LCG trap) with any band/mode: returns 30 cells; no hang (B-003) |
| `hard equality k=5 (hand-crafted rule): 4+ matches` | Constraint is soft, board validity is hard: fill cells rescue the board |

`test/board.test.ts` + `test/state.test.ts` (100 seeded samples each):

| Test name | Behavior proved |
|-----------|-----------------|
| `generateRule hard equality/inequality: k in 13–20` | Constrained range |
| `generateRule hard multiples/factors: k in 2–20` | Unchanged |
| `generateRule standard equality: k in 2–12` | Unchanged (over-filter guard) |
| `state: start hard equality keeps k in 13–20 through next-level` | The reducer path honors the range at level 2+ |

`test/tick.test.ts`:

| Test name | Behavior proved |
|-----------|-----------------|
| `rewriter on a hard equality board rewrites to a cell ≥ 13` | Seed a run where the rewriter moves onto a cell; every observed rewritten expr cell satisfies the constraint |

Red evidence: `hard equality board: every expr cell has value ≥ 13` and the k-range tests must fail against base before the change.

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm test` | All tests pass, including the new ones. |
| 2 | `npm run typecheck` | Exit 0. |
| 3 | `npm run build` | Exit 0. |

## Edges

- Fill cells must land inside band number ranges: 2k ≤ 40 ≤ 100, k ≤ 20 ≤ 30, 7 ≤ 30 — holds for all three bands; the clamp in the multiples row is a guard, not expected to fire.
- `evalExpr` still rejects ÷0 and inexact division (`null`) — the retry loop treats those as before.
- 1 is not prime (primes fill cell relies on it).

## Out of scope

- Easy's spec cell says "results 0–12" but Easy allows `+` up to 24 — a separate pre-existing gap, not this proposal.
- Player step timing.
