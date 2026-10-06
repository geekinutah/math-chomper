# Backlog

Index only. One line per item. The verifier or critic writes the item file in its own worktree. The controller dedupes and updates this index on merge. An item here is not authorization to build it.

| Id | Title | Found during | State |
|---|---|---|---|
| B-001 | Contract typo: 0÷5 test name | T-003 | open |
| B-002 | GenConfig operand range: per-op vs uniform | T-005 | open |
| B-003 | generateBoard: no max-iteration guard | T-006 | open |
| B-004 | Loop createLoop signature: 3 params vs contract 2 | T-007 | open |
| B-005 | Keyboard param named isPlaying but returns Phase | T-008 | open |
| B-006 | Game-over "Menu" button dispatches restart | T-010 | open |
| B-007 | generateRule ignores level parameter | T-011 | open |

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
