# B-006 Game-over "Menu" button dispatches restart

Found during: T-010
Risk: low
Evidence: src/ui/screens.ts:84 — button labeled "Menu" dispatches {type:"restart"} which restarts the game, not goes to title
Direction: Either rename button to "Play Again" (dedup with the other button) or add a "go to title" action in Phase 5.
State: open
