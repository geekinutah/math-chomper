import type { Action, GameState } from "@/game/state";

const TICK_MS = 1000 / 60;
const MAX_ACCUM_MS = 250;

export function createLoop(
  dispatch: (action: Action) => void,
  onFrame: (state: GameState) => void,
  getState: () => GameState,
): () => void {
  let rafId = 0;
  let stopped = false;
  let lastTime = -1;
  let accumulator = 0;

  function frame(time: number): void {
    if (stopped) return;

    if (lastTime < 0) {
      lastTime = time;
    }

    let delta = time - lastTime;
    lastTime = time;

    if (delta > MAX_ACCUM_MS) {
      delta = MAX_ACCUM_MS;
    }

    accumulator += delta;

    while (accumulator >= TICK_MS) {
      dispatch({ type: "tick", dt: TICK_MS / 1000 });
      accumulator -= TICK_MS;
    }

    onFrame(getState());

    rafId = requestAnimationFrame(frame);
  }

  rafId = requestAnimationFrame(frame);

  return function stop(): void {
    stopped = true;
    cancelAnimationFrame(rafId);
    lastTime = -1;
    accumulator = 0;
  };
}
