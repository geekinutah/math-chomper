import type { Action, GameState } from "@/game/state";
import type { BandName } from "@/content/bands";
import { renderModeSelect, type GameMode } from "@/ui/mode-select";
import { renderSettings, DEFAULT_SETTINGS, type Settings } from "@/ui/settings";
import type { ScoreEntry } from "@/storage";
import { renderScoreList, renderInitialsEntry } from "@/ui/scores";

export type SubScreen = "none" | "mode-select" | "settings";

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
  titleScores: HTMLElement;
  levelClear: HTMLElement;
  levelClearText: HTMLElement;
  gameOver: HTMLElement;
  gameOverScore: HTMLElement;
  gameOverLevel: HTMLElement;
  gameOverScores: HTMLElement;
  initialsHost: HTMLElement;
  inGameOver: boolean;
  paused: HTMLElement;
  modeSelectHost: HTMLElement;
  settingsHost: HTMLElement;
  scores: ScoreEntry[];
  onAction: (a: Action) => void;
  onOpenSubScreen?: (s: SubScreen) => void;
  onModeSelect?: (mode: GameMode, band: BandName) => void;
  onSettingsChange?: (s: Settings) => void;
  onResetScores?: () => void;
  onScoreSave?: (name: string) => void;
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
    const r = screenRefs.get(container);
    if (!r) return;
    if (r.onOpenSubScreen) {
      r.onOpenSubScreen("mode-select");
    } else {
      r.onAction({ type: "start", mode: "multiples", band: "standard" });
    }
  });
  title.appendChild(playBtn);
  const settingsBtn = makeButton("Settings", () => {
    screenRefs.get(container)?.onOpenSubScreen?.("settings");
  });
  title.appendChild(settingsBtn);
  const titleScores = document.createElement("div");
  titleScores.className = "mc-score-strip";
  title.appendChild(titleScores);
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
  const gameOverScores = document.createElement("div");
  const initialsHost = document.createElement("div");
  gameOver.append(gameOverScores, initialsHost);
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

  const modeSelectHost = document.createElement("div");
  modeSelectHost.className = "mc-subscreen hidden";
  const settingsHost = document.createElement("div");
  settingsHost.className = "mc-subscreen hidden";

  container.append(title, levelClear, gameOver, paused, modeSelectHost, settingsHost);

  const r: ScreenRefs = {
    title,
    titleScores,
    levelClear,
    levelClearText,
    gameOver,
    gameOverScore,
    gameOverLevel,
    gameOverScores,
    initialsHost,
    inGameOver: false,
    paused,
    modeSelectHost,
    settingsHost,
    scores: [],
    onAction,
  };
  screenRefs.set(container, r);
  return r;
}

export function renderScreens(
  container: HTMLElement,
  state: GameState,
  onAction: (a: Action) => void,
  subScreen?: SubScreen,
  settings?: Settings,
  onOpenSubScreen?: (s: SubScreen) => void,
  onModeSelect?: (mode: GameMode, band: BandName) => void,
  onSettingsChange?: (s: Settings) => void,
  onResetScores?: () => void,
  scores?: ScoreEntry[],
  onScoreSave?: (name: string) => void,
): void {
  let refs = screenRefs.get(container);
  if (!refs) {
    refs = buildScreens(container, onAction);
  }
  refs.onAction = onAction;
  refs.onOpenSubScreen = onOpenSubScreen;
  refs.onModeSelect = onModeSelect;
  refs.onSettingsChange = onSettingsChange;
  refs.onResetScores = onResetScores;
  refs.scores = scores ?? [];
  refs.onScoreSave = onScoreSave;

  const ss = subScreen ?? "none";
  const onTitle = state.phase === "title";

  const show = (el: HTMLElement, visible: boolean): void => {
    el.classList.toggle("hidden", !visible);
  };

  show(refs.title, onTitle && ss === "none");
  show(refs.modeSelectHost, onTitle && ss === "mode-select");
  show(refs.settingsHost, onTitle && ss === "settings");
  show(refs.paused, state.phase === "paused");
  show(refs.gameOver, state.phase === "game-over");
  show(refs.levelClear, state.phase === "level-clear");

  if (onTitle && ss === "mode-select") {
    renderModeSelect(
      refs.modeSelectHost,
      (mode, band) => refs.onModeSelect?.(mode, band),
      () => refs.onOpenSubScreen?.("none"),
    );
  }
  if (onTitle && ss === "settings") {
    renderSettings(
      refs.settingsHost,
      settings ?? DEFAULT_SETTINGS,
      (s) => refs.onSettingsChange?.(s),
      () => refs.onResetScores?.(),
      () => refs.onOpenSubScreen?.("none"),
    );
  }

  if (onTitle && ss === "none") {
    renderScoreList(refs.titleScores, refs.scores.slice(0, 5));
  }
  if (state.phase === "level-clear") {
    const bonus = 25 + 5 * state.level;
    refs.levelClearText.textContent = `Level Clear! +${bonus}`;
  }
  const enteringGameOver = state.phase === "game-over" && !refs.inGameOver;
  refs.inGameOver = state.phase === "game-over";
  if (state.phase === "game-over") {
    refs.gameOverScore.textContent = `Score: ${state.score}`;
    refs.gameOverLevel.textContent = `Level ${state.level}`;
    if (enteringGameOver) {
      const fresh = document.createElement("div");
      refs.initialsHost.replaceWith(fresh);
      refs.initialsHost = fresh;
    }
    const showInitials = refs.onScoreSave !== undefined;
    refs.initialsHost.classList.toggle("hidden", !showInitials);
    renderScoreList(refs.gameOverScores, refs.scores);
    refs.gameOverScores.classList.toggle("hidden", showInitials);
    if (showInitials) {
      renderInitialsEntry(refs.initialsHost, (name) => {
        screenRefs.get(container)?.onScoreSave?.(name);
      }, state.score, state.level);
    }
  } else {
    refs.initialsHost.classList.add("hidden");
    refs.gameOverScores.classList.add("hidden");
  }
}
