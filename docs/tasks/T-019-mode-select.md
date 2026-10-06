# T-019: Mode Select + Settings UI

Phase: 5
Depends on: T-017 (bands)
Round: 1

## Goal

Add the mode select screen (six entries + band picker) and a settings screen to the DOM UI. Wire them into the existing screen flow.

## Files (create or modify)

- `src/ui/mode-select.ts` (create new)
- `src/ui/settings.ts` (create new)
- `src/ui/screens.ts` (modify — add mode-select and settings phases)
- `src/ui/styles.css` (modify — style the new screens)

Do not create or modify files outside this list.

## Requirements

### `src/ui/mode-select.ts`

```ts
import type { Mode } from "@/rules/types";
import type { BandName } from "@/content/bands";
import type { Action } from "@/game/state";

export function renderModeSelect(
  container: HTMLElement,
  onModeSelect: (mode: Mode, band: BandName) => void,
  onBack: () => void
): void;
```

- Shows six mode buttons in a 2×3 grid: Multiples, Factors, Primes, Equality, Inequality, Challenge.
- Shows three band buttons: Easy, Standard, Hard. Default: Standard (highlighted).
- Clicking a mode button highlights it. Clicking a band button highlights it.
- A "Play" button dispatches `onModeSelect(selectedMode, selectedBand)`.
- A "Back" button dispatches `onBack()`.
- Creates DOM on first call, updates highlights on subsequent calls (no innerHTML).
- No `any`. No default exports.

### `src/ui/settings.ts`

```ts
export type Settings = {
  band: BandName;
  modes: Record<Mode, boolean>;
  mute: boolean;
  touch: "always" | "auto";
};

export function renderSettings(
  container: HTMLElement,
  settings: Settings,
  onChange: (s: Settings) => void,
  onResetScores: () => void,
  onBack: () => void
): void;
```

- Band: three radio-style buttons.
- Modes: six checkboxes (all checked by default).
- Mute: toggle button.
- Touch: "Always show" / "Auto" toggle.
- "Reset Scores" button (calls onResetScores).
- "Back" button.
- Creates DOM on first call, updates on subsequent calls.
- No `any`. No default exports.

### Modify `src/ui/screens.ts`

Add to the phase handling:
- `"mode-select"`: show mode select screen.
- `"settings"`: show settings screen.

The existing phases (title, playing, level-clear, game-over, paused) remain unchanged. Add the two new phases to the Phase type import or handle them by checking the container's data attribute.

Actually — the `Phase` type in `state.ts` is `"title" | "playing" | "level-clear" | "game-over" | "paused"`. I CANNOT add new phases to it (that's T-018's file). Instead, the mode-select and settings screens are sub-screens shown ON TOP of the title screen. The `renderScreens` function takes `state.phase` and an additional `subScreen` parameter:

```ts
export type SubScreen = "none" | "mode-select" | "settings";

export function renderScreens(
  container: HTMLElement,
  state: GameState,
  onAction: (action: Action) => void,
  subScreen?: SubScreen,
  settings?: Settings
): void;
```

- When `phase === "title"` and `subScreen === "mode-select"`: show mode select overlay.
- When `phase === "title"` and `subScreen === "settings"`: show settings overlay.
- When `phase === "title"` and `subScreen === "none"` or undefined: show title (as before).
- The "Play" button on title now opens mode-select instead of starting directly.
- The "How to Play" button stays.
- Add a "Settings" button to the title screen.

### Modify `src/ui/styles.css`

- Style the mode select grid (2×3 buttons, band row below).
- Style the settings screen (toggles, checkboxes).
- Consistent with existing dark theme.

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm run typecheck` | Exit 0. |
| 2 | `npm run build` | Exit 0. |

## Edges

- The `Settings` type is defined in `mode-select.ts` or `settings.ts` (whichever is cleaner). It's a UI-level type, not a game state type.
- `renderModeSelect` and `renderSettings` use the same DOM-update pattern as `renderHud` (create once, update text/class on subsequent calls).
- The six modes include "challenge" which is NOT in the `Mode` type in `rules/types.ts`. The `Mode` type is `"multiples" | "factors" | "primes" | "equality" | "inequality"`. Challenge is a meta-mode. Define: `export type GameMode = Mode | "challenge"` in the UI file.

## Out of scope

- No localStorage persistence (Phase 6).
- No audio (Phase 6).
- No changes to game state or logic (T-018/T-020).
