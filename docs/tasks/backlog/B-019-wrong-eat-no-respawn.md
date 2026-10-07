# B-019 Wrong eat never respawns or freezes (spec §9 "same respawn rule")

Found during: T-030
Risk: med
Evidence: src/game/state.ts:177-179 — the wrong-eat branch of `handleEat` decrements lives (and sets game-over at 0) but leaves `playerPos` in place and sets no `freezeTimer`. The `enemy-hit` action (state.ts:47, 212-214) that would perform the §9 respawn is never dispatched from anywhere in `src/` (grep: only the reducer case; tests are the sole callers). Spec §9: "Wrong eat: cell becomes empty, life lost, same respawn rule" (random non-enemy cell + 700 ms enemy freeze). Pre-existing as of base c4ee58d; eating was explicitly out of T-030's scope, so this is logged, not a T-030 failure.
Direction: on a wrong eat that costs a life, route the state through the same respawn path as an enemy hit (or dispatch `enemy-hit` from the app when a wrong eat loses a life).
State: open
