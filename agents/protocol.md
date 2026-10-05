# Agent protocol

`AGENTS.md` governs every role. Roles define behavior. Do not hard-code model names or tool APIs in these files.

Four roles: controller, implementer, verifier, critic. The controller owns contracts, `STATUS.md`, and the backlog index. The implementer owns scoped changes in its worktree. A fresh verifier assesses the candidate from a different worktree and writes backlog item files. The critic plays a milestone from its own worktree and may propose spec changes. The critic does not edit the spec or the game code.

## Handoff

For every implementation, verification, correction, or critique, supply this packet. Do not assume a shared conversation or a shared checkout.

- Role file, this protocol, task id and path, full contract, plus `AGENTS.md` and `PRODUCT_SPEC.md`.
- Absolute worktree path for this role. Implementer, verifier, and critic never share a checkout.
- Base commit and candidate commit.
- Round (max 3 implementer/verifier rounds), and dependencies already verified.
- Prior report and real command output.
- Outstanding questions.

The controller waits until implementation finishes, then hands the frozen candidate to a fresh verifier in a new worktree. A role switch inside the implementer's session is not independent verification. If the harness cannot spawn a fresh session, stop and have Mike open one. Do not self-verify.

## Reports

Implementer:

```text
## Result: PASS | FAIL | BLOCKED
## Task: <id>
## Changes: <files, one line each>
## Tests added: <names and the behavior each proves>
## Red evidence: <trimmed failing output before the change>
## Verification: <each acceptance command and actual output>
## Notes / blockers: <out-of-scope findings; do not fix them>
```

Verifier:

```text
## Result: PASS | FAIL | BLOCKED
## Task: <id>
## Candidate: <commit or patch, round>
## Commands run: <actual output>
## Mutation check: <disposable worktree, realistic defect, test that failed, cleanup>
## Findings: <file:line and the correction, or none>
## Backlog items: <paths of B-### files written, or none>
```

Critic:

```text
## Result: MET | NOT MET | BLOCKED
## Milestone: <phase id>
## Play log: <actions taken, what happened, expected vs actual>
## Objectives: <each milestone objective, met or not, evidence>
## Spec proposals: <sentence to change in PRODUCT_SPEC.md, why, or none>
## Experience notes: <judgements that are not spec bugs>
```

Controller:

```text
## Result: PASS | FAIL | BLOCKED
## Task: <ids and states>
## Verification: <verifier result>
## Critique: <critic result, or not due>
## Notes / blockers: <rounds, questions for Mike>
```

PASS requires every mandatory check. FAIL is an observed defect. BLOCKED means a required check could not be run. Never invent output. A task is `done` only if the last verifier report is PASS.
