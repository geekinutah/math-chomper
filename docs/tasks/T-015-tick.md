# T-015: Tick + State Extension (Enemies, Refuge, Collision)

Phase: 4
Depends on: T-013 (enemies), T-014 (spawn)
Round: 1

## Goal

Extend the game state with enemies and refuge, and implement the tick handler that steps enemies, resolves collisions, manages refuge lifecycle, and handles side effects (eater empties, rewriter rewrites).

## Files (create or modify)

- `src/game/tick.ts` (create new)
- `src/game/state.ts` (modify — extend types, call tick)
- `test/state.test.ts` (modify — add enemy/refuge/collision tests)
- `test/tick.test.ts` (create new)

Do not create or modify files outside this list.

## Requirements

### Extend `src/game/state.ts`

Add to `GameState`:
```ts
enemies: Enemy[];
refuge: Refuge | null;
simTime: number;       // ms, accumulated via tick
freezeTimer: number;   // ms, enemies frozen after player hit
```

Add to `Action`:
```ts
| { type: "enemy-hit" }  // internal, dispatched by tick when collision detected
```

Update `createInitialState`: enemies = [], refuge = null, simTime = 0, freezeTimer = 0.

Update `reduce`:
- `tick` action: calls `handleTick(state, action, rng)` from `@/game/tick`.
- `enemy-hit` action: lives--, streak=0, freezeTimer=700, respawn player to random non-enemy/non-refuge cell. If lives=0, game-over.

The `handleMove` and `handleEat` actions remain unchanged (they work the same).

### `src/game/tick.ts` (new)

```ts
import type { GameState, Action } from "./state";
import type { Enemy, Refuge } from "./enemies";
import { stepEnemy, legalMoves, sameCell, COLS, ROWS } from "./enemies";
import { spawnEnemy, spawnRefuge, enemyCap } from "./spawn";
import { generateBoardForRule } from "./board";

export function handleTick(state: GameState, action: { type: "tick"; dt: number }, rng: () => number): GameState;
```

`handleTick` logic (in order):
1. If phase is not "playing", return state unchanged.
2. `simTime += dt * 1000` (action.dt is in seconds, convert to ms).
3. If `freezeTimer > 0`: decrement by `dt*1000`. If still > 0, return state (enemies frozen). Skip steps.
4. For each enemy: decrement `stepTimer` by `dt*1000`. If ≤ 0, step it:
   - Call `stepEnemy(enemy, state, rng)` to get new pos.
   - **Eater side effect**: set the cell the enemy LEFT to `{kind:"empty"}`. If that was the last match, trigger level-clear.
   - **Rewriter side effect**: write a new random value/expr in the cell the enemy LEFT (70% non-match, 30% match). Use `generateBoardForRule` logic or inline.
   - **Refuge check**: if new pos is a refuge, don't move (stay in place).
   - **Two enemies on same cell**: if another enemy is at the new pos, remove the resident. Schedule replacement (if alive count < cap, add a new enemy at a random edge).
   - Reset `stepTimer` to 420.
5. **Collision check**: if any enemy `sameCell(enemy.pos, playerPos)`:
   - Dispatch `enemy-hit` (lose life, freeze 700ms, respawn player).
   - Remove or keep the enemy? Per spec: "player loses a life, enemies freeze for 700ms, player respawns on a random non-enemy cell." The enemy stays.
6. **Refuge expiry**: if refuge exists and `simTime >= refuge.expiresAt`, set refuge = null.
7. **Refuge spawn**: if no refuge and rng() < 0.12 (roughly every 8s at 60Hz ≈ 0.12 per tick... actually use a timer: spawn refuge if `simTime` has advanced > 8000ms since last spawn). Simpler: spawn if no refuge and `rng() < 0.003` per tick (≈ every 8s at 60Hz).
   - If the new refuge is on an enemy cell, remove that enemy.
8. **Enemy spawn**: if enemies.length < enemyCap(level) and `rng() < 0.002` per tick, spawn a new enemy.
   - Phase 3 has no band, so use: level < 4 → "straight", level 4-7 → "straight" or "shy" (rng), level 8+ → any kind.

### Collision and respawn

When `enemy-hit` is processed:
- lives--, streak = 0, freezeTimer = 700.
- If lives = 0: phase = "game-over". No respawn.
- Else: respawn player to a random cell that is not occupied by an enemy and not a refuge. Use rng.

## Tests to write (in `test/tick.test.ts`)

| Test name | Behavior proved |
|-----------|-----------------|
| `tick with no enemies does nothing` | State unchanged (except simTime) |
| `enemy steps after timer expires` | stepTimer 420, tick 500ms → enemy moved |
| `enemy frozen during freezeTimer` | freezeTimer > 0 → enemy does not step |
| `chaser moves toward player each step` | Distance decreases |
| `shy flees when close` | Distance increases when within 2 |
| `eater empties the cell it leaves` | Cell is {kind:"empty"} after step |
| `eater clearing last match triggers level-clear` | Phase becomes "level-clear" |
| `rewriter writes new value in left cell` | Cell has a new number/expr |
| `refuge expires after duration` | simTime past expiresAt → refuge null |
| `refuge blocks enemy entry` | Enemy doesn't move onto refuge |
| `refuge removes enemy on it` | Enemy on refuge cell is removed |
| `collision: player and enemy same cell → lose life` | Lives decrease |
| `collision: last life → game over` | Phase "game-over" |
| `collision: respawn to non-enemy cell` | Player pos is not on any enemy |
| `two enemies same cell: arriving removes resident` | Only one enemy at that cell after step |
| `enemy spawn respects cap` | No more than cap enemies alive |
| `enemy spawn from edge` | New enemy is on perimeter |

## Tests to add to `test/state.test.ts`

| Test name | Behavior proved |
|-----------|-----------------|
| `enemy-hit reduces lives` | Dispatch enemy-hit → lives-1 |
| `enemy-hit resets streak` | streak was 5 → 0 |
| `enemy-hit at 0 lives → game-over` | Phase changes |
| `enemy-hit sets freezeTimer 700` | freezeTimer === 700 |
| `enemy-hit respawns player` | Player pos changes to non-enemy cell |
| `initial state has empty enemies` | enemies.length === 0 |
| `initial state has no refuge` | refuge === null |

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm test` | All tests pass (existing + new). |
| 2 | `npm run typecheck` | Exit 0. |
| 3 | `npm run build` | Exit 0. |

## Edges

- Multiple enemies stepping in the same tick: process sequentially, each sees the state after the previous enemy's step.
- Eater clears last match → level-clear. The tick must check this after the eater steps.
- Freeze timer: enemies don't step, but the timer decrements. When it hits 0, they step again on the next tick.
- Player respawns to a random non-enemy, non-refuge, in-bounds cell. If no such cell exists (all 30 occupied), respawn to center.

## Out of scope

- No rendering (T-016).
- No band-based enemy type selection (Phase 5).
- No audio.
