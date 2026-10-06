# B-001 Contract typo: 0÷5 test name

Found during: T-003
Risk: low
Evidence: docs/tasks/T-003-expr.md:38 — test name column says "0÷5 is null" but the cell description self-corrects to "0÷5 = 0, valid"
Direction: Rename the test row to "0÷5 equals 0" to match the spec (division is exact when the dividend is 0).
State: open
