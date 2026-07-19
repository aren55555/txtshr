// Package scheme defines the abstraction each payload version of the txtshr
// specification (SPEC.md §4) implements. Concrete versions (v0 raw, v1
// PBKDF2+AES-GCM, …) each satisfy Scheme and are registered in Registry,
// keyed by their version identifier ("0", "1", …).
//
// This layer is deliberately independent of the wire format: Params carries
// raw bytes under the key names each version's section of §4 defines, and
// translating them to and from the URL-fragment encoding (SPEC.md §3 —
// key=value syntax, base64url) is the fragment layer's concern.
package scheme

// Params holds a payload's version-specific parameters: raw bytes keyed by
// the names the version's section of SPEC.md §4 defines (e.g. v1 uses "s",
// "n", "c"). Each version owns its key vocabulary; the keys "v" and "r" are
// reserved by SPEC.md §3 and must not be used. The version identifier is not
// part of Params — it lives alongside the Scheme's registration.
type Params map[string][]byte

// Scheme is one version of the txtshr payload scheme: the pair of Encode and
// Decode operations from SPEC.md §2, specialized by a §4 version section.
type Scheme interface {
	// Encrypts reports whether this version encrypts the plaintext.
	// For versions that return false, the passphrase arguments below are
	// ignored, and the caller is responsible for obtaining the user's
	// explicit per-invocation acknowledgement before emitting a payload
	// (SPEC.md §4.0). For versions that return true, callers must supply a
	// non-empty passphrase.
	Encrypts() bool

	// Encode produces the version-specific payload parameters for the given
	// plaintext, per the version's section of SPEC.md §4.
	Encode(plaintext []byte, passphrase string) (Params, error)

	// Decode recovers the plaintext from payload parameters, mirroring
	// Encode. Per SPEC.md §2.2 it must fail — not return garbage — when
	// parameters the version requires are missing or malformed and, for
	// encrypting versions, when the passphrase is wrong or the payload has
	// been tampered with. Unknown keys are ignored (SPEC.md §3).
	Decode(p Params, passphrase string) ([]byte, error)
}
