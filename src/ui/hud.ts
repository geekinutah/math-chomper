import type { GameState } from "@/game/state";
import type { Rule } from "@/rules/types";

interface HudRefs {
  level: HTMLElement;
  rule: HTMLElement;
  score: HTMLElement;
  lives: HTMLElement;
}

const hudRefs = new WeakMap<HTMLElement, HudRefs>();

function ruleText(rule: Rule): string {
  switch (rule.mode) {
    case "multiples":
      return `Multiples of ${rule.k}`;
    case "factors":
      return `Factors of ${rule.k}`;
    case "primes":
      return "Prime numbers";
    case "equality":
      return `Equals ${rule.k}`;
    case "inequality":
      return `Not equal to ${rule.k}`;
  }
}

function updateLives(el: HTMLElement, lives: number, reserve: number): void {
  const total = lives + reserve;
  while (el.children.length < total) {
    const dot = document.createElement("span");
    dot.className = "life";
    el.appendChild(dot);
  }
  while (el.children.length > total) {
    el.lastChild?.remove();
  }
  for (let i = 0; i < el.children.length; i++) {
    (el.children[i] as HTMLElement).className = i < lives ? "life filled" : "life outline";
  }
}

function buildHud(container: HTMLElement): HudRefs {
  const level = document.createElement("div");
  level.className = "hud-level";
  const rule = document.createElement("div");
  rule.className = "hud-rule";
  const score = document.createElement("div");
  score.className = "hud-score";
  const lives = document.createElement("div");
  lives.className = "hud-lives";
  container.append(level, rule, score, lives);
  return { level, rule, score, lives };
}

export function renderHud(container: HTMLElement, state: GameState): void {
  let refs = hudRefs.get(container);
  if (!refs) {
    refs = buildHud(container);
    hudRefs.set(container, refs);
  }
  refs.level.textContent = `Level ${state.level}`;
  refs.rule.textContent = ruleText(state.rule);
  refs.score.textContent = `Score: ${state.score}`;
  updateLives(refs.lives, state.lives, state.reserveLives);
}
