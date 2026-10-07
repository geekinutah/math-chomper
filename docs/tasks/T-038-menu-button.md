# T-038: Game-Over "Menu" Goes to Title + Stronger Wrong-Eat Test (B-006, carries B-023)

Phase: 6 (feel — screens/state)
Depends on: none (state.ts, screens.ts, state.test.ts are free after the 2026-10-06 wave)
Round: 1
Source: B-006 (backlog, risk low). Carries B-023 (backlog, risk low) since both touch `state.ts` / `state.test.ts`.

## Goal

Two defects in the same files:

1. **B-006.** Spec §11 item 5 says the game-over screen shows two distinct buttons: "Play again" and "Menu". "Play again" restarts the run. But the "Menu" button (`src/ui/screens.ts:120-122`) dispatches `{ type: "restart" }` — it does the same thing as "Play again". "Menu" should take the player back to the **title** screen. There is no action for that yet.

2. **B-023.** The wrong-eat respawn test (`test/state.test.ts:348`) makes a single draw from one seeded rng and asserts the resulting position is off the enemy and refuge cells. Because the candidate pool already excludes those cells, deleting either exclusion line in `handleEnemyHit` (`src/game/state.ts:185-192`) still leaves that one draw on a legal cell, so the test carries no assertion power. Replace the single draw with a multi-seed property check.

## Files

- `src/game/state.ts` (modify — add one action + one reducer case; B-023 lives here but the fix is test-only)
- `src/ui/screens.ts` (modify — one button dispatch)
- `test/state.test.ts` (modify — add the title test; strengthen the wrong-eat test)

Do not create or modify files outside this list. `src/main.ts` is untouched: it already dispatches whatever `Action` the screen sends and re-renders on `next !== prev`, so a new `"title"` action needs no wiring there (title is the initial phase; `renderAll` shows the title screen when `state.phase === "title"` and hides the HUD via `hudEl.classList.toggle("hidden", s.phase === "title")`).

## Requirements

### `src/game/state.ts`

- Add `| { type: "title" }` to the `Action` union (after the existing `restart` member, line 51).
- In `reduce`, add a case that returns a fresh initial state:

  ```ts
  case "title":
    return createInitialState();
  ```

  `createInitialState()` (line 100) already returns phase `"title"`, `mode: "multiples"`, `band: "standard"`, level 1, score 0, lives 3, reserve 0, streak 0, threshold 1000, fresh empty board, center player, no enemies, no refuge. Do **not** preserve `mode`/`band` (unlike `restart`): the title's "Play" opens the mode-select, which already remembers the last choice through the settings layer, so a full reset is the intended "Menu" behavior. No `rng` is used (the reset is deterministic). No phase guard — mirror `restart` (line 238), which is also unconditional.

### `src/ui/screens.ts`

- Line 120-122: the "Menu" button's handler dispatches `{ type: "title" }` instead of `{ type: "restart" }`. The "Play Again" button (line 116-118) is unchanged (still `restart`).

### `test/state.test.ts`

Add one test inside the existing `describe("state", ...)` block:

| Test name | Behavior proved |
|-----------|-----------------|
| `title resets to the title screen from game-over` | Build a game-over state with a distinct history — `makePlayingState({ phase: "game-over", mode: "factors", band: "hard", level: 7, score: 500, lives: 0, streak: 0, reserveLives: 1, nextLifeThreshold: 3000, refuge: { pos: { col: 4, row: 4 }, expiresAt: 0 } })`. Dispatch `{ type: "title" }` with `rng`. Assert the result equals a fresh `createInitialState()`: phase `"title"`, mode `"multiples"`, band `"standard"`, level 1, score 0, lives 3, reserveLives 0, streak 0, nextLifeThreshold 1000, board 30 empty cells, `playerPos` center, `enemies` empty, `refuge` null. |

Strengthen the existing wrong-eat test (B-023) — replace the single-draw body of the test at line 348 (`wrong eat: player respawns off enemy and refuge cells`) with a multi-seed loop, keeping the same two assertions:

```ts
it("wrong eat: player respawns off enemy and refuge cells", () => {
  const pos = { col: 2, row: 2 };
  const board = boardWithCell(pos, { kind: "number", value: 7 });
  const enemy: Enemy = { id: 1, kind: "straight", pos, dir: "right", stepTimer: 420 };
  const refuge = { pos: { col: 3, row: 2 }, expiresAt: 0 };
  for (let seed = 1; seed <= 200; seed++) {
    const s = makePlayingState({ board, enemies: [enemy], refuge });
    const after = reduce(s, { type: "eat" }, seededRng(seed));
    expect(after.playerPos).not.toEqual(enemy.pos);
    expect(after.playerPos).not.toEqual(refuge.pos);
  }
});
```

This is a strengthening, not a deletion: the same two conditions are now asserted across 200 seeds. `seededRng` and the `Enemy` type are already imported/defined at the top of the file (lines 16, 3). Do not delete the surrounding wrong-eat tests (337-346, 359-369).

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | Red: add `{ type: "title" }` to the union, write the title test, and have `case "title": return state;` (no-op). Run the title test. | It fails: phase is still `"game-over"`, score still 500, mode still `"factors"`. Keep trimmed output. |
| 2 | Red: with the single-seed version of the wrong-eat test in place, in a scratch copy delete the refuge line (`state.ts:187`) and the enemy loop (`state.ts:186`) — the 200-seed loop must now fail on at least one seed. | At least one assertion fails per deleted exclusion. Keep trimmed output. |
| 3 | `npm test` | All tests pass. |
| 4 | `npm run typecheck` | Exit 0. |
| 5 | `npm run build` | Exit 0. |

Behavioral audit for the verifier: `git diff src/` is (a) the `title` union member + the one reducer case in `state.ts`, and (b) the one-line Menu-button dispatch in `screens.ts`. Nothing else in `src/` changes.

## Edges

- The title action is unconditional (no phase guard), matching `restart`. It can therefore be dispatched from any phase, but the only in-game sender is the game-over Menu button.
- `createInitialState()` is already the canonical title state used at startup, so `Menu` and cold-start produce the same screen. The mode-select "remember last choice" behavior is a settings-layer concern (T-019/T-023) and is unaffected.

## Out of scope

- B-010 (dedup replacement spawn — also needs a `state.ts` field; claim after this merges so `state.ts` ownership stays exclusive), B-021 (ctx dedup, `enemies.ts`/`tick.ts`), B-016 (rule-k dedup, `board.ts`/`state.ts`), B-022 (test-file splits — `state.test.ts` grows here by ~15 lines; the split is a separate housekeeping contract).
