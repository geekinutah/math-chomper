# B-007 generateRule ignores level parameter

Found during: T-011
Risk: low
Evidence: src/game/board.ts:13 — _level param unused. Contract specifies level-scaled k range, implementation uses flat 2-12.
Direction: Add level escalation in Phase 5 when bands are configured. The flat 2-12 satisfies the Standard band spec.
State: resolved (T-018 added level-scaled k, src/game/board.ts:19)
