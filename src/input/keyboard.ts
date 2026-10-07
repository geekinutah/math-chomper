import type { Action, Dir, Phase } from "@/game/state";

const MOVE_KEYS: Record<string, Dir> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
  W: "up",
  S: "down",
  A: "left",
  D: "right",
};

export function attachKeyboard(
  dispatch: (action: Action) => void,
  isPlaying: () => Phase
): () => void {
  function handler(e: KeyboardEvent): void {
    const phase = isPlaying();

    const dir = MOVE_KEYS[e.key];
    if (dir !== undefined) {
      e.preventDefault();
      if (phase === "playing") dispatch({ type: "move", dir });
      return;
    }

    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (phase === "playing") dispatch({ type: "eat" });
      return;
    }

    if (e.key === "Escape") {
      if (e.repeat) return;
      e.preventDefault();
      if (phase === "playing") {
        dispatch({ type: "pause" });
      } else if (phase === "paused") {
        dispatch({ type: "resume" });
      }
      return;
    }

    if (e.key === "r" || e.key === "R") {
      if (e.repeat) return;
      if (phase === "game-over") {
        e.preventDefault();
        dispatch({ type: "restart" });
      }
    }
  }

  window.addEventListener("keydown", handler);

  return () => {
    window.removeEventListener("keydown", handler);
  };
}
