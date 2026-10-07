# T-040: Enemy Step Ctx Takes GameState Directly (B-021)

Phase: 4 (enemies/tick)
Depends on: T-036 (B-018 — the ctx already carries the resolved playerPos) + T-039 (frees `tick.ts`)
Round: 1
Source: B-021 (backlog, risk low). Pure refactor — **no behavior change**.

## Goal

`src/game/enemies.ts:37` defines `type Ctx = GameState & { refuge?: Refuge }`. Because `GameState.refuge` is `Refuge | null`, intersecting with `refuge?: Refuge` collapses the property to bare `Refuge` (a tsc probe confirms `Refuge` is not assignable) — yet the runtime value is `Refuge | null`, forced in through `toStepCtx`'s `as StepCtx` cast (tick.ts:48-52) and guarded by `state.refuge !== undefined` (enemies.ts:51). The type says "always a non-null object"; the guard is load-bearing at runtime but dead to the type. This is the same cast-papering-over-a-bridge pattern as B-011. Since `refuge` is already `Refuge | null` in `GameState`, the cleanest fix is to drop the `Ctx`/`StepCtx` indirection entirely and pass `GameState` (with the resolved `playerPos` per B-018) straight into `stepEnemy`.

## Files

- `src/game/enemies.ts` (modify) — delete `Ctx`; all step helpers take `GameState`; `isRefuge` checks `!== null`.
- `src/game/tick.ts` (modify) — delete `toStepCtx` + `StepCtx`; build the ctx as a plain `GameState`.
- `test/enemies.test.ts` (modify) — `makeState` returns `GameState` with `refuge: null`; delete the local `TestState` + its cast.

Do not create or modify files outside this list. `spawn.ts`/`state.ts`/`board.ts` are untouched (`Refuge` stays defined + exported in enemies.ts — it is the canonical type used by `state.ts` and `spawn.ts`).

## Requirements

### `src/game/enemies.ts`

- Delete `type Ctx = GameState & { refuge?: Refuge };` (line 37).
- Change every helper's `state: Ctx` parameter to `state: GameState`: `isRefuge` (51), `legalMoves` (55), `stepStraight` (71), `stepShy` (87), `randomStep` (106), `stepChaser` (112), `stepEnemy` (130).
- `isRefuge` (line 51-53): `state.refuge !== undefined` → `state.refuge !== null`. (Everything else in the function body is unchanged — `sameCell(p, state.refuge.pos)` is valid once the null check narrows `Refuge | null` → `Refuge`.)
- Keep `export type Refuge = { pos: PlayerPos; expiresAt: number };` (line 13-16) and the `GameState` import (line 1) — both still used. `Refuge` is no longer referenced by name inside `Ctx` but remains the exported canonical type; that is fine (exports are not `noUnusedLocals` subjects).

### `src/game/tick.ts`

- Delete `type StepCtx = Parameters<typeof stepEnemy>[1];` (line 48) and the whole `function toStepCtx(...) { ... }` (lines 50-52).
- The step-ctx construction (the `const ctx = toStepCtx({ ...state, playerPos });` line, ~96): → `const ctx = { ...state, playerPos };`. This preserves B-018 (the resolved `playerPos` is what the step functions read) and `stepEnemy(e, ctx, rng)` now typechecks as a `GameState` with `refuge: Refuge | null` — no cast.

### `test/enemies.test.ts`

- Delete `type TestState = GameState & { refuge?: Refuge };` (line 26).
- `makeState` (line 28): return type `TestState` → `GameState`; the `refuge: undefined as unknown as Refuge | null,` line (43) → `refuge: null,`; drop the trailing `as TestState` (line 51) so it returns the plain object.
- If `Refuge` (imported at line 11) becomes unused after the above, remove it from the import to satisfy `noUnusedLocals`.
- The tests that assign `state.refuge = { pos, expiresAt }` (lines 92, 176, 188, 199, 211) work unchanged: `GameState.refuge` is a mutable `Refuge | null`.

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | Red: in a scratch copy, change `isRefuge` back to `state.refuge !== undefined` (the old check) while keeping `refuge: null` as the "no refuge" value. Run the enemies suite. | The refuge tests (e.g. `legalMoves excludes refuge`, `no enemy steps onto refuge`) now fail: with `refuge: null`, `null !== undefined` is `true`, so every cell is treated as refuge. Keep trimmed output. (This proves the `!== null` check is load-bearing and the old `!== undefined` is wrong for a `null`-defaulted field.) |
| 2 | `npm test` | All tests pass — identical to the pre-refactor count (this is a behavior-neutral refactor; no test should change result). |
| 3 | `npm run typecheck` | Exit 0. |
| 4 | `npm run build` | Exit 0. |

Behavioral audit for the verifier: `git diff src/` must show **only** the `Ctx`→`GameState` parameter renames, the `isRefuge` `!== undefined`→`!== null` flip, the deleted `Ctx` line, and the `toStepCtx`/`StepCtx` deletion + plain-object ctx in `tick.ts`. No step-function body logic changes. Confirm via a mutation (revert one step body) that the pre-existing enemy tests still guard the actual movement behavior.

## Edges

- `refuge` is `Refuge | null` in `GameState`; the `!== null` check in `isRefuge` is exactly the "no refuge" sentinel. `legalMoves`/`stepStraight` call `isRefuge`, so they inherit the correct check with no further change.
- B-018 (resolved playerPos) is preserved: the ctx is still built as `{ ...state, playerPos }` where `playerPos` is the resolved local.
- The `eater`/`rewriter`/`straight`/`shy`/`chaser` step bodies are untouched — only the `state` parameter's type name changes.

## Out of scope

- B-026 (dedup survivor "arriving vs resident" — `tick.ts` dedup; a spec decision, not this refactor), B-016 (rule-k dedup — `board.ts`/`state.ts`, separate contract T-041 running in parallel), B-022 (test-file splits).
