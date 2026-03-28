import { describe, expect, it } from "bun:test";
import { splitCommandBrand } from "./splitCommandBrand";

type Segment = { text: string; highlight: boolean };

describe("splitCommandBrand", () => {
  it.each<{ desc: string; command: string; expected: Segment[] }>([
    {
      desc: "highlights txtshr surrounded by spaces",
      command: "echo txtshr foo",
      expected: [
        { text: "echo ", highlight: false },
        { text: "txtshr", highlight: true },
        { text: " foo", highlight: false },
      ],
    },
    {
      desc: "does not highlight txtshr at the start of the string",
      command: "txtshr foo",
      expected: [{ text: "txtshr foo", highlight: false }],
    },
    {
      desc: "does not highlight txtshr at the end of the string",
      command: "echo txtshr",
      expected: [{ text: "echo txtshr", highlight: false }],
    },
    {
      desc: "does not highlight txtshr with no surrounding whitespace",
      command: "notxtshrhere",
      expected: [{ text: "notxtshrhere", highlight: false }],
    },
    {
      desc: "highlights multiple occurrences",
      command: "cat file | txtshr | grep txtshr done",
      expected: [
        { text: "cat file | ", highlight: false },
        { text: "txtshr", highlight: true },
        { text: " | grep ", highlight: false },
        { text: "txtshr", highlight: true },
        { text: " done", highlight: false },
      ],
    },
    {
      desc: "handles tabs and newlines as surrounding whitespace",
      command: "run\ttxtshr\nhere",
      expected: [
        { text: "run\t", highlight: false },
        { text: "txtshr", highlight: true },
        { text: "\nhere", highlight: false },
      ],
    },
    {
      desc: "returns a single non-highlighted segment for an empty string",
      command: "",
      expected: [{ text: "", highlight: false }],
    },
  ])("$desc", ({ command, expected }) => {
    expect(splitCommandBrand(command)).toEqual(expected);
  });
});
