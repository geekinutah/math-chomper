import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  loadScores,
  loadSettings,
  qualifiesForScores,
  resetScores,
  saveScore,
  saveSettings,
  type ScoreEntry,
  type Settings,
} from "@/storage";

const store: Record<string, string> = {};

const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => {
    store[k] = v;
  },
  removeItem: (k: string) => {
    delete store[k];
  },
};

// configurable so each test can swap the property again.
function installStorage(): void {
  Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, configurable: true });
}

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  installStorage();
});

function entry(score: number, name = "TEST"): ScoreEntry {
  return { name, mode: "multiples", band: "standard", score, level: 1 };
}

describe("settings", () => {
  it("loadSettings returns defaults when empty", () => {
    expect(DEFAULT_SETTINGS).toEqual({
      band: "standard",
      modes: { multiples: true, factors: true, primes: true, equality: true, inequality: true, challenge: true },
      mute: false,
      touch: "auto",
    });
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("save/load settings round-trip", () => {
    const s: Settings = {
      band: "hard",
      modes: { ...DEFAULT_SETTINGS.modes, factors: false },
      mute: true,
      touch: "always",
    };
    saveSettings(s);
    expect(loadSettings()).toEqual(s);
  });

  it("loadSettings merges missing fields", () => {
    store["mathchomper.settings.v1"] = JSON.stringify({
      band: "easy",
      modes: { multiples: true, factors: true, primes: true, equality: true, inequality: true, challenge: true },
      mute: true,
    });
    const s = loadSettings();
    expect(s.touch).toBe("auto");
    expect(s.band).toBe("easy");
    expect(s.mute).toBe(true);
  });
});

describe("scores", () => {
  it("loadScores returns empty when none", () => {
    expect(loadScores()).toEqual([]);
  });

  it("saveScore adds and sorts", () => {
    const first = saveScore(entry(100));
    expect(first).toHaveLength(1);
    const second = saveScore(entry(300));
    expect(second).toHaveLength(2);
    expect(second[0].score).toBe(300);
    expect(second[1].score).toBe(100);
    expect(loadScores()).toEqual(second);
  });

  it("saveScore caps at 8", () => {
    for (const s of [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]) saveScore(entry(s));
    const list = loadScores();
    expect(list.map((e) => e.score)).toEqual([100, 90, 80, 70, 60, 50, 40, 30]);
  });

  it("saveScore rejects zero score", () => {
    expect(saveScore(entry(0))).toEqual([]);
    expect(loadScores()).toEqual([]);
  });

  it("saveScore sanitizes name", () => {
    // Contract T-023 claims "abc<script>" -> "abc", but its own rule
    // (keep alphanumeric + space, max 8) yields "abcscrip".
    const list = saveScore(entry(50, "abc<script>"));
    expect(list[0].name).toBe("abcscrip");
  });

  it("saveScore truncates name to 8", () => {
    const list = saveScore(entry(50, "abcdefghijkl"));
    expect(list[0].name).toBe("abcdefgh");
  });

  it("qualifiesForScores: under 8 → true", () => {
    saveScore(entry(30));
    saveScore(entry(20));
    saveScore(entry(10));
    expect(qualifiesForScores(1)).toBe(true);
  });

  it("qualifiesForScores: full and lower → false", () => {
    for (const s of [100, 90, 80, 70, 60, 50, 40, 30]) saveScore(entry(s));
    expect(qualifiesForScores(29)).toBe(false);
    expect(qualifiesForScores(30)).toBe(false);
  });

  it("qualifiesForScores: full but higher → true", () => {
    for (const s of [100, 90, 80, 70, 60, 50, 40, 30]) saveScore(entry(s));
    expect(qualifiesForScores(31)).toBe(true);
  });

  it("resetScores clears", () => {
    saveScore(entry(100));
    saveScore(entry(200));
    resetScores();
    expect(loadScores()).toEqual([]);
  });

  it("localStorage unavailable: no throw", () => {
    Object.defineProperty(globalThis, "localStorage", { value: undefined, configurable: true });
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
    expect(loadScores()).toEqual([]);
    expect(saveScore(entry(100))).toEqual([]);
    expect(qualifiesForScores(100)).toBe(true);
    expect(() => saveSettings(DEFAULT_SETTINGS)).not.toThrow();
    expect(() => resetScores()).not.toThrow();
  });
});
