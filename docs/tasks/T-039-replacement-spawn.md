# T-039: Enemy Dedup Schedules a Replacement Spawn (B-010)

Phase: 4 (enemies/tick)
Depends on: T-038 (frees `state.ts`); no other contract is in flight
Round: 1
Source: B-010 (backlog, risk low). Spec §9 (line 237): "If two enemies would occupy one cell, the arriving one removes the resident. Schedule a replacement spawn 2–4 seconds later if the alive count is under the cap."

## Goal

`handleTick` (src/game/tick.ts:141-150) dedups enemies that land on one cell (keeps first, drops the rest) but never replaces the dropped one. Spec §9 requires a **replacement spawn 2–4 s later, if the alive count is under the cap**. Currently the population only recovers via the generic 0.002/tick trickle spawn (line 180), so a collision permanently shrinks the enemy population. Add a `pendingSpawnAt` timer to `GameState` and drive the schedule/fire in `handleTick`.

## Files

- `src/game/state.ts` (modify) — add the `pendingSpawnAt` field to the `GameState` type + initialize it in `createInitialState`.
- `src/game/tick.ts` (modify) — schedule on a collision, fire when due, return the field.
- `test/tick.test.ts` (modify) — add `pendingSpawnAt: null` to the `makeState` helper (line 43) + the new tests below.
- `test/state.test.ts` (modify) — **mechanical only**: add `pendingSpawnAt: null` to the `makePlayingState` helper (line 50) so the new required field typechecks. No behavior test lives here.
- `test/enemies.test.ts` (modify) — **mechanical only**: add `pendingSpawnAt: null` to its state helper (line 48).
- `test/render.test.ts` (modify) — **mechanical only**: add `pendingSpawnAt: null` to its state helper (line 88).

Do not create or modify files outside this list. The four `pendingSpawnAt: null` additions in the three test helpers + `createInitialState` are a mechanical consequence of the new **required** field (the codebase models absent state as `null` — see `refuge: Refuge | null`, `pendingDir: Dir | null`); they are not behavior changes. `enemies.ts`, `board.ts`, `spawn.ts`, `main.ts` are untouched (`spawnEnemy(kind, state, rng)` already returns a legal edge cell and is reused).

## Requirements

### `src/game/state.ts`

- `GameState` type: add `pendingSpawnAt: number | null;` as the last field, after `queuedDir: Dir | null;` (line 39). `null` = no replacement is scheduled; otherwise a `simTime` (ms) timestamp at which it fires.
- `createInitialState`: add `pendingSpawnAt: null,` after `queuedDir: null,` (line 121).

### `src/game/tick.ts`

1. Add a local near the other tick locals (after `let refuge = state.refuge;`, line 67): `let pendingSpawnAt = state.pendingSpawnAt;`
2. Hoist `const cap = enemyCap(state.level);` to just before the collision check so both the replacement logic and the existing trickle spawn share it. Delete the local `const cap = enemyCap(state.level);` that currently sits at line 179 (re-declaring it in the same scope would not typecheck).
3. Immediately after the dedup block (line 150) and **before** the player-collision check (line 152), add the replacement logic:

   ```ts
   const removedCount = newEnemies.length - deduped.length;

   // Fire a replacement that was scheduled 2–4 s after an earlier collision.
   if (pendingSpawnAt !== null && simTime >= pendingSpawnAt) {
     pendingSpawnAt = null;
     if (deduped.length < cap) {
       const kind = pickEnemyKind(state.band, state.level, rng);
       const ne = spawnEnemy(kind, { ...state, playerPos }, rng);
       if (ne) { ne.id = nextId(deduped); deduped.push(ne); }
     }
   }

   // Schedule a replacement when a collision removed an enemy and we are under cap.
   if (removedCount > 0 && deduped.length < cap && pendingSpawnAt === null) {
     pendingSpawnAt = simTime + 2000 + rng() * 2000;
   }
   ```

   It sits before the collision check so a same-tick enemy–enemy collision **and** player hit still schedules the replacement (the early return at line 155 must then carry it — see next bullet).
4. Add `pendingSpawnAt` to the player-collision early-return object (line 155-157): `{ ...state, simTime, enemies: deduped, refuge, board: newBoard, phase, playerPos, pendingSpawnAt }`.
5. Add `pendingSpawnAt,` to the final returned object (line 195-208, next to `enemies: deduped`).
6. Leave the existing generic trickle spawn (now `if (deduped.length < cap && rng() < 0.002)`) exactly as-is, using the hoisted `cap`.

