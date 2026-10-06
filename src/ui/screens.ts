import type { Action, GameState } from "@/game/state";

const HOW_TO_PLAY: readonly string[] = [
  "Arrow keys or WASD to move.",
  "Space or Enter to eat.",
  "Eat only what the rule names.",
  "Wrong eats cost a life.",
  "Enemies hurt you.",
  "Clear all matches to advance.",
];

interface ScreenRefs {
  title: HTMLElement;
  levelClear: HTMLElement;
  levelClearText: HTMLElement;
  gameOver: HTMLElement;
  gameOverScore: HTMLElement;
  gameOverLevel: HTMLElement;
  paused: HTMLElement;
  onAction: (a: Action) => void;
}

const screenRefs = new WeakMap<HTMLElement, ScreenRefs>();

function makeButton(label: string, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "mc-btn";
  btn.textContent = label;
  btn.addEventListener("click", onClick);
  return btn;
}

function buildScreens(
  container: HTMLElement,
  onAction: (a: Action) => void,
): ScreenRefs {
  const title = document.createElement("div");
  title.className = "screen screen-title";
  const titleName = document.createElement("h1");
  titleName.className = "mc-title";
  titleName.textContent = "Math Chomper";
  title.appendChild(titleName);
  const playBtn = makeButton("Play", () => {
    screenRefs.get(container)?.onAction({ type: "start", mode: "multiples" });
  });
  title.appendChild(playBtn);
  const howTo = document.createElement("div");
  howTo.className = "mc-howto";
  const howToHeading = document.createElement("div");
  howToHeading.textContent = "How to Play";
  howTo.appendChild(howToHeading);
  const howToList = document.createElement("ul");
  howToList.className = "mc-howto-lines";
  for (const line of HOW_TO_PLAY) {
    const li = document.createElement("li");
    li.textContent = line;
    howToList.appendChild(li);
  }
  howTo.appendChild(howToList);
  title.appendChild(howTo);

  const levelClear = document.createElement("div");
  levelClear.className = "screen screen-level-clear";
  const levelClearText = document.createElement("div");
  levelClearText.className = "mc-clear-text";
  levelClear.appendChild(levelClearText);

  const gameOver = document.createElement("div");
  gameOver.className = "screen screen-game-over";
  const goHeading = document.createElement("h1");
  goHeading.className = "mc-overline";
  goHeading.textContent = "Game Over";
  gameOver.appendChild(goHeading);
  const gameOverScore = document.createElement("div");
  gameOverScore.className = "mc-stat";
  gameOver.appendChild(gameOverScore);
  const gameOverLevel = document.createElement("div");
  gameOverLevel.className = "mc-stat";
  gameOver.appendChild(gameOverLevel);
  const againBtn = makeButton("Play Again", () => {
    screenRefs.get(container)?.onAction({ type: "restart" });
  });
  gameOver.appendChild(againBtn);
  const menuBtn = makeButton("Menu", () => {
    screenRefs.get(container)?.onAction({ type: "restart" });
  });
  gameOver.appendChild(menuBtn);

  const paused = document.createElement("div");
  paused.className = "screen screen-paused";
  const pausedText = document.createElement("div");
  pausedText.className = "mc-paused-text";
  pausedText.textContent = "Paused";
  paused.appendChild(pausedText);
  const resumeHint = document.createElement("div");
  resumeHint.className = "mc-hint";
  resumeHint.textContent = "Press Esc to resume";
  paused.appendChild(resumeHint);

  container.append(title, levelClear, gameOver, paused);

  const r: ScreenRefs = {
    title,
    levelClear,
    levelClearText,
    gameOver,
    gameOverScore,
    gameOverLevel,
    paused,
    onAction,
  };
  screenRefs.set(container, r);
  return r;
}

export function renderScreens(
  container: HTMLElement,
  state: GameState,
  onAction: (a: Action) => void,
): void {
  let refs = screenRefs.get(container);
  if (!refs) {
    refs = buildScreens(container, onAction);
  } else {
    refs.onAction = onAction;
  }

  const show = (el: HTMLElement, visible: boolean): void => {
    el.classList.toggle("hidden", !visible);
  };

  show(refs.title, state.phase === "title");
  show(refs.paused, state.phase === "paused");
  show(refs.gameOver, state.phase === "game-over");
  show(refs.levelClear, state.phase === "level-clear");

  if (state.phase === "level-clear") {
    const bonus = 25 + 5 * state.level;
    refs.levelClearText.textContent = `Level Clear! +${bonus}`;
  }
  if (state.phase === "game-over") {
    refs.gameOverScore.textContent = `Score: ${state.score}`;
    refs.gameOverLevel.textContent = `Level ${state.level}`;
  }
}
