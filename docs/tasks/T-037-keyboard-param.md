# T-037: Keyboard Param Name (B-005)

Phase: 3 (input)
Depends on: T-030 (last owner of `keyboard.ts`) — done
Round: 1
Source: B-005 (backlog). The parameter `attachKeyboard(dispatch, isPlaying: () => Phase)` is named `isPlaying` but returns the full `Phase` union, not a boolean.

## Files

- `src/input/keyboard.ts` (modify — rename only)

Do not create or modify files outside this list. There is no keyboard test file (DOM-bound; T-008's precedent was typecheck + build). The call site in `src/main.ts:157` passes a lambda and needs no change.

## Requirements

- Rename the second parameter `isPlaying` → `getPhase` (line 20) and its single use `isPlaying()` → `getPhase()` (line 23).
- No logic change of any kind.

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `grep -rn "isPlaying" src/` | Red evidence pre-change: matches keyboard.ts:20,23. Post-change: no match. |
| 2 | `npm test` | All tests pass (none exercise keyboard.ts). |
| 3 | `npm run typecheck` | Exit 0. |
| 4 | `npm run build` | Exit 0. |

Behavioral audit for the verifier: `git diff src/` must be exactly two identifier renames in `src/input/keyboard.ts`.
