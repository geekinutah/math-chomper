# T-002: Prime Checking

Phase: 2
Depends on: none
Round: 1

## Goal

Implement a pure `isPrime` function and its unit tests.

## Files (create, all new)

- `src/rules/primes.ts`
- `test/rules/primes.test.ts`

Do not create or modify files outside this list.

## Requirements

- Export a named function: `export function isPrime(n: number): boolean`
- Returns `true` only for integers ≥ 2 whose only positive divisors are 1 and itself.
- 1 is not prime. 0 is not prime. Negative numbers are not prime. Non-integers are not prime.
- No floating-point comparisons. Use integer arithmetic only.
- No `any` type. No default exports.

## Tests to write

| Test name | Behavior proved |
|-----------|-----------------|
| `1 is not prime` | isPrime(1) === false |
| `2 is prime` | isPrime(2) === true |
| `3 is prime` | isPrime(3) === true |
| `4 is not prime` | isPrime(4) === false |
| `51 is not prime` | isPrime(51) === false (3×17) |
| `91 is not prime` | isPrime(91) === false (7×13) |
| `97 is prime` | isPrime(97) === true |
| `0 is not prime` | isPrime(0) === false |
| `negative numbers are not prime` | isPrime(-7) === false |
| `non-integers are not prime` | isPrime(2.5) === false |
| `25 is not prime` | isPrime(25) === false (5×5) |
| `121 is not prime` | isPrime(121) === false (11×11) |

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm test` | All primes tests pass. |
| 2 | `npm run typecheck` | Exit 0. |

## Edges

- Perfect squares of primes (25, 121) must be detected as composite.
- The function must work for values up to at least 200 (band max is 100, composites up to 91 tested).

## Out of scope

- No board generation, no rule matching, no rendering.
