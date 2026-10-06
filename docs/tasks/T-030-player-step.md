# T-030: Player Step Duration + Input Buffer (B-015)

Phase: 6
Depends on: T-006 (state), T-008 (keyboard), T-015 (tick), T-028 (ramp convention) — all done
Round: 1
Source: B-015 (backlog). Mike's 2026-10-06 decision: follow spec §6, not the implementation.

## Goal

Implement the player-side movement timing spec §6 prescribes: "Step duration for the player is about 140 ms at level 1, floored at 80 ms", "Move one cell. Buffered: a tap during a move queues the next step", and the invariant "Enemy step is always slower than the player step". Today `handleMove` moves a cell instantly on every `move` action and `attachKeyboard` drops all `e.repeat` events, so no step duration and no buffer exist.

## Design decisions (contract-level, for the verifier to audit against §6)

- `playerStepDelay(level) = max(80, round(140 * 0.85 ** (level - 1)))`. The spec anchors 140 ms at level 1 and a floor of 80 ms but names no ramp curve; the ×0.85 factor inherits the project's only established ramp convention (T-028, accepted by Mike for the enemy side). Expected values: L1 = 140, L2 = 119, L3 = 101, L4 = 86, L5+ = 80 (floor).
- One pending step + one queued step (single-slot buffer, newest tap wins). This is the whole buffer; no key-level throttling — the state machine is the source of truth for cadence.
- Movement and eating stay separate exactly as §6 defines them (arrows move, Space/Enter eat). Eating is untouched: it operates on the current `playerPos` and may fire mid-step (it eats the cell the player is still on).
- Steps resolve in `handleTick`, before enemy steps, so the collision check ("same cell at end of any step") sees both resolved positions.

## Files

- `src/game/player.ts` (new — `playerStepDelay(level)` and `stepPos(pos, dir)`, the clamped one-cell move extracted out of `handleMove`)
- `src/game/state.ts` (modify)
- `src/game/tick.ts` (modify)
- `src/input/keyboard.ts` (modify)
- `test/state.test.ts` (modify — helper fields + new tests)
- `test/tick.test.ts` (modify — helper fields + new tests)
- `test/render.test.ts` (modify — helper fields only)
- `test/enemies.test.ts` (modify — helper fields only)

Do not create or modify files outside this list. `src/input/touch.ts`, `src/render/`, `src/audio/`, and `PRODUCT_SPEC.md` are untouched; touch gestures dispatch the same `move` action and inherit the buffer for free.

`src/game/state.ts` is 248 of 250 lines today, so the `stepPos`/`playerStepDelay` extraction into `src/game/player.ts` is mandatory, not optional.

## Requirements

### `src/game/player.ts` (new)

```ts
import type { Dir, PlayerPos } from "@/game/state";
import { COLS, ROWS } from "@/game/state";

const BASE_PLAYER_STEP_MS = 140;
const MIN_PLAYER_STEP_MS = 80;
const RAMP_FACTOR = 0.85;

export function playerStepDelay(level: number): number {
  const ms = BASE_PLAYER_STEP_MS * RAMP_FACTOR ** (level - 1);
  return Math.max(MIN_PLAYER_STEP_MS, Math.round(ms));
}

export function stepPos(pos: PlayerPos, dir: Dir): PlayerPos { /* the clamp logic moved out of handleMove */ }
```

### `src/game/state.ts`

- `GameState` gains three required fields: `stepTimer: number` (ms until the pending step resolves; 0 = idle), `pendingDir: Dir | null`, `queuedDir: Dir | null`. Initialize all three (`0` / `null` / `null`) in `createInitialState` and every other constructor (`startGame`).
- `handleMove`:
  - `stepTimer === 0` (idle) → start: `pendingDir = dir`, `stepTimer = playerStepDelay(state.level)`. Position unchanged.
  - `stepTimer > 0` (mid-step) → queue: `queuedDir = dir`. Position and timer unchanged.
- `handleEnemyHit`: clear all three (`stepTimer: 0, pendingDir: null, queuedDir: null`) — the respawn is a teleport, so an in-flight step is void.
- `next-level` and `startGame`/`restart` produce fresh states, so the fields are naturally reset there via the constructors.
- Delete the inline clamp switch from `handleMove`; use `stepPos`.

