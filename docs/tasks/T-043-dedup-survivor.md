# T-043: Dedup Survivor — Arriving Eats Resident (B-026)

Phase: — (behavior fix)
Depends on: none (all `src` files free)
Round: 1
Source: B-026 (backlog). Owner decision 2026-10-07 (Mike): keep PRODUCT_SPEC.md §9:237 **as written** ("the arriving one removes the resident") and make the code match it, tracking per-cell residency. **This is a behavior change the owner explicitly wants ("more fun that way").**

## Spec (keep — do NOT edit PRODUCT_SPEC.md)

§9:237: *"If two enemies would occupy one cell, the arriving one removes the resident."*

The spec sentence stays exactly as it is. We are making the **code** conform to it. No spec edit. (The one spec-silent case — two enemies that both *arrived* at a previously-empty cell, so there is no resident — is an implementation tiebreak, not a design: keep the first in array order. Note this in the report; it needs no spec change.)

## Current behavior (the bug)

`src/game/tick.ts:136-145` dedups with a `Set` and keeps the **first occurrence in `newEnemies` array order**. Array order = spawn order (older enemies sit earlier; `tick.ts:156`/`197` push newcomers at the end). That is not "resident vs arriving." When a stationary enemy shares a cell with one that stepped onto it, the survivor is whichever is earlier in the array — so the **resident** (usually older/earlier) survives and the **arriving** mover is dropped. The inverse of §9:237.

`newEnemies` is built at `tick.ts:94-134` by iterating `state.enemies` in order; each keeps its `id`. An enemy that was in cooldown this tick (`stepTimer > 0`, line 96-99) is pushed **unmoved** (it stays on its cell); one whose timer fired steps to a new cell. So the pre-step position of each enemy is recoverable.

## Change (in `src/game/tick.ts`)

Distinguish **resident** (the enemy already on the cell at the *start* of the tick) from **arriver** (one that stepped onto it), and let the **arriver win**.

1. Immediately before the step loop (around line 92, where `newEnemies` is declared), snapshot each enemy's start-of-tick position:
   ```ts
   const startPos = new Map<number, { col: number; row: number }>();
   for (const en of state.enemies) startPos.set(en.id, en.pos);
   ```
   (`sameCell` is already imported at line 5.)

2. Replace the `Set`-based dedup (lines 136-145) with a per-cell "arriver-beats-resident" pick. An enemy `x` is a *resident* of cell `c` iff `sameCell(startPos.get(x.id), c)` (its start position was `c`). Keep the winner per cell; `removedCount` and everything downstream stay count-based and unchanged:
   ```ts
   const dedupMap = new Map<string, Enemy>();
   for (const e of newEnemies) {
     const key = `${e.pos.col},${e.pos.row}`;
     const cur = dedupMap.get(key);
     if (!cur) { dedupMap.set(key, e); continue; }
     const curStart = startPos.get(cur.id);
     const eStart = startPos.get(e.id);
     const curIsResident = curStart !== undefined && sameCell(curStart, e.pos);
     const eIsResident = eStart !== undefined && sameCell(eStart, e.pos);
     if (curIsResident && !eIsResident) dedupMap.set(key, e); // e arrived, eats resident cur
   }
   const deduped = [...dedupMap.values()];
   ```
   Cases: resident+arriver → **arriver survives** (in either array order). two arrivers (no resident) → first in array. two residents (defensive, should not occur) → first in array. `deduped.length` (distinct cells) is unchanged, so `removedCount`, the replacement-spawn schedule, and the player-collision loop all behave exactly as before.

Do **not** change the player–enemy collision, the refuge logic, scoring, or the replacement-spawn timing. Only the *which-enemy-survives* selection changes.

## Files

- `src/game/tick.ts` (modify the dedup + add the `startPos` snapshot)
- `test/tick/collision.test.ts` (strengthen/extend — see below)

Do not modify any other file. `makeEnemy`/`makeState`/`seededRng` are imported from `../test-helpers`.

## Tests (in `test/tick/collision.test.ts`)

1. **Strengthen** the existing `it("two enemies same cell: arriving removes resident")` (line 40) so it asserts **which** enemy survives, not just that one remains:
   - Resident: `makeEnemy({ id: 1, kind: "straight", pos: { col: 1, row: 1 }, stepTimer: 999 })` — in cooldown (999 − 500 > 0), so it stays on (1,1).
   - Arriver: `makeEnemy({ id: 2, kind: "straight", pos: { col: 1, row: 0 }, dir: "down", stepTimer: 420 })` — steps down onto (1,1).
   - `makeState({ enemies: [resident, arriver] })`, `handleTick(s, { type: "tick", dt: 0.5 }, seededRng(1))`.
   - Assert the lone enemy at (1,1) has `id: 2` (the **arriver**); id 1 (resident) is gone. **This test must FAIL on the current keep-first code** (current code keeps id 1, the earlier-in-array resident).
2. **Array-order independence:** same two enemies but `enemies: [arriver, resident]` (arriver first in the array). Assert the **arriver (id 2)** still survives — proves the winner is chosen by resident/arriver, not array position.
3. Keep the existing two-arriver shape (both step onto a shared empty cell) asserting one remains; assert it is the first in array (the spec-silent tiebreak).

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm test` | All pass. New/changed tests prove: (a) a resident + arriving mover → the **arriver** survives and the resident is removed; (b) result is independent of array order; (c) two arrivers → one remains. |
| 2 | `npm run typecheck` | Exit 0. |
| 3 | `npm run build` | Exit 0. |

Behavioral audit for the verifier: the only observable change is *which enemy id survives* an enemy–enemy collision (arriver now, was first-in-array). Player–enemy collision, refuge removal, `removedCount`-driven replacement spawn, and the scheduled-spawn timing are all unchanged — a mutation that makes the dedup keep the **resident** instead of the arriver must fail the new tests.

## Red evidence to capture

Run the strengthened "arriving removes resident" test against the **unmodified** `tick.ts` and show it fails (it keeps the resident id 1). Then show it passing after the change.

## Edges

- `startPos.get(...)` is `undefined`-guarded before `sameCell` (no non-null assertions) so `tsc --noEmit` stays clean.
- The two-arriver and two-resident ties keep first-in-array (Map preserves insertion order); do not add a kind-priority or random tiebreak — the spec is silent and the owner did not ask for one.
- Enemy `id`s are stable across the spread (`{ ...enemy }`), so the snapshot lookup by `id` is safe.

## Out of scope

Any spec edit, any change to player collision / refuge / scoring / spawn timing, and any other `src` file. B-025 (UI test harness) is a separate contract (T-044). B-027 (degenerate `min>max`) is separate.
