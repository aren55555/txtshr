import { describe, expect, it } from "bun:test";
import { decryptV1 } from "./crypto";

describe("decryptV1", () => {
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
    await expect(decryptV1(s, n, c, passphrase)).resolves.toBe(expected);
  });

  it("throws on wrong passphrase", async () => {
    await expect(
      decryptV1(
        "dGSsyzxxc192UuylsW-bbQ",
        "il8RS2zgRjH7Ly1d",
        "SddsJTO-CvcBFxoe4OdxuITb9ByCvQCLgPaK",
        "wrong"
      )
    ).rejects.toThrow();
  });
});
