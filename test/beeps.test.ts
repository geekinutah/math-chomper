import { describe, expect, it } from "vitest";
import {
  initAudio,
  isMuted,
  playEat,
  playHit,
  playLevelClear,
  playRefuge,
  playWrong,
  setMuted,
} from "@/audio/beeps";

function playAll(): void {
  playEat();
  playWrong();
  playHit();
  playLevelClear();
  playRefuge();
}

// Runs before any test calls initAudio, so the module is still uninitialized.
describe("beeps", () => {
  it("play functions are no-ops when not initialized", () => {
    expect(() => playAll()).not.toThrow();
  });

  it("initAudio does not throw in Node", () => {
    expect(() => initAudio()).not.toThrow();
  });

  it("initAudio is idempotent", () => {
    expect(() => {
      initAudio();
      initAudio();
    }).not.toThrow();
  });

  it("setMuted/isMuted round-trip", () => {
    setMuted(true);
    expect(isMuted()).toBe(true);
    setMuted(false);
    expect(isMuted()).toBe(false);
  });

  it("play functions are no-ops when muted", () => {
    setMuted(true);
    expect(() => playAll()).not.toThrow();
    setMuted(false);
  });
});
