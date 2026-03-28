import { describe, expect, it } from "bun:test";
import { truncateUrl } from "./truncateUrl";

describe("truncateUrl", () => {
  it.each<{ desc: string; url: string; maxLength?: number; expected: string }>([
    { desc: "returns the URL unchanged when it fits within the default limit", url: "https://example.com/short", expected: "https://example.com/short" },
    { desc: "returns the URL unchanged when it equals the default limit", url: "x".repeat(60), expected: "x".repeat(60) },
    { desc: "truncates with ellipsis when the URL exceeds the default limit", url: "https://example.com/" + "a".repeat(50), expected: "https://example.com/aaaaaaaaaa…" + "a".repeat(29) },
    { desc: "back gets fewer chars when charsToShow is odd (even maxLength)", url: "abcdefghij", maxLength: 6, expected: "abc…ij" },
    { desc: "back gets fewer chars when charsToShow is even (odd maxLength)", url: "abcdefghijk", maxLength: 7, expected: "abc…ijk" },
    { desc: "respects a custom maxLength", url: "https://example.com/some/long/path", maxLength: 20, expected: "https://ex…long/path" },
    { desc: "returns the URL unchanged when it equals a custom maxLength", url: "abc", maxLength: 3, expected: "abc" },
  ])("$desc", ({ url, maxLength, expected }) => {
    expect(maxLength === undefined ? truncateUrl(url) : truncateUrl(url, maxLength)).toBe(expected);
  });
});
