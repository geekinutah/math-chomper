# Status

Ledger for contracted work. The controller updates this file. Other roles do not.

| Id | Title | Phase | State | Round | Worktree | Critic |
|---|---|---|---|---|---|---|
| T-001 | Project Scaffold | 1 | done | 1 | — | no |
| T-002 | Prime Checking | 2 | done | 1 | — | no |
| T-003 | Expression Eval | 2 | done | 1 | — | no |
| T-004 | Rule Matching | 2 | done | 1 | — | no |
| T-005 | Board Generator | 2 | done | 1 | — | no |
| T-006 | Game State + Reducers | 3 | done | 1 | — | no |
| T-007 | Game Loop | 3 | done | 1 | — | no |
| T-008 | Keyboard Input | 3 | done | 1 | — | no |
| T-009 | Board Rendering | 3 | done | 1 | — | no |
| T-010 | HUD + Screens | 3 | done | 1 | — | no |
| T-011 | Board/Level Mgmt | 3 | done | 1 | — | no |
| T-012 | Integration (main+index) | 3 | done | 1 | — | MET |
| T-013 | Enemy Step Functions | 4 | done | 1 | — | no |
| T-014 | Spawning + Refuge | 4 | done | 1 | — | no |
| T-015 | Tick + State Extension | 4 | done | 2 | — | no |
| T-016 | Enemy + Refuge Rendering | 4 | in progress | 1 | ../math-chomper-worktrees/t-016-render | no |

States: `todo`, `in progress`, `verifying`, `done`, `blocked`.

## Blockers

None.

## Spec proposals awaiting Mike

1. **Remove match-highlight border** (critic Phase 3). The board draws a faint `#1a3a2a` border around cells that match the rule. Critic argues this undermines the core skill (fast recognition) since the player follows the border instead of doing the math. Proposal: render all occupied cells identically; the rule line is the sole indicator. — Awaiting accept/defer.
