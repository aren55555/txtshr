import { describe, expect, it } from "bun:test";
import { splitCommandBrand } from "./splitCommandBrand";

type Segment = { text: string; highlight: boolean };

describe("splitCommandBrand", () => {
  it.each<[string, string, Segment[]]>([
    [
      "highlights txtshr surrounded by spaces",
      "echo txtshr foo",
      [
        { text: "echo ", highlight: false },
        { text: "txtshr", highlight: true },
        { text: " foo", highlight: false },
      ],
    ],
    [
      "does not highlight txtshr at the start of the string",
      "txtshr foo",
      [{ text: "txtshr foo", highlight: false }],
    ],
    [
      "does not highlight txtshr at the end of the string",
      "echo txtshr",
      [{ text: "echo txtshr", highlight: false }],
    ],
    [
      "does not highlight txtshr with no surrounding whitespace",
      "notxtshrhere",
      [{ text: "notxtshrhere", highlight: false }],
    ],
    [
      "highlights multiple occurrences",
      "cat file | txtshr | grep txtshr done",
      [
        { text: "cat file | ", highlight: false },
        { text: "txtshr", highlight: true },
        { text: " | grep ", highlight: false },
        { text: "txtshr", highlight: true },
        { text: " done", highlight: false },
      ],
    ],
    [
      "handles tabs and newlines as surrounding whitespace",
      "run\ttxtshr\nhere",
      [
        { text: "run\t", highlight: false },
        { text: "txtshr", highlight: true },
        { text: "\nhere", highlight: false },
      ],
    ],
    [
      "returns a single non-highlighted segment for an empty string",
      "",
      [{ text: "", highlight: false }],
    ],
  ])("%s", (_, command, expected) => {
    expect(splitCommandBrand(command)).toEqual(expected);
  });
});
