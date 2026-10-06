# T-012: Integration — Main + Index

Phase: 3
Depends on: T-006, T-007, T-008, T-009, T-010, T-011
Round: 1

## Goal

Wire all modules together in `main.ts` and update `index.html` so the game boots, renders, and is playable with keyboard. This is the integration point that makes Phase 3 a real game.

## Files (modify)

- `src/main.ts` (modify — replace the current placeholder)
- `index.html` (modify — add HUD container, screens container, import styles)

Do not create or modify files outside this list. Do not modify any module in `src/game/`, `src/input/`, `src/render/`, `src/ui/`, or `src/rules/`.

## Requirements

### `index.html`

- Keep the `<canvas>` element.
- Add a `<div id="hud">` above the canvas.
- Add a `<div id="screens">` overlaying the canvas.
- Import `src/ui/styles.css`.
- The canvas and containers are centered in the viewport.

### `src/main.ts`

Wire everything together:

1. Get DOM elements: canvas, hud container, screens container.
2. Create initial state: `createInitialState()`.
3. Create a state holder (mutable ref): `let state = createInitialState()`.
4. Define `dispatch(action: Action)`: `state = reduce(state, action, rng)`.
5. Get the 2D context from the canvas.
6. Call `renderBoard(ctx, state)` initially.
7. Call `renderHud(hudEl, state)` initially.
8. Call `renderScreens(screensEl, state, dispatch)` initially.
9. Attach keyboard: `attachKeyboard(dispatch, () => state.phase)`.
10. Start the loop: `createLoop(dispatch, (s) => { state = s; renderBoard(ctx, state); renderHud(hudEl, state); renderScreens(screensEl, state, dispatch); })`.
    - Wait: the loop's `onFrame` callback receives state. But the loop dispatches ticks and the dispatch function updates the local `state` variable. So `onFrame` should just trigger re-renders with the current `state` (which was already updated by dispatch). Actually, let me reconsider:
    - The loop calls `dispatch(action)` for each tick, which updates `state`. Then it calls `onFrame(state)`. But `state` is a local variable in main.ts, and the loop's dispatch is a closure that updates it. So `onFrame` receives the updated state.
    - In `onFrame`: call `renderBoard(ctx, state)`, `renderHud(hudEl, state)`, `renderScreens(screensEl, state, dispatch)`.
11. Integer scaling: set the canvas CSS size to fit the viewport while maintaining 960:600 aspect ratio. Use integer multipliers only (1x, 2x, 3x...). On window resize, recalculate.
12. The game starts on the "title" phase. The player sees the title screen and clicks "Play".

### Canvas scaling

- Canvas internal resolution: always 960×600.
- CSS size: `width = 960 * scale`, `height = 600 * scale` where scale is the largest integer that fits the viewport (accounting for HUD height).
- `imageSmoothingEnabled = false` on the context.

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm run dev` | Browser shows title screen. Click "Play" → board appears. Arrow keys move the player. Space eats. Score/lives/level update. |
| 2 | `npm test` | All tests pass (no new tests in this contract — it's integration). |
| 3 | `npm run typecheck` | Exit 0. |
| 4 | `npm run build` | Exit 0. `dist/index.html` opens standalone (relative paths). |
| 5 | Playability | A human can: see the rule, move the player, eat a match (+10 score), eat a miss (lose a life), clear a level (advance), lose all 3 lives (game over), and restart. |

## Edges

- The HUD must update on every state change (eat, move, level clear, game over).
- The screens overlay must not block canvas rendering when hidden (pointer-events: none, display: none).
- Window resize must not break the game. Scale recalculates smoothly.
- The game must work from `dist/index.html` opened via `file://` (relative paths, no CORS issues).

## Out of scope

- No enemies (Phase 4).
- No touch controls (Phase 6).
- No audio (Phase 6).
- No high scores (Phase 6).
- No settings (Phase 6).
