# T-033: Spawn Functions Take GameState (B-011)

Phase: 4 (housekeeping; zero behavior change)
Depends on: T-015 (tick), T-028 (ramp) — done. **Start only after T-031 merges** (T-031 may make mechanical vitest-compat edits to `test/spawn.test.ts`; no parallel editing of that file).
Round: 1
Source: B-011 (backlog). The T-014 contract specified `spawnEnemy(kind, state: GameState, rng)` and `spawnRefuge(state: GameState, simTime, rng)`; the implementer deviated with a local `SpawnState` that redeclares nine `GameState` fields plus a `blockedCells` field `GameState` does not have.

## Goal

Restore the T-014 contract signatures and delete the duplicated local type. **No behavior change of any kind.**

### Why not the backlog's "derive blocked cells from state.enemies"

B-011's advisory second clause is deliberately **not** adopted. Spec §9 defines the spawn constraint as exactly "an edge cell that is not the player's cell and not a refuge" and routes two-enemies-on-one-cell through dedup + replacement spawn. Pre-blocking enemy cells would be a second design the spec does not name (AGENTS.md: the spec wins on behavior; backlog directions are advisory). Recorded as spec proposal #5 in STATUS.md for Mike's visibility; no spec change recommended. The blocked set stays exactly player + refuge.

## Files

- `src/game/spawn.ts` (modify)
- `test/spawn.test.ts` (modify)

Do not create or modify files outside this list. `src/game/tick.ts`, `src/game/state.ts`, and all other test files are untouched: `tick.ts` already passes the full `GameState` into both functions (`spawnEnemy(kind, state, rng)` / `spawnRefuge(state, simTime, rng)`), so the call sites compile against the new signatures without edits.

## Requirements

### `src/game/spawn.ts`

- Delete the local `SpawnState` type (lines 7–22) and the `blockedCells` handling in `spawnEnemy`.
- `spawnEnemy(kind: EnemyKind, state: GameState, rng: () => number): Enemy | null` — blocked set = player cell + refuge cell (unchanged logic; drop the `state.blockedCells` loop). Keep the defensive `null` return when the filtered edge list is empty (unreachable on the 6×5 board: at most 2 of 18 edges blocked, but the function stays total-safe).
- `spawnRefuge(state: GameState, simTime: number, rng: () => number): Refuge | null` — signature only; logic unchanged.
- Keep the `export type { Enemy, EnemyKind, Refuge };` re-export line (tests import from here).
- `import type { GameState, PlayerPos } from "@/game/state";` already covers both names.
- File stays under 250 lines (it shrinks).

### `test/spawn.test.ts`

- Remove `type SpawnState` from the `@/game/spawn` import; add `type Enemy, type Refuge` (re-exported by spawn.ts).
- `makeState(overrides: Partial<GameState> = {}, extra: { enemies?: Enemy[]; refuge?: Refuge | null } = {}): GameState` — same body, minus `blockedCells`, minus the `as SpawnState` cast (the object is exactly `GameState` now).
- Replace the test `null when no valid edge (player + blocked cells cover all edges)`: with only player + refuge blocking, all-edges-blocked is inexpressible. Replace it with `spawnEnemy returns non-null with player and refuge both on edges` (player and refuge on two distinct edge cells → a spawn still succeeds and lands on a different edge cell).
- Keep every other test unchanged, including `not on player cell` and `not on refuge` (both still expressible through `overrides` / `extra`).

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `rg -n "SpawnState\|blockedCells" src test` | Red evidence pre-change: matches. Post-change: no match anywhere in `src/` or `test/`. |
| 2 | `npm test` | All tests pass; the tick suite in particular is unchanged and green (its constant-0.002 rng never crosses the strict-`<` enemy-spawn threshold, so the spawn path is not exercised — no expectations shift). |
| 3 | `npm run typecheck` | Exit 0. |
| 4 | `npm run build` | Exit 0. |

Behavioral audit for the verifier: `git diff src/` must show only the two signature lines and the `SpawnState`/`blockedCells` deletions. Any other diff in `src/` is a FAIL.

## Edges

- The shipped "no valid edge → null" unit test was only reachable through the never-populated `blockedCells`; its replacement (non-null invariant) covers the production-reachable case.
- `Enemy` ids in the rewritten tests: plain integers; `spawnEnemy` ignores `id` (tick assigns ids at the call site — verify against `tick.ts:159-161`; it does).

## Out of scope

- Pre-blocking enemy cells in `spawnEnemy` (spec proposal #5; not adopted).
- B-010 (dedup replacement spawn — `tick.ts`, blocked on T-030 file ownership).
- B-016 (`board.ts`/`state.ts` rule-k duplication — `state.ts`, blocked on T-030).
- Rendering, audio, storage, any `src/rules` file.
