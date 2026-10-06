# T-022: Audio Beeps

Phase: 6
Depends on: none
Round: 1

## Goal

Implement Web Audio API beeps for game events. No sample files, no runtime dependencies. All sounds are synthesized.

## Files (create, all new)

- `src/audio/beeps.ts`
- `test/beeps.test.ts`

Do not create or modify files outside this list.

## Requirements

### `src/audio/beeps.ts`

```ts
export function initAudio(): void;
export function setMuted(muted: boolean): void;
export function isMuted(): boolean;
export function playEat(): void;
export function playWrong(): void;
export function playHit(): void;
export function playLevelClear(): void;
export function playRefuge(): void;
```

- `initAudio()`: Create the `AudioContext` (lazy — first call). Must be called from a user gesture (browser policy). Store the context in a module-level variable.
- `setMuted(m)`: Store mute state. When muted, all play functions are no-ops.
- `isMuted()`: Return current mute state.
- Each `playX()` function: if muted, return. Otherwise, synthesize and play a short beep using the `AudioContext`.
  - **eat**: short noise burst (50ms), high-pitched. Use a `BufferSourceNode` with a small random buffer, or an `OscillatorNode` at ~800Hz with quick decay.
  - **wrong**: low buzz (200ms), ~150Hz square wave.
  - **hit**: descending blip (300ms), oscillator frequency ramp from 600→200Hz.
  - **levelClear**: three rising tones (100ms each, 50ms gap): 400, 500, 600Hz sine.
  - **refuge**: soft tick (30ms), ~1200Hz sine, low volume.
- Use `ctx.createOscillator()` + `ctx.createGain()` for each sound. Connect to `ctx.destination`. Start and stop the oscillator.
- If the AudioContext is in "suspended" state (browser autoplay policy), call `ctx.resume()`.
- No `any`. No default exports. No third-party audio libraries.
- The AudioContext type: use `AudioContext` (standard web API). If TypeScript complains about the type, use `window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext` for Safari compat. But keep it simple — just `AudioContext`.

### `test/beeps.test.ts`

Since there's no AudioContext in Node/Vitest, test what you can:
- `setMuted` / `isMuted` round-trip
- `initAudio` doesn't throw when called (it will fail to create a real context in Node, so make initAudio handle the case where AudioContext is undefined gracefully — just store null and make all play functions no-ops)
- Play functions don't throw when audio is not initialized or is muted

| Test name | Behavior proved |
|-----------|-----------------|
| `setMuted/isMuted round-trip` | setMuted(true) → isMuted() true, setMuted(false) → false |
| `initAudio does not throw in Node` | No AudioContext available, initAudio handles gracefully |
| `play functions are no-ops when muted` | setMuted(true), all play functions don't throw |
| `play functions are no-ops when not initialized` | Without initAudio, play functions don't throw |

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm test` | All beeps tests pass. |
| 2 | `npm run typecheck` | Exit 0. |
| 3 | `npm run build` | Exit 0. |

## Edges

- `initAudio` must be safe to call multiple times (idempotent).
- All play functions must be safe to call without prior `initAudio` (no-ops).
- Mute state is module-level (not persisted — that's T-023/T-026's job via storage).

## Out of scope

- No music, no sound files.
- No persistence of mute state (Phase 6 storage/integration handles that).
- No settings UI (T-025/T-026).
