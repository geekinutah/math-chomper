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
| T-016 | Enemy + Refuge Rendering | 4 | done | 1 | — | MET |
| T-017 | Band Content | 5 | done | 1 | — | no |
| T-018 | State: All Modes + Challenge + Band | 5 | done | 1 | — | no |
| T-019 | Mode Select + Settings UI | 5 | done | 1 | — | no |
| T-020 | Integration: Band Spawn + Mode Wiring | 5 | done | 1 | — | MET |
| T-021 | Rewriter fixes (B-015/B-016) | 5 | done | 1 | — | no |
| T-022 | Audio Beeps | 6 | done | 2 | — | no |
| T-023 | Storage (Settings + Scores) | 6 | done | 1 | — | no |
| T-024 | Touch Controls | 6 | done | 1 | — | no |
| T-025 | High Scores UI | 6 | done | 1 | — | no |
| T-026 | Phase 6 Integration | 6 | done | 1 | — | yes |

States: `todo`, `in progress`, `verifying`, `done`, `blocked`.

## Blockers

None.

## Spec proposals awaiting Mike

1. **Remove match-highlight border** (critic Phase 3). The board draws a faint `#1a3a2a` border around cells that match the rule. Critic argues this undermines the core skill (fast recognition) since the player follows the border instead of doing the math. Proposal: render all occupied cells identically; the rule line is the sole indicator. — Awaiting accept/defer.
2. **Assign §8 in-run ramp to a phase** (critic Phase 4). Spec §8 says "Level 18+: step delays ×0.85, floored. Refuges rare" and §3 says "After about level 18, enemy step delay drops." Currently constant 420 ms / constant refuge probability to level 34+. Suggest adding to Phase 5 or 6. — Awaiting accept/defer.
3. **§8 Hard expressions ambiguous** (critic Phase 5). "operands to 12, larger results" — shipped Hard uses identical expr ranges to Standard. Replace with concrete difference or confirm they're the same. — Awaiting accept/defer.
4. ~~**§13 settings persistence** (critic Phase 5).~~ Resolved by Phase 6 (T-023/T-026): settings saved to `mathchomper.settings.v1`, mode select remembers last choice, mute/touch/band persist.
