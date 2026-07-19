// The viewer-side seam for txtshr payload versions, mirroring the CLI's
// internal/scheme package: each version of SPEC.md §4 implements Scheme
// (v0.ts, v1.ts, …) and is registered in registry.ts, keyed by its version
// identifier ("0", "1", …). This layer deals in raw bytes; translating the
// URL fragment's key=value + base64url wire format (SPEC.md §3) into Params
// is the caller's concern.

/**
 * A payload's version-specific parameters: raw bytes keyed by the names the
 * version's section of SPEC.md §4 defines (e.g. v1 uses "s", "n", "c"). The
 * keys "v" and "r" are reserved by SPEC.md §3 and never appear here.
 */
export type Params = Record<string, Uint8Array>;

/**
 * The decryption half of one version of the txtshr payload scheme — the
 * viewer only ever consumes payloads, so Encrypt (SPEC.md §2.1) has no
 * counterpart here.
 */
export interface Scheme {
  /**
   * Whether this version encrypts the plaintext. Drives the passphrase
   * prompt and, when false, the unencrypted-content indicator (SPEC.md §4.0).
   */
  readonly encrypts: boolean;
  /** Params keys this version's section of SPEC.md §4 requires. */
  readonly requiredParams: readonly string[];
  /**
   * Recovers the plaintext from payload parameters (SPEC.md §2.2). Throws —
   * never returns garbage — when required params are malformed and, for
   * encrypting versions, when the passphrase is wrong or the payload has
   * been tampered with. Unknown keys are ignored (SPEC.md §3).
   */
  decode(params: Params, passphrase: string): Promise<string>;
}
