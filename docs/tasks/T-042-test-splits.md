# T-042: Test-File Splits + Shared Test Helpers (B-022)

Phase: — (housekeeping)
Depends on: none (all `src` files free; pure test reorganization)
Round: 1
Source: B-022 (backlog, risk low). AGENTS.md code rule: "Files under 250 lines. Split rather than grow." **Pure test reorganization — zero `src/` changes, zero behavior change.** The full suite (312 tests) must pass with every test preserved.

## Goal

Three test files breach the 250-line rule and their fixture helpers are duplicated across files:
- `test/state.test.ts` — 693 lines
- `test/tick.test.ts` — 443 lines
- `test/rules/generate.test.ts` — 328 lines

The `seededRng`, `emptyBoard`, `makeEnemy` helpers (and the identical `makePlayingState`/`makeState`) are re-defined in multiple files. This task (a) extracts the shared fixtures into one `test/test-helpers.ts`, and (b) splits each over-limit file into per-behavior files so **every test file is under 250 lines** with no test added, removed, or loosened.

## Target layout (all new files; delete the three originals)

- `test/test-helpers.ts` — the shared fixtures, exported: `seededRng`, `quietRng`, `emptyBoard`, `makeState` (the full-`GameState` builder — `makePlayingState` in state.test.ts and `makeState` in tick.test.ts are byte-identical; unify to one `makeState`), `makeEnemy`, `boardWithCell` (with the optional `base` param, so it also serves `boardWith`). Import `Cell`, `Rule` from `@/rules/types`, `Enemy` from `@/game/enemies`, `COLS`/`ROWS`/`BOARD_SIZE` from `@/game/state`.
- `test/state/move.test.ts` — the `move *` tests from the old "state" describe.
- `test/state/eat.test.ts` — the `eating *`, level-clear/next-level, extra-life, pause/resume, restart, and title tests.
- `test/state/enemy-hit.test.ts` — the `enemy-hit *` and `wrong eat *` tests.
- `test/state/step.test.ts` — the old "player step and buffer" describe.
- `test/state/modes.test.ts` — the old "modes and bands" describe.
- `test/tick/step.test.ts` — the player/enemy step-resolution tests from the "tick" describe.
- `test/tick/collision.test.ts` — the collision + replacement-spawn tests (incl. the T-039 `pendingSpawnAt` cases).
- `test/tick/refuge.test.ts` — the refuge expiry/spawn tests.
- `test/rules/generate-board.test.ts` — the "generateBoard" + "all five modes" describes.
- `test/rules/generate-expr.test.ts` — the "hard expression floor" + "band-aware last-resort cells (T-034)" describes, plus the `cycleRng`/`operands` helpers (keep these local to this file or move to `test/test-helpers.ts` if also used by generate-board).

Delete `test/state.test.ts`, `test/tick.test.ts`, `test/rules/generate.test.ts` after their contents are moved. Keep the generate-file's config constants (`config`/`easyConfig`/`hardConfig`) and rule constants (`MULTIPLES`/`FACTORS`/…) in the file(s) that use them; if both generate files need them, put them in `test/test-helpers.ts` too. The `matchCount` helper likewise.

You may split a describe into sub-files at your discretion, **provided every resulting file is under 250 lines** and no test is dropped. Preserve each test's exact name, body, and assertions — this is a move + import-wire, not a rewrite.

## Files

- `test/test-helpers.ts` (create)
- `test/state/*.test.ts`, `test/tick/*.test.ts` (create; delete `test/state.test.ts`, `test/tick.test.ts`)
- `test/rules/generate-*.test.ts` (create; delete `test/rules/generate.test.ts`)

Do NOT modify anything in `src/`. Do not modify `test/enemies.test.ts`, `test/board.test.ts`, `test/render.test.ts` (all already under 250), or `test/rules/rule-k.test.ts` (T-041) unless one of them re-defines a helper you extract — if so, point it at `test/test-helpers.ts` and leave its tests unchanged. Do not edit `PRODUCT_SPEC.md` / `STATUS.md` / `docs/tasks/BACKLOG.md`.

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm test` | All 312 tests pass, **exactly 312** (same count as before the split). Run `npm test 2>&1 \| rg "Tests "` and confirm `312 passed (312)`. No test may be lost, renamed, or loosened. |
| 2 | `npm run typecheck` | Exit 0. |
| 3 | `npm run build` | Exit 0. |
| 4 | `wc -l test/**/*.test.ts test/test-helpers.ts` | Every file is under 250 lines. No file over 250. |

Behavioral audit for the verifier: `git diff` against the base must show **zero changes under `src/`**. Every `it("...")` test name that existed in the three deleted files must appear in a new file (the verifier should `rg -o 'it\("[^"]+"' <old file>` at the base and confirm each name exists in the new files). Helper behavior (`makeState`, `emptyBoard`, `seededRng`, `makeEnemy`, `boardWithCell`) must be byte-for-byte identical to the originals, only relocated.

## Edges

- `makePlayingState` (state) and `makeState` (tick) are currently byte-identical; unify to one `makeState` in `test-helpers.ts` and update the import in every split file. If they have diverged by even one default, do NOT merge them — keep both in `test-helpers.ts` under their original names and note it.
- `emptyBoard` in enemies.test.ts uses a literal `30`; the shared one uses `BOARD_SIZE` (= 30). If you point enemies.test.ts at the shared helper, confirm the count is identical (it is). Prefer leaving enemies.test.ts untouched unless trivially safe.
- The `boardWith` (tick) helper has no `base` param; `boardWithCell` (state) does. The unified `boardWithCell(pos, cell, base?)` with `base` defaulting to a fresh `emptyBoard()` covers both call shapes.
- Import paths use the `@` alias → `src`. Test helpers import from `@/game/state` etc. via the same alias the tests already use.

## Out of scope

- Any `src/` change, any behavior change, adding new tests, or new dependencies. B-020 (advisory dep re-approval), B-025 (UI test harness — needs a DOM capability), B-026 (dedup-survivor spec decision), B-027 (degenerate k-range) are all separate.
