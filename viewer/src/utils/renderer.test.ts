import { describe, expect, it } from "bun:test";
import { formatRendererSpec, parseRendererSpec, type RendererSpec } from "./renderer";

describe("parseRendererSpec", () => {
  it.each<{ input: string; expected: RendererSpec }>([
    { input: "owner/repo/name@1.2.3",            expected: { owner: "owner",    repo: "repo",    name: "name",    version: "1.2.3"   } },
    { input: "owner/repo/name",                  expected: { owner: "owner",    repo: "repo",    name: "name",    version: "latest"  } },
    { input: "my.org/my_repo/my-name@v1.0.0-beta", expected: { owner: "my.org", repo: "my_repo", name: "my-name", version: "v1.0.0-beta" } },
  ])("parses valid spec $input", ({ input, expected }) => {
    expect(parseRendererSpec(input)).toEqual(expected);
  });

  it.each<{ label: string; input: string }>([
    { label: "path traversal in owner",    input: "../evil/repo/name" },
    { label: "path traversal in repo",     input: "owner/../evil/name" },
    { label: "path traversal in name",     input: "owner/repo/../../etc" },
    { label: "slash injection in version", input: "owner/repo/name@v1/evil" },
    { label: "spaces in a segment",        input: "ow ner/repo/name" },
    { label: "percent-encoded characters", input: "owner/re%2Fpo/name" },
    { label: "empty owner",                input: "/repo/name" },
    { label: "empty repo",                 input: "owner//name" },
    { label: "empty name",                 input: "owner/repo/" },
    { label: "empty version",              input: "owner/repo/name@" },
    { label: "too few segments",           input: "owner/repo" },
    { label: "too many segments",          input: "owner/repo/name/extra" },
    { label: "empty string",              input: "" },
  ])("rejects $label", ({ input }) => {
    expect(parseRendererSpec(input)).toBeNull();
  });
});

describe("formatRendererSpec", () => {
  it.each<{ expected: string; spec: RendererSpec }>([
    { expected: "owner/repo/name@1.2.3",            spec: { owner: "owner",    repo: "repo",    name: "name",    version: "1.2.3"       } },
    { expected: "owner/repo/name",                  spec: { owner: "owner",    repo: "repo",    name: "name",    version: "latest"      } },
    { expected: "my.org/my_repo/my-name@v1.0.0-beta", spec: { owner: "my.org", repo: "my_repo", name: "my-name", version: "v1.0.0-beta" } },
  ])("formats spec as $expected", ({ expected, spec }) => {
    expect(formatRendererSpec(spec)).toBe(expected);
  });
});
