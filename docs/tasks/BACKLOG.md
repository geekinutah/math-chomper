# Backlog

Index only. One line per item. The verifier or critic writes the item file in its own worktree. The controller dedupes and updates this index on merge. An item here is not authorization to build it.

| Id | Title | Found during | State |
|---|---|---|---|
| B-001 | Contract typo: 0÷5 test name | T-003 | open |

States: `open`, `accepted`, `resolved`, `declined`.

Item file: `docs/tasks/backlog/B-###-slug.md`

```text
# B-### Title

Found during: T-###
Risk: low | med | high
Evidence: file:line or command output
Direction: one sentence, advisory
State: open
```
