# T-025: High Scores UI + Game-Over Initials

Phase: 6
Depends on: T-023 (storage, ScoreEntry)
Round: 1

## Goal

Add the high-scores display and game-over initials entry to the DOM UI. Show top 8 on the title screen. Collect initials on game-over if the score qualifies.

## Files (create or modify)

- `src/ui/scores.ts` (create new)
- `src/ui/screens.ts` (modify — add scores display + initials entry)
- `src/ui/styles.css` (modify — style the new elements)

Do not create or modify files outside this list.

## Requirements

### `src/ui/scores.ts` (new)

```ts
import type { ScoreEntry } from "@/storage";
import type { GameMode } from "@/game/state";
import type { BandName } from "@/content/bands";

export function renderScoreList(container: HTMLElement, scores: ScoreEntry[]): void;
export function renderInitialsEntry(
  container: HTMLElement,
  onConfirm: (name: string) => void,
  score: number,
  level: number
): void;
```

- `renderScoreList`: Shows a ranked list (1-8) of score entries. Each row: rank, name, score, mode short-name, band short-name. Create-once/update pattern (no innerHTML). If empty, show "No scores yet."
- `renderInitialsEntry`: Shows "New High Score!" text, the score and level, and a text input (max 8 chars, uppercase, placeholder "YOUR NAME") with a "Confirm" button. On confirm, call `onConfirm(name)`. The input auto-focuses.
- No `any`. No default exports.

### Modify `src/ui/screens.ts`

- In the `"game-over"` phase handling:
  - Accept an optional `scores` param and `onScoreSave` callback.
  - If the score qualifies (caller checks), show the initials entry instead of just the score.
  - After initials confirmed, call `onScoreSave(name)` and re-render to show the score list.
- In the `"title"` phase handling:
  - Accept an optional `scores` param.
  - Show the top 5 scores below the Play/Settings buttons (compact strip).
- Add `ScoreEntry` to the imports.
- The `renderScreens` function gains two optional params: `scores?: ScoreEntry[]` and `onScoreSave?: (name: string) => void`.

### Modify `src/ui/styles.css`

- Score list: monospace, 8 rows, subtle background.
- Initials entry: centered, input with green border, confirm button.
- Title score strip: compact, 5 rows, smaller font.

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm run typecheck` | Exit 0. |
| 2 | `npm run build` | Exit 0. |

## Edges

- The initials input: `maxlength="8"`, `type="text"`, `autocomplete="off"`, auto-uppercase via CSS `text-transform: uppercase`.
- If the player closes the tab before confirming, the score is lost (no draft persistence in v1).
- The score list on the title screen shows only the top 5 (not all 8) to save space.

## Out of scope

- No wiring into main.ts (T-026).
- No cross-device sync.
- No animations.
