# B-027 ruleKRange can report min > max with no guard or downstream test

Found during: T-041
Risk: low
Evidence: src/rules/rule-k.ts:14-17 returns `{ min, max }` where equality/inequality sets `min = max(kRange.min, exprMinResult)`. If a band's `exprMinResult` ever exceeds its `kMax`, the helper reports a degenerate range (`min > max`) with no guard or assert. Both draw paths then collapse the key to the floor: board.ts:20 `kMin + Math.floor(rng() * (top - kMin + 1))` and state.ts:63 `randomInt(rng, floor, top)` each compute `min + Math.floor(rng() * 0)` = `min`, so a hypothetical floored band would always emit the same key (still matchable, since it is >= exprMinResult, but zero variety). The new test/rules/rule-k.test.ts pins only that the helper *reports* `{min:13, max:12}`; it does not pin what the downstream draw produces for a degenerate range.
Direction: no shipped band triggers this (Easy 2<=9, Standard 2<=12, Hard floor 13 <= 20 — verified), so it is not a live bug. Decide whether to (a) leave it as documented degenerate behavior the helper is allowed to report (T-041's contract explicitly excluded clamping as a behavior change), or (b) add a defensive assert/clamp in ruleKRange and a test pinning the degenerate draw. A spec/band-content decision, not a T-041 defect.
State: open
