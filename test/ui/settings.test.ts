// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderSettings, type Settings } from "@/ui/settings";
import { buttonByText, checkboxByLabel } from "./dom";

function settingsRoot(container: HTMLElement): Element {
  const el = container.querySelector(".screen-settings");
  if (!el) throw new Error("missing .screen-settings");
  return el;
}

function testSettings(): Settings {
  return {
    band: "standard",
    modes: { multiples: true, factors: true, primes: true, equality: true, inequality: true, challenge: true },
    mute: false,
    touch: "auto",
  };
}

describe("settings dispatch", () => {
  it("clicking the Hard band dispatches band 'hard'", () => {
    const container = document.createElement("div");
    const onChange = vi.fn();
    renderSettings(container, testSettings(), onChange, vi.fn(), vi.fn());
    buttonByText(settingsRoot(container), "Hard").click();
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ band: "hard" }));
  });

  it("unchecking the Primes checkbox dispatches modes.primes false", () => {
    const container = document.createElement("div");
    const onChange = vi.fn();
    renderSettings(container, testSettings(), onChange, vi.fn(), vi.fn());
    const box = checkboxByLabel(settingsRoot(container), "Primes");
    box.checked = false;
    box.dispatchEvent(new Event("change"));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ modes: expect.objectContaining({ primes: false }) }),
    );
  });

  it("clicking the mute button toggles mute on and relabels On", () => {
    const container = document.createElement("div");
    const onChange = vi.fn();
    renderSettings(container, testSettings(), onChange, vi.fn(), vi.fn());
    const mute = buttonByText(settingsRoot(container), "Off");
    mute.click();
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ mute: true }));
    expect(mute.textContent).toBe("On");
  });

  it("clicking the Auto touch button dispatches touch 'auto'", () => {
    const container = document.createElement("div");
    const onChange = vi.fn();
    renderSettings(container, testSettings(), onChange, vi.fn(), vi.fn());
    buttonByText(settingsRoot(container), "Auto").click();
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ touch: "auto" }));
  });

  it("clicking Reset Scores dispatches onResetScores", () => {
    const container = document.createElement("div");
    const onResetScores = vi.fn();
    renderSettings(container, testSettings(), vi.fn(), onResetScores, vi.fn());
    buttonByText(settingsRoot(container), "Reset Scores").click();
    expect(onResetScores).toHaveBeenCalledTimes(1);
  });

  it("clicking Back dispatches onBack", () => {
    const container = document.createElement("div");
    const onBack = vi.fn();
    renderSettings(container, testSettings(), vi.fn(), vi.fn(), onBack);
    buttonByText(settingsRoot(container), "Back").click();
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
