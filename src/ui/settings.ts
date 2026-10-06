import type { BandName } from "@/content/bands";
import { GAME_MODES, BAND_CHOICES, type GameMode } from "@/ui/mode-select";

export type TouchMode = "always" | "auto";

export interface Settings {
  band: BandName;
  modes: Record<GameMode, boolean>;
  mute: boolean;
  touch: TouchMode;
}

export const DEFAULT_SETTINGS: Settings = {
  band: "standard",
  modes: {
    multiples: true,
    factors: true,
    primes: true,
    equality: true,
    inequality: true,
    challenge: true,
  },
  mute: false,
  touch: "auto",
};

const TOUCH_MODES: ReadonlyArray<{ id: TouchMode; label: string }> = [
  { id: "always", label: "Always show" },
  { id: "auto", label: "Auto" },
];

interface SettingsRefs {
  bandBtns: Record<BandName, HTMLButtonElement>;
  modeBoxes: Record<GameMode, HTMLInputElement>;
  muteBtn: HTMLButtonElement;
  touchBtns: Record<TouchMode, HTMLButtonElement>;
  last: Settings;
  onChange?: (s: Settings) => void;
  onResetScores?: () => void;
  onBack?: () => void;
}

const settingsRefs = new WeakMap<HTMLElement, SettingsRefs>();

function makeChoiceButton(label: string, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "mc-choice";
  btn.textContent = label;
  btn.addEventListener("click", onClick);
  return btn;
}

function makeSection(label: string): { section: HTMLElement; body: HTMLElement } {
  const section = document.createElement("div");
  section.className = "mc-set-section";
  const labelEl = document.createElement("span");
  labelEl.className = "mc-set-label";
  labelEl.textContent = label;
  const body = document.createElement("div");
  body.className = "mc-set-body";
  section.append(labelEl, body);
  return { section, body };
}

function commit(refs: SettingsRefs, next: Settings): void {
  refs.last = next;
  apply(next, refs);
  refs.onChange?.(next);
}

function apply(s: Settings, r: SettingsRefs): void {
  for (const b of BAND_CHOICES) {
    r.bandBtns[b.id].classList.toggle("selected", s.band === b.id);
  }
  for (const m of GAME_MODES) {
    r.modeBoxes[m.id].checked = s.modes[m.id];
  }
  r.muteBtn.textContent = s.mute ? "On" : "Off";
  r.muteBtn.classList.toggle("selected", s.mute);
  for (const t of TOUCH_MODES) {
    r.touchBtns[t.id].classList.toggle("selected", s.touch === t.id);
  }
}

function buildSettings(container: HTMLElement): SettingsRefs {
  const root = document.createElement("div");
  root.className = "screen screen-settings";

  const heading = document.createElement("h1");
  heading.className = "mc-overline";
  heading.textContent = "Settings";
  root.appendChild(heading);

  const bandBtns = {} as Record<BandName, HTMLButtonElement>;
  const bandSection = makeSection("Band");
  for (const b of BAND_CHOICES) {
    const btn = makeChoiceButton(b.label, () => {
      const r = settingsRefs.get(container);
      if (!r) return;
      commit(r, { ...r.last, band: b.id });
    });
    bandBtns[b.id] = btn;
    bandSection.body.appendChild(btn);
  }
  root.appendChild(bandSection.section);

  const modeBoxes = {} as Record<GameMode, HTMLInputElement>;
  const modesSection = makeSection("Modes");
  const modesGrid = document.createElement("div");
  modesGrid.className = "mc-set-modes";
  for (const m of GAME_MODES) {
    const label = document.createElement("label");
    const box = document.createElement("input");
    box.type = "checkbox";
    box.addEventListener("change", () => {
      const r = settingsRefs.get(container);
      if (!r) return;
      const modes = { ...r.last.modes };
      modes[m.id] = box.checked;
      commit(r, { ...r.last, modes });
    });
    const text = document.createElement("span");
    text.textContent = m.label;
    label.append(box, text);
    modesGrid.appendChild(label);
    modeBoxes[m.id] = box;
  }
  modesSection.body.appendChild(modesGrid);
  root.appendChild(modesSection.section);

  const soundSection = makeSection("Mute");
  const muteBtn = makeChoiceButton("Off", () => {
    const r = settingsRefs.get(container);
    if (!r) return;
    commit(r, { ...r.last, mute: !r.last.mute });
  });
  soundSection.body.appendChild(muteBtn);
  root.appendChild(soundSection.section);

  const touchBtns = {} as Record<TouchMode, HTMLButtonElement>;
  const touchSection = makeSection("Touch");
  for (const t of TOUCH_MODES) {
    const btn = makeChoiceButton(t.label, () => {
      const r = settingsRefs.get(container);
      if (!r) return;
      commit(r, { ...r.last, touch: t.id });
    });
    touchBtns[t.id] = btn;
    touchSection.body.appendChild(btn);
  }
  root.appendChild(touchSection.section);

  const actions = document.createElement("div");
  actions.className = "mc-actions";
  const reset = document.createElement("button");
  reset.className = "mc-btn";
  reset.textContent = "Reset Scores";
  reset.addEventListener("click", () => {
    settingsRefs.get(container)?.onResetScores?.();
  });
  actions.appendChild(reset);
  const back = document.createElement("button");
  back.className = "mc-btn";
  back.textContent = "Back";
  back.addEventListener("click", () => {
    settingsRefs.get(container)?.onBack?.();
  });
  actions.appendChild(back);
  root.appendChild(actions);

  container.appendChild(root);

  const refs: SettingsRefs = {
    bandBtns,
    modeBoxes,
    muteBtn,
    touchBtns,
    last: DEFAULT_SETTINGS,
  };
  settingsRefs.set(container, refs);
  return refs;
}

export function renderSettings(
  container: HTMLElement,
  settings: Settings,
  onChange: (s: Settings) => void,
  onResetScores: () => void,
  onBack: () => void,
): void {
  let refs = settingsRefs.get(container);
  if (!refs) {
    refs = buildSettings(container);
  }
  refs.onChange = onChange;
  refs.onResetScores = onResetScores;
  refs.onBack = onBack;
  refs.last = settings;
  apply(settings, refs);
}
