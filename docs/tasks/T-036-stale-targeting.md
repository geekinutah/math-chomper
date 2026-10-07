# T-036: Enemy Step Ctx Uses the Resolved Player Position (B-018)

Phase: 4 (enemies/tick)
Depends on: T-030 (player step resolution in tick) — done
Round: 1
Source: B-018 (backlog, risk low).

## Goal

In `handleTick` (src/game/tick.ts:96) the enemy step context is built from the state as it entered the tick:

```ts
const ctx = toStepCtx(state);
```

but the player step is resolved a few lines earlier (line 84: `playerPos = stepPos(...)`). So a chaser/shy that steps in the same tick targets the cell the player *was on* before resolving — up to one cell of stale targeting, self-correcting next tick. Collision (line 154) and both spawn calls (lines 168, 182) already use the resolved `playerPos`, so within one tick the game disagrees with itself about where the player is.

## Files

- `src/game/tick.ts` (modify — one line)
- `test/tick.test.ts` (modify — add two tests)

Do not create or modify files outside this list. `src/game/enemies.ts` is untouched: `stepEnemy`/`Ctx` are pure and already read whatever `playerPos` the ctx carries — the fix is at the ctx construction site, which is exactly where B-018's direction points.

## Requirements

### `src/game/tick.ts`

- Line 96: `const ctx = toStepCtx(state);` → `const ctx = toStepCtx({ ...state, playerPos });`

  `playerPos` is the local that holds the resolved position (lines 76/84). No other change: the refuge local equals `state.refuge` at this point (expiry/spawn are handled later), and `toStepCtx` maps null → undefined.

### `test/tick.test.ts`

Both tests: player at (2,2) with `stepTimer: 10, pendingDir: "right", queuedDir: null` (resolves to (3,2) within one 16.67 ms tick), level 1, no refuge, single enemy with `stepTimer: 0` (steps this tick), constant rng `() => 0.5` (never crosses the 0.003/0.002 spawn rolls, so no spawns interfere; the enemy never lands on the resolved player cell, so no hit).

| Test name | Behavior proved |
|-----------|-----------------|
| `shy targets the resolved player position` | Shy at (4,3). Under the resolved target (3,2) its only distance-increasing move is (4,4) — assert the shy ends at (4,4). Fails on the current code: against the pre-resolution target (2,2) the scan picks (5,3) instead. (Flee branch is deterministic — no rng dependence.) |
| `chaser targets the resolved player position` | Chaser at (4,0). Under the resolved target (3,2) its unique best move is (4,1) — assert (4,1). Fails on the current code: against (2,2) the tie between (4,1) and (3,0) is broken by the constant rng to (3,0). |

Move ordering for the verifier's reference: `legalMoves` iterates `ALL_DIRS` = up, down, left, right (src/game/enemies.ts:35); `stepShy`'s flee scan keeps the first strict maximum, `stepChaser` collects all minima and `pick`s with the rng.

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | Red evidence: run the two new tests against the pre-change tick.ts | Both fail (shy at (5,3), chaser at (3,0)). Keep trimmed output. |
| 2 | `npm test` | All tests pass. The existing tick suite is unmodified and green — no existing test pins the stale-target behavior (they use positions where both targets agree). |
| 3 | `npm run typecheck` | Exit 0. |
| 4 | `npm run build` | Exit 0. |

Behavioral audit for the verifier: `git diff src/` must be exactly the one line at tick.ts:96.

## Edges

- A step that does *not* resolve this tick (stepTimer > dt) leaves `playerPos` at `state.playerPos` — the new ctx is then identical to the old one; no behavior change for non-resolving ticks.
- The collision check (line 154) already used the resolved position; this closes the only remaining stale consumer.

## Out of scope

- B-010 (dedup replacement spawn — also in `tick.ts`; claim after this merges so file ownership stays exclusive), B-019 (state.ts).
