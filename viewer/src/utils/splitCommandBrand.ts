/**
 * Splits a command string into segments, marking occurrences of "txtshr" that
 * are surrounded by whitespace on both sides.
 *
 * @param command - The command string to parse
 * @returns Array of { text, highlight } segments
 */
export const splitCommandBrand = (
  command: string
): { text: string; highlight: boolean }[] =>
  command
    .split(/((?<=\s)txtshr(?=\s))/)
    .map((text) => ({ text, highlight: text === "txtshr" }));
