# T-010: HUD + Screens

Phase: 3
Depends on: T-006 (state)
Round: 1

## Goal

Implement the HTML/CSS DOM-based UI: the HUD bar (level, rule, score, lives), the title screen, the game-over screen, and the pause overlay.

## Files (create, all new)

- `src/ui/hud.ts`
- `src/ui/screens.ts`
- `src/ui/styles.css`

Do not create or modify files outside this list. Do not modify `index.html` (that is T-012).

## Requirements

### `src/ui/hud.ts`

- Export: `export function renderHud(container: HTMLElement, state: GameState): void`
  - Updates DOM in-place (no re-creation). Creates child elements on first call, updates text on subsequent calls.
  - Shows:
    - Level: "Level 3" (top-left)
    - Rule: "Multiples of 6" (top-center, the rule line)
    - Score: "Score: 1450" (bottom-left)
    - Lives: row of small hearts or dots (bottom-right). 3 filled = 3 lives. Reserve lives shown as outline.
  - Rule text by mode:
    - multiples: `Multiples of ${k}`
    - factors: `Factors of ${k}`
    - primes: `Prime numbers`
    - equality: `Equals ${k}`
    - inequality: `Not equal to ${k}`
  - No `any`. No default exports.

### `src/ui/screens.ts`

- Export: `export function renderScreens(container: HTMLElement, state: GameState, onAction: (action: Action) => void): void`
  - Shows/hides overlay screens based on `state.phase`:
    - **"title"**: Game name "Math Chomper", "Play" button (dispatches `{type:"start", mode:"multiples"}`), "How to Play" text (6 lines).
    - **"level-clear"**: Brief "Level Clear! +XX" text. Auto-dismisses (the loop dispatches next-level).
    - **"game-over"**: "Game Over", final score, level reached, "Play Again" button (dispatches restart), "Menu" button (dispatches start with same mode but to title — actually, just restart).
    - **"paused"**: "Paused" overlay, "Press Esc to resume".
    - **"playing"**: No overlay (hide all screens).
  - Buttons are `<button>` elements with click handlers that call `onAction`.
  - No `any`. No default exports.

### `src/ui/styles.css`

- Dark theme matching the canvas palette:
  - Background: `#0d1110`
  - Text: `#f4f1e8`
  - Accent: `#3ddc6e`
  - Buttons: dark bg, green border, hover brightens
- HUD positioned as a bar above the canvas.
- Screens are full-canvas overlays with semi-transparent dark background.
- Monospace font stack: `ui-monospace, "SF Mono", "Cascadia Code", Menlo, monospace`
- No external fonts, no CSS frameworks.
- Responsive: HUD and canvas scale to fit viewport (integer scaling handled in T-012).

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm run typecheck` | Exit 0. |
| 2 | `npm run build` | Exit 0. |

## Edges

- `renderHud` must be callable every frame without creating new DOM nodes (update textContent, not innerHTML).
- `renderScreens` must handle rapid phase transitions without leaving stale overlays.
- The "How to Play" text is exactly 6 lines:
  1. Arrow keys or WASD to move.
  2. Space or Enter to eat.
  3. Eat only what the rule names.
  4. Wrong eats cost a life.
  5. Enemies hurt you.
  6. Clear all matches to advance.

## Out of scope

- No touch controls (Phase 6).
- No settings screen (Phase 6).
- No high score entry (Phase 6).
- No band picker (Phase 5).
