import { describe, expect, it } from "bun:test";
import { base64urlDecode } from "./base64url";
import { Params } from "./scheme";
import { schemes } from "./registry";

const utf8 = (s: string): Uint8Array => new TextEncoder().encode(s);

describe("schemes registry", () => {
  it("contains v0 and v1", () => {
    expect(schemes.get("0")).toBeDefined();
    expect(schemes.get("1")).toBeDefined();
  });

  it("has no entry for unknown versions", () => {
    expect(schemes.get("2")).toBeUndefined();
    expect(schemes.get("")).toBeUndefined();
  });

  it("reports encryption per version", () => {
    expect(schemes.get("0")!.encrypts).toBe(false);
    expect(schemes.get("1")!.encrypts).toBe(true);
  });

  it("declares required params per version", () => {
    expect(schemes.get("0")!.requiredParams).toEqual(["c"]);
    expect(schemes.get("1")!.requiredParams).toEqual(["s", "n", "c"]);
  });
});

describe("v0 decode", () => {
  const v0 = schemes.get("0")!;

  it.each<{ desc: string; text: string }>([
    { desc: "decodes a simple message", text: "hello world" },
    { desc: "decodes unicode content", text: "unicode: 日本語 ✓" },
    { desc: "decodes URL-unsafe characters", text: "a&b=c#d?e/f+g h%i" },
  ])("$desc", async ({ text }) => {
    await expect(v0.decode({ c: utf8(text) }, "")).resolves.toBe(text);
  });

  it("ignores the passphrase", async () => {
    await expect(v0.decode({ c: utf8("hi") }, "anything")).resolves.toBe("hi");
  });

  it("ignores unknown params", async () => {
    await expect(v0.decode({ c: utf8("hi"), zz: utf8("future") }, "")).resolves.toBe("hi");
  });

  it("throws when the content param is missing", async () => {
    await expect(v0.decode({}, "")).rejects.toThrow();
  });
});

describe("v1 decode", () => {
  const v1 = schemes.get("1")!;

  const params = (s: string, n: string, c: string): Params => ({
    s: base64urlDecode(s),
    n: base64urlDecode(n),
    c: base64urlDecode(c),
  });

  it.each<{ desc: string; s: string; n: string; c: string; passphrase: string; expected: string }>([
    {
      desc: "decrypts a simple message",
      s: "dGSsyzxxc192UuylsW-bbQ",
      n: "il8RS2zgRjH7Ly1d",
      c: "SddsJTO-CvcBFxoe4OdxuITb9ByCvQCLgPaK",
      passphrase: "hunter2",
      expected: "hello world",
    },
    {
      desc: "decrypts with a multi-word passphrase",
      s: "P_EU_7N1am6zLtVyO73lbQ",
      n: "HeU8op7tlZ0TXl5U",
      c: "Ji7VXpqPyzVO8AMoCgjhV6JG4q2NpK6URfrRMQ",
      passphrase: "correct horse battery staple",
      expected: "txtshr rocks",
    },
    {
      desc: "decrypts with a unicode passphrase",
      s: "Hj11yOS-daxzmXyvKjGnUg",
      n: "33w9_4cI_U3N5I_a",
      c: "dylZBvJNtGmNSrHJ6CV0t0VaHOiBNV91px8k-fD71zL0GA",
      passphrase: "pässwörد",
      expected: "unicode: 日本語",
    },
  ])("$desc", async ({ s, n, c, passphrase, expected }) => {
    await expect(v1.decode(params(s, n, c), passphrase)).resolves.toBe(expected);
  });

  it("throws on wrong passphrase", async () => {
    await expect(
      v1.decode(
        params("dGSsyzxxc192UuylsW-bbQ", "il8RS2zgRjH7Ly1d", "SddsJTO-CvcBFxoe4OdxuITb9ByCvQCLgPaK"),
        "wrong"
      )
    ).rejects.toThrow();
  });

  it("throws on tampered ciphertext", async () => {
    const p = params("dGSsyzxxc192UuylsW-bbQ", "il8RS2zgRjH7Ly1d", "SddsJTO-CvcBFxoe4OdxuITb9ByCvQCLgPaK");
    p.c[0] ^= 0x01;
    await expect(v1.decode(p, "hunter2")).rejects.toThrow();
  });

  it.each<string>(["s", "n", "c"])("throws when %s is missing", async (missing) => {
    const p = params("dGSsyzxxc192UuylsW-bbQ", "il8RS2zgRjH7Ly1d", "SddsJTO-CvcBFxoe4OdxuITb9ByCvQCLgPaK");
    delete p[missing];
    await expect(v1.decode(p, "hunter2")).rejects.toThrow();
  });
});
