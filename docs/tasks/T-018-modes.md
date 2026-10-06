# T-018: State — All Modes + Challenge + Band

Phase: 5
Depends on: T-017 (bands)
Round: 1

## Goal

Extend the game state to support all five modes plus Challenge, and use the selected band for rule/board generation. Add level-scaled key K.

## Files (modify)

- `src/game/state.ts` (modify — add band, handle all modes, challenge rotation)
- `src/game/board.ts` (modify — use band GenConfig, level-scaled k)
- `test/state.test.ts` (modify — add mode/challenge/band tests)
- `test/board.test.ts` (modify — add band-based generation tests)

Do not create or modify files outside this list.

## Requirements

### Extend `src/game/state.ts`

Add to `GameState`:
```ts
band: BandName;  // import from @/content/bands
```

Update `Action`:
```ts
| { type: "start"; mode: Mode; band: BandName }
```
(Remove the old `{ type: "start"; mode: Mode }` — band is now required)

Update `createInitialState`: band = "standard".

Update `reduce`:
- **start**: Accepts `mode` and `band`. Stores both. Generates rule and board using the band.
- **next-level**: 
  - For non-challenge modes: same mode, new k (level-scaled), new board.
  - For **challenge**: rotate to the next mode (multiples → factors → primes → equality → inequality → multiples...). Announce on rule line (the HUD handles display).
- **restart**: Same as start, keeps mode and band.

Update the rule generation in state to use `getKRange(band)` for the k value:
- `k = kMin + floor(rng() * (kMax - kMin + 1))`
- For multiples: level-scaled: `k = kMin + floor(rng() * min(kMax - kMin, level + 2))` (gradually widens)

### Modify `src/game/board.ts`

- `generateRule(mode, level, rng, band?)`: Add optional `band` param. If provided, use `getKRange(band)` for k range. If not, use default 2-12. Use level-scaled range for multiples.
- `generateBoardForRule(rule, rng, band?)`: Add optional `band` param. If provided, use `getGenConfig(band)`. If not, use standard.
- Import `getKRange`, `getGenConfig`, `Band` from `@/content/bands`.

## Tests to add to `test/state.test.ts`

| Test name | Behavior proved |
|-----------|-----------------|
| `start with factors mode` | rule.mode === "factors", board has numbers |
| `start with primes mode` | rule.mode === "primes" (no k) |
| `start with equality mode` | rule.mode === "equality", board has expressions |
| `start with inequality mode` | rule.mode === "inequality", board has expressions |
| `start with easy band` | state.band === "easy" |
| `start with hard band` | state.band === "hard" |
| `challenge: level 1 is first mode` | After start with challenge, mode is set |
| `challenge: next-level rotates mode` | multiples → factors → primes → equality → inequality → multiples |
| `challenge: rotates through all 5` | 5 next-levels cycle back to start |
| `band affects board: easy has smaller numbers` | All number cells ≤ 30 |
| `band affects board: hard has larger numbers` | Some number cells > 30 (with seeded rng, check max) |
| `band affects k: easy k ≤ 9` | rule.k ≤ 9 for easy |
| `band affects k: hard k can be 20` | rule.k can be up to 20 for hard |
| `level-scaled k: level 1 has smaller range` | k at level 1 is in a narrower range than level 10 |

## Tests to add to `test/board.test.ts`

| Test name | Behavior proved |
|-----------|-----------------|
| `generateRule with easy band: k in 2-9` | 100 samples, all in range |
| `generateRule with hard band: k in 2-20` | 100 samples, all in range |
| `generateRule level-scaled: level 1 k ≤ 4` | (kMin + min(kMax-kMin, 1+2)) = 2+3 = 5, so k in 2-5 |
| `generateBoardForRule with easy: all numbers ≤ 30` | 30 cells, max ≤ 30 |
| `generateBoardForRule with hard: numbers up to 100` | Some cells > 30 |
| `generateBoardForRule easy: only + and -` | All expr cells use + or − only |

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm test` | All tests pass (existing + new). |
| 2 | `npm run typecheck` | Exit 0. |
| 3 | `npm run build` | Exit 0. |

## Edges

- Challenge mode rotation: define an ordered array `["multiples","factors","primes","equality","inequality"]`. Next mode is `(currentIdx + 1) % 5`.
- The "start" action now requires `band`. Update the existing test helper to pass a band.
- `createInitialState` uses "standard" band and "multiples" mode (the defaults).
- Level-scaled k: the range widens with level but is capped at kMax. Formula: `k = kMin + floor(rng() * (min(kMax, kMin + level + 1) - kMin + 1))`. At level 1 with easy (kMin=2,kMax=9): range is 2 to min(9, 2+1+1)=4, so k in 2-4. At level 7: 2 to min(9, 2+7+1)=9, so full range 2-9.

## Out of scope

- No UI changes (T-019).
- No band-based spawning (T-020).
- No localStorage (Phase 6).
