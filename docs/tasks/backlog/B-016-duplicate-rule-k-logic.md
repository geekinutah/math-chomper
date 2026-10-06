# B-016 Duplicated rule-k logic in generateRule and genRule

Found during: T-029
Risk: low
Evidence: src/game/board.ts:20-26 (generateRule: `kMin = max(kRange.min, band?.exprMinResult ?? 0)` for equality/inequality, comment "Kept in sync with genRule in state.ts") and src/game/state.ts:68-70 (genRule: same floor formula, comment "Hard floors expressions at 13"). Two call sites now duplicate the effective-k rule, including the T-029 exprMinResult floor. T-029's mutation check (revert the floor in one file only) is the only thing keeping them in sync; a future change to one (e.g. a new mode with a floor) will silently diverge from the other.
Direction: Extract one shared helper (e.g. `ruleKRange(mode, kRange, band) -> { min, max }` in rules/ or content/) used by both generateRule and genRule, so the k-range rules live in one place.
State: open
