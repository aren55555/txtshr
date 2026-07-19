package scheme

// Version identifiers as they appear in the fragment's "v" key.
const (
	V0 = "0"
	V1 = "1"

	// Latest is the version producers emit by default. Non-encrypting
	// versions are never the default (SPEC.md §4.0).
	Latest = V1
)

// Registry maps each version identifier to its Scheme implementation. The
// map key is the single source of truth for a version's identifier: the
// fragment layer writes it as the "v" value, so the emitted version can
// never disagree with the implementation that produced the payload.
var Registry = map[string]Scheme{
	V0: v0{},
	V1: v1{},
}
