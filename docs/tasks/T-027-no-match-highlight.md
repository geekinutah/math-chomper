# T-027: Remove Match-Highlight Border

Phase: 6 (critic Phase 3 fix, accepted by Mike 2026-10-06)
Depends on: T-009 (board rendering, done)
Round: 1

## Goal

All occupied cells render identically whether or not they match the current rule. The rule line in the HUD is the sole target indicator. The faint `#1a3a2a` border (a T-009 contract decision, not a spec requirement) lets players trace the border instead of doing the math; the Phase 3 critic flagged this and Mike accepted the removal.

## Files

- `src/render/canvas.ts` (modify)
- `test/render.test.ts` (create new)

Do not create or modify files outside this list. In particular: do not edit `PRODUCT_SPEC.md` (the spec is silent on the highlight; no spec change is needed), `src/ui/hud.ts` (the rule line stays as-is), `src/render/sprites.ts`, or anything under `src/rules`.

## Requirements

### `src/render/canvas.ts`

- Delete the `MATCH_BORDER` constant.
- In `drawCell`, delete the `if (matches(rule, cell))` branch (the `strokeRect` call).
- `drawCell` no longer needs the rule: drop the `rule` parameter and update the call site in `renderBoard`. Remove the now-unused `matches` import and the `Rule` type import.
- Grid, cell text, player, enemy, and refuge drawing are unchanged. Spec §12 palette stays as-is.

## Tests to write in `test/render.test.ts` (before the code change)

Vitest runs in a node environment (no DOM, no canvas). Build a `FakeCtx` class implementing exactly the `CanvasRenderingContext2D` members that `canvas.ts` and `sprites.ts` use — `fillRect`, `beginPath`, `moveTo`, `lineTo`, `closePath`, `stroke`, `arc`, `fill`, `fillText`, `strokeRect` — plus settable `fillStyle`, `strokeStyle`, `lineWidth`, `font`, `textAlign`, `textBaseline`. Record every method call as `{ method: string; args: unknown[] }` in an array the tests can inspect. Cast the instance with `as unknown as CanvasRenderingContext2D`; no `any`. `test/beeps.test.ts` (typed fake classes) is the house precedent.

| Test name | Behavior proved |
|-----------|-----------------|
| `renderBoard never calls strokeRect` | Board holds a matching number cell (12, rule multiples of 6), a non-matching number cell (7), and an expr cell; state has the player, one enemy, and a refuge. Zero `strokeRect` calls recorded. |
| `cell rendering is independent of the rule` | Same board rendered twice — rule `{ mode: "multiples", k: 6 }` (12 matches) and `{ mode: "multiples", k: 7 }` (12 does not). The recorded call lists are deeply equal. |
| `occupied cells still draw their content` | A number cell records `fillText(String(value))`; an expr cell records `fillText(text)`; an empty cell records no `fillText` of its own. |
| `all-empty board still draws grid and actors` | Fully empty board: grid `stroke` calls and player calls still occur; zero `fillText`. |

Tests 1–2 must fail against the current code (the border is present) before the change; keep the trimmed red output.

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm test` | All tests pass, including the 4 new render tests (14 test files). |
| 2 | `npm run typecheck` | Exit 0. |
| 3 | `npm run build` | Exit 0. |

## Edges

- Tests must build full `GameState` values (enemies, refuge, simTime, freezeTimer), not partial objects.
- Grid, player, enemies, and refuge use `stroke()`/`arc()`, never `strokeRect`. The zero-`strokeRect` assertion must hold with all actors present, so it proves only the cell border was removed.

## Out of scope

- No HUD, UI copy, audio, or rules changes. `matches` still gates scoring in `state.ts`; this task is rendering only.
