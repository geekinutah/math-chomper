# Math Chomper — Product Spec

Title: **Math Chomper**. Do not ship under the name Number Munchers, Math Munchers, Muncher, or Troggle. Those names, the MECC character designs, the mock-Latin species names, the cutscene scripts, and the original sprites and sounds are not ours to reuse. The *mechanics* of a grid math-munching game are the thing being reimplemented, with original presentation.

Status: decisions locked 2026-10-05. Build this, not the 1986 manual.

Locked by the owner:

- Looser modern game. Keep the modes, the enemies, and the "eat only what the rule names" tension. Change scoring, lives, and session shape where the original plays worse.
- All five modes plus Challenge ship in v1.
- Audience is kids and nostalgic adults. It is a static browser game: keyboard first, touch works, no accounts.

Audience for this document: a coding agent (Qwen3.7-27B via OpenCode) and the human owner. The agent must treat this file as the source of truth for behavior.

---

## 1. What this is

A single-player browser game in the tradition of MECC's *Number Munchers* (Apple II, 1986; MS-DOS and Macintosh, 1990). The player moves a creature around a grid of numbers or short expressions, eats only the cells that match the rule at the top of the screen, and avoids enemies that rearrange the board and eat the player.

It is a fluency game, not a lesson. The skill being trained is fast, accurate recognition: multiples, factors, primes, and mental evaluation of small expressions. Wrong answers are punished immediately. The board is hostile, so the player cannot sit and calculate forever.

Primary player: a kid roughly grades 3–8, or an adult who wants the same loop. A parent can cap the number range. No accounts, no classroom roster, no network. Local high scores only.

## 2. Why this stack

**Vite + TypeScript + Canvas 2D + Vitest. HTML/CSS only for menus and HUD chrome.**

Rejected:

- React / a component framework for the board. The game is a fixed grid and a tick loop. A virtual DOM buys nothing and gives a 27B model more ways to desync state.
- Phaser, Pixi, Excalibur. Extra API surface the model will misuse. Canvas 2D is enough for a 6×5 grid of text and simple sprites.
- Electron / Tauri / native. A static build that opens in any browser is the whole product. Desktop wrapping is a later decision, not a v1 dependency.
- Python / Godot / Unity. Worse fit for "open a tab and play," and a worse fit for this model.

The math must live in pure functions with no DOM, no canvas, and no timers, so it can be unit-tested without a browser.

## 3. Reference: what the 1986 game actually did

Sources: MECC manual (via archive.org text and Apple II mirrors), Wikipedia "Number Munchers", GameFAQs Apple II guide, Giant Bomb, retrogaminggeek history of the MECC design docs ("Harry" for motion, "Ed" for the educational engine).

### Board and controls

- Grid is **6 columns × 5 rows** (30 cells). Sources sometimes say 5×6; screenshots are 6 wide and 5 tall.
- Rule is printed across the top. Level number top-left. Score and reserve lives along the bottom.
- Arrow keys move. The player chooses *when* to eat. Moving onto a cell does not eat it. Space (and Enter) eats the current cell. This matches the manual: the player chooses direction and when the Muncher eats.
- Player moves faster than enemies. Enemies pause between steps; the player does not have to. A careful player can always outrun a single chaser.
- Clearing every correct cell ends the level. The screen resets with a new rule and a new board.

### Modes

Five modes, plus a mix mode. School builds let a teacher lock modes and clamp the key-value range (manual: key values about 2–99, fixed or random).

| Mode | Rule | Example |
|---|---|---|
| Multiples | Eat multiples of K, including K | K = 3 → 3, 6, 9, 12. Not 7. |
| Factors | Eat positive divisors of K, including 1 and K | K = 12 → 1, 2, 3, 4, 6, 12 |
| Primes | Eat primes. 1 is not prime. 2 is prime. | 2, 3, 5, 7, 11. Not 1, 4, 9, 51. |
| Equality | Eat expressions whose value is K | K = 6 → `3×2`, `3+3`, `12÷2` |
| Inequality | Eat expressions whose value is **not** K | K = 6 → `4×2` (8), `3+5` (8). Not `3×2`. |
| Challenge | Modes rotate. A new mode every level, announced on the rule line. | — |

