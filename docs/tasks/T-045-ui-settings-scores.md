# T-045: Settings + Scores UI Dispatch Tests (B-028)

Phase: — (test coverage)
Depends on: T-044 (the `jsdom` harness + `test/ui/dom.ts` are already on main). **Tests only — zero `src/` change, no new dependencies, no `package.json` change.**
Round: 1
Source: B-028 (backlog, verifier-filed during T-044). Owner decision 2026-10-07 (Mike): "Do B-028 now." The T-044 harness scoped the harness to `test/ui/{screens,mode-select}` only; this closes the adjacent gap in the **same** screen layer.

## Why (the gap)

`src/ui/settings.ts` and `src/ui/scores.ts` attach click/change/keydown listeners that call the `on*` callbacks, but no test imports either module (`grep -rn "ui/settings\|ui/scores" test/` → no matches). The T-044 mutation check proved the harness guards dispatch *when a test exists*; these two modules simply have no tests yet. A regression re-pointing e.g. the settings **Back** button, or the initials **Confirm** not sanitizing, would pass `npm test` unchanged.

## Prerequisites already on main (do not re-add)

- `jsdom` is a dev dependency (from T-044). Use the per-file `// @vitest-environment jsdom` directive.
- `test/ui/dom.ts` exports `buttonByText(root: ParentNode, text: string): HTMLButtonElement`. Reuse it; you may add small sibling helpers (e.g. an `inputByClass` / `checkboxByLabel`) to `test/ui/dom.ts` if useful, but keep it minimal.
- `@/storage` is safe to import under jsdom: `DEFAULT_SETTINGS` is a module-level pure const (`src/storage.ts:82`); only `loadSettings`/`saveSettings`/`loadScores`/`saveScore` touch `localStorage`, and none run at import or inside `renderSettings`/`renderScoreList`/`renderInitialsEntry`. So no storage I/O happens in these tests.
- **WeakMap caching:** `settings.ts` (`settingsRefs`) and `scores.ts` (`scoreListRefs`, `initialsRefs`) cache refs keyed by the container element. **Use a fresh `document.createElement("div")` container per test** so state doesn't leak between tests.

## Files (all new or test-only; no `src/`, no `package.json`, no `vite.config.ts`)

- `test/ui/settings.test.ts` (new, `// @vitest-environment jsdom`)
- `test/ui/scores.test.ts` (new, `// @vitest-environment jsdom`)
- `test/ui/dom.ts` (optional — only if you add a helper)

The UI `render*` signatures:
- `renderSettings(container, settings: Settings, onChange: (s: Settings) => void, onResetScores: () => void, onBack: () => void)` (`settings.ts:166`)
- `renderScoreList(container, scores: ScoreEntry[])` (`scores.ts:76`)
- `renderInitialsEntry(container, onConfirm: (name: string) => void, score: number, level: number)` (`scores.ts:144`)

Build a `Settings` literal in the test (e.g. `{ band: "standard", modes: { multiples: true, factors: true, primes: true, equality: true, inequality: true, challenge: true }, mute: false, touch: "auto" }`) — or import `DEFAULT_SETTINGS` from `@/storage`. Build a `ScoreEntry` literal from `@/storage`.

## Tests to write (assert the dispatched **value**, not "a click happened")

### `test/ui/settings.test.ts` — `renderSettings`
Scope button queries to the settings root (`.screen-settings`) to stay unambiguous.
1. **band** → `onChange`: click band button `"Hard"`; expect `onChange` called with `expect.objectContaining({ band: "hard" })`.
2. **mode checkbox** → `onChange`: the six mode checkboxes sit in `.mc-set-modes` labels (text Multiples…Challenge). Find the **Primes** checkbox, set `checked = false`, `dispatchEvent(new Event("change"))`; expect `onChange` called with `objectContaining({ modes: expect.objectContaining({ primes: false }) })`.
3. **mute** → `onChange` + label: click the mute button (initial text `"Off"`); expect `onChange` called with `objectContaining({ mute: true })` **and** the button's `textContent` now `"On"`.
4. **touch** → `onChange`: click touch button `"Auto"`; expect `onChange` called with `objectContaining({ touch: "auto" })`.
5. **Reset Scores** → `onResetScores`: click `"Reset Scores"`; expect `onResetScores` called once.
6. **Back** → `onBack`: click `"Back"`; expect `onBack` called once.

