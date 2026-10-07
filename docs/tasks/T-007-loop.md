# T-007: Game Loop

Phase: 3
Depends on: T-006 (state)
Round: 1

## Goal

Implement the requestAnimationFrame game loop with a fixed 60 Hz simulation step.

## Files (create, all new)

- `src/game/loop.ts`

Do not create or modify files outside this list.

## Requirements

- Export: `export function createLoop(dispatch: (action: Action) => void, onFrame: (state: GameState) => void, getState: () => GameState): () => void`
  - Returns a stop function that cancels the loop.
  - `getState` supplies the current state to `onFrame` each rAF frame; the loop itself never stores game truth.
- The loop uses `requestAnimationFrame`. Each frame, it accumulates time and dispatches `{ type: "tick", dt }` in fixed 1/60s steps (approximately 16.67 ms).
- After dispatching ticks, call `onFrame(state)` once per rAF frame (not per tick). The `onFrame` callback receives the current state for rendering.
- The `dispatch` function is provided by the caller (connects to the reducer).
- The loop must be safe to start/stop multiple times.
- No `setInterval` or `setTimeout`. Only `requestAnimationFrame`.
- No `any` type. No default exports.

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm run typecheck` | Exit 0. |
| 2 | `npm run build` | Exit 0. |

Note: The loop cannot be fully unit-tested without a browser (no rAF in Node). Type-checking and build are the acceptance criteria. The integration test (T-012) will verify it works in the browser.

## Edges

- Tab visibility: when the tab is hidden, rAF pauses. On return, do not dispatch a huge burst of ticks. Cap accumulated time at 250 ms (drop excess).
- The stop function must cancel the rAF and prevent further dispatches.

## Out of scope

- No enemy stepping, no refuge timers (Phase 4).
- No audio.
