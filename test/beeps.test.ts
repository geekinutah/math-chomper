import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

interface FakeParam {
  setValueAtTime: ReturnType<typeof vi.fn>;
  linearRampToValueAtTime: ReturnType<typeof vi.fn>;
  exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
}

function fakeParam(): FakeParam {
  return {
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };
}

class FakeOscillatorNode {
  type: OscillatorType = "sine";
  frequency = fakeParam();
  onended: (() => void) | null = null;
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class FakeGainNode {
  gain = fakeParam();
  connect = vi.fn();
}

class FakeAudioContext {
  state: AudioContextState = "running";
  currentTime = 0;
  destination: unknown = {};
  resume = vi.fn((): Promise<void> => Promise.resolve());
  createOscillator = vi.fn((): FakeOscillatorNode => {
    const node = new FakeOscillatorNode();
    createdOscillators.push(node);
    return node;
  });
  createGain = vi.fn((): FakeGainNode => new FakeGainNode());
}

const createdOscillators: FakeOscillatorNode[] = [];

// These run before any stub is installed, so the module is still
// uninitialized: in Node AudioContext is undefined and initAudio no-ops.
describe("beeps uninitialized", () => {
  it("play functions are no-ops when not initialized", () => {
    expect(() => playAll()).not.toThrow();
  });

  it("initAudio does not throw without an AudioContext global", () => {
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
});

describe("beeps with an AudioContext", () => {
  beforeEach(() => {
    vi.stubGlobal("AudioContext", FakeAudioContext);
    createdOscillators.length = 0;
    setMuted(false);
    initAudio();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setMuted(false);
    createdOscillators.length = 0;
  });

  it("creates oscillators when not muted", () => {
    expect(isMuted()).toBe(false);
    playEat();
    expect(createdOscillators).toHaveLength(1);
  });

  it("plays one oscillator per tone in a multi-tone sound", () => {
    playLevelClear();
    expect(createdOscillators).toHaveLength(3);
  });

  it("creates no oscillators when muted", () => {
    setMuted(true);
    expect(isMuted()).toBe(true);
    playAll();
    expect(createdOscillators).toHaveLength(0);
  });
});
