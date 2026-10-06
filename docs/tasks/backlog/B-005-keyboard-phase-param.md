# B-005 Keyboard param named isPlaying but returns Phase

Found during: T-008
Risk: low
Evidence: src/input/keyboard.ts — param is `isPlaying: () => Phase` (name says boolean, type says Phase)
Direction: Rename to `getPhase: () => Phase` for clarity.
State: open
