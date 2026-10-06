# B-010 Enemy dedup does not schedule replacement spawn

Found during: T-015
Risk: low
Evidence: src/game/tick.ts dedup removes the resident enemy but does not schedule a 2-4s replacement spawn as spec §9 requires.
Direction: After dedup, if alive count < cap, schedule a spawn 2-4s later. Currently relies on the generic 0.002/tick spawn probability.
State: open
