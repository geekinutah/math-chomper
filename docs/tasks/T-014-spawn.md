# T-014: Enemy Spawning + Refuge

Phase: 4
Depends on: T-013 (enemy types)
Round: 1

## Goal

Implement enemy spawning (edge cells, caps per level) and refuge management (spawn, expire, remove enemies on it).

## Files (create, all new)

- `src/game/spawn.ts`
- `test/spawn.test.ts`

Do not create or modify files outside this list.

## Requirements

### `src/game/spawn.ts`

```ts
import type { Enemy, EnemyKind, Refuge } from "./enemies";
import type { PlayerPos, GameState } from "./state";

export function enemyCap(level: number): number;
export function spawnEnemy(kind: EnemyKind, state: GameState, rng: () => number): Enemy | null;
export function spawnRefuge(state: GameState, simTime: number, rng: () => number): Refuge | null;
export function refugeDuration(level: number): number;
export function edgeCells(): PlayerPos[];
```

- **enemyCap**: Level 1–3 → 1, Level 4–7 → 2, Level 8+ → 3.
- **spawnEnemy**:
  - Pick a random edge cell (not the player's cell, not a refuge).
  - If no valid edge cell exists, return null.
  - Create an Enemy with the given kind, pos = edge cell, dir = "down" (straight picks its own on first step), stepTimer = 420 (base enemy step duration).
  - Return the Enemy.
- **spawnRefuge**:
  - Pick a random cell (not the player's cell).
  - Create a Refuge with pos and expiresAt = simTime + refugeDuration(level).
  - If an enemy is on that cell, the caller (tick) removes it.
  - Return the Refuge.
- **refugeDuration**: Level < 12 → 5000ms, Level ≥ 12 → 2500ms.
- **edgeCells**: All 18 edge cells (perimeter of 6×5 grid = 2·(6+5)−4). Top row (6) + bottom row (6) + left col (3, excluding corners already counted) + right col (3) = 18.
- No `any`. No default exports. No `Math.random`. File under 250 lines.

## Tests to write

| Test name | Behavior proved |
|-----------|-----------------|
| `enemyCap: level 1-3 → 1` | enemyCap(1)===1, enemyCap(3)===1 |
| `enemyCap: level 4-7 → 2` | enemyCap(4)===2, enemyCap(7)===2 |
| `enemyCap: level 8+ → 3` | enemyCap(8)===3, enemyCap(20)===3 |
| `spawnEnemy returns edge cell` | Result pos is on the perimeter |
| `spawnEnemy not on player cell` | Player at edge → spawn elsewhere |
| `spawnEnemy not on refuge` | Refuge at edge → spawn elsewhere |
| `spawnEnemy null when no valid edge` | Player + refuge cover all edges → null (edge case) |
| `spawnEnemy has correct kind` | Result.kind matches input |
| `spawnEnemy stepTimer is 420` | Base enemy step duration |
| `edgeCells returns 18 cells` | All perimeter cells, no interior |
| `edgeCells includes all four sides` | Top, bottom, left, right |
| `refugeDuration: level < 12 → 5000` | refugeDuration(1)===5000, refugeDuration(11)===5000 |
| `refugeDuration: level ≥ 12 → 2500` | refugeDuration(12)===2500, refugeDuration(20)===2500 |
| `spawnRefuge not on player cell` | Player at (2,2) → refuge elsewhere |
| `spawnRefuge expiresAt correct` | simTime + duration |

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm test` | All spawn/refuge tests pass. |
| 2 | `npm run typecheck` | Exit 0. |

## Edges

- Edge cells: 6×5 grid has 18 perimeter cells (6+6+3+3=18, corners counted once).
- If the player is on an edge and a refuge is on another edge, there are still valid spawns.
- The "no valid edge" case (return null) requires the player + refuge + blocked cells to cover all 18 edges, which is impossible with 1 player + 1 refuge. But handle it gracefully.

## Out of scope

- No tick logic, no collision, no rendering.
- No band-based enemy type selection (Phase 5).
