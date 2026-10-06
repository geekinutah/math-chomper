# T-021: Rewriter Fixes (B-015 + B-016)

Phase: 5 (bugfix)
Depends on: T-015 (tick), T-018 (modes/band in state)
Round: 1

## Goal

Fix two high-severity rewriter bugs found by the Phase 5 critic:
1. **B-015**: Rewriter always writes a bare number. In equality/inequality modes, regenerated cells must be expressions (§7: "regenerated cells obey the same rule and the same constraints"). On Hard band, numbers must be in 1-100 range.
2. **B-016**: A rewrite that clears the last match never ends the level. §7: "If a rewrite or an eater-enemy clears the last match, the level ends."

## Files (modify)

- `src/game/tick.ts` (modify — fix the rewriter logic)

Do not create or modify files outside this list.

## Requirements

### Fix 1: Rewriter must respect the current mode

In the rewriter side-effect (when a rewriter leaves a cell and writes a new value):

- If `state.rule.mode` is `"equality"` or `"inequality"`: write a new **expression** (not a number). Generate a random expression using the band's `exprOps` and operand range. Use `formatExpr` + `evalExpr` from `@/rules/expr`. The cell becomes `{ kind: "expr", text, value }`.
- If `state.rule.mode` is `"multiples"`, `"factors"`, or `"primes"`: write a new **number** using the band's `numMin`..`numMax` range (not hardcoded 1-60). Use `getGenConfig(getBand(state.band))` to get the range.
- The 70%/30% match/non-match preference still applies: generate a value, check if it matches, if it matches and you want non-match (rng < 0.7), regenerate (up to 3 attempts, then accept whatever).

### Fix 2: Rewriter clearing last match ends the level

After the rewriter writes its new value in the cell it left, check: `allMatchesCleared(board, rule)`. If true, add level-clear bonus and set phase to `"level-clear"` (same as the eater branch does).

This means: after ANY cell mutation (eater empty OR rewriter rewrite), check if all matches are gone.

## Tests

Add to `test/tick.test.ts`:

| Test name | Behavior proved |
|-----------|-----------------|
| `rewriter in equality mode writes an expression` | Cell kind is "expr", not "number" |
| `rewriter in inequality mode writes an expression` | Cell kind is "expr" |
| `rewriter in multiples mode writes a number` | Cell kind is "number" |
| `rewriter uses band range: easy numbers ≤ 30` | With easy band, written number ≤ 30 |
| `rewriter uses band range: hard numbers can be > 60` | With hard band, number can be up to 100 |
| `rewriter clearing last match triggers level-clear` | Board has 1 match, rewriter rewrites it to non-match → level-clear |
| `rewriter writing a match does not clear` | Board has 1 match, rewriter writes another match → still playing |

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm test` | All tests pass (existing + new). |
| 2 | `npm run typecheck` | Exit 0. |
| 3 | `npm run build` | Exit 0. |

## Edges

- The rewriter writes in the cell it LEFT (not the cell it's on). Make sure the board mutation targets the correct cell index.
- For expression generation: pick a random op from the band's exprOps, two random operands in [exprMin, exprMax]. Format with `formatExpr`. Eval with `evalExpr`. If null (invalid), retry with different operands.
- The `getGenConfig` import: `import { getGenConfig, getBand } from "@/content/bands"`.
- The `formatExpr`/`evalExpr` import: `import { formatExpr, evalExpr } from "@/rules/expr"`.
- `allMatchesCleared` import: `import { allMatchesCleared } from "./board"`.

## Out of scope

- No rendering changes.
- No new features.
- The 70%/30% preference logic stays as-is (just fix WHAT is written, not the probability).
