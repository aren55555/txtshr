import { describe, expect, it } from "bun:test";
import { TOAST_PALETTES } from "./Toast";
import brand from "../../../brand/brand.json";

// Extracts color tokens (e.g. "amber-300") from Tailwind utility classes like
// "bg-amber-300/30", "border-red-400/49", "text-red-200".
const tokensIn = (classes: string): string[] =>
  [...classes.matchAll(/(?:bg|border|text)-([a-z]+-\d{2,3})/g)].map((m) => m[1]);

describe("TOAST_PALETTES", () => {
  const brandTokens = Object.keys(brand.colors);

  for (const [color, palette] of Object.entries(TOAST_PALETTES)) {
    for (const [role, classes] of Object.entries(palette)) {
      it(`${color}.${role} uses only brand.json color tokens`, () => {
        const tokens = tokensIn(classes);
        expect(tokens.length).toBeGreaterThan(0);
        for (const token of tokens) {
          expect(brandTokens).toContain(token);
        }
      });
    }
  }
});
