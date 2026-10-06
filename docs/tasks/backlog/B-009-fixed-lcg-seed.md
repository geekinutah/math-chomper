# B-009 Fixed LCG seed makes first board identical every session

Found during: T-012
Risk: low
Evidence: src/main.ts — rng seeded with constant 42. Every session starts with the same board.
Direction: Seed from Date.now() % 2147483647 for production. Tests use fixed seeds.
State: open
