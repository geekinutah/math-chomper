export function buttonByText(root: ParentNode, text: string): HTMLButtonElement {
  const btn = [...root.querySelectorAll("button")].find((b) => b.textContent === text);
  if (!btn) throw new Error(`no button with text ${JSON.stringify(text)}`);
  return btn;
}