Equality and inequality cells are expressions, not bare numbers. Other modes are bare integers.

### Lives and score (original, not what we ship)

Kept here so the agent does not "correct" the modern rules back to the manual.

- Original start: 4 lives. Extra life at 1,000 and at 10,000.
- Original points per correct eat: 5 (levels 1–3), then 10, 15, 20, 25, 30, 35, 40, 45, then 50 through level 18, then 75.
- Wrong eat cost a life, not points.
- Hall of Fame was a local top list with a 3-character name.

### What we change, and why

The original scoring table is invisible. A kid cannot tell why a munch was worth 5 and the next one 35. The life awards at 1,000 and 10,000 are too far apart for a short session. The grid, the explicit eat, and the five enemy behaviors already play well, so those stay.

Ship these instead:

- **Grid stays 6×5.** A wider or taller board is worse on a phone and slower to scan. Do not "modernize" the grid.
- **Eat stays explicit.** Moving onto a cell does not eat it. Space, Enter, or a tap on the occupied cell eats. Auto-eat makes pathing through a wrong cell lethal, which is a bad lesson.
- **3 lives**, plus up to 2 in reserve (5 total). A wrong eat or an enemy hit costs one. Three on the HUD reads instantly; four looked like leftover Apple II UI.
- **+10** for every correct eat, at every level. Floating `+10` on the cell.
- **Streak:** 3 correct eats in a row without a miss or a hit, then each further correct eat in that streak is +15 instead of +10. A miss, a hit, or a level change resets the streak. No point penalty on a miss.
- **Level clear:** +25, plus +5 per level number. Level 4 clear is +45.
- **Extra life** at every 1,000 points, one-shot per threshold (1,000, 2,000, 3,000…). Reserve caps at 2.
- **Run shape:** endless until lives hit 0. Every 3 levels, a one-second breather card with the score, skippable with Space. Not a cutscene.
- **High scores:** top 8, name up to 8 letters, mode, band, score, level reached. `localStorage` key `mathchomper.scores.v1`.

### Enemies

Five species. They enter from the edges, move on the grid, and kill the player on contact. Two enemies on the same cell: one eats the other, and a replacement may spawn. They also rewrite the board, which is the real pressure.

| Original name (do not reuse) | Behavior to reimplement |
|---|---|
| Straight-liner (Reggie) | Picks a direction and walks until blocked, then turns. Predictable. |
| Shy (Bashful) | Wanders. If the player is within 2 cells, steps away. |
| Eater (Helper) | Eats the cell it lands on (correct or not) and leaves it empty. Can clear the level for the player, which steals points. Still lethal on contact. |
| Rewriter (Worker) | On each step, replaces the cell it leaves with a new value. Does not chase. |
| Chaser (Smartie) | Greedy step toward the player each move. Most dangerous. |

Spawn cadence from Wikipedia / gameplay writeups: 1 enemy on levels 1–3, a second from level 4, a third from level 8. After about level 18, enemy step delay drops. There is no last level. The run ends when lives hit 0.

### Safety squares

A cell sometimes gains corner marks and becomes a refuge.

- Enemies cannot enter it.
- If a refuge appears on an occupied enemy cell, that enemy is removed (and may be replaced).
- Refuges expire. Standing in one forever is a trap.
- Early levels have more, longer refuges. Later levels have fewer and shorter ones.

### Cutscenes

Every 3 cleared levels, a short skippable cartoon. Six scenes, then they repeat. These are rewards, not gameplay. **v1 does not include them.** A title card ("Level 4") is enough. Cutscenes are a later phase and must be original gags, not the MECC parodies.

### What the original was for

Grades about 4–8, with a school build that could restrict modes and ranges. The useful teacher idea to keep: a parent can set max key value and which modes are on, stored in localStorage.

## 4. Product goals

1. A round is fun for 10 minutes without instructions beyond the rule line.
2. The rule engine is correct. A wrong "correct" answer is a ship blocker.
3. Keyboard-first on a laptop. Touch works on a phone without being the focus.
4. Runs from `npm run dev` and from `npm run build` as a static site. No server.
5. A 27B agent can finish it in phases without inventing a second game.

