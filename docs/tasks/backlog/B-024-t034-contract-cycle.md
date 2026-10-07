# B-024 T-034 contract's standard-band fallback cycle is unreachable as written

Found during: T-034 (verification).
Risk: low. Documentation defect in the contract table, not game code. The shipped test is correct; this item is so the controller fixes the contract text on merge and a later round or re-verification does not re-flag it.
Evidence: docs/tasks/T-034-band-fallback.md, standard row stated cycle rng `[0.6, 0.05, 0.99]` and expectation `0+12` (12). Standard's 4-op list gives floor(0.6×4)=2 → "×", operands 0 / 12, so attempt 1 evaluates 0×12 = 0, which is legal (Standard has no exprMinResult) and returns before the fallback — the row's stated expectation was unreachable with that cycle under any code keeping the draw loop byte-identical. The implementer corrected the test to `[0.3, 0.05, 0.95]` (floor(0.3×4)=1 → "−", 0−12 → null, all 100 attempts fail, fallback runs) with a comment; the verifier re-derived the math and confirmed the correction preserves the row's intent and asserted cell.
Direction: controller edits the T-034 contract table to `[0.3, 0.05, 0.95]` on merge.
State: resolved (contract table corrected by the controller at 7713cdb integration)
