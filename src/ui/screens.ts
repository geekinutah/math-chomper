import type { Action, GameState } from "@/game/state";
import type { BandName } from "@/content/bands";
import type { ScoreEntry } from "@/storage";
import { renderModeSelect, type GameMode } from "@/ui/mode-select";
import { renderSettings, DEFAULT_SETTINGS, type Settings } from "@/ui/settings";
import { renderInitialsEntry, renderScoreList, MAX_SCORES } from "@/ui/scores";

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
  title: HTMLElement; titleScores: HTMLElement;
  levelClear: HTMLElement;
  levelClearText: HTMLElement;
  gameOver: HTMLElement;
  gameOverScore: HTMLElement;
  gameOverLevel: HTMLElement;
  gameOverInitials: HTMLElement; gameOverScores: HTMLElement;
  paused: HTMLElement;
  modeSelectHost: HTMLElement;
  settingsHost: HTMLElement;
  scoreEntered: boolean; initialsShown: boolean;
  displayScores: ScoreEntry[] | null;
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
  titleScores.className = "mc-title-scores hidden";
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
  const gameOverInitials = document.createElement("div");
  gameOverInitials.className = "mc-over-initials hidden";
  gameOver.appendChild(gameOverInitials);
  const gameOverScores = document.createElement("div");
  gameOverScores.className = "mc-over-scores hidden";
  gameOver.appendChild(gameOverScores);
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
    title, titleScores,
    levelClear, levelClearText,
    gameOver, gameOverScore, gameOverLevel,
    gameOverInitials, gameOverScores,
    paused,
    modeSelectHost,
    settingsHost,
    scoreEntered: false, initialsShown: false,
    displayScores: null,
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
  refs.onScoreSave = onScoreSave;

  const ss = subScreen ?? "none";
  const onTitle = state.phase === "title";

  const show = (el: HTMLElement, visible: boolean): void => {
    el.classList.toggle("hidden", !visible);
  };

  if (state.phase !== "game-over") {
    refs.scoreEntered = false; refs.initialsShown = false; refs.displayScores = null;
    show(refs.gameOverInitials, false); show(refs.gameOverScores, false);
  }

  show(refs.title, onTitle && ss === "none");
  show(refs.modeSelectHost, onTitle && ss === "mode-select");
  show(refs.settingsHost, onTitle && ss === "settings");
  show(refs.paused, state.phase === "paused");
  show(refs.gameOver, state.phase === "game-over");
  show(refs.levelClear, state.phase === "level-clear");

  if (onTitle && ss === "none") {
    renderScoreList(refs.titleScores, (scores ?? []).slice(0, 5)); show(refs.titleScores, true);
  }

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

  if (state.phase === "level-clear") {
    const bonus = 25 + 5 * state.level;
    refs.levelClearText.textContent = `Level Clear! +${bonus}`;
  }
  if (state.phase === "game-over") {
    refs.gameOverScore.textContent = `Score: ${state.score}`;
    refs.gameOverLevel.textContent = `Level ${state.level}`;
    const list = scores ?? [];
    const qualifies = state.score > 0 && (list.length < MAX_SCORES || state.score > list[list.length - 1].score);
    if (qualifies && !refs.scoreEntered) {
      if (!refs.initialsShown) {
        refs.initialsShown = true;
        renderInitialsEntry(refs.gameOverInitials, (name) => {
          refs.onScoreSave?.(name);
          const entry: ScoreEntry = { name, mode: state.mode, band: state.band, score: state.score, level: state.level };
          refs.displayScores = [...list, entry].sort((a, b) => b.score - a.score).slice(0, MAX_SCORES);
          refs.scoreEntered = true;
          show(refs.gameOverInitials, false); renderScoreList(refs.gameOverScores, refs.displayScores);
        }, state.score, state.level);
        show(refs.gameOverInitials, true); show(refs.gameOverScores, false);
      }
    } else if (refs.scoreEntered) {
      renderScoreList(refs.gameOverScores, refs.displayScores ?? list);
      show(refs.gameOverScores, true);
    }
  }
}
