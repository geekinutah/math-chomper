# T-009: Board Rendering

Phase: 3
Depends on: T-006 (state)
Round: 1

## Goal

Implement canvas rendering of the game board: grid, cells (numbers/expressions), and the player character.

## Files (create or modify)

- `src/render/canvas.ts` (modify — replace the current black-rect placeholder)
- `src/render/sprites.ts` (create new)

Do not create or modify files outside this list.

## Requirements

### `src/render/canvas.ts`

- Export: `export function renderBoard(ctx: CanvasRenderingContext2D, state: GameState): void`
  - Clears the canvas (960×600).
  - Draws the 6×5 grid.
  - Draws each cell's content (number or expression text).
  - Draws the player at its position.
  - Reads state only. No mutations. No side effects.
- Cell layout:
  - Canvas is 960×600. Grid area: 600×500 centered (offset 180, 50).
  - Each cell: 100×100 px.
  - Grid lines: `#2a3a32`, 1px.
  - Background: `#0d1110`.
- Cell content:
  - Numbers: centered text, `#f4f1e8`, monospace font, 28px.
  - Expressions: centered text, `#f4f1e8`, monospace font, 24px (slightly smaller to fit).
  - Empty cells: nothing drawn (just background).
  - Matching cells (cells that match the current rule): subtle highlight — draw a faint green border `#1a3a2a` around the cell. (Helps the player see targets.)
- Player:
  - Delegates to `drawPlayer` from `sprites.ts`.

### `src/render/sprites.ts`

- Export: `export function drawPlayer(ctx: CanvasRenderingContext2D, x: number, y: number, cellSize: number): void`
  - Draws a small green circle (`#3ddc6e`) centered in the cell.
  - Radius: 30% of cellSize.
  - Two small black dot eyes.
  - A wide mouth arc (open, facing the player's last move direction — for now, just face down).
- Export: `export function drawRefuge(ctx: CanvasRenderingContext2D, x: number, y: number, cellSize: number): void`
  - Four corner tick marks (small L-shapes) in `#4aa3ff`.
  - (Used in Phase 4, but define it now so the file is complete.)
- No `any` type. No default exports. Files under 250 lines.

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm run typecheck` | Exit 0. |
| 2 | `npm run build` | Exit 0. |

Note: Visual correctness is verified by the critic in a browser. The gate is type-check + build.

## Edges

- The render function must be idempotent: calling it twice with the same state produces the same visual output.
- Must handle all cell kinds: empty, number, expr.
- Must handle the player being on any cell (including edge cells).

## Out of scope

- No enemy sprites (Phase 4).
- No screen shake, no particles, no animation.
- No audio.
