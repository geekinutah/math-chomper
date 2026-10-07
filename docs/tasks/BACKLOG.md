# Backlog

Index only. One line per item. The verifier or critic writes the item file in its own worktree. The controller dedupes and updates this index on merge. An item here is not authorization to build it.

| Id | Title | Found during | State |
|---|---|---|---|
| B-001 | Contract typo: 0÷5 test name | T-003 | resolved (contract doc corrected) |
| B-002 | GenConfig operand range: per-op vs uniform | T-005 | open (spec proposal #5, awaiting Mike) |
| B-003 | generateBoard: no max-iteration guard | T-006 | resolved (T-029: 1000-draw cap + known-valid fill) |
| B-004 | Loop createLoop signature: 3 params vs contract 2 | T-007 | resolved (contract doc corrected) |
| B-005 | Keyboard param named isPlaying but returns Phase | T-008 | open (sequenced behind T-030) |
| B-006 | Game-over "Menu" button dispatches restart | T-010 | open (sequenced behind T-030) |
| B-007 | generateRule ignores level parameter | T-011 | resolved |
| B-008 | Screens container blocks pointer events | T-012 | resolved |
| B-009 | Fixed LCG seed makes first board identical | T-012 | accepted (T-032 in progress) |
| B-010 | Enemy dedup does not schedule replacement spawn | T-015 | open (sequenced behind T-030) |
| B-011 | Local type duplication in spawn.ts | T-014 | accepted (T-033 in progress, starts after T-031) |
| B-012 | Contract perimeter count error (22 vs 18) | T-014 | resolved (contract doc corrected) |
| B-013 | T-027 contract omits closePath from FakeCtx list | T-027 | resolved (contract doc corrected) |
| B-014 | Dev-dependency audit: vitest transitive vulns, unapproved install scripts | T-027 | accepted (T-031 in progress) |
| B-015 | Player has no step duration (spec §6: ~140 ms, floor 80 ms) | T-028 | accepted (T-030 in progress) |
| B-016 | Duplicated rule-k logic in generateRule/genRule | T-029 | open (sequenced behind T-030) |
| B-017 | Fallback/fill expr cells outside band operand grammar | T-029 | open (spec proposal #6, awaiting Mike) |

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
