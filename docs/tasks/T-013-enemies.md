# T-013: Enemy Step Functions

Phase: 4
Depends on: T-006 (state types), T-004 (types)
Round: 1

## Goal

Implement the Enemy type and pure step functions for all five enemy behaviors. These are pure functions: `(enemy, state) => nextCell`. No side effects, no timers, no `Math.random`.

## Files (create, all new)

- `src/game/enemies.ts`
- `test/enemies.test.ts`

Do not create or modify files outside this list.

## Requirements

### `src/game/enemies.ts`

```ts
import type { Dir, PlayerPos, GameState } from "./state";
import type { Cell } from "@/rules/types";

export type EnemyKind = "straight" | "shy" | "eater" | "rewriter" | "chaser";

export type Enemy = {
  id: number;
  kind: EnemyKind;
  pos: PlayerPos;
  dir: Dir;
  stepTimer: number; // ms until next step
};

export type Refuge = {
  pos: PlayerPos;
  expiresAt: number; // ms timestamp (sim time)
};

export const COLS = 6;
export const ROWS = 5;

export function stepEnemy(enemy: Enemy, state: GameState, rng: () => number): PlayerPos;
export function legalMoves(pos: PlayerPos, state: GameState): PlayerPos[];
export function chebyshev(a: PlayerPos, b: PlayerPos): number;
export function sameCell(a: PlayerPos, b: PlayerPos): boolean;
```

### Step behavior per kind

- **straight**: Move in `enemy.dir`. If next cell is out of bounds or a refuge, pick a new direction (prefer a turn over a reverse: 2 options instead of 1). Update `enemy.dir` to the new direction. Return the new position.
- **shy**: If Chebyshev distance to player ≤ 2, move to increase that distance (pick the legal move that maximizes distance). Else random legal step.
- **eater**: Random legal step. (The cell-emptying side effect is handled in the tick module, not here. This function only returns the new position.)
- **rewriter**: Random legal step. (The cell-rewriting side effect is handled in the tick module.)
- **chaser**: Among legal moves, pick the one with smallest Chebyshev distance to the player. Break ties at random. Does not enter refuges.

### Shared rules

- Legal moves: in bounds (col 0–5, row 0–4), not a refuge cell.
- No enemy moves onto the player's cell (that's a collision, handled by tick).
- `legalMoves` returns up to 4 positions (the cardinal neighbors that are in-bounds and not refuges).
- No `any`. No default exports. No `Math.random` (use the rng param). File under 250 lines.

## Tests to write

| Test name | Behavior proved |
|-----------|-----------------|
| `straight moves in its direction` | Enemy facing right at (2,2) → (3,2) |
| `straight turns at wall` | Enemy facing right at (5,2) → turns (up or down), new position reflects turn |
| `straight prefers turn over reverse` | At wall, never reverses (dir is not the opposite) |
| `shy flees when player within 2` | Player at (3,2), shy at (1,2) → moves to (0,2) (increases distance) |
| `shy wanders when player far` | Player at (0,0), shy at (5,4) → moves to a random adjacent cell |
| `chaser moves toward player` | Player at (4,4), chaser at (0,0) → Chebyshev distance decreases |
| `chaser never increases distance when closer exists` | For various positions, result distance ≤ current distance |
| `chaser does not enter refuge` | Refuge at the target cell → chaser picks alternate |
| `no enemy steps onto refuge` | All 5 kinds: if the only "good" move is a refuge, they don't go there |
| `legalMoves excludes out-of-bounds` | Corner (0,0) → 2 legal moves, (2,2) → 4 legal moves |
| `legalMoves excludes refuge` | Refuge at (3,2) → (2,2) has 3 legal moves, not 4 |
| `chebyshev distance correct` | (0,0) to (3,4) = 4, (0,0) to (0,0) = 0 |
| `sameCell true/false` | Same pos → true, different → false |
| `eater returns a legal position` | Result is in bounds, not refuge |
| `rewriter returns a legal position` | Result is in bounds, not refuge |

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm test` | All enemy tests pass. |
| 2 | `npm run typecheck` | Exit 0. |

## Edges

- Enemy at a corner with a refuge adjacent: still has legal moves (2 of 3 neighbors).
- Enemy completely surrounded by refuges (shouldn't happen with 1 refuge max, but handle gracefully): return current position (no move).
- Chaser with player on the same row: moves horizontally.

## Out of scope

- No enemy spawning, no collision resolution, no cell mutation.
- No timers (stepTimer is just a number, the tick module decrements it).
- No rendering.
