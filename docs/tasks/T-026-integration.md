# T-026: Phase 6 Integration — Audio, Storage, Touch, Scaling, Settings

Phase: 6
Depends on: T-022 (audio), T-023 (storage), T-024 (touch), T-025 (scores UI)
Round: 1

## Goal

Wire all Phase 6 features into the game: audio beeps on events, settings persistence, touch controls, integer scaling, reduced motion, and the high-score flow.

## Files (modify)

- `src/main.ts` (modify — wire everything)
- `index.html` (modify — add touch container, import touch.css)

Do not create or modify files outside this list. Do NOT modify any file in `src/audio/`, `src/storage.ts`, `src/input/touch.ts`, `src/ui/`, `src/game/`, `src/content/`, `src/render/`.

## Requirements

### Modify `src/main.ts`

1. **Audio**:
   - Import `initAudio`, `setMuted`, `playEat`, `playWrong`, `playHit`, `playLevelClear`, `playRefuge` from `@/audio/beeps`.
   - Call `initAudio()` on the first user gesture (the Play button click, or the first keydown).
   - After each `dispatch`, check the state transition and play the appropriate sound:
     - Eat match: `playEat()`
     - Eat non-match (life lost): `playWrong()`
     - Enemy hit (life lost): `playHit()`
     - Level clear: `playLevelClear()`
     - Refuge appears: `playRefuge()`
   - Detect transitions by comparing `prevScore`, `prevLives`, `prevPhase` before dispatch.
   - Call `setMuted(settings.mute)` on load and whenever settings change.

2. **Storage**:
   - Import `loadSettings`, `saveSettings`, `loadScores`, `saveScore`, `resetScores`, `qualifiesForScores` from `@/storage`.
   - On load: `settings = loadSettings()`. `scores = loadScores()`.
   - Apply `setMuted(settings.mute)`.
   - Apply touch mode from settings.
   - On settings change (from the settings screen): `saveSettings(settings)`.
   - On game-over: check `qualifiesForScores(state.score)`. If yes, the initials entry appears (T-025 handles the UI). On confirm: `saveScore({ name, mode: state.mode, band: state.band, score: state.score, level: state.level })`. Update `scores`. Re-render.
   - On "Reset Scores" (settings): `resetScores()`. Update `scores = []`. Re-render.

3. **Touch controls**:
   - Import `attachTouch` from `@/input/touch`.
   - Import `TouchMode` from `@/storage`.
   - After the canvas is set up: `attachTouch(dispatch, () => state.phase, settings.touch, canvasEl)`.
   - The detach function is called on... actually, the touch controls persist for the session. No need to detach unless the settings change the touch mode.

4. **Integer scaling**:
   - Already implemented in T-012. Verify it still works. The canvas should scale with integer multipliers to fit the viewport.
   - If the current implementation doesn't use integer scaling (floor), fix it here.

5. **Reduced motion**:
   - `const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches`
   - If true, add a class to the body or skip any CSS animations/transitions.
   - The game currently has no screen shake, so this is mostly a no-op. Add the check for future-proofing.

6. **Pass new params to renderScreens**:
   - The `renderAll` function must now pass `scores` and `onScoreSave` to `renderScreens` (the new params from T-025).
   - `onScoreSave`: takes the name string, calls `saveScore(...)`, updates `scores`, re-renders.

### Modify `index.html`

- Import `src/input/touch.css` via `<link>`.
- Add a `<div id="touch-controls">` container (the touch module will populate it).

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm test` | All tests pass (existing 223+). |
| 2 | `npm run typecheck` | Exit 0. |
| 3 | `npm run build` | Exit 0. `dist/index.html` uses relative paths. |
| 4 | `npm run dev` | Game boots. Settings persist across reload. Mute works. Touch controls appear on narrow viewport. Audio plays on eat/hit/clear. |
| 5 | Playability | Full game: play → eat (beep) → miss (buzz) → hit (blip) → level clear (rising tones) → game over → initials → score saved → title shows scores. |

## Edges

- `localStorage` may be unavailable (privacy mode). The storage module handles this (returns defaults). The game must still work without persistence.
- Audio context may be suspended (autoplay policy). `initAudio` handles resume.
- The `onScoreSave` callback must be stable (not recreated every frame) to avoid re-rendering the initials input while the user is typing.
- Touch controls and the screens overlay: touch controls should be `pointer-events: auto` but the screens overlay should be `pointer-events: none` when hidden (B-008 fix).

## Out of scope

- No gamepad.
- No cross-device sync.
- No music.
