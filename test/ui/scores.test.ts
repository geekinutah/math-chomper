// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderInitialsEntry, renderScoreList } from "@/ui/scores";
import type { ScoreEntry } from "@/storage";
import { buttonByText, inputByClass } from "./dom";

function scoreEmpty(container: HTMLElement): Element {
  const el = container.querySelector(".mc-score-empty");
  if (!el) throw new Error("missing .mc-score-empty");
  return el;
}

function childText(parent: Element, selector: string): string {
  const el = parent.querySelector(selector);
  if (!el) throw new Error(`missing ${selector}`);
  return el.textContent ?? "";
}

function firstRow(container: HTMLElement): Element {
  const rows = [...container.querySelectorAll(".mc-score-row")];
  const row = rows[0];
  if (!row) throw new Error("missing first .mc-score-row");
  return row;
}

describe("initials entry dispatch", () => {
  it("Confirm button sanitizes and uppercases the name", () => {
    const container = document.createElement("div");
    const onConfirm = vi.fn();
    renderInitialsEntry(container, onConfirm, 1234, 5);
    const input = inputByClass(container, "mc-initials-input");
    input.value = "mike!!";
    buttonByText(container, "Confirm").click();
    expect(onConfirm).toHaveBeenCalledWith("MIKE");
  });

  it("Enter key confirms, strips tags, uppercases and caps at 8", () => {
    const container = document.createElement("div");
    const onConfirm = vi.fn();
    renderInitialsEntry(container, onConfirm, 1234, 5);
    const input = inputByClass(container, "mc-initials-input");
    input.value = "ab<script>cd";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(onConfirm).toHaveBeenCalledWith("ABSCRIPT");
  });

  it("name is capped at exactly 8 characters", () => {
    const container = document.createElement("div");
    const onConfirm = vi.fn();
    renderInitialsEntry(container, onConfirm, 1234, 5);
    const input = inputByClass(container, "mc-initials-input");
    input.value = "aaaaaaaaaaaa";
    buttonByText(container, "Confirm").click();
    expect(onConfirm).toHaveBeenCalledWith("AAAAAAAA");
  });
});

describe("score list", () => {
  it("with no entries shows the empty note and hides every row", () => {
    const container = document.createElement("div");
    renderScoreList(container, []);
    expect(scoreEmpty(container).classList.contains("hidden")).toBe(false);
    for (const row of container.querySelectorAll(".mc-score-row")) {
      expect(row.classList.contains("hidden")).toBe(true);
    }
  });

  it("with one entry hides the note and fills row one", () => {
    const container = document.createElement("div");
    const entry: ScoreEntry = { name: "MIKE", mode: "multiples", band: "hard", score: 100, level: 5 };
    renderScoreList(container, [entry]);
    expect(scoreEmpty(container).classList.contains("hidden")).toBe(true);
    const row = firstRow(container);
    expect(row.classList.contains("hidden")).toBe(false);
    expect(childText(row, ".mc-score-rank")).toBe("1");
    expect(childText(row, ".mc-score-name")).toBe("MIKE");
    expect(childText(row, ".mc-score-score")).toBe("100");
    expect(childText(row, ".mc-score-mode")).toBe("Mult");
    expect(childText(row, ".mc-score-band")).toBe("H");
  });
});
