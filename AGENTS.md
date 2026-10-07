# Math Chomper — agent instructions

OpenCode reads this file. The design lives in `PRODUCT_SPEC.md`. Read that file before writing gameplay code. If this file and the spec disagree, the spec wins on behavior and this file wins on process.

Roles, adapted from NextThing `docs/agents/` and locked 2026-10-05:

- `agents/controller.md` — plans, writes small non-overlapping contracts, delegates in parallel, integrates in its own worktree. No application code.
- `agents/implementer.md` — one contract, in its own worktree, tests first, real command output.
- `agents/verifier.md` — fresh session, own worktree, skeptical, mutation check, logs gaps to the backlog.
- `agents/critic.md` — plays phases 3–6 from its own worktree, judges the milestone, proposes spec changes, edits no game code.
- `agents/protocol.md` — handoff packet and report formats.
- `docs/tasks/BACKLOG.md` — index of gaps and discovered bugs. Item files live in `docs/tasks/backlog/`.

No work is done until a fresh verifier says PASS. A playable phase is not done until the critic has reported and Mike has accepted or deferred each spec proposal. "It should work" is not verification.

Isolation is the rule, and more than one controller may run at once. Implement, verify, and critique each happen in their own git worktree. No controller stages in the shared main checkout. Claiming a task means pulling `main`, writing the contract and the `in progress` row, and committing and pushing both to `origin/main` before any implementation work starts. This is a must, not a courtesy: the `STATUS.md` row and the contract must be on `origin/main` before an implementer is handed off. An unpushed `STATUS.md` edit is an unclaimed task. A rejected fast-forward means another controller won the claim; pull and pick different work. Integration happens in a throwaway worktree. Git's fast-forward push is the lock, not care taken in a shared directory.

Title is Math Chomper. Package name is `math-chomper`. localStorage prefix is `mathchomper.`. Do not rename the project, and do not use the names Number Munchers, Math Munchers, Muncher, Troggle, or Trogglus anywhere in UI, code, comments, or commits.

## Commands

- Install: `npm install`
- Dev: `npm run dev`
- Test: `npm test` (Vitest, no browser)
- Typecheck: `npm run typecheck` (`tsc --noEmit`)
- Build: `npm run build`

The gate is `npm test && npm run typecheck && npm run build`. All three must succeed before a task is reported done. Do not claim success without pasting output.

## Stack (locked)

- Vite, TypeScript strict, Canvas 2D, Vitest.
- Menus and HUD are HTML/CSS. The board is canvas.
- No React, Vue, Svelte, Phaser, Pixi, jQuery, Tailwind, or CSS frameworks.
- No backend, no analytics, no account system, no CDN fonts.
- Runtime dependencies allowed: none, unless the human adds one. Vite and Vitest are dev dependencies only.
- Path alias `@` → `src`.

## How to work

- Modularize. A phase is not a task. The controller splits each phase into contracts a single implementer can finish in one sitting: one behavior, one module, a file list that does not overlap any other in-flight contract. "Build enemies" is four or five contracts, not one. If two contracts would edit the same file, one of them is too big.
- Prefer a new module over growing a shared file. Rules, board generation, each enemy behavior, input, rendering, audio, and storage are separate scopes so they can run in parallel.
- A finding outside the current contract is a backlog item, not a drive-by fix. The verifier writes the item file. The controller dedupes the index on merge.
- Do not add features that are not in the spec. Cutscenes, music, multiplayer, accounts, and a level editor are out.
- Game truth lives in plain objects and reducers under `src/game` and `src/rules`. The canvas only draws. The DOM only displays HUD and menus.
- Write the rule tests before the board renderer. A pretty board with a wrong prime check is a failed phase.
- Prefer a boring `switch` and a typed `Rule` union over a class hierarchy.
- Enemy AI is a pure function `(enemy, state) => nextCell`. No pathfinding library.
- Comments only where a rule would surprise a reader (why 1 is not prime, why division must be exact). Do not narrate the code.
- No negative points. A miss costs a life, not score.
- Score is +10, or +15 on a streak already at 3. Level clear is +25 plus +5 per level. Extra life every 1,000 points. Start with 3 lives, reserve cap 2. Do not implement the 1986 point ladder (5 / 10 / 15 … 75).
- If a spec case is ambiguous, stop and record it in `STATUS.md`. Do not invent a second design. Do not write `NOTES.md`.

## Code rules

- `"strict": true`, `noUnusedLocals`, `noImplicitOverride`. No `any`. No non-null assertions unless the previous line just checked.
- Named exports. No default exports except the Vite config.
- Files under 250 lines. Split rather than grow.
- Deterministic generation: `board.ts` takes a `() => number` rng. Tests pass a seeded rng. Do not call `Math.random` inside `src/rules`.
- Integers only on the board. No floats in expressions.
- Player-facing operator glyphs are `+ − × ÷`. Internal eval must not use `eval` or `Function`.

## Definition of done, per phase

1. Scaffold: `npm run dev` shows a black canvas. `npm test` runs an example test. `npm run build` emits `dist/`. Verifier only.
2. Rules: every test in PRODUCT_SPEC.md section 15 under "Rules" exists and passes. Verifier only.
3. Playable board: keyboard move and eat, score, lives, level clear, game over, Multiples only. A human can play a full level with no enemies. Critic plays it.
4. Enemies: all five behaviors, refuge, spawn caps. Tests in section 15 under "Enemies" pass. Critic plays it.
5. Modes: all six entries on the mode select. Bands change range and which enemies appear. Critic plays each mode.
6. Feel: pause, mute, local top 8, touch controls, integer scaling. `npm run build` output opens by itself from `dist/index.html` (relative asset paths). Critic plays it.

## UI copy

Short. The rule line is the tutorial. Examples: `Multiples of 6`, `Factors of 12`, `Prime numbers`, `Equals 8`, `Not equal to 8`.

## When stuck

Stop and write the blocker under Blockers in `STATUS.md`. Do not swap the stack. Do not add a framework to get unstuck. Do not copy sprites or text from the 1986 game.
