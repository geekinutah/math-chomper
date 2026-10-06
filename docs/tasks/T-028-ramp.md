# T-028: In-Run Ramp (Level 18+)

Phase: 6
Depends on: T-015 (tick), T-014 (spawn) — both done
Round: 1

## Goal

Implement the in-run escalation spec §8 prescribes for level 18+: "Step delays ×0.85, floored. Refuges rare." Enemy step delay compounds ×0.85 per level from level 18, floored at 180 ms (§9: "start ~420 ms, floor ~180 ms"). Refuge spawn probability halves at level 18+ (Mike's 2026-10-06 decision on the proposal: 0.003 → 0.0015/tick). Levels 1–17 behave exactly as today.

## Files

- `src/game/spawn.ts` (modify)
- `src/game/tick.ts` (modify)
- `test/spawn.test.ts` (modify — add tests)
- `test/tick.test.ts` (modify — add tests)

Do not create or modify files outside this list. `PRODUCT_SPEC.md` is already correct; no spec edit.

## Requirements

### `src/game/spawn.ts`

- Replace `const ENEMY_STEP_MS = 420` with:
  ```ts
  const BASE_ENEMY_STEP_MS = 420;
  const MIN_ENEMY_STEP_MS = 180;
  const RAMP_LEVEL = 18;
  const RAMP_FACTOR = 0.85;

  export function enemyStepDelay(level: number): number {
    if (level < RAMP_LEVEL) return BASE_ENEMY_STEP_MS;
    const ms = BASE_ENEMY_STEP_MS * RAMP_FACTOR ** (level - RAMP_LEVEL + 1);
    return Math.max(MIN_ENEMY_STEP_MS, Math.round(ms));
  }
  ```
  Expected: L18 → 357, L19 → 303, L20 → 258, L21 → 219, L22 → 186, L23+ → 180 (floor).
- Add: `export function refugeSpawnChance(level: number): number { return level >= RAMP_LEVEL ? 0.0015 : 0.003; }`
- `spawnEnemy`: use `stepTimer: enemyStepDelay(state.level)`.
- `refugeDuration` stays as-is (5000 / 2500 at level 12; the §8 18+ row says "rare", not "shorter").

### `src/game/tick.ts`

- Delete `const STEP_MS = 420`; import `enemyStepDelay` and `refugeSpawnChance` from `./spawn` (this also removes the duplicated 420 constant).
- After an enemy steps: `e.stepTimer = enemyStepDelay(state.level);`
- Refuge roll: `if (!refuge && rng() < refugeSpawnChance(state.level))`.

## Tests to add

`test/spawn.test.ts`:

| Test name | Behavior proved |
|-----------|-----------------|
| `enemyStepDelay: levels 1–17 → 420` | No ramp before level 18 |
| `enemyStepDelay: level 18 → 357` | First ramp step |
| `enemyStepDelay: 19 → 303, 20 → 258, 21 → 219, 22 → 186` | Compounds ×0.85 per level |
| `enemyStepDelay: level 23+ → 180` | Floored |
| `spawnEnemy at level 20: stepTimer is 258` | Spawns use the ramped delay |
| `refugeSpawnChance: 17 → 0.003, 18 → 0.0015` | Halved at 18 |

`test/tick.test.ts`:

| Test name | Behavior proved |
|-----------|-----------------|
| `tick at level 20 resets stepTimer to 258` | Stepped enemies are re-armed with the ramped delay, not 420 |
| `refuge roll 0.002 spawns at L17, not at L18` | A state with no enemies, no refuge, player at center, and a constant-0.002 rng: `state.refuge` non-null after a tick at level 17, null after one at level 18 |

Existing tests that construct level-1 states keep passing unchanged. If any existing test breaks *because* it exercises level ≥ 18, update its expectation to the ramped value and list it in the report.

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm test` | All tests pass, including the 8 new ones. |
| 2 | `npm run typecheck` | Exit 0. |
| 3 | `npm run build` | Exit 0. |

## Edges

- `0.85 ** n` is float; round to integer ms. The floor is applied after rounding.
- The constant-0.002 rng in the tick test also feeds the enemy-spawn roll (`rng() < 0.002` is false at exactly 0.002), so no enemy spawns; the only observable L17/L18 difference is the refuge.

## Out of scope

- Player step timing (spec §9's "about 140 ms at level 1, floored at 80 ms" is a separate gap).
- Refuge duration changes.
