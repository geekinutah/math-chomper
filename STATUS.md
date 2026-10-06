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
| T-027 | Remove Match-Highlight Border (critic fix) | 6 | done | 1 | — | no |
| T-028 | In-Run Ramp (Level 18+) | 6 | in progress | 1 | ../math-chomper-worktrees/t-028-ramp | no |
| T-029 | Hard Band Larger Expression Results | 6 | todo | 1 | — | no |

States: `todo`, `in progress`, `verifying`, `done`, `blocked`.

## Blockers

None.

## Spec proposals awaiting Mike

1. ~~**Remove match-highlight border** (critic Phase 3).~~ Accepted by Mike 2026-10-06 ("the faint green border is just cheating") → T-027. The spec was silent on the highlight; this is a contract-level rendering fix, no spec edit needed.
2. ~~**Assign §8 in-run ramp to a phase** (critic Phase 4).~~ Accepted by Mike 2026-10-06 → T-028. Decisions: enemy step delay ×0.85/level from 18, floored 180 ms (§9); refuge spawn probability halved at 18+ (0.003 → 0.0015/tick).
3. ~~**§8 Hard expressions ambiguous** (critic Phase 5).~~ Accepted by Mike 2026-10-06 → T-029. Decision: Hard = all four ops, operands 0–12, results ≥ 13 (bounded retry + known-valid fallback). Consequence: Hard equality/inequality k draws 13–20; board generation gains a termination cap (resolves B-003).
4. ~~**§13 settings persistence** (critic Phase 5).~~ Resolved by Phase 6 (T-023/T-026): settings saved to `mathchomper.settings.v1`, mode select remembers last choice, mute/touch/band persist.