### `test/ui/scores.test.ts`
The initials UI has a **local** `sanitizeName` (`scores.ts:107`) = `name.replace(/[^a-zA-Z0-9 ]/g, "").toUpperCase().slice(0, 8).trim()` — note it **uppercases** (unlike `storage.ts`'s). Find the input by class `.mc-initials-input`; the confirm button is `"Confirm"`.
1. **confirm via button** sanitizes + uppercases: set `input.value = "mike!!"`, click `"Confirm"`; expect `onConfirm("MIKE")`.
2. **confirm via Enter** (keydown): set `input.value = "ab<script>cd"`, dispatch a `keydown` with `key: "Enter"` on the input; expect `onConfirm("ABSCRIPT")` (`<`/`>` stripped, `script` letters kept, uppercased, sliced to 8).
3. **8-char cap**: set `input.value = "aaaaaaaaaaaa"` (12 a's), click `"Confirm"`; expect `onConfirm("AAAAAAAA")` (exactly 8).
4. **score list empty**: `renderScoreList(container, [])`; expect `.mc-score-empty` **not** `.hidden` and all `.mc-score-row` hidden.
5. **score list populated**: `renderScoreList(container, [{ name: "MIKE", mode: "multiples", band: "hard", score: 100, level: 5 }])`; expect `.mc-score-empty` `.hidden`, the first `.mc-score-row` **not** `.hidden`, and its children `.mc-score-rank`/`.mc-score-name`/`.mc-score-score`/`.mc-score-mode`/`.mc-score-band` equal `"1"`/`"MIKE"`/`"100"`/`"Mult"`/`"H"` (`MODE_SHORT`/`BAND_SHORT` in `scores.ts:8-21`).

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm test 2>&1 \| rg "Tests \|Test Files "` | All pass; the two new `test/ui/*` files ran under jsdom (implementer baseline is 324; expect 324 + your new tests, all green). |
| 2 | `npm run typecheck` | Exit 0. |
| 3 | `npm run build` | Exit 0. |
| 4 | `git diff --stat -- src/` | **Empty** (no `src/` change). |
| 5 | `git diff --name-only` | Only `test/ui/settings.test.ts`, `test/ui/scores.test.ts` (and `test/ui/dom.ts` if you extended it). No `package.json`/`vite.config.ts`. |
| 6 | `wc -l test/ui/*.ts` | Every new file under 250 lines (B-022 rule). |
| 7 | `grep -c "@vitest-environment jsdom" test/ui/settings.test.ts test/ui/scores.test.ts` | 1 each. |

The tests must assert **exact/sanitized dispatch values** (the `onConfirm` name, the `onChange` field, the `onResetScores`/`onBack` call) — real assertions, not "button exists."

## Edges

- **`localStorage`:** if a test transitively triggers a storage write it is harmless under jsdom (jsdom provides `localStorage`), but none of the three `render*` functions call storage — assert you don't need to mock it. Do **not** import `main.ts` or the canvas renderer.
- **Enter key:** `input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }))`. jsdom fires the listener; `doConfirm` reads `refs.input.value`.
- **Focus:** `renderInitialsEntry` calls `input.focus()` — jsdom allows it; no error.
- Keep the two files' helpers local (or in `dom.ts`); don't reach into `@/storage`'s private `sanitizeName` — the UI uses its own.

## Out of scope

Any `src/` change, any new dependency, `vite.config.ts`, the canvas renderer, `src/input` (keyboard/touch) tests, and B-020/B-027. (The `src/ui/*` behavior is assumed correct from T-044's harness; this task only adds the missing dispatch/coverage for settings + scores.)
