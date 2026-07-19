# txtshr Specification

This document specifies **txtshr**: a zero-knowledge text-sharing scheme in
which a *producer* encrypts plaintext into a shareable URL and a *viewer*
decrypts it entirely on the recipient's device. It is deliberately abstract —
it describes *what* conforming implementations must do, not *how* any
particular language or library does it. The reference implementations (a Go
CLI producer and a browser-based viewer) must both conform to this document.

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY**
are to be interpreted as described in RFC 2119.

## 1. Model

There are three parties:

- **Producer** — takes a plaintext and a passphrase, produces a URL.
- **Server** — hosts the viewer application as static content. It **MUST**
  never receive the plaintext, the passphrase, or any material derived from
  them.
- **Viewer** — running on the recipient's device, takes the URL and the
  passphrase, recovers the plaintext.

Zero-knowledge is achieved by placing all sensitive material in the URL
**fragment** (the part after `#`), which user agents do not transmit to the
server[^rfc3986][^rfc9112][^mdn-fragment]. The passphrase is shared
out-of-band and never appears in the URL.

[^rfc3986]: [RFC 3986 §3.5 (Fragment)](https://datatracker.ietf.org/doc/html/rfc3986#section-3.5):
    "the fragment identifier is separated from the rest of the URI prior to a
    dereference, and thus the identifying information within the fragment
    itself is dereferenced solely by the user agent, regardless of the URI
    scheme."

[^rfc9112]: [RFC 9112 §3.2.1 (origin-form request-target)](https://datatracker.ietf.org/doc/html/rfc9112#section-3.2.1):
    the request-target an HTTP client sends is `absolute-path [ "?" query ]` —
    the grammar has no fragment component, so a conforming client cannot
    transmit one.

[^mdn-fragment]: [MDN: URI fragment](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment):
    "The fragment is not sent to the server when the URI is requested; it is
    processed by the client (e.g., the browser) after the resource is
    retrieved."

## 2. Abstract API

Conforming implementations expose two operations. Inputs and outputs are
described abstractly; the payload encoding is defined in §3.

### 2.1 Encrypt

```
Encrypt(plaintext, passphrase) → payload
```

- **plaintext** — an arbitrary sequence of bytes (in practice, UTF-8 text).
- **passphrase** — a non-empty sequence of bytes.
- **payload** — a self-describing value carrying the version identifier, all
  public parameters (salt, nonce, …), and the ciphertext. It contains
  everything needed to decrypt *except* the passphrase.

For versions that perform encryption, `Encrypt` **MUST** generate fresh,
cryptographically random values for every per-message parameter (e.g. salt,
nonce) on every invocation, so encrypting the same plaintext twice yields
distinct payloads. For versions that do not encrypt (§4.0), the passphrase is
ignored and the operation degenerates to encoding the plaintext into a
payload.

### 2.2 Decrypt

```
Decrypt(payload, passphrase) → plaintext | error
```

- Reads the version identifier from the payload and applies the corresponding
  scheme from §4.
- **MUST** fail (not return garbage) when the payload is malformed, and — for
  versions that encrypt — when the passphrase is wrong or the payload has been
  tampered with. This implies every version that encrypts **MUST** use
  authenticated encryption.
- **MUST** reject payloads whose version identifier it does not recognize,
  with an error distinguishable from a wrong-passphrase failure.

## 3. Payload Encoding

The payload is the URL fragment (without the leading `#`). It is a sequence of
`key=value` pairs joined by `&`, with keys and values percent-encoded per the
`application/x-www-form-urlencoded` convention.

Keys defined for all versions:

| Key | Required | Meaning |
|-----|----------|---------|
| `v` | yes | Version identifier (a small integer, as a decimal string). Selects a section of §4. |
| `r` | no | Renderer spec (§5). Not part of the cryptographic scheme. |

All remaining keys are defined per-version in §4. Binary values are encoded
with **base64url without padding** (RFC 4648 §5, `=` omitted).

A complete share URL is:

```
<viewer-base-url>/#v=<version>&<version-specific-pairs>[&r=<renderer-spec>]
```

Unknown keys **MUST** be ignored by the viewer (to allow forward-compatible
additions); absence of a key required by the indicated version is an error.

## 4. Versions

Each version fully specifies its key-derivation function, cipher, and
version-specific payload keys. Versions are immutable once published: any
change to the cryptography requires a new version identifier. Viewers
**SHOULD** support all published versions indefinitely so old links keep
working; producers **SHOULD** emit only the newest version.

### 4.0 Version 0 (`v=0`) — raw, no encryption

Version 0 carries the plaintext unencrypted. It exists so that the sharing
and renderer machinery (§5) can be used without a passphrase; it provides
**no confidentiality or integrity whatsoever** — anyone with the URL can read
and a forger can fabricate its content. None of the security guarantees in §6
apply to version 0 payloads.

**Parameters**

None. There is no key derivation, no cipher, no salt, and no nonce. The
passphrase input to the abstract API is ignored.

**Payload keys**

| Key | Value |
|-----|-------|
| `c` | base64url(plaintext) |

The plaintext is encoded (base64url, unpadded — same as all binary values in
§3) rather than embedded literally so that arbitrary text survives the
fragment's `key=value` syntax unambiguously and version 0 payloads remain
shaped like every other version's.

**Encrypt (v0)**

1. Emit the payload with `v=0` and `c` = base64url(plaintext). No random
   values are generated; the operation is deterministic.

**Decrypt (v0)**

1. Decode `c` from base64url; fail on malformed input.
2. Interpret the result as UTF-8 text.

**Producer acknowledgement**

Producer-side tooling **MUST NOT** emit a non-encrypting version unless the
user has explicitly and affirmatively acknowledged that the content will be
shared without encryption. The form of the acknowledgement is
implementation-defined (a command-line flag, a confirmation dialog, …), but
it **MUST** be opt-in and off by default, **MUST** be given per invocation —
producers **MUST NOT** allow it to be satisfied by a persistent default such
as a configuration setting or a remembered choice — and **MUST** make the
absence of encryption evident in its wording. Producers **MUST NOT** select
a non-encrypting version implicitly (e.g. as a fallback when no passphrase
is provided).

Viewers **MUST NOT** prompt for a passphrase for version 0 payloads, and
**SHOULD** indicate to the recipient that the content was not encrypted. All
renderer trust requirements (§5) apply unchanged.

### 4.1 Version 1 (`v=1`)

Passphrase-based authenticated encryption using PBKDF2 and AES-GCM.

**Parameters**

| Parameter | Value |
|-----------|-------|
| Key derivation | PBKDF2 with HMAC-SHA-256 |
| PBKDF2 iterations | 600,000 |
| Derived key length | 32 bytes (256 bits) |
| Salt | 16 random bytes, unique per message |
| Cipher | AES-256-GCM |
| Nonce (IV) | 12 random bytes, unique per message |
| Authentication tag | 16 bytes, appended to the ciphertext |
| Additional authenticated data (AAD) | none |

**Payload keys**

| Key | Value |
|-----|-------|
| `s` | base64url(salt) |
| `n` | base64url(nonce) |
| `c` | base64url(ciphertext ‖ tag) |

**Encrypt (v1)**

1. Generate a random 16-byte salt and a random 12-byte nonce.
2. Derive `key = PBKDF2-HMAC-SHA-256(passphrase, salt, 600000 iterations, 32 bytes)`.
3. Compute `ciphertext ‖ tag = AES-256-GCM-Seal(key, nonce, plaintext, AAD = none)`.
4. Emit the payload with `v=1` and the keys above.

**Decrypt (v1)**

1. Decode `s`, `n`, `c` from base64url; fail on malformed input.
2. Derive the key exactly as in step 2 above.
3. Compute `AES-256-GCM-Open(key, nonce, ciphertext ‖ tag)`; fail if tag
   verification fails (wrong passphrase or tampering).
4. Interpret the result as UTF-8 text.

### 4.2 Future versions

New sections are added here when a new `v` value is introduced — for example,
a post-quantum or memory-hard-KDF scheme. A new version defines its own
parameter table, payload keys, and encrypt/decrypt procedures; it **MUST
NOT** change the meaning of any key under an existing version.

## 5. Renderers (version-independent)

The optional `r` key names a *remote renderer*: third-party presentation code
the viewer may load to display the decrypted plaintext (e.g. as markdown or a
diagram). It is orthogonal to the encryption version.

**Spec format**: `owner/repo/name[@version]`. Each of `owner`, `repo`, `name`,
and `version` **MUST** match `[a-zA-Z0-9._-]+`; anything else is invalid and
**MUST** be rejected. When `@version` is omitted it defaults to `latest`.

**Resolution**: the spec resolves to a published module at a well-known CDN
location derived from the spec (currently
`https://cdn.jsdelivr.net/gh/<owner>/<repo>@<version>/dist/<name>.js`). The
module **MUST** export a `render` entry point that accepts a display surface
and the decrypted text, and **MAY** return a cleanup routine.

**Trust requirements** — because a renderer receives the decrypted plaintext,
the viewer:

- **MUST** warn the recipient and obtain explicit consent before loading a
  renderer not previously trusted.
- **MUST** fingerprint the fetched module (SHA-256 of the raw bytes) so that
  previously-approved code can be recognized and changed code re-prompts.
- **MUST** validate the module's shape (a `render` entry point exists) before
  invoking it.
- **MUST** fall back to plain-text display if the renderer is invalid,
  rejected, or fails to load. Decryption never depends on the renderer.

## 6. Security Properties and Non-Goals

**Guarantees** (encrypting versions only — version 0 provides none of these)

- Confidentiality and integrity of the plaintext against anyone lacking the
  passphrase, including the server operator.
- Tampering with any part of the payload is detected (authenticated
  encryption).

**Non-goals / caveats**

- **No expiry**: a URL is valid forever; there is no revocation.
- **Passphrase strength is the recipient-side defense**: the payload is public
  once shared, so offline brute-force is limited only by the KDF cost and the
  passphrase entropy.
- **URL leakage**: anything that logs full URLs *including fragments*
  (browser history, chat previews that resolve fragments client-side) sees the
  ciphertext — but not the plaintext without the passphrase.
- **Renderer trust**: an approved renderer runs with full access to the
  decrypted text; the trust prompt and fingerprinting mitigate but do not
  eliminate this risk.
