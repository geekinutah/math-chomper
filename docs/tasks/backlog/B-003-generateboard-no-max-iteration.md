# B-003 generateBoard: no max-iteration guard

Found during: T-006
Risk: low
Evidence: src/rules/generate.ts while-loop has no cap. A degenerate rng (e.g. `() => 0.5`) that never produces a matching value loops forever.
Direction: Add a max-iteration cap (e.g. 1000 attempts per cell) that falls back to a known valid value if exceeded. Only affects pathological rng inputs, not gameplay.
State: open
