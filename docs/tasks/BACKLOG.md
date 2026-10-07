# Backlog

Index only. One line per item. The verifier or critic writes the item file in its own worktree. The controller dedupes and updates this index on merge. An item here is not authorization to build it.

| Id | Title | Found during | State |
|---|---|---|---|
| B-001 | Contract typo: 0÷5 test name | T-003 | resolved (contract doc corrected) |
| B-002 | GenConfig operand range: per-op vs uniform | T-005 | resolved (§8 band tables win; §7 annotated, no code change) |
| B-003 | generateBoard: no max-iteration guard | T-006 | resolved (T-029: 1000-draw cap + known-valid fill) |
| B-004 | Loop createLoop signature: 3 params vs contract 2 | T-007 | resolved (contract doc corrected) |
| B-005 | Keyboard param named isPlaying but returns Phase | T-008 | resolved (T-037: getPhase, verifier PASS r1) |
| B-006 | Game-over "Menu" button dispatches restart | T-010 | resolved (T-038: new `title` action; Menu dispatches it; verifier PASS r2) |
| B-007 | generateRule ignores level parameter | T-011 | resolved |
| B-008 | Screens container blocks pointer events | T-012 | resolved |
| B-009 | Fixed LCG seed makes first board identical | T-012 | resolved (T-032: time-seeded production stream, 275 tests) |
| B-010 | Enemy dedup does not schedule replacement spawn | T-015 | resolved (T-039: `pendingSpawnAt` timer, 2–4 s, cap-guarded; verifier PASS r1) |
| B-011 | Local type duplication in spawn.ts | T-014 | resolved (T-033: spawn functions take GameState; verifier PASS r1) |
| B-012 | Contract perimeter count error (22 vs 18) | T-014 | resolved (contract doc corrected) |
| B-013 | T-027 contract omits closePath from FakeCtx list | T-027 | resolved (contract doc corrected) |
| B-014 | Dev-dependency audit: vitest transitive vulns, unapproved install scripts | T-027 | resolved (T-031: vitest 5.0.3, 0 vulns, esbuild/fsevents approved) |
| B-015 | Player has no step duration (spec §6: ~140 ms, floor 80 ms) | T-028 | resolved (T-030: 140 ms ×0.85/level, floor 80 ms, single-slot buffer) |
| B-016 | Duplicated rule-k logic in generateRule/genRule | T-029 | open (awaits T-039: state.ts; T-041 queued) |
| B-017 | Fallback/fill expr cells outside band operand grammar | T-029 | resolved (T-034: fallback + fills derive from GenConfig; verifier PASS r1) |
| B-018 | Enemy AI targets the pre-resolution player position (one-cell lag) | T-030 | resolved (T-036: step ctx from resolved playerPos; verifier PASS r1) |
| B-019 | Wrong eat never respawns or freezes (spec §9 "same respawn rule") | T-030 | resolved (T-035: respawn + 700 ms freeze; verifier PASS r1) |
| B-020 | allowScripts keys are version-pinned; a future vite/esbuild/fsevents bump re-surfaces the warning | T-031 | open (advisory; no action on the current tree) |
| B-021 | stepEnemy Ctx/`as StepCtx` cast bridges null→undefined refuge | T-033 | accepted (T-040 queued; waits for T-039's tick.ts merge) |
| B-022 | Test files exceed the 250-line limit (state 614, tick 404, generate 328) | T-034/T-036 | open (T-042 queued; after batch 3) |
| B-023 | Wrong-eat respawn test samples one seeded draw; blocked-cell exclusions unguarded | T-035 | resolved (T-038: 200-seed window 61537..61736; verifier confirmed power via mutation) |
| B-024 | T-034 contract standard-band fallback cycle unreachable as written | T-034 | resolved (contract table corrected at merge) |
| B-025 | No unit test imports `src/ui`; screen button dispatch (e.g. game-over Menu) unguarded | T-038 | open (advisory — needs a UI-layer test harness) |
| B-026 | Dedup survivor keeps first-in-array; spec §9:237 says the arriving one removes the resident | T-039 | open (advisory — spec decision for Mike: pin the survivor rule or waive the sentence) |

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
