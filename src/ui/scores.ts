import type { ScoreEntry } from "@/storage";
import type { GameMode } from "@/game/state";
import type { BandName } from "@/content/bands";

export const MAX_SCORES = 8;
export const MAX_NAME = 8;

const MODE_SHORT: Record<GameMode, string> = {
  multiples: "Mult",
  factors: "Fact",
  primes: "Prime",
  equality: "Eq",
  inequality: "Neq",
  challenge: "Chal",
};

const BAND_SHORT: Record<BandName, string> = {
  easy: "E",
  standard: "S",
  hard: "H",
};

interface ScoreRow {
  el: HTMLElement;
  rank: HTMLElement;
  name: HTMLElement;
  score: HTMLElement;
  mode: HTMLElement;
  band: HTMLElement;
}

interface ScoreListRefs {
  empty: HTMLElement;
  rows: ScoreRow[];
}

const scoreListRefs = new WeakMap<HTMLElement, ScoreListRefs>();

function makeRow(): ScoreRow {
  const el = document.createElement("div");
  el.className = "mc-score-row";
  const rank = document.createElement("span");
  rank.className = "mc-score-rank";
  const name = document.createElement("span");
  name.className = "mc-score-name";
  const score = document.createElement("span");
  score.className = "mc-score-score";
  const mode = document.createElement("span");
  mode.className = "mc-score-mode";
  const band = document.createElement("span");
  band.className = "mc-score-band";
  el.append(rank, name, score, mode, band);
  return { el, rank, name, score, mode, band };
}

function buildScoreList(container: HTMLElement): ScoreListRefs {
  const list = document.createElement("div");
  list.className = "mc-score-list";
  const rows: ScoreRow[] = [];
  for (let i = 0; i < MAX_SCORES; i++) {
    const row = makeRow();
    row.el.classList.add("hidden");
    rows.push(row);
    list.appendChild(row.el);
  }
  const empty = document.createElement("div");
  empty.className = "mc-score-empty";
  empty.textContent = "No scores yet.";
  empty.classList.add("hidden");
  container.append(list, empty);
  const refs = { empty, rows };
  scoreListRefs.set(container, refs);
  return refs;
}

export function renderScoreList(container: HTMLElement, scores: ScoreEntry[]): void {
  let refs = scoreListRefs.get(container);
  if (!refs) {
    refs = buildScoreList(container);
  }
  for (let i = 0; i < refs.rows.length; i++) {
    const row = refs.rows[i];
    const entry = scores[i];
    if (entry === undefined) {
      row.el.classList.add("hidden");
      continue;
    }
    row.el.classList.remove("hidden");
    row.rank.textContent = String(i + 1);
    row.name.textContent = entry.name;
    row.score.textContent = String(entry.score);
    row.mode.textContent = MODE_SHORT[entry.mode];
    row.band.textContent = BAND_SHORT[entry.band];
  }
  refs.empty.classList.toggle("hidden", scores.length > 0);
}

interface InitialsRefs {
  scoreText: HTMLElement;
  levelText: HTMLElement;
  input: HTMLInputElement;
  onConfirm?: (name: string) => void;
}

const initialsRefs = new WeakMap<HTMLElement, InitialsRefs>();

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9 ]/g, "").toUpperCase().slice(0, MAX_NAME).trim();
}

function buildInitials(container: HTMLElement): InitialsRefs {
  const root = document.createElement("div");
  root.className = "mc-initials";
  const heading = document.createElement("h1");
  heading.className = "mc-overline";
  heading.textContent = "New High Score!";
  const scoreText = document.createElement("div");
  scoreText.className = "mc-stat";
  const levelText = document.createElement("div");
  levelText.className = "mc-stat";
  const input = document.createElement("input");
  input.type = "text";
  input.maxLength = MAX_NAME;
  input.autocomplete = "off";
  input.placeholder = "YOUR NAME";
  input.className = "mc-initials-input";
  const confirm = document.createElement("button");
  confirm.className = "mc-btn";
  confirm.textContent = "Confirm";
  root.append(heading, scoreText, levelText, input, confirm);
  container.appendChild(root);
  const refs: InitialsRefs = { scoreText, levelText, input };
  const doConfirm = (): void => {
    refs.onConfirm?.(sanitizeName(refs.input.value));
  };
  confirm.addEventListener("click", doConfirm);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doConfirm();
  });
  initialsRefs.set(container, refs);
  return refs;
}

export function renderInitialsEntry(
  container: HTMLElement,
  onConfirm: (name: string) => void,
  score: number,
  level: number,
): void {
  let refs = initialsRefs.get(container);
  if (!refs) {
    refs = buildInitials(container);
  }
  refs.onConfirm = onConfirm;
  refs.scoreText.textContent = `Score: ${score}`;
  refs.levelText.textContent = `Level ${level}`;
  refs.input.value = "";
  refs.input.focus();
}
