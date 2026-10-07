# B-018 Enemy AI targets the pre-resolution player position (one-cell lag)

Found during: T-030
Risk: low
Evidence: src/game/tick.ts:96 — `toStepCtx(state)` is built from the state as it entered the tick; the resolved playerPos (line 84) is not passed into the stepEnemy ctx, so a chaser/shy stepping in the same tick targets the cell the player was on before resolving. Collision (line 154) and both spawn calls (lines 168, 182) use the resolved position, so within one tick the game disagrees with itself about where the player is. Magnitude is at most one cell (player moves one cell per step) and self-corrects on the next enemy step, but a chaser chasing a straight-line player trails the vacated cell.
Direction: build the step ctx from the resolved position (`{ ...state, playerPos, refuge: ... }`) so every consumer in a tick agrees on the player's cell.
State: open
