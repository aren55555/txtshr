import { Scheme } from "./scheme";

const PBKDF2_ITERATIONS = 600_000 as const;

/** SPEC.md §4.1: PBKDF2-SHA256 key derivation + AES-256-GCM (Web Crypto API). */
export const v1: Scheme = {
  encrypts: true,
  requiredParams: ["s", "n", "c"],
  decode: async (params, passphrase) => {
    const { s: salt, n: nonce, c: ciphertext } = params;
    if (!salt || !nonce || !ciphertext) {
      throw new Error("v1: payload missing required key");
    }

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(passphrase),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );

    // Throws on GCM authentication failure (wrong passphrase or tampering).
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: nonce },
      key,
      ciphertext
    );

    return new TextDecoder().decode(plaintext);
  },
};