Non-goals for v1: accounts, multiplayer, ads, a level editor, procedural music, cutscenes, a teacher dashboard, i18n, analytics.

## 5. Player fantasy and tone

Title **Math Chomper**. The player character is a small green round eater with a wide mouth. Enemies are original blob creatures, color-coded by behavior, not copies of the MECC sprites. Tone is dry and a little mean, like a classroom arcade game. No gore. Getting eaten is a chomp and a life lost.

UI copy is short. The rule line is the whole tutorial.

Examples:

- `Multiples of 6`
- `Factors of 12`
- `Prime numbers`
- `Equals 8`
- `Not equal to 8`

## 6. Controls

| Input | Action |
|---|---|
| Arrow keys, WASD | Move one cell. Buffered: a tap during a move queues the next step. |
| Space, Enter | Eat current cell. |
| Esc | Pause. |
| R (on game over) | Restart same mode. |
| Touch | D-pad plus an Eat button. Swipe on the board also moves. Tapping the occupied cell eats. |
| Gamepad | Left stick / d-pad move, South button eats. Optional, only if cheap. |

Movement is discrete. No analog sliding. Step duration for the player is about 140 ms at level 1, floored at 80 ms. Enemy step is always slower than the player step (start ~420 ms, floor ~180 ms).

## 7. Rules, precisely

The rule engine is `src/rules/`. It exports pure functions. No exceptions for bad content: generators must not emit a cell they cannot classify.

```ts
type Mode = "multiples" | "factors" | "primes" | "equality" | "inequality";

type Cell =
  | { kind: "empty" }
  | { kind: "number"; value: number }
  | { kind: "expr"; text: string; value: number };

type Rule =
  | { mode: "multiples"; k: number }
  | { mode: "factors"; k: number }
  | { mode: "primes" }
  | { mode: "equality"; k: number }
  | { mode: "inequality"; k: number };

function matches(rule: Rule, cell: Cell): boolean;
```

Definitions:

- Multiples: `value % k === 0` and `value > 0`. `k` itself matches. 0 never appears.
- Factors: `k % value === 0` and `value` is an integer from 1 to `k`.
- Primes: integer `>= 2` whose only divisors are 1 and itself. 1 does not match.
- Equality: expression value `=== k`.
- Inequality: expression value `!== k`. Both sides are integers. No division by zero. Division only when it divides evenly, so the board never shows `5÷2`.
- Empty cells never match. Eating empty is a no-op, not a miss.

Expression grammar, v1 only: `a+b`, `a−b`, `a×b`, `a÷b`, with `a` and `b` integers 0–12 for addition/subtraction and 1–12 for multiplication/division. That split records the 1986 original; v1 board generation draws operands from the band tables in §8 (0–12 wherever a band leaves the range unstated). Display uses `×` and `÷`, not `*` and `/`. Subtraction results are non-negative in v1.

Board generation constraints:

- Always spawn at least 4 matching cells and at least 4 non-matching cells.
- Never fill more than 60% of occupied cells with matches. The level should not be "eat almost everything."
- Cap matching cells at 10 so a level cannot become a slog.
- Equality boards are all expressions. Inequality boards are all expressions. Other modes are all numbers.
- Regenerated cells (after an enemy rewrite) obey the same rule and the same constraints, except a rewrite may legally drop the match count. If a rewrite or an eater-enemy clears the last match, the level ends.

## 8. Difficulty

**[LOCKED]** Three parent-facing bands, and inside a band the run still escalates. Default band is Standard.

| Band | Number range | Key K | Expressions | Enemy types unlocked |
|---|---|---|---|---|
| Easy | 1–30 | 2–9 | `+` and `−` only, results 0–12 | straight, shy |
| Standard | 1–60 | 2–12 | all four ops, operands 0–12 | + eater, rewriter at level 4 |
| Hard | 1–100 | 2–20 | operands to 12, larger results | + chaser from level 3 |

Inside a run:

