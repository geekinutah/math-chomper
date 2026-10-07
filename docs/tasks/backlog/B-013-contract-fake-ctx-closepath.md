# B-013 T-027 contract omits `closePath` from FakeCtx member list

Found during: T-027
Risk: low
Evidence: docs/tasks/T-027-no-match-highlight.md:29 lists the FakeCtx methods as `fillRect`, `beginPath`, `moveTo`, `lineTo`, `stroke`, `arc`, `fill`, `fillText`, `strokeRect` — but src/render/sprites.ts:161 (chaser triangle nose) calls `ctx.closePath()`. The contract's prose says "exactly the members that canvas.ts and sprites.ts use," so the list is self-contradictory; the implementer added `closePath` to test/render.test.ts:51-53, deviating from the explicit list in the direction the intent requires. The current tests only draw a `straight` enemy, so `closePath` is never exercised and the omission is latent.
Direction: Amend the T-027 contract (or the house precedent note for render tests) to include `closePath` in the FakeCtx member list, and consider adding a test that renders a `chaser` enemy so the closePath/fill path is covered.
State: resolved
