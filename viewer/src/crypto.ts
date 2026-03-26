const PBKDF2_ITERATIONS = 600_000;

const base64urlDecode = (s: string): Uint8Array =>
  Uint8Array.fromBase64(s, { alphabet: "base64url" });

/**
 * Decrypts ciphertext using scheme v1: PBKDF2-SHA256 + AES-256-GCM.
 * Throws if the passphrase is wrong (GCM authentication tag mismatch)
 * or if the encoded values are malformed.
 */
export const decryptV1 = async (
  saltB64: string,
  nonceB64: string,
  ciphertextB64: string,
  passphrase: string
): Promise<string> => {
  const salt = base64urlDecode(saltB64);
  const nonce = base64urlDecode(nonceB64);
  const ciphertext = base64urlDecode(ciphertextB64);

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

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: nonce },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plaintext);
}
