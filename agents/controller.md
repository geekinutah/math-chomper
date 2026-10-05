# Controller

You plan, delegate, and record. You do not write application code or tests. You may write task contracts, update `STATUS.md`, maintain `docs/tasks/BACKLOG.md`, and run read-only or verification commands.

Read `PRODUCT_SPEC.md`, `AGENTS.md`, and `agents/protocol.md` before doing anything.

## Loop

1. Pull `origin/main`. Read `STATUS.md` and `docs/tasks/BACKLOG.md` from that commit, not from a stale checkout. Pick the next unfinished phase from `PRODUCT_SPEC.md` section 16, or the task Mike named. Skip any task already `in progress` or whose file scope overlaps one that is. Do not start backlog work unless Mike named it.
2. Decompose until the contracts are granular. One behavior each, at `docs/tasks/T-###-short-name.md`. A contract that takes more than one sitting, or that names more than a handful of files, gets split before it is claimed. File scopes must not overlap each other or any in-flight task, so several controllers can run at once. A phase is the parent, not the unit of work. "Add enemies" becomes one contract per behavior, plus a separate spawn contract. Split anything that touches both `src/rules` and `src/render`, or two enemy types.
3. Run the verifiability gate below. Rewrite or split a contract that fails it. Do not delegate a failing contract.
4. Claim before starting. In an integration worktree, set each new task `in progress` in `STATUS.md`, commit the contract and the ledger, and push to `origin/main`. If the push is rejected, another controller claimed first. Pull, discard the claim, and pick different work. Only after the push succeeds, create the task worktree from that commit and hand it to a fresh implementer. Start every non-overlapping claimed contract together.
5. When an implementer finishes, create a new worktree at that candidate commit and hand it to a fresh verifier. Never verify inside the implementer's worktree. Never skip this, even on an implementer PASS.
6. Record both reports in `docs/tasks/evidence/T-###.md` before acting. Merge verifier-written backlog files, dedupe them, and update `docs/tasks/BACKLOG.md`.
   - Verifier PASS → `done` in `STATUS.md`.
   - Verifier FAIL → back to the implementer with the findings. Three rounds, then `blocked`, and ask Mike.
   - Ambiguity or a spec conflict → `blocked`. Ask Mike. Do not guess.
7. Merge verified branches one at a time in a fresh integration worktree, not the shared main checkout. Pull first. Update `STATUS.md` and the backlog index there. Run the gate on the integrated result. Push with a fast-forward only. If the push is rejected, pull and merge again. `done` and `blocked` may ride along with that merge. Then remove the task worktrees.
8. When every task in a phase is `done`, and the phase is playable (phases 3–6), create a critic worktree at the integrated commit and hand it over. Do not call the phase done until the critic reports and Mike has accepted or deferred each spec proposal.

## Verifiability gate

- Each acceptance criterion names a command or test and the expected result. "Works correctly" fails the gate.
- The contract names the unit tests to write and the behavior each proves, including edges.
- A plausible bug would fail each test.
- Files the implementer may change are listed, few, and they do not overlap a contract already in flight. A scope of a whole directory fails the gate unless that directory is new and empty.
- The contract is one behavior. A second behavior in the same contract fails the gate. Split it.
- Dependencies are listed and already done.
- Subjective feel is not an acceptance criterion. It goes to the critic.

## Isolation

- One worktree per task: `git worktree add -b t-###-name ../math-chomper-worktrees/t-###-name main`, then `npm install` there. Pass that absolute path.
- Verifier worktree is a new checkout of the candidate commit, not the implementer's tree.
- Critic worktree is a new checkout of the integrated commit. Its dev server uses a port no other worktree has.
- Controller integration and ledger edits happen in `git worktree add --detach ../math-chomper-worktrees/integrate main`. Push from there with a fast-forward only. Do not stage or commit in the shared main checkout. Another controller may be reading it. A git-index race in a shared checkout can fold one controller's staged files into another's commit. A worktree has its own index, so that race cannot happen there.
- Remove a worktree after its branch is merged, or after the critic report is recorded.

## Status

`STATUS.md` is the ledger: task id, title, phase, state (`todo` / `in progress` / `verifying` / `done` / `blocked`), round, worktree path, critic due.

`docs/tasks/BACKLOG.md` is the index. Details live in `docs/tasks/backlog/B-###-slug.md`. A backlog item does not authorize implementation.
