# T-041: Shared Rule-K Range Helper (B-016)

Phase: 2/3 (rules / game state)
Depends on: T-039 (frees `state.ts`)
Round: 1
Source: B-016 (backlog, risk low). Pure refactor — **no behavior change**.

## Goal

`src/game/board.ts:16-26` (`generateRule`) and `src/game/state.ts:68-75` (`genRule`) independently compute the *effective* k range for a rule:

```
top  = mode === "multiples" ? min(kRange.max, kRange.min + level + 1) : kRange.max
kMin = mode === "equality" || mode === "inequality" ? max(kRange.min, exprMinResult) : kRange.min
k    = kMin + floor(rng() * (top - kMin + 1))
```

The `top` (multiples widening) and the `kMin`/`floor` (the T-029 `exprMinResult` floor) are duplicated across the two call sites, held in sync only by a comment and T-029's mutation check. A future change to one (e.g. a new mode with a floor, or a changed multiples ramp) silently diverges from the other. Extract the range computation into one shared helper used by both.

## Files

- `src/rules/rule-k.ts` (create) — the shared `ruleKRange` helper.
- `src/game/board.ts` (modify) — `generateRule` uses the helper.
- `src/game/state.ts` (modify) — `genRule` uses the helper.
- `test/rules/rule-k.test.ts` (create) — unit tests pinning the helper.

Do not create or modify files outside this list. The helper lives in `src/rules/` (a leaf: it imports only the `Mode` type from `./types`), so neither `board.ts` nor `state.ts` gains a new import cycle. `content/bands.ts`, `rules/generate.ts`, `rules/match.ts` are untouched.

## Requirements

### `src/rules/rule-k.ts` (new)

```ts
import type { Mode } from "./types";

// Effective k range for a rule: `multiples` widens by one per level (capped at the
// band's k max); equality/inequality floor at the band's exprMinResult so the key can
// actually match a generated expression. Single source of truth shared by
// generateRule (board.ts) and genRule (state.ts) — do not re-derive it at a call site.
export function ruleKRange(
  mode: Mode,
  level: number,
  kRange: { min: number; max: number },
  exprMinResult: number,
): { min: number; max: number } {
  const max = mode === "multiples" ? Math.min(kRange.max, kRange.min + level + 1) : kRange.max;
  const min =
    mode === "equality" || mode === "inequality"
      ? Math.max(kRange.min, exprMinResult)
      : kRange.min;
  return { min, max };
}
```

### `src/game/board.ts` — `generateRule` (lines 16-26)

Replace the hand-rolled `top`/`kMin` with the helper (keep the `DEFAULT_K` fallback and the inline draw):

```ts
export function generateRule(mode: Mode, level: number, rng: () => number, band?: Band): Rule {
  const kRange = band ? getKRange(band) : DEFAULT_K;
  const { min: kMin, max: top } = ruleKRange(mode, level, kRange, band?.exprMinResult ?? 0);
  const k = kMin + Math.floor(rng() * (top - kMin + 1));
  switch (mode) { /* unchanged */ }
}
```

Add `import { ruleKRange } from "@/rules/rule-k";`. Delete the now-dead `top` and `kMin` computation lines and the "kept in sync with genRule" comment.

### `src/game/state.ts` — `genRule` (lines 68-75)

```ts
function genRule(mode: Mode, level: number, rng: () => number, band: Band): Rule {
  const { min: floor, max: top } = ruleKRange(mode, level, getKRange(band), band.exprMinResult ?? 0);
  const k = randomInt(rng, floor, top);
  switch (mode) { /* unchanged */ }
}
```

Add `import { ruleKRange } from "@/rules/rule-k";`. Delete the hand-rolled `top`/`floor` lines and the `kMin`/`kMax` destructure (they are replaced by the helper's `{ min, max }`). `randomInt` is already defined in state.ts and equals `min + floor(rng()*(max-min+1))` — same draw as board.ts, so behavior is identical.

### `test/rules/rule-k.test.ts` (new)

Pin the shared helper so a future edit to it is caught. Use a fixed `kRange` of `{ min: 2, max: 12 }` (the standard band) and `exprMinResult` of `0` and `13`:

| Test name | Call | Expected |
|-----------|------|----------|
| `multiples widens by one per level, capped` | `ruleKRange("multiples", 1, {min:2,max:12}, 0)` and `("multiples", 5, ...)` and `("multiples", 99, ...)` | level 1 → `{min:2, max:4}`; level 5 → `{min:2, max:8}`; level 99 → `{min:2, max:12}` (capped at the band max, not 103). |
| `equality floors at exprMinResult` | `ruleKRange("equality", 1, {min:2,max:12}, 13)` | `{min:13, max:12}` (the floor can exceed the max — that degenerate range is pre-existing and preserved; the helper only reports the range, it does not clamp). And `("equality", 1, {min:2,max:20}, 13)` → `{min:13, max:20}`. |
| `inequality floors at exprMinResult` | `ruleKRange("inequality", 1, {min:2,max:12}, 13)` | `{min:13, max:12}` (same floor as equality). |
| `factors and primes use the raw kRange` | `ruleKRange("factors", 1, {min:2,max:12}, 13)` and `("primes", 1, ...)` | `{min:2, max:12}` (no floor for non-equality/inequality modes, regardless of exprMinResult). |

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm test` | All tests pass. The pre-existing `bands`/`state`/`generate`/`board` suites are unchanged and green (this is behavior-neutral). The new `rule-k.test.ts` adds its cases. |
| 2 | `npm run typecheck` | Exit 0. |
| 3 | `npm run build` | Exit 0. |
| 4 | Red (helper): in a scratch copy, change the helper's `min` floor line to always return `kRange.min` (drop the `exprMinResult` floor). | `test/rules/rule-k.test.ts`'s `equality floors at exprMinResult` fails, and the existing `generate`/`state` tests that draw equality/inequality keys on a floored band also fail — proving the helper (not a call site) is the source of truth. Keep trimmed output. |

Behavioral audit for the verifier: `git diff src/` = the new `rule-k.ts` + the two call-site bodies reduced to a helper call + the `ruleKRange` import. `randomInt` and the `switch` in both call sites are unchanged. Confirm `generateBoard`/`generateExprCell` are untouched (they take a `Rule`/`GenConfig`, not a k range).

## Edges

- **Degenerate `min > max`** (equality/inequality on a band whose `kMax < exprMinResult`, e.g. standard equality floored to 13 vs `kMax` 12): preserved exactly as the two call sites already produce it. The helper reports the range; `randomInt`/the inline draw handle it identically to before. Do **not** add clamping — that would be a behavior change and is out of scope (if the floor can exceed the max on a real band, that is a separate finding, not B-016).
- The two call sites differ only in null-safety of `band` (`board.ts` allows `band?` → `band?.exprMinResult ?? 0`; `state.ts` has a required `band` → `band.exprMinResult ?? 0`) and in the draw helper (`randomInt` vs inline). Both differences stay at the call site; only the range math is shared.

## Out of scope

- B-021 (ctx dedup — `enemies.ts`/`tick.ts`, separate contract T-040 running in parallel), B-026 (dedup survivor spec decision), B-022 (test-file splits), and any clamping of the degenerate `min > max` range.
