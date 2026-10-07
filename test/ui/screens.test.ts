// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderScreens } from "@/ui/screens";
import { makeState } from "../test-helpers";
import { buttonByText } from "./dom";

function titleScreen(container: HTMLElement): Element {
  const el = container.querySelector(".screen-title");
  if (!el) throw new Error("missing .screen-title");
  return el;
}

function overScreen(container: HTMLElement): Element {
  const el = container.querySelector(".screen-game-over");
  if (!el) throw new Error("missing .screen-game-over");
  return el;
}

describe("screens dispatch", () => {
  it("game-over Menu dispatches { type: 'title' }", () => {
    const container = document.createElement("div");
    const onAction = vi.fn();
    renderScreens(container, makeState({ phase: "game-over" }), onAction);
    buttonByText(overScreen(container), "Menu").click();
    expect(onAction).toHaveBeenCalledWith({ type: "title" });
  });

  it("game-over Play Again dispatches { type: 'restart' }", () => {
    const container = document.createElement("div");
    const onAction = vi.fn();
    renderScreens(container, makeState({ phase: "game-over" }), onAction);
    buttonByText(overScreen(container), "Play Again").click();
    expect(onAction).toHaveBeenCalledWith({ type: "restart" });
  });

  it("title Play with a sub-screen handler opens mode-select and skips onAction", () => {
    const container = document.createElement("div");
    const onAction = vi.fn();
    const onOpenSubScreen = vi.fn();
    renderScreens(container, makeState({ phase: "title" }), onAction, "none", undefined, onOpenSubScreen);
    buttonByText(titleScreen(container), "Play").click();
    expect(onOpenSubScreen).toHaveBeenCalledWith("mode-select");
    expect(onAction).not.toHaveBeenCalled();
  });

  it("title Play without a sub-screen handler starts the default game", () => {
    const container = document.createElement("div");
    const onAction = vi.fn();
    renderScreens(container, makeState({ phase: "title" }), onAction);
    buttonByText(titleScreen(container), "Play").click();
    expect(onAction).toHaveBeenCalledWith({ type: "start", mode: "multiples", band: "standard" });
  });

  it("title Settings with a sub-screen handler opens settings and skips onAction", () => {
    const container = document.createElement("div");
    const onAction = vi.fn();
    const onOpenSubScreen = vi.fn();
    renderScreens(container, makeState({ phase: "title" }), onAction, "none", undefined, onOpenSubScreen);
    buttonByText(titleScreen(container), "Settings").click();
    expect(onOpenSubScreen).toHaveBeenCalledWith("settings");
    expect(onAction).not.toHaveBeenCalled();
  });

  it("title phase shows .screen-title and hides .screen-game-over", () => {
    const container = document.createElement("div");
    renderScreens(container, makeState({ phase: "title" }), vi.fn());
    expect(titleScreen(container).classList.contains("hidden")).toBe(false);
    expect(overScreen(container).classList.contains("hidden")).toBe(true);
  });

  it("game-over phase hides .screen-title and shows .screen-game-over", () => {
    const container = document.createElement("div");
    renderScreens(container, makeState({ phase: "game-over" }), vi.fn());
    expect(titleScreen(container).classList.contains("hidden")).toBe(true);
    expect(overScreen(container).classList.contains("hidden")).toBe(false);
  });
});
