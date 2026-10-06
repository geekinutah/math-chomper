import type { Mode } from "@/rules/types";
import type { BandName } from "@/content/bands";

export type GameMode = Mode | "challenge";

export interface ModeChoice {
  id: GameMode;
  label: string;
}

export interface BandChoice {
  id: BandName;
  label: string;
}

export const GAME_MODES: readonly ModeChoice[] = [
  { id: "multiples", label: "Multiples" },
  { id: "factors", label: "Factors" },
  { id: "primes", label: "Primes" },
  { id: "equality", label: "Equality" },
  { id: "inequality", label: "Inequality" },
  { id: "challenge", label: "Challenge" },
];

export const BAND_CHOICES: readonly BandChoice[] = [
  { id: "easy", label: "Easy" },
  { id: "standard", label: "Standard" },
  { id: "hard", label: "Hard" },
];

interface ModeSelectRefs {
  modeBtns: Record<GameMode, HTMLButtonElement>;
  bandBtns: Record<BandName, HTMLButtonElement>;
  mode: GameMode;
  band: BandName;
  onModeSelect?: (mode: GameMode, band: BandName) => void;
  onBack?: () => void;
}

const modeSelectRefs = new WeakMap<HTMLElement, ModeSelectRefs>();

function makeChoiceButton(label: string, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "mc-choice";
  btn.textContent = label;
  btn.addEventListener("click", onClick);
  return btn;
}

function applyHighlights(r: ModeSelectRefs): void {
  for (const m of GAME_MODES) {
    r.modeBtns[m.id].classList.toggle("selected", r.mode === m.id);
  }
  for (const b of BAND_CHOICES) {
    r.bandBtns[b.id].classList.toggle("selected", r.band === b.id);
  }
}

function buildModeSelect(container: HTMLElement): ModeSelectRefs {
  const root = document.createElement("div");
  root.className = "screen screen-mode-select";

  const heading = document.createElement("h1");
  heading.className = "mc-overline";
  heading.textContent = "Choose a Mode";
  root.appendChild(heading);

  const modeBtns = {} as Record<GameMode, HTMLButtonElement>;
  const grid = document.createElement("div");
  grid.className = "mc-mode-grid";
  for (const m of GAME_MODES) {
    const btn = makeChoiceButton(m.label, () => {
      const r = modeSelectRefs.get(container);
      if (!r) return;
      r.mode = m.id;
      applyHighlights(r);
    });
    modeBtns[m.id] = btn;
    grid.appendChild(btn);
  }
  root.appendChild(grid);

  const bandBtns = {} as Record<BandName, HTMLButtonElement>;
  const bandRow = document.createElement("div");
  bandRow.className = "mc-band-row";
  for (const b of BAND_CHOICES) {
    const btn = makeChoiceButton(b.label, () => {
      const r = modeSelectRefs.get(container);
      if (!r) return;
      r.band = b.id;
      applyHighlights(r);
    });
    bandBtns[b.id] = btn;
    bandRow.appendChild(btn);
  }
  root.appendChild(bandRow);

  const actions = document.createElement("div");
  actions.className = "mc-actions";
  const play = document.createElement("button");
  play.className = "mc-btn";
  play.textContent = "Play";
  play.addEventListener("click", () => {
    const r = modeSelectRefs.get(container);
    if (r) r.onModeSelect?.(r.mode, r.band);
  });
  actions.appendChild(play);
  const back = document.createElement("button");
  back.className = "mc-btn";
  back.textContent = "Back";
  back.addEventListener("click", () => {
    modeSelectRefs.get(container)?.onBack?.();
  });
  actions.appendChild(back);
  root.appendChild(actions);

  container.appendChild(root);

  const refs: ModeSelectRefs = {
    modeBtns,
    bandBtns,
    mode: "multiples",
    band: "standard",
  };
  modeSelectRefs.set(container, refs);
  applyHighlights(refs);
  return refs;
}

export function renderModeSelect(
  container: HTMLElement,
  onModeSelect: (mode: GameMode, band: BandName) => void,
  onBack: () => void,
): void {
  let refs = modeSelectRefs.get(container);
  if (!refs) {
    refs = buildModeSelect(container);
  }
  refs.onModeSelect = onModeSelect;
  refs.onBack = onBack;
  applyHighlights(refs);
}
