# T-017: Band Content

Phase: 5
Depends on: T-013 (enemy types), T-005 (GenConfig)
Round: 1

## Goal

Define the three difficulty bands with all their parameters, and helper functions to convert a band into the config objects the game uses.

## Files (create, all new)

- `src/content/bands.ts`
- `test/bands.test.ts`

Do not create or modify files outside this list.

## Requirements

### `src/content/bands.ts`

```ts
import type { EnemyKind } from "@/game/enemies";
import type { GenConfig } from "@/rules/generate";

export type BandName = "easy" | "standard" | "hard";

export type Band = {
  name: BandName;
  label: string;
  numMin: number;
  numMax: number;
  kMin: number;
  kMax: number;
  exprOps: Array<"+" | "−" | "×" | "÷">;
  exprMin: number;
  exprMax: number;
  enemyUnlocks: Array<{ level: number; kind: EnemyKind }>;
};

export const EASY: Band;
export const STANDARD: Band;
export const HARD: Band;

export function getBand(name: BandName): Band;
export function getGenConfig(band: Band): GenConfig;
export function getEnemyKinds(band: Band, level: number): EnemyKind[];
export function getKRange(band: Band): { min: number; max: number };
```

- **EASY**: label "Easy", numMin 1, numMax 30, kMin 2, kMax 9, exprOps ["+","−"], exprMin 0, exprMax 12, enemyUnlocks [{level:1,kind:"straight"},{level:1,kind:"shy"}]
- **STANDARD**: label "Standard", numMin 1, numMax 60, kMin 2, kMax 12, exprOps ["+","−","×","÷"], exprMin 0, exprMax 12, enemyUnlocks [{level:1,kind:"straight"},{level:1,kind:"shy"},{level:4,kind:"eater"},{level:4,kind:"rewriter"},{level:8,kind:"chaser"}]
- **HARD**: label "Hard", numMin 1, numMax 100, kMin 2, kMax 20, exprOps ["+","−","×","÷"], exprMin 0, exprMax 12, enemyUnlocks [{level:1,kind:"straight"},{level:1,kind:"shy"},{level:3,kind:"chaser"},{level:4,kind:"eater"},{level:4,kind:"rewriter"}]

- `getBand(name)`: returns the matching Band constant.
- `getGenConfig(band)`: maps to `{ numMin, numMax, exprOps, exprMin, exprMax }`.
- `getEnemyKinds(band, level)`: returns all `kind` values from `enemyUnlocks` where `unlock.level <= level`. Order doesn't matter.
- `getKRange(band)`: `{ min: band.kMin, max: band.kMax }`.
- No `any`. No default exports.

## Tests to write

| Test name | Behavior proved |
|-----------|-----------------|
| `getBand returns each band` | All 3 names return correct label |
| `easy: numMax 30, kMax 9` | Correct values |
| `easy: only + and -` | exprOps has 2 entries |
| `easy: straight and shy from level 1` | getEnemyKinds(easy, 1) has 2 kinds |
| `easy: no chaser ever` | getEnemyKinds(easy, 20) has no "chaser" |
| `standard: numMax 60, kMax 12` | Correct values |
| `standard: all 4 ops` | exprOps has 4 entries |
| `standard: chaser from level 8` | Not in level 7, in level 8 |
| `hard: numMax 100, kMax 20` | Correct values |
| `hard: chaser from level 3` | In level 3, not in level 2 |
| `getGenConfig maps correctly` | All fields match band |
| `getKRange returns min/max` | Correct for each band |

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm test` | All band tests pass. |
| 2 | `npm run typecheck` | Exit 0. |

## Out of scope

- No localStorage, no settings UI.
- No changes to game logic (that's T-018/T-020).
