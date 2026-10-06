# T-006: Game State + Reducers

Phase: 3
Depends on: T-004 (types, match)
Round: 1

## Goal

Implement the complete game state machine: state type, action types, and the pure reducer. This is the core logic that everything else reads from and dispatches to.

## Files (create, all new)

- `src/game/state.ts`
- `test/state.test.ts`

Do not create or modify files outside this list.

## Requirements

### `src/game/state.ts`

Export the following (all named exports):

```ts
export type Dir = "up" | "down" | "left" | "right";
export type Phase = "title" | "playing" | "level-clear" | "game-over" | "paused";

export type PlayerPos = { col: number; row: number };

export type GameState = {
  phase: Phase;
  mode: Mode;
  level: number;
  score: number;
  lives: number;
  reserveLives: number;
  streak: number;
  nextLifeThreshold: number;
  rule: Rule;
  board: Cell[];
  playerPos: PlayerPos;
};

export type Action =
  | { type: "start"; mode: Mode }
  | { type: "move"; dir: Dir }
  | { type: "eat" }
  | { type: "tick"; dt: number }
  | { type: "next-level" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "restart" };

export function createInitialState(): GameState;
export function reduce(state: GameState, action: Action): GameState;
```

### Reducer behavior

- **start**: Sets mode, phase to "playing", level 1, score 0, lives 3, reserveLives 0, streak 0, nextLifeThreshold 1000. Generates a rule (multiples with random k 2–12) and a board. Player starts at center (col 2, row 2).
- **move**: If phase is "playing", move playerPos by one cell in the given dir. Clamp to grid bounds (col 0–5, row 0–4). No eating on move.
- **eat**: If phase is "playing":
  - Get cell at playerPos.
  - If empty: no-op (do nothing).
  - If `matches(rule, cell)`: score += (streak >= 3 ? 15 : 10), streak++, set cell to `{kind:"empty"}`. Then check: if no remaining cell on the board matches the rule, add level-clear bonus (+25 + 5*level), set phase to "level-clear".
  - If not a match: lives--, streak = 0, set cell to `{kind:"empty"}`. If lives reaches 0, set phase to "game-over".
  - After scoring, check extra life: if score >= nextLifeThreshold, reserveLives = min(reserveLives + 1, 2), nextLifeThreshold += 1000.
- **tick**: No-op in Phase 3 (enemies come in Phase 4). Accepts the action but returns state unchanged.
- **next-level**: If phase is "level-clear": level++, generate new rule (new random k), generate new board, reset playerPos to center, phase = "playing", streak = 0.
- **pause**: If phase is "playing", set phase to "paused".
- **resume**: If phase is "paused", set phase to "playing".
- **restart**: Same as "start" but keeps the current mode.

### Rules for generation in state

- The reducer uses `generateBoard` from `@/rules/generate` and a `matches` from `@/rules/match`.
- For the "start" and "next-level" actions, the reducer needs an rng. Since reducers must be pure, accept an optional `rng` parameter: `export function reduce(state: GameState, action: Action, rng?: () => number): GameState`. Default to a simple LCG if not provided.
- For "start"/"next-level" with mode "multiples": pick k from 2–12 using rng.

### Grid constants

Export: `export const COLS = 6; export const ROWS = 5; export const BOARD_SIZE = 30;`

### GenConfig

Define a local constant for the standard band: `{ numMin: 1, numMax: 60, exprOps: ["+", "−", "×", "÷"], exprMin: 0, exprMax: 12 }`. Use this for board generation. (Phase 5 will make this configurable per band.)

## Tests to write

Use a deterministic rng for all tests. Helper:
```ts
const rng = () => 0.5; // deterministic for tests
```

| Test name | Behavior proved |
|-----------|-----------------|
| `start sets initial state` | phase "playing", level 1, score 0, lives 3, reserveLives 0, streak 0, nextLifeThreshold 1000, board length 30, playerPos {col:2,row:2} |
| `move right increases col` | playerPos.col increases by 1 |
| `move left decreases col` | playerPos.col decreases by 1 |
| `move up decreases row` | playerPos.row decreases by 1 |
| `move down increases row` | playerPos.row increases by 1 |
| `move clamps at right edge` | col stays at 5 |
| `move clamps at left edge` | col stays at 0 |
| `move clamps at top edge` | row stays at 0 |
| `move clamps at bottom edge` | row stays at 4 |
| `move during pause does nothing` | playerPos unchanged |
| `eating a match scores +10` | score increases by 10, cell becomes empty |
| `eating a match at streak 3 scores +15` | Pre-set streak to 3, score increases by 15 |
| `eating a match increments streak` | streak increases by 1 |
| `eating a non-match costs a life` | lives decreases by 1, streak resets to 0, cell becomes empty, score unchanged |
| `eating a non-match at 1 life triggers game over` | phase becomes "game-over" |
| `eating empty does nothing` | score, lives, streak all unchanged |
| `eating during pause does nothing` | No state change |
| `last match cleared triggers level-clear` | phase becomes "level-clear", score includes +25 + 5*level bonus |
| `next-level advances level and generates new board` | level increases, new board, phase "playing", streak 0 |
| `extra life at 1000 points` | Set score to 995, eat a match (+10 = 1005), reserveLives becomes 1 |
| `extra life does not exceed reserve cap 2` | Set reserveLives to 2, cross another threshold, stays at 2 |
| `extra life triggers once per threshold` | Cross 1000, then 2000 in one action — only one extra life |
| `pause then resume` | phase "playing" → "paused" → "playing" |
| `restart resets but keeps mode` | score 0, level 1, lives 3, same mode |
| `tick is a no-op in phase 3` | State unchanged |

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm test` | All state tests pass (plus all prior tests). |
| 2 | `npm run typecheck` | Exit 0. |

## Edges

- Eating the last match on the board must trigger level-clear in the same action (not a separate tick).
- Multiple extra-life thresholds crossed in one score jump: only one life awarded per action.
- The reducer must be pure: same input → same output. No side effects, no `Math.random` (use the rng param).

## Out of scope

- No enemy logic, no refuge, no rendering, no input, no audio.
- The `tick` action exists but does nothing (Phase 4 fills it in).
