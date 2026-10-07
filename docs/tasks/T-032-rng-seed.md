# T-032: Production RNG Seed (B-009)

Phase: 3 (production wiring; no gameplay rule change)
Depends on: none
Round: 1
Source: B-009 (backlog). Every session starts with the same board: `src/main.ts` seeds its LCG with the constant 42.

## Goal

Seed the production random stream from the page-load time so the first board differs between sessions, while keeping generation deterministic for tests (which always pass an explicitly seeded rng). Verifier direction (B-009): "Seed from Date.now() % 2147483647 for production. Tests use fixed seeds." Spec check: PRODUCT_SPEC.md mandates no fixed seed; AGENTS.md requires only that generation be deterministic in a given `() => number`. No spec edit needed.

## Files

- `src/game/rng.ts` (new — the LCG moved out of `main.ts`, plus the time-seed policy)
- `src/main.ts` (modify — use the module; delete the local 5-line LCG)
- `test/rng.test.ts` (new)

Do not create or modify files outside this list. `src/game/state.ts` keeps its own `defaultRng` fallback (used only by callers that omit the rng parameter; `main.ts` always passes one) — out of scope.

## Requirements

### `src/game/rng.ts` (new)

```ts
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
```

Same Park–Miller constants and mapping as today's `main.ts` LCG — only the seed source changes, so the stream distribution is unchanged. `seedFromTime` is a pure function of the clock so it is testable; `main.ts` supplies `Date.now()`.

### `src/main.ts`

- Delete the local `let lcg = 42; const rng = ...` block.
- `const rng = createRng(seedFromTime(Date.now()));`
- Everything else untouched. `main.ts` stays well under 250 lines.

### `test/rng.test.ts` (new)

| Test name | Behavior proved |
|-----------|-----------------|
| `createRng: same seed produces identical sequences` | Two `createRng(42)` instances, 100 draws each, deeply equal |
| `createRng: different seeds produce different first draws` | `createRng(1)` vs `createRng(2)` |
| `createRng: outputs stay in [0,1)` | 1000 draws from `createRng(42)` |
| `createRng: seed 0 normalizes to a live stream` | 100 draws from `createRng(0)` all in `[0,1)` (no degenerate zero/negative) |
| `seedFromTime: 0 → 1, 1 → 2` | Mapping |
| `seedFromTime: result always in 1..2147483646` | Check `0`, `1`, `2147483644`, `2147483645`, `2147483646`, `2 * 2147483646 + 3` |

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `grep -n "lcg = 42" src/main.ts` | Red evidence pre-change: matches line 30. Post-change: no match. |
| 2 | `npm test` | All tests pass, including the new `test/rng.test.ts`. Existing suite unchanged (the stream distribution is identical, only the seed differs). |
| 3 | `npm run typecheck` | Exit 0. |
| 4 | `npm run build` | Exit 0. |

Manual (critic, not a gate): load the dev server twice; the first board differs between loads.

## Edges

- `Date.now()` is ~1.78e12 ms, well within `number` integer precision; `% (M-1)` keeps the seed ≤ 2147483646.
- Two page loads within the same millisecond get the same seed — acceptable; a sub-millisecond distinction is not worth a non-determinism source.
- Consecutive games in one session already differ (the stream continues); only the session start was fixed.

## Out of scope

- `src/game/state.ts` `defaultRng` fallback (different seed 1, callers omitting rng — tests only).
- B-017 (band grammar of last-resort cells), B-010 (replacement spawn), any `src/rules` or `src/game` file other than `rng.ts`.