| Level | Enemies alive (cap) | Notes |
|---|---|---|
| 1–3 | 1 | Refuges common (about every 8 s, last 5 s). |
| 4–7 | 2 | Rewriter joins on Standard+. |
| 8–17 | 3 | Chaser joins on Hard; on Standard from level 8. |
| 18+ | 3 | Step delays ×0.85, floored. Refuges rare. |

Primes mode ignores `k` and uses the band's number range. Do not put primes above 100 in v1. Composites that fool people must appear on purpose once the range allows: 1, 9, 15, 21, 25, 27, 33, 35, 49, 51, 57, 77, 91.

Level advance: all current matches eaten (by player or by an eater-enemy). Short pause, score popup, next board. Same mode, new `k`, except Challenge, which changes mode.

Game over: lives reach 0. Show score, offer initials if it qualifies for the local top 8, then menu.

## 9. Enemies, precisely

All enemies occupy one cell. They step on their own timer. They do not move on the player's tick.

- **Straight.** On spawn, pick a cardinal direction. Each step, move if the next cell is in bounds and not a refuge. Else pick a new direction, preferring a turn over a reverse.
- **Shy.** Each step, if Chebyshev distance to the player is ≤ 2, move to increase that distance. Else random legal step.
- **Eater.** Random legal step. On leaving a cell, set it to empty. If that emptied the last match, the level ends after the step resolves.
- **Rewriter.** Random legal step. On leaving a cell, write a new legal number or expression. Prefer writing a non-match (70%) so the board does not fill with free points.
- **Chaser.** Each step, among legal moves, pick the one with smallest Chebyshev distance to the player. Break ties at random. Does not enter refuges. Does not pathfind around them in v1 (greedy is the right amount of dumb).

Shared:

- Spawn on an edge cell that is not the player's cell and not a refuge.
- If two enemies would occupy one cell, the arriving one removes the resident. Schedule a replacement spawn 2–4 seconds later if the alive count is under the cap.
- Player and enemy on the same cell at end of any step: player loses a life, enemies freeze for 700 ms, player respawns on a random non-enemy cell. If that was the last life, game over instead of respawn.
- Wrong eat: cell becomes empty, life lost, same respawn rule. The eaten wrong value does not come back.

Refuge:

- At most one at a time.
- Spawn on an occupied or empty cell that is not the player.
- Visual: four corner ticks.
- Duration 5 s early, 2.5 s from level 12.
- An enemy already on that cell is removed immediately.

## 10. Scoring

Use the modern table in section 3, not the 1986 point ladder. Show a floating `+10` or `+15` on a correct eat. Extra lives fire once per 1,000-point threshold and cannot push the reserve above 2.

High scores: top 8, name up to 8 letters, mode, band, score, level reached. `localStorage` key `mathchomper.scores.v1`.

## 11. Screens

1. **Title.** Name, "Play", "How to play", "Settings". High score strip.
2. **Mode select.** Five modes + Challenge. Band picker (Easy / Standard / Hard). Remembers last choice.
3. **How to play.** Six lines. Arrow keys move. Space eats. Eat only what the rule names. Enemies hurt. Wrong eats hurt. Clear the matches to advance.
4. **Play.** Canvas centered. DOM HUD: level, rule, score, lives. Pause overlay on Esc.
5. **Game over.** Score, level, initials if top 8, Play again, Menu.

No cutscenes in v1.

## 12. Presentation

- Canvas internal resolution 960×600, integer-scaled to fit the window. Crisp pixels, `imageSmoothingEnabled = false` if sprites are used.
- Palette: near-black background `#0d1110`, grid lines `#2a3a32`, player `#3ddc6e`, numbers `#f4f1e8`. Enemy colors fixed: straight `#e23d3d`, shy `#4aa3ff`, eater `#b06bff`, rewriter `#e0a045`, chaser `#f2e14a`.
- Font: a bundled pixel/monospace face for numbers, or `ui-monospace` if no font is vendored. Do not depend on a network font.
- v1 art may be vector-drawn on canvas (circles, eyes, mouths). Do not download or trace MECC sprites.
- Sound: Web Audio beeps, no sample files required. Eat (short noise burst), wrong (low buzz), hit (descending blip), level clear (three rising tones), refuge (soft tick). Mute toggle, persisted. Music is out of scope.
- Reduced motion: respect `prefers-reduced-motion` by cutting screen shake. There should be almost no screen shake anyway.

