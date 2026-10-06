# T-011: Board and Level Management

Phase: 3
Depends on: T-006 (state), T-004 (generate, match)
Round: 1

## Goal

Implement the board/level helper functions that the state reducer uses for level transitions: generating a new rule and a new board for a given mode and level.

## Files (create, all new)

- `src/game/board.ts`

Do not create or modify files outside this list.

## Requirements

- Export: `export function generateRule(mode: Mode, level: number, rng: () => number): Rule`
  - **multiples**: k = random integer 2–12 (standard band). Slightly increases with level: `2 + floor(rng() * min(12, 2 + level))` capped at 12.
  - **factors**: k = random integer 2–12.
  - **primes**: returns `{ mode: "primes" }` (no k).
  - **equality**: k = random integer 2–12.
  - **inequality**: k = random integer 2–12.
- Export: `export function generateBoardForRule(rule: Rule, rng: () => number): Cell[]`
  - Wraps `generateBoard` from `@/rules/generate` with the standard band GenConfig: `{ numMin: 1, numMax: 60, exprOps: ["+", "−", "×", "÷"], exprMin: 0, exprMax: 12 }`.
  - Returns 30 cells.
- Export: `export function countMatches(board: Cell[], rule: Rule): number`
  - Returns the number of cells that `matches(rule, cell)`.
- Export: `export function allMatchesCleared(board: Cell[], rule: Rule): boolean`
  - Returns `countMatches(board, rule) === 0`.
- No `any`. No default exports. No `Math.random` (use the rng param).

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm run typecheck` | Exit 0. |
| 2 | `npm run build` | Exit 0. |

Note: These are pure helper functions. They are exercised indirectly through the state reducer tests (T-006) and the integration (T-012). No separate unit test file is required — the state tests cover the behavior. If the implementer wishes to add `test/board.test.ts` for `countMatches` and `allMatchesCleared`, that is permitted but the file is not in the contract scope. The functions must be correct as exercised by the state tests.

Wait — actually, let me add a test file since the verifiability gate requires named tests:

- `test/board.test.ts` (also create)

| Test name | Behavior proved |
|-----------|-----------------|
| `generateRule multiples returns k in 2-12` | For 100 rng values, k is always 2–12 |
| `generateRule primes has no k` | Result has mode "primes" |
| `generateBoardForRule returns 30 cells` | length === 30 |
| `generateBoardForRule multiples: all numbers` | Every cell kind is "number" |
| `generateBoardForRule equality: all expressions` | Every cell kind is "expr" |
| `countMatches counts correctly` | Hand-crafted board with known matches |
| `allMatchesCleared true when no matches remain` | Board with all empty or non-matching |
| `allMatchesCleared false when matches exist` | Board with at least one match |

## Edges

- `generateRule` must work for all five modes.
- The rng is injected. Never call `Math.random`.

## Out of scope

- No enemy spawning.
- No band configuration (Phase 5).
