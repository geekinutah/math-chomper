let context: AudioContext | null = null;
let muted = false;

interface Tone {
  type: OscillatorType;
  frequency: number;
  rampTo?: number;
  duration: number;
  delay: number;
  volume: number;
}

export function initAudio(): void {
  if (context !== null) return;
  if (typeof AudioContext === "undefined") return;
  context = new AudioContext();
}

export function setMuted(value: boolean): void {
  muted = value;
}

export function isMuted(): boolean {
  return muted;
}

export function playEat(): void {
  playTones([{ type: "sine", frequency: 800, duration: 0.05, delay: 0, volume: 0.15 }]);
}

export function playWrong(): void {
  playTones([{ type: "square", frequency: 150, duration: 0.2, delay: 0, volume: 0.08 }]);
}

export function playHit(): void {
  playTones([{ type: "sine", frequency: 600, rampTo: 200, duration: 0.3, delay: 0, volume: 0.2 }]);
}

export function playLevelClear(): void {
  playTones([
    { type: "sine", frequency: 400, duration: 0.1, delay: 0, volume: 0.15 },
    { type: "sine", frequency: 500, duration: 0.1, delay: 0.15, volume: 0.15 },
    { type: "sine", frequency: 600, duration: 0.1, delay: 0.3, volume: 0.15 },
  ]);
}

export function playRefuge(): void {
  playTones([{ type: "sine", frequency: 1200, duration: 0.03, delay: 0, volume: 0.06 }]);
}

function playTones(tones: Tone[]): void {
  if (muted || context === null) return;
  if (context.state === "suspended") {
    context.resume().catch(() => undefined);
  }
  for (const tone of tones) {
    scheduleTone(context, tone);
  }
}

function scheduleTone(ctx: AudioContext, tone: Tone): void {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const start = ctx.currentTime + tone.delay;
  const end = start + tone.duration;

  oscillator.type = tone.type;
  oscillator.frequency.setValueAtTime(tone.frequency, start);
  if (tone.rampTo !== undefined) {
    oscillator.frequency.linearRampToValueAtTime(tone.rampTo, end);
  }

  // Attack and release ramps keep the beep from clicking.
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(tone.volume, start + 0.005);
  gain.gain.linearRampToValueAtTime(0, end);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(end);
}
