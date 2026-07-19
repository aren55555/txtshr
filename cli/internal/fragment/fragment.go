// Package fragment implements the wire format of SPEC.md §3: serializing
// scheme.Params to and from the URL fragment's key=value syntax, with binary
// values encoded as unpadded base64url. It is version-agnostic — key names
// belong to the scheme layer; only "v" (and "r", handled by the CLI) are
// reserved here.
package fragment

import (
	"encoding/base64"
	"errors"
	"fmt"
	"net/url"

	"github.com/aren55555/txtshr/internal/scheme"
)

var enc = base64.RawURLEncoding

// Encode serializes payload parameters and their version identifier into a
// URL fragment (without the leading #).
func Encode(version string, p scheme.Params) string {
	values := url.Values{"v": {version}}
	for key, raw := range p {
		values.Set(key, enc.EncodeToString(raw))
	}
	return values.Encode()
}

// Decode parses a URL fragment (without the leading #) into its version
// identifier and payload parameters. Every key except "v" and "r" is treated
// as a base64url-encoded payload parameter; malformed syntax, a missing "v"
// key, or invalid base64url is an error.
func Decode(fragment string) (version string, p scheme.Params, err error) {
	values, err := url.ParseQuery(fragment)
	if err != nil {
		return "", nil, fmt.Errorf("parsing fragment: %w", err)
	}
	version = values.Get("v")
	if version == "" {
		return "", nil, errors.New(`fragment missing version key "v"`)
	}

	p = scheme.Params{}
	for key := range values {
		if key == "v" || key == "r" {
			continue
		}
		raw, err := enc.DecodeString(values.Get(key))
		if err != nil {
			return "", nil, fmt.Errorf("decoding %q: %w", key, err)
		}
		p[key] = raw
	}
	return version, p, nil
}
