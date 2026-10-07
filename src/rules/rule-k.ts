import type { Mode } from "./types";

// Effective k range for a rule: `multiples` widens by one per level (capped at the
// band's k max); equality/inequality floor at the band's exprMinResult so the key can
// actually match a generated expression. Single source of truth shared by
// generateRule (board.ts) and genRule (state.ts) — do not re-derive it at a call site.
export function ruleKRange(
  mode: Mode,
  level: number,
  kRange: { min: number; max: number },
  exprMinResult: number,
): { min: number; max: number } {
  const max = mode === "multiples" ? Math.min(kRange.max, kRange.min + level + 1) : kRange.max;
  const min =
    mode === "equality" || mode === "inequality"
      ? Math.max(kRange.min, exprMinResult)
      : kRange.min;
  return { min, max };
}
