# B-012 Contract perimeter count error (22 vs 18)

Found during: T-014
Risk: low
Evidence: docs/tasks/T-014-spawn.md:45,77,79 — "6+6+3+3 = 22" but the sum is 18; test/spawn.test.ts:63 correctly expects 18 (6×5 perimeter = 2·(6+5)−4 = 18)
Direction: Fix the T-014 contract to state 18 perimeter cells so it matches the shipped behavior.
State: resolved
