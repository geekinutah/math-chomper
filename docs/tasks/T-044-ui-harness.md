# T-044: UI Test Harness + Button-Dispatch Tests (B-025)

Phase: — (test coverage)
Depends on: none (adds `src/ui` *tests* + a dev dependency; touches no `src/` behavior)
Round: 1
Source: B-025 (backlog). Owner decision 2026-10-07 (Mike): "let's definitely build tests" for the UI layer. **This adds tests only — zero `src/` behavior change.**

## Why

No unit test imports `src/ui` or `src/input`. The screen button wiring in `src/ui/screens.ts` and `src/ui/mode-select.ts` dispatches game `Action`s via the `onAction`/`onModeSelect` callbacks, but nothing guards it: e.g. the game-over **Menu** button (T-038) dispatches `{ type: "title" }` (screens.ts:120-122) and the **Play Again** button dispatches `{ type: "restart" }` (screens.ts:116-118) with no test. A wrong dispatch would only be caught by hand-playing.

## The harness (jsdom, dev-only)

Add **one** dev dependency, `jsdom`, and run the UI tests under Vitest's `jsdom` environment **per file** — do **not** change `vite.config.ts` and do **not** set a global `test.environment` (that would load a DOM for every test file). Instead put the directive at the top of each new UI test file:

```ts
// @vitest-environment jsdom
```

- `npm install --save-dev jsdom` (this is a **dev** dependency — allowed; Vite/Vitest are already dev-only). No **runtime** dependency may be added.
- The `@` → `src` alias already lives in `vite.config.ts` (`resolve.alias`) and Vitest reads it, so `import { renderScreens } from "@/ui/screens"` resolves with no config change.
- `jsdom` provides `document`/`window` globally in that environment; the UI modules only touch `document` inside functions, so importing them is safe.
- After install, run `npm audit` and record the result (jsdom's tree should be clean; if a warning appears, note it in the report — do not add `allowScripts` entries without flagging).

## Files

- `package.json` (add `jsdom` to `devDependencies` — via `npm i -D jsdom`, so the version + lockfile are correct)
- `test/ui/screens.test.ts` (new, `// @vitest-environment jsdom`)
- `test/ui/mode-select.test.ts` (new, `// @vitest-environment jsdom`)
- Optionally `test/ui/dom.ts` (a tiny shared helper — see below). No changes to any `src/` file, no changes to `vite.config.ts`, no changes to existing `test/` files.

Do not touch `src/**`. Do not add `@testing-library/*` — plain DOM is enough (one dependency, not two).

## Tests to write

A small shared helper is fine (e.g. `test/ui/dom.ts`):
```ts
export function buttonByText(root: ParentNode, text: string): HTMLButtonElement {
  const btn = [...root.querySelectorAll("button")].find((b) => b.textContent === text);
  if (!btn) throw new Error(`no button with text ${JSON.stringify(text)}`);
  return btn;
}
```

### `test/ui/screens.test.ts`
Build a `container = document.createElement("div")`, a spy `onAction`, and call `renderScreens(container, state, onAction, ...)` (`state` from `makeState(...)` in `../test-helpers` with the relevant `phase`). Assert dispatch by the action object the spy records:
- **game-over Menu → title**: `state.phase = "game-over"`; click `buttonByText(container, "Menu")`; expect `onAction` called with `{ type: "title" }`. *(This is the specific B-025 example.)*
- **game-over Play Again → restart**: same setup; click `"Play Again"`; expect `{ type: "restart" }`.
- **title Play with a sub-screen handler → opens mode-select**: `state.phase = "title"`; pass `onOpenSubScreen` spy (6th param); click `"Play"`; expect `onOpenSubScreen("mode-select")` and that `onAction` was **not** called.
- **title Play with no sub-screen handler → start default**: no `onOpenSubScreen`; click `"Play"`; expect `onAction({ type: "start", mode: "multiples", band: "standard" })`.
- **title Settings → opens settings**: pass `onOpenSubScreen`; click `"Settings"`; expect `onOpenSubScreen("settings")`.
- **visibility**: for `phase "title"` + `subScreen "none"`, the `.screen-title` element is not `.hidden` and `.screen-game-over` is `.hidden`; for `phase "game-over"`, the reverse. Assert via `classList.contains("hidden")`.
- Reset the spy between cases (`vi.clearAllMocks()` in a `beforeEach`, or a fresh container per test — the module caches refs in a `WeakMap` keyed by container, so **use a fresh `container` per test** to avoid cross-test state).

### `test/ui/mode-select.test.ts`
`renderModeSelect(host, onModeSelectSpy, onBackSpy)` (from `@/ui/mode-select`). The six mode buttons are labeled Multiples/Factors/Primes/Equality/Inequality/Challenge; bands are Easy/Standard/Hard; the confirm button is `"Play"`, plus `"Back"`.
- Select a non-default mode + band then **Play** dispatches that choice: click `"Factors"`, click `"Hard"`, click `"Play"`; expect `onModeSelect("factors", "hard")`.
- **Back** dispatches: click `"Back"`; expect `onBackSpy()` called.
- Default is multiples/standard: click `"Play"` with no prior selection; expect `onModeSelect("multiples", "standard")`.
- Fresh `host` (a new `document.createElement("div")`) per test for the same `WeakMap` reason.

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm install` (picks up `jsdom`) then `npm test` | All tests pass, including the new `test/ui/*` files. Confirm the UI files actually ran under jsdom (they use `document`). |
| 2 | `npm run typecheck` | Exit 0. |
| 3 | `npm run build` | Exit 0. |
| 4 | `npm audit` | Report the count (0 expected). If non-zero, note it — do not silence. |
| 5 | `git diff --stat -- src/` | Empty. No `src/` change. |
| 6 | `grep -c "@vitest-environment jsdom" test/ui/*.test.ts` | Every UI test file carries the directive (no global env change). |

The new tests must be **real dispatch assertions** (the spy is called with the exact `Action`/choice), not just "the button exists." At minimum one test must import `@/ui/screens` and one must import `@/ui/mode-select`.

## Edges

- **WeakMap caching:** `screens.ts` and `mode-select.ts` cache refs in a `WeakMap` keyed by the container element. Reusing one container across tests leaks state; give each test a fresh container element.
- **localStorage:** if a UI module touches `localStorage` (scores rendering), jsdom provides a stub; if any module calls it at import time and it throws, scope it out — the goal is dispatch/visibility, not storage. Prefer not importing `@/storage` in these tests.
- Do not import the app entry (`main.ts`) or the canvas renderer — this is the DOM *screens/menus* layer only. The board is canvas and is out of scope here.

## Out of scope

Any `src/` behavior change, the canvas renderer, `src/input` (keyboard/touch) tests (a separate harness concern; B-025 is about screen button dispatch), `@testing-library`, a global vitest env change, and B-020/B-026/B-027. T-043 (dedup survivor) is a separate, file-disjoint contract running in parallel.
