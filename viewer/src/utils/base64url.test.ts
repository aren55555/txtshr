import { describe, expect, it } from "bun:test";
import { base64urlDecode } from "./base64url";

describe("base64urlDecode", () => {
  it.each<{ desc: string; input: string; expected: string }>([
    { desc: "decodes a simple value", input: "aGVsbG8gd29ybGQ", expected: "hello world" },
    { desc: "decodes unpadded input (1 byte)", input: "eA", expected: "x" },
    { desc: "decodes unpadded input (2 bytes)", input: "YWI", expected: "ab" },
    { desc: "decodes unpadded input (3 bytes)", input: "YWJj", expected: "abc" },
    { desc: "decodes the empty string", input: "", expected: "" },
  ])("$desc", ({ input, expected }) => {
    expect(new TextDecoder().decode(base64urlDecode(input))).toBe(expected);
  });

  it("decodes url-safe alphabet characters (- and _)", () => {
    // 0xfb 0xff encodes to "-_8" in base64url ("+/8" in standard base64).
    expect(Array.from(base64urlDecode("-_8"))).toEqual([0xfb, 0xff]);
  });

  it("produces raw bytes, not text", () => {
    expect(Array.from(base64urlDecode("AAEC_w"))).toEqual([0x00, 0x01, 0x02, 0xff]);
  });

  it("throws on characters outside the base64url alphabet", () => {
    expect(() => base64urlDecode("!!!not-base64!!!")).toThrow();
  });

  it("throws on the standard-alphabet characters + and /", () => {
    expect(() => base64urlDecode("+/8")).toThrow();
  });
});
