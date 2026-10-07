# B-022 Test files exceed the 250-line limit

Found during: T-034 / T-036 (verification). Merged from the T-034 verifier's B-023 and the T-036 verifier's B-026.
Risk: low
Evidence: AGENTS.md code rule "Files under 250 lines. Split rather than grow." At 7713cdb: test/state.test.ts 614, test/tick.test.ts 404, test/rules/generate.test.ts 328. All growth pre-existing or contract-scoped; no single contract caused a breach.
Direction: split the three files into per-behavior files (e.g. state: eat/enemy-hit/step/lives; tick: step-resolution/collision/spawn/refuge; rules generate: boards/hard-floor/band-fallback) in a dedicated housekeeping contract. Do not fold into gameplay contracts. Files are mutually disjoint from the in-flight wave except test/state.test.ts (T-038) and test/tick.test.ts (T-039) — sequence after they merge.
State: resolved (T-042, merged at 3ce2500). Extracted shared fixtures to `test/test-helpers.ts`; split into `test/state/{move,eat,enemy-hit,step,modes}.test.ts`, `test/tick/{step,collision,refuge}.test.ts`, `test/rules/generate-{board,expr}.test.ts`; also pointed `board`/`render`/`enemies` test files at the shared helpers. Audit: 126 unique `it` names preserved exactly (zero missing/added); 312 tests pass; zero `src/` change; every touched file < 250 lines.
