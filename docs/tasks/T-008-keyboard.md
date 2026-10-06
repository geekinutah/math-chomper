# T-008: Keyboard Input

Phase: 3
Depends on: T-006 (state)
Round: 1

## Goal

Implement keyboard input handling that translates keypresses into game actions.

## Files (create, all new)

- `src/input/keyboard.ts`

Do not create or modify files outside this list.

## Requirements

- Export: `export function attachKeyboard(dispatch: (action: Action) => void, isPlaying: () => boolean): () => void`
  - Returns a detach function that removes all event listeners.
- Key mappings:
  - ArrowUp / W → `{ type: "move", dir: "up" }`
  - ArrowDown / S → `{ type: "move", dir: "down" }`
  - ArrowLeft / A → `{ type: "move", dir: "left" }`
  - ArrowRight / D → `{ type: "move", dir: "right" }`
  - Space / Enter → `{ type: "eat" }`
  - Escape → `{ type: "pause" }` (when playing) or `{ type: "resume" }` (when paused)
  - R (only on game-over screen) → `{ type: "restart" }`
- The `isPlaying` callback tells the handler the current phase so it can:
  - Suppress movement/eat when not in "playing" phase
  - Handle Esc as pause vs resume
  - Handle R only on game-over
- Must call `e.preventDefault()` on handled keys (prevents page scroll on arrows/space).
- No `any` type. No default exports.

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm run typecheck` | Exit 0. |
| 2 | `npm run build` | Exit 0. |

Note: Full behavioral testing requires a browser. Type-check and build are the gate. Integration (T-012) verifies in-browser.

## Edges

- Holding a key must not auto-repeat movement (the browser's keydown repeat should be ignored — only respond to the first keydown, not repeats). Use `e.repeat` check.
- Detach must work cleanly (no memory leaks, no errors if called twice).

## Out of scope

- No touch input (Phase 6).
- No gamepad (optional, Phase 6).
