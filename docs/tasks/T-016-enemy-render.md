# T-016: Enemy + Refuge Rendering

Phase: 4
Depends on: T-015 (state with enemies/refuge)
Round: 1

## Goal

Extend the canvas renderer to draw enemies and the refuge on the board.

## Files (modify)

- `src/render/canvas.ts` (modify — add enemy + refuge drawing to renderBoard)
- `src/render/sprites.ts` (modify — add enemy sprite functions)

Do not create or modify files outside this list.

## Requirements

### `src/render/sprites.ts` — add:

```ts
export function drawEnemy(ctx: CanvasRenderingContext2D, kind: EnemyKind, x: number, y: number, cellSize: number): void;
```

- Each enemy is a colored circle with distinct features:
  - **straight** `#e23d3d`: circle, single eye, flat front (rectangle)
  - **shy** `#4aa3ff`: circle, two eyes, small body (shrunken circle, 25% of cell)
  - **eater** `#b06bff`: circle, wide open mouth (arc), larger body (35% of cell)
  - **rewriter** `#e0a045`: circle, pencil mark (small line), medium body (30%)
  - **chaser** `#f2e14a`: circle, two angry eyes (angled lines), pointed nose (triangle), 30%
- `drawRefuge` already exists (corner ticks). Keep it.

### `src/render/canvas.ts` — modify `renderBoard`:

After drawing cells and the player, also draw:
- Each enemy at its cell position (call `drawEnemy` with the kind and cell center coords).
- The refuge (if state.refuge is not null): call `drawRefuge` at the refuge cell.
- Import `Enemy`, `EnemyKind`, `Refuge` from `@/game/enemies`.
- Import `drawEnemy` from `@/render/sprites`.

## Acceptance

| # | Command | Expected result |
|---|---------|-----------------|
| 1 | `npm run typecheck` | Exit 0. |
| 2 | `npm run build` | Exit 0. |

## Edges

- Multiple enemies: all drawn, no overlap issues (they're on different cells by construction).
- Enemy on same cell as player (brief, during freeze): draw both, enemy on top.
- Refuge and enemy on same cell: shouldn't happen (refuge removes enemy), but if it does, draw both.

## Out of scope

- No animation, no movement interpolation.
- No audio.
