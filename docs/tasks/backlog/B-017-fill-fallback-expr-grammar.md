# B-017 Fallback/fill expr cells can violate band grammar or Easy op list

Found during: T-029
Risk: low
Evidence: src/rules/generate.ts:44-46 — the 100-attempt fallback is `2×7` (value 14), which is "valid on every band" per the T-029 contract, but on EASY (`exprOps: ["+", "−"]`, spec §8 "results 0–12") it introduces a `×` op and a result > 12. src/rules/generate.ts:79,82,99,102 — the known-valid fill cells build expressions from `k` as an operand (`k÷1`, `k×2`); on Hard k is 13–20, exceeding spec §7's "a and b integers 0–12" operand grammar. Both paths are only reachable after the 100-attempt cell fallback or the 1000-draw board cap, i.e. under degenerate rng; with the production LCG they are effectively unreachable, so no gameplay impact is observed.
Direction: Decide with the spec owner whether the last-resort cells should be band-aware (draw the op from config.exprOps and clamp operands to config.exprMin/exprMax, or precompute a per-band valid fallback), or accept the contract-mandated table as documented last-resort output.
State: open
