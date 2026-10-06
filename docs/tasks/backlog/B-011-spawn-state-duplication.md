# B-011 Local type duplication in spawn.ts

Found during: T-014
Risk: low
Evidence: src/game/spawn.ts:7-22 — local `SpawnState` redeclares phase/mode/level/score/lives/reserveLives/streak/nextLifeThreshold/rule/board/playerPos with optional enemies/refuge/blockedCells; src/game/state.ts:19-36 — `GameState` now carries `enemies: Enemy[]` and `refuge: Refuge | null` as required (T-015) and has no blockedCells
Direction: Replace `SpawnState` with `GameState` in the spawnEnemy/spawnRefuge signatures, drop the local type, and derive blocked cells from state.enemies.
State: open
