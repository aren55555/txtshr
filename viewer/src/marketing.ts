export const META_DESCRIPTION =
  "Securely share text with end-to-end encryption. The passphrase never leaves your device — the server never sees your content." as const;

export const TAGLINE =
  "Share encrypted text via a URL. The passphrase never leaves your device — decryption happens entirely in your browser. Even the server can't read your message." as const;

export const ZERO_KNOWLEDGE_LABEL = "100% zero-knowledge" as const;

// InfoPopup: <strong>txtshr</strong>{HOW_IT_WORKS_AFTER_BRAND}
export const HOW_IT_WORKS_AFTER_BRAND =
  " lets you share encrypted text via a URL. The passphrase never leaves your device — decryption happens entirely in your browser using the Web Crypto API." as const;
export const HOW_IT_WORKS = `txtshr${HOW_IT_WORKS_AFTER_BRAND}` as const;

// Fragment notes: {FRAGMENT_PREAMBLE}<code>#</code>...
export const FRAGMENT_PREAMBLE = "The URL fragment (everything after " as const;

// InfoPopup: ...#</code>) is <em>{NEVER_SENT}</em>{FRAGMENT_GUARANTEE_TAIL}
export const NEVER_SENT = "never sent to any server" as const;
export const FRAGMENT_GUARANTEE_TAIL =
  " — it's a browser guarantee. Even we can't read your message." as const;
export const FRAGMENT_GUARANTEE =
  `${FRAGMENT_PREAMBLE}#) is ${NEVER_SENT}${FRAGMENT_GUARANTEE_TAIL}` as const;

// LandingPage: ...#</code>{LANDING_FRAGMENT_NOTE_AFTER_HASH}
export const LANDING_FRAGMENT_NOTE_AFTER_HASH =
  ") is never sent to any server — it's a browser guarantee. Encryption uses AES-256-GCM with PBKDF2-SHA256 key derivation." as const;
export const LANDING_FRAGMENT_NOTE =
  `${FRAGMENT_PREAMBLE}#${LANDING_FRAGMENT_NOTE_AFTER_HASH}` as const;

export const PRIVACY_NOTE =
  "Encryption and decryption happen entirely on your device. The server never sees your text, your passphrase, or the encrypted content — everything sensitive lives in the URL fragment (after the #), which browsers never include in HTTP requests. The server only ever serves the app itself." as const;