## 13. Settings (parent)

Stored in `localStorage`.

- Band.
- Modes enabled (all on by default).
- Mute.
- Touch controls always visible, or auto (show under 800 px).
- Reset scores.

No PIN in v1. A parent gate is theater without an account.

## 14. Architecture

```
src/
  main.ts              boot, screen router
  game/
    state.ts           GameState type, reducers, no DOM
    loop.ts            rAF loop, fixed sim step
    board.ts           generate and rewrite cells
    enemies.ts         step functions, pure
    spawn.ts
  rules/
    match.ts
    primes.ts
    expr.ts            parse/eval the four ops
    generate.ts
  render/
    canvas.ts          draw only, reads state
    sprites.ts         procedural draw of actors
  input/
    keyboard.ts
    touch.ts
  ui/                  HTML screens, not the board
  audio/beeps.ts
  storage.ts
  content/
    bands.ts           the tables in section 8
test/
  rules.test.ts
  enemies.test.ts
  state.test.ts
```

State changes go through reducers: `move`, `eat`, `enemyStep`, `spawnRefuge`, `tick`. The renderer is a function of state. Do not store game truth on the canvas or in the DOM.

Sim ticks at 60 Hz for timers. Movement resolves on step boundaries, not continuously.

## 15. Acceptance tests the agent must write

Rules:

- Multiples of 1 match every positive integer. (Do not use K = 1 in generation. Test it anyway.)
- Factors of 12 are exactly {1, 2, 3, 4, 6, 12}.
- 1 is not prime. 2 is prime. 51 is not prime. 91 is not prime. 97 is prime.
- `12÷2` equals 6. `5÷2` is never generated.
- Inequality does not match an expression equal to K, and does match one that is not.
- Generator always returns 4–10 matches on a fresh board.

State:

- Eating a match scores +10, or +15 if the streak is already at 3 or more, and empties the cell.
- Eating a non-match costs a life and does not add points. Streak resets.
- Eating empty does nothing.
- Last match cleared sets phase to `level-clear` and adds the level-clear bonus (+25 plus +5 per level).
- Player–enemy overlap costs a life and resets the streak.
- Extra life triggers once at each 1,000-point threshold and never pushes reserve lives above 2.

Enemies:

- Chaser never increases Chebyshev distance when a closer legal step exists.
- Shy increases distance when within 2.
- No enemy steps onto a refuge.
- Eater empties the cell it leaves.

## 16. Phases

The agent completes one phase, runs the checks, and stops for the human. It does not start the next phase in the same turn unless the human says to continue.

1. **Scaffold.** Vite + TS strict + Vitest. Blank canvas. `npm run dev`, `npm test`, `npm run build` all succeed.
2. **Rules.** `match`, primes, expr eval, board generator. Tests green. No rendering required beyond a debug dump.
3. **Playable board.** Move, eat, score, lives, level clear, game over. One mode (Multiples). No enemies. Keyboard only.
4. **Enemies and refuges.** All five behaviors. Spawn caps from section 9. Still one mode.
5. **All modes + Challenge + bands.** Mode select and settings.
6. **Feel.** HUD, pause, high scores, beeps, mute, touch controls, integer scaling, game-over initials.

Done means the checks in AGENTS.md pass, not that the agent says they pass.

## 17. Legal and content

- Original title, original characters, original palette is fine as a homage.
- Do not copy MECC sprites, manual text, cutscene scripts, or the words Number Munchers / Math Munchers / Troggle / Trogglus as in-game proper nouns.
- Code license: MIT.
- No third-party art or audio unless it is public domain or MIT/CC0 and vendored with a license file.

## 18. Decisions already made

Do not reopen these in code:

- Modern scoring and 3+2 lives, as in section 3. Not the manual ladder.
- All five modes and Challenge in v1.
- Static browser build for kids and nostalgic adults. Keyboard first, touch supported, parent band in localStorage, no accounts.
- Title is Math Chomper. Do not use MECC names. Package name `math-chomper`. localStorage prefix `mathchomper.`.
