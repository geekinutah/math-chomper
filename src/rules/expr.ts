// Display glyphs per spec: + U+002B, minus U+2212, times U+00D7, divide U+00F7.
// The board never shows * or /.

type OpFn = (a: number, b: number) => number | null;

const OPERATORS: Record<string, OpFn> = {
  "+": (a, b) => a + b,
  // Subtraction results are non-negative in v1.
  "−": (a, b) => (a < b ? null : a - b),
  "×": (a, b) => a * b,
  // Division must be exact, so the board never shows a fraction.
  "÷": (a, b) => (b === 0 || a % b !== 0 ? null : a / b),
};

function isDigit(code: number): boolean {
  return code >= 48 && code <= 57;
}

// Grammar: <digits><glyph><digits>. No whitespace, no chains, no signs.
export function evalExpr(text: string): number | null {
  let i = 0;
  let a = 0;
  let sawA = false;
  while (i < text.length && isDigit(text.charCodeAt(i))) {
    a = a * 10 + text.charCodeAt(i) - 48;
    sawA = true;
    i += 1;
  }
  if (!sawA) return null;

  const op = i < text.length ? text.charAt(i) : "";
  const apply = OPERATORS[op];
  if (!apply) return null;
  i += 1;

  let b = 0;
  let sawB = false;
  while (i < text.length && isDigit(text.charCodeAt(i))) {
    b = b * 10 + text.charCodeAt(i) - 48;
    sawB = true;
    i += 1;
  }
  if (!sawB || i !== text.length) return null;

  return apply(a, b);
}

export function formatExpr(a: number, op: string, b: number): string {
  return `${a}${op}${b}`;
}
