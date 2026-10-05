# T-001: Project Scaffold

Phase: 1
Depends on: none
Round: 1

## Goal

Stand up the Vite + TypeScript strict + Vitest project so that `npm run dev` shows a black canvas, `npm test` runs and passes, and `npm run build` emits `dist/`.

## Files (create, all new)

- `package.json`
- `vite.config.ts`
- `tsconfig.json`
- `tsconfig.node.json` (if needed for Vite config)
- `index.html`
- `src/main.ts`
- `src/render/canvas.ts`
- `test/example.test.ts`

Do not create files outside this list. Do not add runtime dependencies.

## Requirements

- `package.json` name is `math-chomper`. Dev dependencies only: `vite`, `typescript`, `vitest`. Scripts: `dev`, `test`, `typecheck` (`tsc --noEmit`), `build`.
- `tsconfig.json`: `"strict": true`, `"noUnusedLocals": true`, `"noImplicitOverride": true`, path alias `@` → `src`, target ES2020+, module ESNext, moduleResolution bundler.
- `vite.config.ts`: Vite + `@vitejs/plugin-vite` for TS (or `vite` built-in TS handling). Relative base path (`./`) so the build opens from `dist/index.html`.
- `index.html`: loads `src/main.ts`, contains a `<canvas>` element.
- `src/render/canvas.ts`: exports a named function `createBoardCanvas(canvas: HTMLCanvasElement): void` that sets the canvas to 960×600 internal resolution and fills it solid black (`#000000`). No other drawing.
- `src/main.ts`: imports `createBoardCanvas`, grabs the canvas from the DOM, calls it. This is the entire boot.
- `test/example.test.ts`: one passing test that asserts `1 + 1 === 2`. This proves the test runner works.

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm install` | Completes without error. |
| 2 | `npm run dev` | Dev server starts. Browser at the printed URL shows a black 960×600 canvas. |
| 3 | `npm test` | Vitest runs `test/example.test.ts`, 1 test, 1 pass. |
| 4 | `npm run typecheck` | `tsc --noEmit` exits 0 with no errors. |
| 5 | `npm run build` | Emits `dist/index.html` and `dist/assets/`. Opens in browser showing the black canvas (relative paths). |

## Tests to write

| File | Test name | Behavior proved |
|------|-----------|-----------------|
| `test/example.test.ts` | `arithmetic sanity` | `1 + 1 === 2` (runner works) |

## Edges

- Build must use relative base (`./`) — verify `dist/index.html` references `./assets/…` not `/assets/…`.
- No `any` type anywhere. No default exports (except `vite.config.ts`).

## Out of scope

- No game logic, no rules, no state, no input, no audio.
- No additional dependencies beyond `vite`, `typescript`, `vitest` (and `@types/node` if Vite requires it as devDep).