The fire is guarded by `deduped.length < cap` so a scheduled spawn can never push the population above the cap; `spawnEnemy` already avoids the player and refuge cells.

### `test/tick.test.ts`

Add `pendingSpawnAt: null,` to `makeState` (line 43). Then add these tests in the existing `describe("tick", ...)` block. Use a constant rng `() => 0.5` unless noted; level 4 → `enemyCap` is 2; no refuge; player at (2,2) with `stepTimer: 0, pendingDir: null` (no player step this tick).

| Test name | Setup | Behavior proved |
|-----------|-------|-----------------|
| `collision schedules a replacement spawn` | Two `straight` enemies, `stepTimer: 0` so both step this tick: A at (0,0) `dir: "down"`, B at (0,2) `dir: "up"`. After one tick both land on (0,1) → B is deduped. | `after.enemies` has length 1 (B removed); `after.pendingSpawnAt` is non-null and within `[after.simTime + 2000, after.simTime + 4000]` (with rng 0.5 it is exactly `after.simTime + 3000`). |
| `a scheduled replacement spawns after the delay and clears the timer` | `makeState({ level: 4, enemies: [one enemy at (5,5) dir up stepTimer 0], pendingSpawnAt: 100, simTime: 100 })` (timer already due), player at (2,2). | After one tick: `after.enemies` has length 2 (a replacement spawned on a free edge cell), and `after.pendingSpawnAt` is `null`. |
| `a scheduled spawn does not exceed the cap` | `makeState({ level: 4, enemies: [two enemies at (5,5)/(5,4) dir up stepTimer 0], pendingSpawnAt: 100, simTime: 100 })` — two enemies at cap 2, timer due. | After one tick: `after.enemies` still has length 2 (the `deduped.length < cap` guard blocks the 3rd), and `after.pendingSpawnAt` is `null` (the timer is consumed). |
| `no second schedule while one is pending` | Two collisions in a row while `pendingSpawnAt` is already set: start with `pendingSpawnAt: 5000` and a colliding pair (A (0,0) down, B (0,2) up, both `stepTimer 0`), `simTime: 0`. | After one tick: `after.pendingSpawnAt` is still `5000` (the `pendingSpawnAt === null` guard prevents a second schedule; the due-check does not fire because 5000 > simTime). |

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | Red: write the 4 tests against the **unchanged** `tick.ts`/`state.ts` (with the `pendingSpawnAt: null` helper additions only). | The "collision schedules" test fails (`pendingSpawnAt` is `null`, never set) and the "spawns after delay" test fails (no spawn). Keep trimmed output. The other two may or may not fail pre-change; the first two must. |
| 2 | `npm test` | All tests pass (including the pre-existing tick/enemies/render/state suites — the helper additions must not break them). |
| 3 | `npm run typecheck` | Exit 0. |
| 4 | `npm run build` | Exit 0. |

Behavioral audit for the verifier: `git diff src/` = (a) the `pendingSpawnAt` field + `createInitialState` init in `state.ts`, and (b) the schedule/fire/return + hoisted `cap` + early-return field in `tick.ts`. The three test-helper edits are one line each. No other file changes.

## Edges

- **Freeze interaction:** `simTime` advances even during the 700 ms post-hit freeze (line 62 runs before the early return), so a `pendingSpawnAt` scheduled just before a hit fires 2–4 s of sim-time later, spread across ticks. Correct.
- **Double collision** (enemy–enemy **and** enemy–player in one tick): the schedule runs before the collision check and the early return carries `pendingSpawnAt`, so the replacement is still scheduled even though the player is also hit.
- **At-cap fire:** a scheduled spawn that becomes due while the population is at cap is a no-op (guard) but the timer is cleared, so it will not fire again.
- **Refuge:** `spawnEnemy` avoids the refuge cell; a replacement will not spawn on it.

## Out of scope

- B-021 (ctx `as StepCtx` dedup — `enemies.ts`/`tick.ts`; claim after this merges, since both touch `tick.ts`), B-016 (rule-k dedup — `board.ts`/`state.ts`; claim after this merges), B-022 (test-file splits — `tick.test.ts` grows ~30 lines here; the split is separate housekeeping), B-006/B-023 (done in T-038).
- The "arriving removes the resident" vs "keep first in array order" question (spec §9 line 237 vs tick.ts:144-150) is a *separate* semantics issue, not B-010. Do not change which enemy survives the dedup; if it is wrong, file it as a new backlog item in your report.