### `src/game/tick.ts`

- After the freeze early-return, resolve the player step: if `stepTimer > 0`, subtract `dtMs`. When it reaches 0: apply `stepPos(playerPos, pendingDir)`, then if `queuedDir !== null` start the next step (`pendingDir = queuedDir`, `queuedDir = null`, `stepTimer = playerStepDelay(level)`), else `pendingDir = null`, `stepTimer = 0`. A negative remainder is discarded, not carried.
- The existing collision loop compares each enemy's post-step position against `state.playerPos` — change it to the resolved player position so a player step and an enemy step landing on the same cell in one tick is a hit.
- Where the tick can leave `playing` (eater/rewriter clears the last match → `level-clear`), clear `stepTimer`/`pendingDir`/`queuedDir`.

### `src/input/keyboard.ts`

- Remove the blanket `if (e.repeat) return;` for move and eat keys: held keys dispatch on every repeat, and the state's buffer yields one step per `playerStepDelay`. Eat-on-empty is already a no-op, so repeat eat is harmless.
- Keep the repeat guard for Escape (repeat would flap pause/resume) and for R (repeat would fire repeated restarts).

## Tests to add

`test/state.test.ts` (add the three fields to the `makePlayingState` helper literal):

| Test name | Behavior proved |
|-----------|-----------------|
| `playerStepDelay: level 1 → 140` | Spec anchor |
| `playerStepDelay: 2 → 119, 3 → 101, 4 → 86` | Compounds ×0.85 per level |
| `playerStepDelay: level 5+ → 80` | Floored |
| `playerStepDelay < enemyStepDelay for levels 1..100` | Spec invariant: enemy step always slower than player step |
| `move when idle starts a step: position unchanged, stepTimer 140, pendingDir set` | The step is timed, not instant |
| `move mid-step queues: queuedDir set, stepTimer and position unchanged` | §6 buffer |
| `tick shorter than the step moves nothing` (dt 100 ms against a 140 ms step) | Timer advances, no resolution |
| `tick ≥ step duration resolves one cell and idles` | Step completes |
| `queued step chains after resolution` (start right, queue left, two ticks) | Buffer feeds the next step |
| `move at right edge clamps after resolution` | Clamp survives the move to `stepPos` |
| `move during pause starts no step` | Phase guard (update the existing test to assert `stepTimer` 0 / `pendingDir` null) |
| `enemy-hit clears pendingDir and queuedDir` | No phantom step after respawn |
| `level-clear during tick clears pending + queued` | No step chains onto the next level's board |

Update the eight existing directional/clamp move tests: after the `move` dispatch, dispatch `{ type: "tick", dt: 0.14 }` (140 ms ≥ L1 step) before asserting `playerPos`. Their current instant-move assertions are the red evidence.

`test/tick.test.ts` (add the three fields to the `makeState` helper literal):

| Test name | Behavior proved |
|-----------|-----------------|
| `player step freezes while freezeTimer > 0` (early return leaves stepTimer and position untouched) | Freeze covers the player step too |
| `enemy and player land on the same cell in one tick → hit` (player at (2,2) starting right, enemy at (4,2) stepping left; assert life lost, respawn elsewhere) | Collision uses the resolved player position; fails on current code, which compares against the pre-tick position |

`test/render.test.ts`, `test/enemies.test.ts`: add the three fields to the state helper literals only; no behavior changes.

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm test` | All tests pass, including the new ones. Red evidence first: the timed-move and chaining tests fail against the pre-change code. |
| 2 | `npm run typecheck` | Exit 0. |
| 3 | `npm run build` | Exit 0. |
| 4 | `wc -l src/game/state.ts` | ≤ 250 lines. |

## Edges

- `0.85 ** n` is float; round to integer ms, floor applied after rounding (same convention as T-028).
- Fixed 16.67 ms sim steps against a 140 ms step: the resolving tick overshoots by up to ~17 ms; the remainder is discarded. Spec needs no finer precision.
- Rendering needs no change: the canvas draws `playerPos` and "no analog sliding" (§6) means the hop is a discrete jump, as today.

## Out of scope

- B-009 (fixed LCG seed), B-010 (dedup replacement spawn), B-006 (game-over Menu button).
- Touch input, gamepad, audio, any change to `handleEat`.
