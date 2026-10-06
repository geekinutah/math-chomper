# B-014 Dev-dependency audit: vitest transitive vulns and unapproved install scripts

Found during: T-027
Risk: low (dev-only toolchain; no runtime dependencies; static game)
Evidence: `npm install` in a checkout of 4cb1959 and of base b8cfa98 both print "3 vulnerabilities (1 moderate, 2 critical)" and "2 packages have install scripts not yet covered by allowScripts: esbuild@0.28.2 (postinstall), fsevents@2.3.3 (install)". `npm audit` attributes the 3 to vitest's transitive deps: @vitest/mocker 2.1.0–4.1.10 (GHSA-82fw-gwwq-j7x9, moderate, path traversal in redirect mocks) and tinypool <=2.1.1 (GHSA-5gmw-xhrv-c9v3 and GHSA-85c8-ppgw-ccpr, both critical, prototype-pollution-to-RCE in worker options); `npm audit fix` wants vitest@5.0.3, a breaking change. package.json is unchanged between base and candidate, so this is pre-existing, not introduced by T-027. Note: the T-027 implementer report attributed the 3 vulnerabilities to esbuild/fsevents; the observed attribution is vitest/@vitest/mocker/tinypool — esbuild/fsevents are the install-script warnings, a separate issue.
Direction: Human decision: bump vitest to 5.x (or later) to clear the tinypool/@vitest/mocker advisories, and approve or drop the esbuild/fsevents install scripts via `npm install-scripts approve`. Do not run `npm audit fix --force` without the human's sign-off (breaking).
State: open
