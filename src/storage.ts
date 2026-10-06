import type { BandName } from "@/content/bands";
import type { GameMode } from "@/game/state";

export type TouchMode = "always" | "auto";

export type Settings = {
  band: BandName;
  modes: Record<GameMode, boolean>;
  mute: boolean;
  touch: TouchMode;
};

export type ScoreEntry = {
  name: string;
  mode: GameMode;
  band: BandName;
  score: number;
  level: number;
};

const SETTINGS_KEY = "mathchomper.settings.v1";
const SCORES_KEY = "mathchomper.scores.v1";
const MAX_SCORES = 8;
const NAME_MAX = 8;
const GAME_MODES: readonly GameMode[] = ["multiples", "factors", "primes", "equality", "inequality", "challenge"];

// In privacy mode (or Node) the accessor itself can throw.
function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function read(key: string): string | null {
  try {
    return storage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function write(key: string, value: string): boolean {
  try {
    const s = storage();
    if (s === null) return false;
    s.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function isBandName(value: unknown): value is BandName {
  return value === "easy" || value === "standard" || value === "hard";
}

function isGameMode(value: unknown): value is GameMode {
  return (
    value === "multiples" ||
    value === "factors" ||
    value === "primes" ||
    value === "equality" ||
    value === "inequality" ||
    value === "challenge"
  );
}

function isTouchMode(value: unknown): value is TouchMode {
  return value === "always" || value === "auto";
}

function allModesOn(): Record<GameMode, boolean> {
  return { multiples: true, factors: true, primes: true, equality: true, inequality: true, challenge: true };
}

function defaultSettings(): Settings {
  return { band: "standard", modes: allModesOn(), mute: false, touch: "auto" };
}

export const DEFAULT_SETTINGS: Settings = defaultSettings();

export function loadSettings(): Settings {
  const def = defaultSettings();
  const raw = read(SETTINGS_KEY);
  if (raw === null) return def;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return def;
  }
  if (typeof parsed !== "object" || parsed === null) return def;
  const obj = parsed as Record<string, unknown>;
  const modes = { ...def.modes };
  if (typeof obj.modes === "object" && obj.modes !== null) {
    const rawModes = obj.modes as Record<string, unknown>;
    for (const key of GAME_MODES) {
      const value = rawModes[key];
      if (typeof value === "boolean") modes[key] = value;
    }
  }
  return {
    band: isBandName(obj.band) ? obj.band : def.band,
    modes,
    mute: typeof obj.mute === "boolean" ? obj.mute : def.mute,
    touch: isTouchMode(obj.touch) ? obj.touch : def.touch,
  };
}

export function saveSettings(s: Settings): void {
  write(SETTINGS_KEY, JSON.stringify(s));
}

function isScoreEntry(value: unknown): value is ScoreEntry {
  if (typeof value !== "object" || value === null) return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.name === "string" &&
    isGameMode(o.mode) &&
    isBandName(o.band) &&
    typeof o.score === "number" &&
    Number.isFinite(o.score) &&
    typeof o.level === "number" &&
    Number.isFinite(o.level)
  );
}

export function loadScores(): ScoreEntry[] {
  const raw = read(SCORES_KEY);
  if (raw === null) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isScoreEntry).sort((a, b) => b.score - a.score).slice(0, MAX_SCORES);
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9 ]/g, "").slice(0, NAME_MAX);
}

export function saveScore(entry: ScoreEntry): ScoreEntry[] {
  const current = loadScores();
  const clean: ScoreEntry = { ...entry, name: sanitizeName(entry.name) };
  // No negative points in this game, so <= 0 can never rank.
  if (clean.score <= 0) return current;
  if (current.length >= MAX_SCORES && clean.score <= current[current.length - 1].score) return current;
  const next = [...current, clean].sort((a, b) => b.score - a.score).slice(0, MAX_SCORES);
  if (!write(SCORES_KEY, JSON.stringify(next))) return current;
  return next;
}

export function resetScores(): void {
  write(SCORES_KEY, "[]");
}

export function qualifiesForScores(score: number): boolean {
  const list = loadScores();
  if (list.length < MAX_SCORES) return true;
  return score > list[list.length - 1].score;
}
