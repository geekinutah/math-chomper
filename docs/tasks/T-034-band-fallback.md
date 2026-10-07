# T-034: Band-Aware Last-Resort Board Cells (B-017)

Phase: 2 (rules)
Depends on: T-029 (board-gen cap + floor) — done
Round: 1
Source: B-017 (backlog). Mike's 2026-10-06 decision on spec proposal #6: make the last-resort cells band-aware.

## Goal

The two last-resort paths in `src/rules/generate.ts` emit constant cells that can violate the band's expression grammar:

- The 100-attempt fallback in `generateExprCell` (lines 44–46): fixed `2×7` (value 14). On Easy this uses an op (`×`) outside `config.exprOps` and a result above the §8 Easy result range.
- The known-valid fills in `fillMatchCell`/`fillNonMatchCell` (lines 79, 82, 99, 102): build expressions from `k` as an operand (`k÷1`, `k×2`). On Hard, k is 13–20, exceeding the 0–12 operand range.

Both paths are only reachable after a degenerate-rng draw (100-attempt cell fallback, or the 1000-draw board cap), but when reached they must still obey the band grammar. Fix: derive every last-resort expression from `GenConfig` (op from `config.exprOps`, operands within `config.exprMin`/`exprMax`, result respecting `config.exprMinResult`). Number fills (multiples/factors/primes) are unchanged — number cells have no op grammar, and their values are already within every band's range.

## Files

- `src/rules/generate.ts` (modify)
- `test/rules/generate.test.ts` (modify — add tests only; do not weaken existing ones)

Do not create or modify files outside this list. `src/content/bands.ts` already carries everything needed (`exprOps`, `exprMin`, `exprMax`, `exprMinResult`) — no config shape change.

## Requirements

### `src/rules/generate.ts`

1. **`generateExprCell` fallback.** Replace the fixed `2×7` with a deterministic candidate scan over `config`:

   ```ts
   // Candidates in fixed order; the first that is legal for this config wins.
   const cands: Array<{ a: number; b: number; op: "+" | "−" | "×" | "÷" }> = [
     { a: config.exprMin, b: config.exprMax, op: "+" },
     { a: config.exprMax, b: config.exprMax, op: "+" },
     { a: config.exprMax, b: config.exprMax, op: "×" },
   ];
   ```

   A candidate is legal when its op is in `config.exprOps` and `evalExpr(text) !== null` and the value satisfies `config.exprMinResult` (if defined). Return the first legal candidate. If none is legal (only possible with a hand-crafted config whose floor exceeds every candidate's value), return the last candidate anyway — it is still classifiable by `matches`, and §7 only forbids emitting a cell the engine cannot classify. Comment the invariant: for every shipped band, candidate 1 (Easy/Standard) or 2 (Hard: `12+12` = 24 ≥ 13) is legal.

2. **`fillMatchCell` equality:** value must equal `k` with in-range operands:
   ```ts
   const a = Math.min(rule.k, config.exprMax);
   const b = rule.k - a; // 0 when k ≤ exprMax; 1..12 for the shipped k range 13..20
   return { kind: "expr", text: formatExpr(a, "+", b), value: rule.k };
   ```
   Keep the existing "deliberately breaks the floor" comment (a k below the floor still yields value k; band aesthetics are not a level rule). Document the invariant: k ≤ 2·exprMax for all shipped bands (max k 20, exprMax 12), so `b` stays in range; `+` is in every band's op list.

3. **`fillMatchCell` inequality** and **`fillNonMatchCell` equality:** value must differ from `k`:
   ```ts
   return { kind: "expr", text: formatExpr(config.exprMax, "+", config.exprMax), value: 2 * config.exprMax };
   ```
   `2·exprMax` = 24 differs from every shipped k (2–20). Document the invariant.

4. **`fillNonMatchCell` inequality:** value must equal `k` — the same recipe as (2).

### `test/rules/generate.test.ts`

The file's existing `config` / `easyConfig` / `hardConfig` literals are the three shipped bands' `GenConfig`s — reuse them. Add a small local helper `operands(text: string): { a: number; op: string; b: number } | null` that finds the op character in the text and parses both sides (texts never contain minus signs: results and operands are non-negative).

| Test name | Behavior proved |
|-----------|-----------------|
| `generateExprCell fallback: easy → "0+12" (12)` | Cycle rng `[0.6, 0.05, 0.99]` forces all 100 attempts to fail on `easyConfig` (op `−`, `0−12` → eval null) → the fallback cell is exactly `{ kind: "expr", text: "0+12", value: 12 }`; op in the band's list, operands in 0–12 |
| `generateExprCell fallback: hard → "12+12" (24), clears the floor` | Cycle rng `[0.3, 0.05, 0.95]` forces all attempts to fail on `hardConfig` (`0−12` → null) → fallback `12+12` = 24 ≥ 13, operands in range |
| `generateExprCell fallback: standard → "0+12" (12)` | Cycle rng `[0.3, 0.05, 0.95]` on `config` (the 4-op list makes the easy-style 0.6 draw `×`, which succeeds on Standard's un-floored grammar; 0.3 forces `−` → `0−12` → null × 100 → fallback) → `0+12` = 12. Corrected at merge per B-024. |
| `degenerate board: every expr cell obeys the band grammar` | For each of the three configs and rules `{equality, k: 13}` / `{inequality, k: 13}`, with the always-failing cycle rng `[0.6, 0.05, 0.99]` (forces the per-cell fallback on every draw and the 1000-draw cap → exercises both fill paths): for every expr cell, the op is in `config.exprOps` and both operands are integers within `config.exprMin`/`exprMax`. This fails on the current code: the old fill emits `13÷1` / `13×2` (operand 13 > 12) and the old fallback emits `2×7` (`×` ∉ Easy's ops) |
| `degenerate board still reaches its match quotas` | Same setup: match count in 4–10 for both modes on all three configs (proves the new fills still satisfy the rule: equality fill `12+1` = 13 matches; inequality fill `12+12` = 24 ≠ 13 matches) |

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | Red evidence: run the new tests against the pre-change `generate.ts` (e.g. on a pristine checkout of the base) | The two `generateExprCell` fallback tests and the grammar test fail (fallback `2×7` and fills `13÷1`/`13×2`); the quota test passes (old fills also satisfied the rule). Keep trimmed output. |
| 2 | `npm test` | All tests pass, including the existing suite (the normal generation path is untouched — only the two last-resort paths changed). |
| 3 | `npm run typecheck` | Exit 0. |
| 4 | `npm run build` | Exit 0. |

Behavioral audit for the verifier: `git diff src/` must touch only `src/rules/generate.ts`. The normal 100-attempt draw loop and `generateBoard`'s cap/quotas must be byte-identical.

## Edges

- `b = rule.k - a` can be 0 (`k+0`); `+` with a zero operand is legal grammar (§7 add/subtraction 0–12) and reads fine on a board.
- The candidate list intentionally omits `÷`: a `÷` fallback would need an in-range exact-dividend pair, which the fixed-a/b recipe cannot guarantee. `+`/`×` cover every shipped floor (`+` ≤ 24 max, `×` 144 max).
- `genRewriteCell` in `src/game/tick.ts` reuses `generateExprCell` for rewriter-enemy writes, so it inherits the band-aware fallback for free; it is out of this contract's file scope and needs no change.

## Out of scope

- B-018 (step ctx staleness, `tick.ts`), B-019 (wrong-eat respawn, `state.ts`), any `src/game` file, the §8 Easy "results 0–12" descriptive range (not an operational GenConfig field; normal-path draws already ignore it — closing that would be a new decision).
