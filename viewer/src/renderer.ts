import { z } from "zod";

// Non-empty strings containing only alphanumeric characters, dots,
// underscores, and hyphens — safe to embed in URL path segments without
// encoding and free of path-traversal sequences (e.g. `..`).
const SafeSegment = z.string().regex(/^[a-zA-Z0-9._-]+$/);

const RendererSpecSchema = z.object({
  owner: SafeSegment,
  repo: SafeSegment,
  name: SafeSegment,
  version: SafeSegment,
});

export type RendererSpec = z.infer<typeof RendererSpecSchema>;

/**
 * Parse a renderer spec string of the form `owner/repo/name[@version]`.
 * Returns null if the spec is invalid or contains unsafe characters.
 */
export const parseRendererSpec = (raw: string): RendererSpec | null => {
  const atIdx = raw.indexOf("@");
  const specPart = atIdx === -1 ? raw : raw.slice(0, atIdx);
  const version = atIdx === -1 ? "latest" : raw.slice(atIdx + 1);

  const parts = specPart.split("/");
  if (parts.length !== 3) return null;

  const [owner, repo, name] = parts;
  const result = RendererSpecSchema.safeParse({ owner, repo, name, version });
  return result.success ? result.data : null;
}

/**
 * Format a RendererSpec back into its canonical string form: `owner/repo/name[@version]`.
 * The version is omitted when it is "latest".
 */
export const formatRendererSpec = (spec: RendererSpec): string => {
  const version = spec.version !== "latest" ? `@${spec.version}` : "";
  return `${spec.owner}/${spec.repo}/${spec.name}${version}`;
}

/**
 * Resolve a RendererSpec to a jsDelivr CDN URL.
 * Expects the renderer repo to publish ESM bundles at `dist/<name>.js`.
 */
export const resolveRendererURL = (spec: RendererSpec): string => {
  return `https://cdn.jsdelivr.net/gh/${spec.owner}/${spec.repo}@${spec.version}/dist/${spec.name}.js`;
}

export interface RemoteRenderer {
  render(el: HTMLElement, text: string): void | (() => void);
}

export interface LoadedRenderer {
  renderer: RemoteRenderer;
  /** Hex-encoded SHA-256 of the raw JS payload fetched from the CDN. */
  hash: string;
}

/**
 * Fetch a renderer module from the given URL, compute a SHA-256 fingerprint of
 * the raw JS payload, then import it via a blob URL and validate its exports.
 * Returns the renderer and its hash. Throws if the fetch fails, the module
 * does not export a `render` function, or hashing is unavailable.
 */
export const loadRenderer = async (url: string): Promise<LoadedRenderer> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch renderer (${response.status}): ${url}`);
  }
  const jsText = await response.text();

  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(jsText));
  const hash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const blobUrl = URL.createObjectURL(new Blob([jsText], { type: "application/javascript" }));
  try {
    const mod = await import(/* @vite-ignore */ blobUrl);
    if (typeof mod.render !== "function") {
      throw new Error(`Renderer at ${url} does not export a render function`);
    }
    return { renderer: mod as RemoteRenderer, hash };
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}
