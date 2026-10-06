# T-004: Rule Matching

Phase: 2
Depends on: T-002 (primes), T-003 (expr)
Round: 1

## Goal

Define the core `Cell` and `Rule` types and implement the `matches` function that classifies a cell against a rule.

## Files (create, all new)

- `src/rules/types.ts`
- `src/rules/match.ts`
- `test/rules/match.test.ts`

Do not create or modify files outside this list. Do not modify `src/rules/primes.ts` or `src/rules/expr.ts`.

## Requirements

### `src/rules/types.ts`

```ts
export type Mode = "multiples" | "factors" | "primes" | "equality" | "inequality";

export type Cell =
  | { kind: "empty" }
  | { kind: "number"; value: number }
  | { kind: "expr"; text: string; value: number };

export type Rule =
  | { mode: "multiples"; k: number }
  | { mode: "factors"; k: number }
  | { mode: "primes" }
  | { mode: "equality"; k: number }
  | { mode: "inequality"; k: number };
```

### `src/rules/match.ts`

- Export: `export function matches(rule: Rule, cell: Cell): boolean`
- Behavior per mode:
  - **multiples**: cell is a number, `value > 0` and `value % k === 0`. (k ≥ 2 in generation, but test k=1.)
  - **factors**: cell is a number, `value >= 1`, `value <= k`, and `k % value === 0`.
  - **primes**: cell is a number, `isPrime(value)` is true. (Use T-002.)
  - **equality**: cell is an expr, `cell.value === rule.k`.
  - **inequality**: cell is an expr, `cell.value !== rule.k`.
- Empty cells never match any rule. Return `false`.
- A number cell in equality/inequality mode: return `false` (those modes only have expressions on the board).
- An expr cell in multiples/factors/primes mode: return `false` (those modes only have numbers).
- No `any` type. No default exports.

## Tests to write

| Test name | Behavior proved |
|-----------|-----------------|
| `multiples of 1 match every positive integer` | matches({mode:"multiples",k:1}, {kind:"number",value:n}) for n=1..20 all true |
| `multiples of 6: 6 matches` | matches({mode:"multiples",k:6}, {kind:"number",value:6}) === true |
| `multiples of 6: 12 matches` | matches({mode:"multiples",k:6}, {kind:"number",value:12}) === true |
| `multiples of 6: 7 does not match` | matches({mode:"multiples",k:6}, {kind:"number",value:7}) === false |
| `multiples of 6: 0 does not match` | matches({mode:"multiples",k:6}, {kind:"number",value:0}) === false |
| `factors of 12: exactly {1,2,3,4,6,12}` | Test all values 1-15, only those six match |
| `factors of 12: 5 does not match` | matches({mode:"factors",k:12}, {kind:"number",value:5}) === false |
| `factors of 12: 13 does not match` | value > k, false |
| `primes: 1 is not prime` | matches({mode:"primes"}, {kind:"number",value:1}) === false |
| `primes: 2 is prime` | matches({mode:"primes"}, {kind:"number",value:2}) === true |
| `primes: 51 is not prime` | false |
| `primes: 91 is not prime` | false |
| `primes: 97 is prime` | true |
| `equality: 3×2 matches k=6` | matches({mode:"equality",k:6}, {kind:"expr",text:"3×2",value:6}) === true |
| `equality: 4+5 does not match k=6` | value 9 ≠ 6, false |
| `equality: number cell does not match` | matches({mode:"equality",k:6}, {kind:"number",value:6}) === false |
| `inequality: 3×2 (6) does not match not-equal-6` | value === k, false |
| `inequality: 4+5 (9) matches not-equal-6` | value !== k, true |
| `inequality: number cell does not match` | matches({mode:"inequality",k:6}, {kind:"number",value:9}) === false |
| `empty cell never matches` | Test all five modes with {kind:"empty"}, all false |
| `expr cell in multiples mode does not match` | matches({mode:"multiples",k:6}, {kind:"expr",text:"3×2",value:6}) === false |

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm test` | All match tests pass (plus T-002 and T-003 tests still pass). |
| 2 | `npm run typecheck` | Exit 0. |

## Edges

- k=1 for multiples: every positive integer matches (test it, but generation won't use k=1).
- Number cell in expression mode: false, not an error.
- Expr cell in number mode: false, not an error.

## Out of scope

- No board generation, no rendering, no game state.
