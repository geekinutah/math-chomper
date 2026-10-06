import type { ScoreEntry } from "@/storage";

const MAX_ROWS = 8;

interface ScoreListRefs {
  empty: HTMLElement;
  rows: HTMLElement[];
  cells: HTMLElement[][];
}

interface InitialsRefs {
  stat: HTMLElement;
}

const scoreListRefs = new WeakMap<HTMLElement, ScoreListRefs>();
const initialsRefs = new WeakMap<HTMLElement, InitialsRefs>();

const ROW_CLASSES = ["mc-score-rank", "mc-score-name", "mc-score-value", "mc-score-mode", "mc-score-band"];

function makeRow(): { row: HTMLElement; cells: HTMLElement[] } {
  const row = document.createElement("div");
  row.className = "mc-score-row hidden";
  const cells = ROW_CLASSES.map((cls) => {
    const span = document.createElement("span");
    span.className = cls;
    row.appendChild(span);
    return span;
  });
  return { row, cells };
}

export function renderScoreList(container: HTMLElement, scores: ScoreEntry[]): void {
  let refs = scoreListRefs.get(container);
  if (refs === undefined) {
    const root = document.createElement("div");
    root.className = "mc-score-list";
    const empty = document.createElement("div");
    empty.className = "mc-scores-empty";
    empty.textContent = "No scores yet.";
    root.appendChild(empty);
    const rows: HTMLElement[] = [];
    const cells: HTMLElement[][] = [];
    for (let i = 0; i < MAX_ROWS; i++) {
      const made = makeRow();
      root.appendChild(made.row);
      rows.push(made.row);
      cells.push(made.cells);
    }
    container.appendChild(root);
    refs = { empty, rows, cells };
    scoreListRefs.set(container, refs);
  }
  refs.empty.classList.toggle("hidden", scores.length > 0);
  for (let i = 0; i < MAX_ROWS; i++) {
    const entry = scores[i];
    if (entry === undefined) {
      refs.rows[i].classList.add("hidden");
      continue;
    }
    refs.rows[i].classList.remove("hidden");
    const [rank, name, value, mode, band] = refs.cells[i];
    rank.textContent = String(i + 1);
    name.textContent = entry.name;
    value.textContent = String(entry.score);
    mode.textContent = entry.mode;
    band.textContent = entry.band;
  }
}

export function renderInitialsEntry(
  container: HTMLElement,
  onConfirm: (name: string) => void,
  score: number,
  level: number,
): void {
  let refs = initialsRefs.get(container);
  if (refs === undefined) {
    const root = document.createElement("div");
    root.className = "mc-initials";
    const heading = document.createElement("div");
    heading.className = "mc-overline";
    heading.textContent = "New High Score!";
    const stat = document.createElement("div");
    stat.className = "mc-stat";
    const input = document.createElement("input");
    input.type = "text";
    input.className = "mc-initials-input";
    input.maxLength = 8;
    input.autocomplete = "off";
    input.placeholder = "YOUR NAME";
    const confirm = document.createElement("button");
    confirm.className = "mc-btn";
    confirm.textContent = "Confirm";
    confirm.addEventListener("click", () => onConfirm(input.value.trim()));
    root.append(heading, stat, input, confirm);
    container.appendChild(root);
    refs = { stat };
    initialsRefs.set(container, refs);
    input.focus();
  }
  refs.stat.textContent = `Score: ${score}  Level: ${level}`;
}
