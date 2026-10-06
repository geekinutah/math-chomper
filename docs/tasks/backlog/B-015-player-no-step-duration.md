# B-015 Player has no step duration (spec §6: ~140 ms L1, floor 80 ms)

Found during: T-028
Risk: med
Evidence: src/game/state.ts handleMove (129–148) moves one cell instantly on each `move` action; src/input/keyboard.ts:23,30 dispatches `move` on every keydown (only the `e.repeat` guard); GameState (src/game/state.ts:19–36) carries no player step-timer field — only `freezeTimer`/`simTime`. No `140`/`80` player-step constant exists anywhere in src (grep: all `80`/`140` hits are CSS px and a 0.05 s beep).
Direction: Add a player step duration (~140 ms at level 1, floored at 80 ms per spec §6) advanced by the 60 Hz tick, or record an explicit owner decision to keep instant movement — this is the player-side counterpart to T-028's enemy ramp and the "enemy step always slower than the player step" invariant.
State: open
