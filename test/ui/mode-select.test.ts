// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderModeSelect } from "@/ui/mode-select";
import { buttonByText } from "./dom";

describe("mode-select dispatch", () => {
  it("selecting Factors + Hard then Play dispatches that choice", () => {
    const host = document.createElement("div");
    const onModeSelect = vi.fn();
    const onBack = vi.fn();
    renderModeSelect(host, onModeSelect, onBack);
    buttonByText(host, "Factors").click();
    buttonByText(host, "Hard").click();
    buttonByText(host, "Play").click();
    expect(onModeSelect).toHaveBeenCalledWith("factors", "hard");
    expect(onBack).not.toHaveBeenCalled();
  });

  it("Play with no prior selection dispatches the defaults", () => {
    const host = document.createElement("div");
    const onModeSelect = vi.fn();
    const onBack = vi.fn();
    renderModeSelect(host, onModeSelect, onBack);
    buttonByText(host, "Play").click();
    expect(onModeSelect).toHaveBeenCalledWith("multiples", "standard");
  });

  it("Back dispatches onBack and does not select a mode", () => {
    const host = document.createElement("div");
    const onModeSelect = vi.fn();
    const onBack = vi.fn();
    renderModeSelect(host, onModeSelect, onBack);
    buttonByText(host, "Back").click();
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onModeSelect).not.toHaveBeenCalled();
  });
});
