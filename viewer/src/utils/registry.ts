import { Scheme } from "./scheme";
import { v0 } from "./v0";
import { v1 } from "./v1";

/**
 * Registry of all supported versions, keyed by the fragment's "v" value. The
 * map key is the single source of truth for a version's identifier; an
 * unknown version must surface a distinct "unsupported" error (SPEC.md §2.2).
 */
export const schemes: ReadonlyMap<string, Scheme> = new Map([
  ["0", v0],
  ["1", v1],
]);
