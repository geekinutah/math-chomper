# T-024: Touch Controls

Phase: 6
Depends on: T-006 (state actions)
Round: 1

## Goal

Implement touch input: on-screen D-pad, Eat button, swipe-to-move, and tap-to-eat. Show/hide based on settings.

## Files (create, all new)

- `src/input/touch.ts`
- `src/input/touch.css`

Do not create or modify files outside this list.

## Requirements

### `src/input/touch.ts`

```ts
import type { Action, Dir } from "@/game/state";
import type { TouchMode } from "@/storage";

export function attachTouch(
  dispatch: (action: Action) => void,
  getPhase: () => string,
  mode: TouchMode,
  boardEl: HTMLElement
): () => void;
```

- Returns a detach function.
- **Visibility**:
  - `"always"`: touch controls always visible.
  - `"auto"`: visible when viewport width < 800px. Listen to `resize`.
- **D-pad**: 4 arrow buttons (▲▼◀▶) in a cross layout, bottom-left of screen. Each dispatches a move action on `touchstart`.
- **Eat button**: large circular button, bottom-right. Dispatches eat on `touchstart`.
- **Swipe on board**: `touchstart`/`touchend` on `boardEl`. If the swipe distance > 30px, determine direction from the dominant axis and dispatch move.
- **Tap on board**: `touchstart`/`touchend` on `boardEl`. If no significant movement (< 10px), it's a tap. Dispatch eat.
- All touch handlers call `e.preventDefault()` to prevent scrolling.
- D-pad and eat button are `<div>` elements with CSS classes, positioned `fixed` at the bottom of the screen.
- No `any`. No default exports. No third-party touch libraries.

### `src/input/touch.css`

- D-pad: 4 buttons in a cross (CSS grid or flex), semi-transparent, 60×60px each, fixed bottom-left.
- Eat button: 80×80px circle, fixed bottom-right, green.
- Hidden by default (`display: none`). Shown via a class (`.touch-visible`).
- `pointer-events: auto` on buttons, `pointer-events: none` on the container.
- Must not interfere with the canvas (z-index below the screens overlay).

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm run typecheck` | Exit 0. |
| 2 | `npm run build` | Exit 0. |

Note: No unit tests (DOM/touch events require a browser). Type-check + build are the gate.

## Edges

- `touchstart` fires on mouse click too in some browsers. Use `e.cancelable` check or feature-detect `ontouchstart in window`.
- Multiple simultaneous touches: only respond to the first `touchstart` (use `e.touches[0]`).
- Detach must remove all listeners and DOM elements cleanly.
- The D-pad should only be active when `getPhase()` returns `"playing"`.

## Out of scope

- No gamepad (optional, not in v1 DoD).
- No haptics.
- No animation on the D-pad.
