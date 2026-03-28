import { describe, expect, it } from "bun:test";
import { formatRendererSpec, parseRendererSpec, type RendererSpec } from "./renderer";

describe("parseRendererSpec", () => {
  it.each<[string, RendererSpec]>([
    [
      "owner/repo/name@1.2.3",
      { owner: "owner", repo: "repo", name: "name", version: "1.2.3" },
    ],
    [
      "owner/repo/name",
      { owner: "owner", repo: "repo", name: "name", version: "latest" },
    ],
    [
      "my.org/my_repo/my-name@v1.0.0-beta",
      { owner: "my.org", repo: "my_repo", name: "my-name", version: "v1.0.0-beta" },
    ],
  ])("parses valid spec %s", (input, expected) => {
    expect(parseRendererSpec(input)).toEqual(expected);
  });

  it.each([
    ["path traversal in owner",    "../evil/repo/name"],
    ["path traversal in repo",     "owner/../evil/name"],
    ["path traversal in name",     "owner/repo/../../etc"],
    ["slash injection in version", "owner/repo/name@v1/evil"],
    ["spaces in a segment",        "ow ner/repo/name"],
    ["percent-encoded characters", "owner/re%2Fpo/name"],
    ["empty owner",                "/repo/name"],
    ["empty repo",                 "owner//name"],
    ["empty name",                 "owner/repo/"],
    ["empty version",              "owner/repo/name@"],
    ["too few segments",           "owner/repo"],
    ["too many segments",          "owner/repo/name/extra"],
    ["empty string",               ""],
  ])("rejects %s", (_label, input) => {
    expect(parseRendererSpec(input)).toBeNull();
  });
});

describe("formatRendererSpec", () => {
  it.each<[string, RendererSpec]>([
    [
      "owner/repo/name@1.2.3",
      { owner: "owner", repo: "repo", name: "name", version: "1.2.3" },
    ],
    [
      "owner/repo/name",
      { owner: "owner", repo: "repo", name: "name", version: "latest" },
    ],
    [
      "my.org/my_repo/my-name@v1.0.0-beta",
      { owner: "my.org", repo: "my_repo", name: "my-name", version: "v1.0.0-beta" },
    ],
  ])("formats spec as %s", (expected, spec) => {
    expect(formatRendererSpec(spec)).toBe(expected);
  });
});
