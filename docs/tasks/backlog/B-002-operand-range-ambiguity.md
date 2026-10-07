# B-002 GenConfig operand range: per-op vs uniform

Found during: T-005
Risk: low
Evidence: PRODUCT_SPEC.md §7 says "integers 0–12 for addition/subtraction and 1–12 for multiplication/division" but §8 Standard band says "all four ops, operands 0–12". GenConfig uses a single exprMin/exprMax for all ops.
Direction: Clarify in spec whether the generator should enforce per-operator operand ranges, or whether the band config is allowed to set a uniform range. Phase 5 band tables will need this resolved.
State: resolved
