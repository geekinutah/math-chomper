import type { Action, Dir } from "@/game/state";
import "./touch.css";

// T-023 will own this type in src/storage.ts once that worktree merges;
// defined locally so this module typechecks before the merge.
export type TouchMode = "always" | "auto";

const SWIPE_MIN_PX = 30;
const TAP_MAX_PX = 10;
const AUTO_VIEWPORT_PX = 800;

const PAD_DIRS: readonly Dir[] = ["up", "left", "down", "right"];

const PAD_GLYPHS: Record<Dir, string> = {
  up: "▲",
  down: "▼",
  left: "◀",
  right: "▶",
};

function hasTouch(): boolean {
  return typeof window !== "undefined" && "ontouchstart" in window;
}

type Point = { x: number; y: number };

export function attachTouch(
  dispatch: (action: Action) => void,
  getPhase: () => string,
  mode: TouchMode,
  boardEl: HTMLElement
): () => void {
  const root = document.createElement("div");
  root.className = "mc-touch";

  const applyVisibility = (): void => {
    const visible = mode === "always" || window.innerWidth < AUTO_VIEWPORT_PX;
    root.classList.toggle("touch-visible", visible);
  };
  applyVisibility();
  window.addEventListener("resize", applyVisibility);

  const dpad = document.createElement("div");
  dpad.className = "mc-dpad";
  const padDetaches: Array<() => void> = [];
  for (const dir of PAD_DIRS) {
    const btn = document.createElement("div");
    btn.className = `mc-dpad-btn mc-dpad-${dir}`;
    btn.setAttribute("role", "button");
    btn.setAttribute("aria-label", `Move ${dir}`);
    btn.textContent = PAD_GLYPHS[dir];
    const handler = (e: TouchEvent): void => {
      if (!hasTouch()) return;
      if (e.cancelable) e.preventDefault();
      if (e.touches.length !== 1) return;
      if (getPhase() !== "playing") return;
      dispatch({ type: "move", dir });
    };
    btn.addEventListener("touchstart", handler, { passive: false });
    padDetaches.push(() => btn.removeEventListener("touchstart", handler));
    dpad.appendChild(btn);
  }
  root.appendChild(dpad);

  const eatBtn = document.createElement("div");
  eatBtn.className = "mc-eat-btn";
  eatBtn.setAttribute("role", "button");
  eatBtn.setAttribute("aria-label", "Eat");
  eatBtn.textContent = "EAT";
  const eatHandler = (e: TouchEvent): void => {
    if (!hasTouch()) return;
    if (e.cancelable) e.preventDefault();
    if (e.touches.length !== 1) return;
    if (getPhase() !== "playing") return;
    dispatch({ type: "eat" });
  };
  eatBtn.addEventListener("touchstart", eatHandler, { passive: false });
  root.appendChild(eatBtn);
  document.body.appendChild(root);

  let swipeStart: Point | null = null;

  const onBoardStart = (e: TouchEvent): void => {
    if (!hasTouch()) return;
    if (e.cancelable) e.preventDefault();
    if (e.touches.length !== 1) {
      swipeStart = null;
      return;
    }
    swipeStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const onBoardEnd = (e: TouchEvent): void => {
    if (!hasTouch()) return;
    if (e.cancelable) e.preventDefault();
    const start = swipeStart;
    swipeStart = null;
    if (start === null || e.changedTouches.length === 0) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (getPhase() !== "playing") return;
    const dist = Math.hypot(dx, dy);
    if (dist > SWIPE_MIN_PX) {
      const dir: Dir =
        Math.abs(dx) >= Math.abs(dy)
          ? dx > 0
            ? "right"
            : "left"
          : dy > 0
            ? "down"
            : "up";
      dispatch({ type: "move", dir });
    } else if (dist < TAP_MAX_PX) {
      dispatch({ type: "eat" });
    }
  };

  boardEl.addEventListener("touchstart", onBoardStart, { passive: false });
  boardEl.addEventListener("touchend", onBoardEnd, { passive: false });

  return () => {
    window.removeEventListener("resize", applyVisibility);
    boardEl.removeEventListener("touchstart", onBoardStart);
    boardEl.removeEventListener("touchend", onBoardEnd);
    for (const detachPad of padDetaches) detachPad();
    eatBtn.removeEventListener("touchstart", eatHandler);
    root.remove();
  };
}
