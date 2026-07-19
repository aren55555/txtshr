/**
 * Decodes unpadded base64url (RFC 4648 §5) — the encoding SPEC.md §3 mandates
 * for binary values in the URL fragment. Throws on input outside the
 * base64url alphabet.
 */
export const base64urlDecode = (s: string): Uint8Array =>
  Uint8Array.fromBase64(s, { alphabet: "base64url" });
