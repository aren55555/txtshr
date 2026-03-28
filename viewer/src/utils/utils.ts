/**
 * Truncates a long URL by replacing the middle with an ellipsis,
 * preserving the start and end so the URL remains recognizable.
 *
 * @param url - The URL to truncate
 * @param maxLength - Maximum total length (default: 60)
 * @returns The truncated URL, or the original if it fits within maxLength
 */
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

export const truncateUrl = (url: string, maxLength = 60): string => {
  if (url.length <= maxLength) return url;

  const ellipsis = "…";
  const charsToShow = maxLength - ellipsis.length;
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);

  return url.slice(0, frontChars) + ellipsis + url.slice(url.length - backChars);
};
