package scheme

import "errors"

// v0 implements SPEC.md §4.0: the plaintext carried raw, no encryption.
// The passphrase is ignored; callers must obtain the user's explicit
// per-invocation acknowledgement before emitting a v0 payload.
type v0 struct{}

func (v0) Encrypts() bool { return false }

func (v0) Encode(plaintext []byte, _ string) (Params, error) {
	return Params{"c": plaintext}, nil
}

func (v0) Decode(p Params, _ string) ([]byte, error) {
	content, ok := p["c"]
	if !ok {
		return nil, errors.New(`v0: payload missing content key "c"`)
	}
	return content, nil
}
