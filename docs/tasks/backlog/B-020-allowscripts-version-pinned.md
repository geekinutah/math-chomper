# B-020 allowScripts keys are version-pinned; a future vite/esbuild/fsevents bump re-surfaces the warning

Found during: T-031 (verification)
Risk: low (dev-only toolchain; safe-fail direction — the warning re-surfaces rather than the install silently running unapproved scripts)
Evidence: package.json:18-21 — the allowScripts block written by `npm install-scripts approve` pins exact versions: "esbuild@0.28.2" and "fsevents@2.3.3". The lockfile pins those same versions, so a clean `npm install` from the committed tree stays warning-free (T-031 verification: exit 0, 36 packages, 0 vulnerabilities, no warning). Reproduced in a disposable worktree: with vitest 5 and 0 vulnerabilities, deleting the allowScripts block makes `npm install` print "2 packages have install scripts not yet covered by allowScripts: esbuild@0.28.2 (postinstall), fsevents@2.3.3 (install)" — so the block is load-bearing, and any future vite bump (e.g. to 8.x) or `npm update` that moves esbuild or fsevents to a new version will stop matching the pinned keys and re-surface the warning on every install.
Direction: The next toolchain task that bumps vite or otherwise moves esbuild/fsevents must re-run `npm install-scripts approve` for the new versions and include the updated package.json allowScripts block in its contract. No action needed on the current tree.
State: open
