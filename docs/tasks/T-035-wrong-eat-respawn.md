# T-035: Wrong-Eat Respawn + Freeze (B-019)

Phase: 3 (state)
Depends on: T-030 (IDLE_STEP, enemy-hit semantics) — done
Round: 1
Source: B-019 (backlog, risk med, pre-existing). Spec §9: "Wrong eat: cell becomes empty, life lost, same respawn rule" — the respawn rule being "player respawns on a random non-enemy cell, enemies freeze for 700 ms; if that was the last life, game over instead of respawn."

## Goal

`handleEat`'s wrong-eat branch (src/game/state.ts:177-179) decrements lives and resets the streak but leaves the player where they are and sets no freeze. Route a wrong eat through the same path as an enemy hit.

## Files

- `src/game/state.ts` (modify)
- `test/state.test.ts` (modify — add tests; the two existing non-match tests at lines 174/185 assert only lives/phase and stay unchanged)

Do not create or modify files outside this list. `main.ts` needs no change: its `playForTransition` already plays the wrong-eat beep on `next.lives < prev.lives` with an `eat` action.

## Requirements

### `src/game/state.ts`

- `handleEat(state: GameState, rng: () => number)` — gain the rng parameter (currently absent; `reduce` already holds `r`).
- Wrong-eat branch: replace
  ```ts
  const lives = state.lives - 1;
  const phase: Phase = lives <= 0 ? "game-over" : state.phase;
  return { ...state, board, lives, streak: 0, phase };
  ```
  with
  ```ts
  return handleEnemyHit({ ...state, board }, rng);
  ```
  `handleEnemyHit` performs exactly the §9 rule on top of the already-cleared cell: one life lost, streak 0, `IDLE_STEP` (voids any in-flight player step — a teleport invalidates it, same as enemy-hit), 700 ms freeze, respawn on a random non-enemy/non-refuge cell (CENTER fallback), or game-over without respawn at 0 lives.
- `reduce`: `case "eat"` passes `r` to `handleEat`.
- The correct-eat branch is untouched (it consumes no rng; a correct eat mid-step keeps the step running, per T-030).
- `state.ts` stays under 250 lines (net: 3 lines become 1).

### `test/state.test.ts`

Use the file's existing `makePlayingState` helper; drive everything through `reduce(state, { type: "eat" }, rng)`.

| Test name | Behavior proved |
|-----------|-----------------|
| `wrong eat: life lost, streak reset, 700 ms freeze` | Player on a non-match cell, 3 lives → after eat: lives 2, streak 0, freezeTimer 700, phase playing |
| `wrong eat: player respawns off enemy and refuge cells` | Seeded rng; an enemy and a refuge placed near the player's eaten cell. Assert the new `playerPos` is on none of the blocked cells (enemy cells + refuge) — the §9 "random non-enemy cell" rule |
| `wrong eat on last life: game over, no respawn` | 1 life, an enemy somewhere → phase game-over, lives 0, freezeTimer 700 (the §9 "game over instead of respawn") |
| `wrong eat: eaten cell is empty` | The cell under the player is `{ kind: "empty" }` afterward |
| `correct eat: no freeze, no teleport` | Guard against over-application: a matching eat keeps `playerPos` and leaves `freezeTimer` 0 |

Red evidence: the first three tests fail against the pre-change code (position unchanged, freezeTimer 0). The correct-eat test passes both before and after.

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | Red evidence against base | As above; keep trimmed output. |
| 2 | `npm test` | All tests pass; the existing suite unmodified and green (no existing test asserts the old stay-put behavior). |
| 3 | `npm run typecheck` | Exit 0. |
| 4 | `npm run build` | Exit 0. |

Behavioral audit for the verifier: `git diff src/` must touch only `state.ts` — the correct-eat branch and `handleEnemyHit` itself must be byte-identical.

## Edges

- A wrong eat while a player step is in flight: `IDLE_STEP` inside `handleEnemyHit` clears `stepTimer`/`pendingDir`/`queuedDir`, so the voided step cannot resume after the teleport (same rule T-030 established for enemy hits).
- `handleEnemyHit` is exported and also served by the `enemy-hit` action — this contract changes what the eat path does, not what `handleEnemyHit` does.

## Out of scope

- B-006 (game-over Menu button — `state.ts` gains no actions here; claim after this merges), B-016 (rule-k dedup — `state.ts`, claim after this merges), B-018 (tick step ctx).
