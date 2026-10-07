export function buttonByText(root: ParentNode, text: string): HTMLButtonElement {
  const btn = [...root.querySelectorAll("button")].find((b) => b.textContent === text);
  if (!btn) throw new Error(`no button with text ${JSON.stringify(text)}`);
  return btn;
}

export function checkboxByLabel(root: ParentNode, label: string): HTMLInputElement {
  const el = [...root.querySelectorAll("label")].find((l) => l.textContent === label);
  const box = el?.querySelector("input") ?? null;
  if (box instanceof HTMLInputElement) return box;
  throw new Error(`no checkbox for label ${JSON.stringify(label)}`);
}

export function inputByClass(root: ParentNode, className: string): HTMLInputElement {
  const el = [...root.querySelectorAll(`.${className}`)].find((n) => n instanceof HTMLInputElement);
  if (!el) throw new Error(`no input with class ${JSON.stringify(className)}`);
  return el;
}
