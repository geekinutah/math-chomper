# T-023: Storage (Settings + High Scores)

Phase: 6
Depends on: T-017 (bands), T-019 (Settings type)
Round: 1

## Goal

Implement localStorage persistence for settings and local high scores (top 8).

## Files (create, all new)

- `src/storage.ts`
- `test/storage.test.ts`

Do not create or modify files outside this list.

## Requirements

### `src/storage.ts`

```ts
import type { BandName } from "@/content/bands";
import type { Mode } from "@/rules/types";
import type { GameMode } from "@/game/state";

export type TouchMode = "always" | "auto";

export type Settings = {
  band: BandName;
  modes: Record<GameMode, boolean>;
  mute: boolean;
  touch: TouchMode;
};

export type ScoreEntry = {
  name: string;
  mode: GameMode;
  band: BandName;
  score: number;
  level: number;
};

const SETTINGS_KEY = "mathchomper.settings.v1";
const SCORES_KEY = "mathchomper.scores.v1";

export const DEFAULT_SETTINGS: Settings;
export function loadSettings(): Settings;
export function saveSettings(s: Settings): void;
export function loadScores(): ScoreEntry[];
export function saveScore(entry: ScoreEntry): ScoreEntry[];
export function resetScores(): void;
export function qualifiesForScores(score: number): boolean;
```

- `DEFAULT_SETTINGS`: `{ band: "standard", modes: { all 6 true }, mute: false, touch: "auto" }`
- `loadSettings()`: Read `SETTINGS_KEY` from localStorage. Parse JSON. Merge with defaults (in case a new field was added). If empty/invalid, return `DEFAULT_SETTINGS`.
- `saveSettings(s)`: Write `JSON.stringify(s)` to `SETTINGS_KEY`.
- `loadScores()`: Read `SCORES_KEY`. Parse JSON array. If empty/invalid, return `[]`. Always return at most 8 entries, sorted by score descending.
- `saveScore(entry)`: Load current scores. If entry.score is 0 or the list already has 8 entries with all scores higher, don't add. Otherwise insert, sort by score descending, cap at 8. Save. Return the new list.
- `resetScores()`: Set `SCORES_KEY` to `[]`.
- `qualifiesForScores(score)`: Returns true if the list has < 8 entries, or the new score beats the lowest entry.
- Name: max 8 characters, alphanumeric + space only. Sanitize in `saveScore`.
- No `any`. No default exports. No third-party storage libraries.
- Must handle `localStorage` being unavailable (SSR, privacy mode) gracefully: all functions are no-ops or return defaults.

### `test/storage.test.ts`

Vitest runs in Node which has no `localStorage`. Mock it:
```ts
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
};
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });
```

| Test name | Behavior proved |
|-----------|-----------------|
| `loadSettings returns defaults when empty` | No key in storage → DEFAULT_SETTINGS |
| `save/load settings round-trip` | save then load returns same object |
| `loadSettings merges missing fields` | Save old format (no `touch`), load → has `touch: "auto"` |
| `loadScores returns empty when none` | No key → [] |
| `saveScore adds and sorts` | Two scores, higher first |
| `saveScore caps at 8` | Add 10, only top 8 remain |
| `saveScore rejects zero score` | score 0 not added |
| `saveScore sanitizes name` | "abc<script>" → "abc" (strip non-alphanumeric/space) |
| `saveScore truncates name to 8` | 12-char name → 8 chars |
| `qualifiesForScores: under 8 → true` | 3 entries, any score → true |
| `qualifiesForScores: full and lower → false` | 8 entries, score below lowest → false |
| `qualifiesForScores: full but higher → true` | 8 entries, score above lowest → true |
| `resetScores clears` | Add scores, reset, load → [] |
| `localStorage unavailable: no throw` | Delete localStorage, all functions work (return defaults/empty) |

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm test` | All storage tests pass. |
| 2 | `npm run typecheck` | Exit 0. |
| 3 | `npm run build` | Exit 0. |

## Edges

- `localStorage` can throw in some privacy modes. Wrap all access in try/catch.
- The `GameMode` type includes "challenge" (6 modes total). `modes` record has 6 keys.
- ScoreEntry name is the player's initials (up to 8 chars).

## Out of scope

- No UI (T-025).
- No wiring into main.ts (T-026).
- No cross-device sync (local only).
