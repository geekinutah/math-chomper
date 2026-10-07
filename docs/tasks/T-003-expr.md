# T-003: Expression Evaluation

Phase: 2
Depends on: none
Round: 1

## Goal

Implement pure expression parsing and evaluation for the four binary operators, plus display formatting.

## Files (create, all new)

- `src/rules/expr.ts`
- `test/rules/expr.test.ts`

Do not create or modify files outside this list.

## Requirements

- Export named functions:
  - `export function evalExpr(text: string): number | null` — parses `a+b`, `a−b`, `a×b`, `a÷b` (display glyphs) and returns the integer result, or `null` if the expression is invalid.
  - `export function formatExpr(a: number, op: string, b: number): string` — returns the display string (e.g., `3×2`, `12÷2`).
- Display glyphs: `+`, `−` (U+2212), `×` (U+00D7), `÷` (U+00F7). Never `*` or `/`.
- Valid expressions: two integers separated by one operator. No whitespace, no parentheses, no chains.
- Division: returns `null` if `a % b !== 0` (does not divide evenly) or `b === 0`.
- Subtraction: returns `null` if the result would be negative (a < b).
- Addition and multiplication: always valid for non-negative operands.
- Operands must be non-negative integers (0–99 range is sufficient for v1).
- No `eval`, no `Function`, no regex backreferences.
- No `any` type. No default exports.

## Tests to write

| Test name | Behavior proved |
|-----------|-----------------|
| `12÷2 equals 6` | evalExpr("12÷2") === 6 |
| `5÷2 is null` | evalExpr("5÷2") === null (not exact) |
| `0÷5 equals 0` | evalExpr("0÷5") === 0 (dividend is 0, 0%5===0, division is exact) |
| `10÷0 is null` | evalExpr("10÷0") === null (division by zero) |
| `4+5 equals 9` | evalExpr("4+5") === 9 |
| `7−3 equals 4` | evalExpr("7−3") === 4 |
| `3−7 is null` | evalExpr("3−7") === null (negative result) |
| `3×2 equals 6` | evalExpr("3×2") === 6 |
| `12×12 equals 144` | evalExpr("12×12") === 144 |
| `invalid: empty string` | evalExpr("") === null |
| `invalid: single number` | evalExpr("5") === null |
| `invalid: unknown operator` | evalExpr("3&5") === null |
| `invalid: negative operand` | evalExpr("-3+5") === null |
| `formatExpr produces display glyphs` | formatExpr(3, "×", 2) === "3×2" |
| `formatExpr division` | formatExpr(12, "÷", 2) === "12÷2" |
| `formatExpr subtraction` | formatExpr(7, "−", 3) === "7−3" |
| `formatExpr addition` | formatExpr(4, "+", 5) === "4+5" |

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm test` | All expr tests pass. |
| 2 | `npm run typecheck` | Exit 0. |

## Edges

- Division by zero returns null.
- Non-exact division returns null.
- Negative subtraction result returns null.
- Multi-digit operands (12÷2, 12×12) work.
- The minus sign is U+2212 (`−`), not ASCII hyphen (`-`).

## Out of scope

- No board generation, no rule matching, no rendering.
- No expression chains (a+b+c is not in v1).
