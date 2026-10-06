# T-020: Integration — Band Spawning + Mode Select Wiring

Phase: 5
Depends on: T-017 (bands), T-018 (modes+band in state), T-019 (mode select UI)
Round: 1

## Goal

Wire the band into enemy spawning (which enemy types appear based on band+level), and connect the mode select screen to game start. Make all six modes playable from the UI.

## Files (modify)

- `src/game/tick.ts` (modify — band-based enemy type selection)
- `src/main.ts` (modify — wire mode select, pass band+mode to start)
- `index.html` (modify if needed)

Do not create or modify files outside this list. Do NOT modify `src/game/state.ts`, `src/game/board.ts`, `src/ui/screens.ts`, `src/ui/mode-select.ts`, `src/ui/settings.ts`, `src/content/bands.ts`.

## Requirements

### Modify `src/game/tick.ts`

- Import `getEnemyKinds`, `getBand` from `@/content/bands`.
- In the enemy spawn logic (step 8 of handleTick): instead of the current level-based kind selection, use `getEnemyKinds(getBand(state.band), state.level)` to get the pool of allowed kinds. Pick randomly from that pool.
- This means: Easy → straight/shy only. Standard → +eater/rewriter at L4, +chaser at L8. Hard → +chaser at L3.

### Modify `src/main.ts`

- Import `renderModeSelect` from `@/ui/mode-select`, `renderSettings` from `@/ui/settings`.
- Import `BandName` from `@/content/bands`, `Mode` from `@/rules/types`.
- Add a `subScreen` state variable: `"none" | "mode-select" | "settings"`.
- The title screen's "Play" button: set `subScreen = "mode-select"`, re-render screens.
- The title screen's "Settings" button (if added by T-019): set `subScreen = "settings"`.
- Mode select "Play" callback: dispatch `{ type: "start", mode, band }`, set `subScreen = "none"`.
- Mode select "Back" callback: set `subScreen = "none"`.
- Settings "Back" callback: set `subScreen = "none"`.
- Pass `subScreen` and `settings` to `renderScreens` (the new parameters from T-019).
- Define a local `settings` object with defaults: `{ band: "standard", modes: all true, mute: false, touch: "auto" }`.
- The `createLoop` onFrame callback must also pass `subScreen` to `renderScreens`.

### Modify `index.html` (if needed)

- If T-019 added new container divs, make sure they're in the HTML. Otherwise, no change needed.

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm test` | All tests pass (existing). |
| 2 | `npm run typecheck` | Exit 0. |
| 3 | `npm run build` | Exit 0. |
| 4 | `npm run dev` | Title → Play → Mode Select appears. Pick Factors + Standard → game starts with factors. Pick Challenge → mode rotates each level. Pick Hard → chaser appears at level 3. |
| 5 | Playability | All six modes are playable. Bands change the number range and enemy types. |

## Edges

- The `start` action signature changed in T-018 to require `band`. The main.ts dispatch must pass both `mode` and `band`.
- Challenge mode: the state handles rotation internally (T-018). main.ts just dispatches `start` with `mode: "challenge"`. But wait — `"challenge"` is not in the `Mode` type! T-018 should have added it. If it didn't, this is a type error. Check: the `Mode` type in `rules/types.ts` is `"multiples" | "factors" | "primes" | "equality" | "inequality"`. Challenge is a UI concept. The state needs to handle it. If T-018 added `GameMode = Mode | "challenge"` to state.ts, use that. If not, you may need to add it to the `Action` type.

IMPORTANT: You CANNOT modify state.ts. If there's a type mismatch between what T-019's mode select emits and what the `start` action expects, work around it in main.ts with a mapping function. For example, if `Mode` doesn't include "challenge", map it: the state's "start" action takes `mode: Mode`, but challenge is handled by passing the first mode and a flag. OR: if T-018 already extended the Action to accept `GameMode`, it will just work.

Read the actual files in your worktree to see what T-018 and T-019 produced, and adapt.

## Out of scope

- No localStorage (Phase 6).
- No audio (Phase 6).
- No touch controls (Phase 6).
