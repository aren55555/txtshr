package fragment

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/sha256"
	"encoding/base64"
	"net/url"
	"testing"

	"github.com/aren55555/txtshr/internal/scheme"
	"golang.org/x/crypto/pbkdf2"
)

// encodeFragment runs the full producer pipeline (scheme Encode → fragment
// Encode) for the given version, as main does.
func encodeFragment(t *testing.T, version string, plaintext []byte, passphrase string) string {
	t.Helper()
	p, err := scheme.Registry[version].Encode(plaintext, passphrase)
	if err != nil {
		t.Fatalf("scheme %s Encode: %v", version, err)
	}
	return Encode(version, p)
}

// decryptV1 is an independent reference implementation of the v1 decrypt
// procedure (SPEC.md §4.1), built directly on the primitives with the
// spec-mandated parameters hardcoded. Tests use it to verify that whatever
// the pipeline emits is decryptable under the published contract — if a
// refactor drifts from the spec (iterations, key length, tag handling,
// encoding), these tests fail rather than the viewer.
func decryptV1(t *testing.T, fragment, passphrase string) ([]byte, error) {
	t.Helper()
	params, err := url.ParseQuery(fragment)
	if err != nil {
		t.Fatalf("fragment is not valid query syntax: %v", err)
	}
	if got := params.Get("v"); got != "1" {
		t.Fatalf("v = %q, want %q", got, "1")
	}

	enc := base64.RawURLEncoding
	salt, err := enc.DecodeString(params.Get("s"))
	if err != nil {
		t.Fatalf("s is not valid unpadded base64url: %v", err)
	}
	nonce, err := enc.DecodeString(params.Get("n"))
	if err != nil {
		t.Fatalf("n is not valid unpadded base64url: %v", err)
	}
	ciphertext, err := enc.DecodeString(params.Get("c"))
	if err != nil {
		t.Fatalf("c is not valid unpadded base64url: %v", err)
	}

	key := pbkdf2.Key([]byte(passphrase), salt, 600_000, 32, sha256.New)
	block, err := aes.NewCipher(key)
	if err != nil {
		t.Fatalf("creating cipher: %v", err)
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		t.Fatalf("creating GCM: %v", err)
	}
	return gcm.Open(nil, nonce, ciphertext, nil)
}

func TestV1Contract_Roundtrip(t *testing.T) {
	cases := map[string]string{
		"simple":     "hello world",
		"unicode":    "héllo wörld — ünïcödé ✓ 日本語",
		"url_unsafe": "a&b=c#d?e/f+g h%i",
		"newlines":   "line one\nline two\r\nline three",
		"long":       string(bytes.Repeat([]byte("0123456789"), 10_000)),
	}
	for name, plaintext := range cases {
		t.Run(name, func(t *testing.T) {
			fragment := encodeFragment(t, scheme.V1, []byte(plaintext), "correct horse battery staple")
			got, err := decryptV1(t, fragment, "correct horse battery staple")
			if err != nil {
				t.Fatalf("reference decrypt failed: %v", err)
			}
			if string(got) != plaintext {
				t.Errorf("roundtrip = %q, want %q", got, plaintext)
			}
		})
	}
}

func TestV1Contract_FragmentStructure(t *testing.T) {
	plaintext := []byte("hello world")
	fragment := encodeFragment(t, scheme.V1, plaintext, "pw")
	params, err := url.ParseQuery(fragment)
	if err != nil {
		t.Fatalf("fragment is not valid query syntax: %v", err)
	}

	if got := params.Get("v"); got != "1" {
		t.Errorf("v = %q, want %q", got, "1")
	}
	for key := range params {
		switch key {
		case "v", "s", "n", "c":
		default:
			t.Errorf("unexpected key %q in v1 fragment", key)
		}
	}

	enc := base64.RawURLEncoding
	salt, err := enc.DecodeString(params.Get("s"))
	if err != nil {
		t.Fatalf("s is not valid unpadded base64url: %v", err)
	}
	if len(salt) != 16 {
		t.Errorf("salt length = %d, want 16", len(salt))
	}
	nonce, err := enc.DecodeString(params.Get("n"))
	if err != nil {
		t.Fatalf("n is not valid unpadded base64url: %v", err)
	}
	if len(nonce) != 12 {
		t.Errorf("nonce length = %d, want 12", len(nonce))
	}
	ciphertext, err := enc.DecodeString(params.Get("c"))
	if err != nil {
		t.Fatalf("c is not valid unpadded base64url: %v", err)
	}
	if want := len(plaintext) + 16; len(ciphertext) != want {
		t.Errorf("ciphertext length = %d, want %d (plaintext + 16-byte GCM tag)", len(ciphertext), want)
	}
}

func TestV1Contract_WrongPassphraseFails(t *testing.T) {
	fragment := encodeFragment(t, scheme.V1, []byte("secret"), "right")
	if _, err := decryptV1(t, fragment, "wrong"); err == nil {
		t.Error("decrypt with wrong passphrase succeeded, want authentication failure")
	}
}

func TestV1Contract_EmptyPlaintext(t *testing.T) {
	// The CLI rejects empty input before encoding, but the contract itself
	// should still roundtrip an empty plaintext (the payload is then just
	// the 16-byte tag).
	fragment := encodeFragment(t, scheme.V1, nil, "pw")
	got, err := decryptV1(t, fragment, "pw")
	if err != nil {
		t.Fatalf("reference decrypt failed: %v", err)
	}
	if len(got) != 0 {
		t.Errorf("roundtrip of empty plaintext = %q, want empty", got)
	}
}

func TestV0Contract_Structure(t *testing.T) {
	fragment := encodeFragment(t, scheme.V0, []byte("hello"), "")
	params, err := url.ParseQuery(fragment)
	if err != nil {
		t.Fatalf("fragment is not valid query syntax: %v", err)
	}
	if got := params.Get("v"); got != "0" {
		t.Errorf("v = %q, want %q", got, "0")
	}
	for key := range params {
		if key != "v" && key != "c" {
			t.Errorf("unexpected key %q in v0 fragment", key)
		}
	}
}

func TestV0Contract_Roundtrip(t *testing.T) {
	cases := map[string]string{
		"simple":       "hello world",
		"unicode":      "héllo wörld — ünïcödé ✓ 日本語",
		"url_unsafe":   "a&b=c#d?e/f+g h%i",
		"newlines":     "line one\nline two\r\nline three",
		"single_byte":  "x",
		"base64_edge1": "ab",  // encodes with 1 padding char in standard base64
		"base64_edge2": "abc", // encodes with no padding
	}
	for name, plaintext := range cases {
		t.Run(name, func(t *testing.T) {
			fragment := encodeFragment(t, scheme.V0, []byte(plaintext), "")
			params, err := url.ParseQuery(fragment)
			if err != nil {
				t.Fatalf("parsing fragment: %v", err)
			}
			decoded, err := base64.RawURLEncoding.DecodeString(params.Get("c"))
			if err != nil {
				t.Fatalf("c is not valid unpadded base64url: %v", err)
			}
			if string(decoded) != plaintext {
				t.Errorf("roundtrip = %q, want %q", decoded, plaintext)
			}
		})
	}
}

func TestV0Contract_NoPadding(t *testing.T) {
	// "ab" base64-encodes to "YWI=" with padding; the fragment must use the
	// unpadded encoding.
	fragment := encodeFragment(t, scheme.V0, []byte("ab"), "")
	params, err := url.ParseQuery(fragment)
	if err != nil {
		t.Fatalf("parsing fragment: %v", err)
	}
	if got, want := params.Get("c"), "YWI"; got != want {
		t.Errorf("c = %q, want unpadded %q", got, want)
	}
}

func TestV0Contract_Deterministic(t *testing.T) {
	a := encodeFragment(t, scheme.V0, []byte("same input"), "")
	b := encodeFragment(t, scheme.V0, []byte("same input"), "")
	if a != b {
		t.Errorf("v0 pipeline not deterministic: %q vs %q", a, b)
	}
}

func TestDecode_RoundtripsEncode(t *testing.T) {
	in := scheme.Params{
		"s": {0x00, 0x01, 0xfe, 0xff},
		"n": {0xde, 0xad, 0xbe, 0xef},
		"c": []byte("payload bytes"),
	}
	version, out, err := Decode(Encode("7", in))
	if err != nil {
		t.Fatalf("Decode: %v", err)
	}
	if version != "7" {
		t.Errorf("version = %q, want %q", version, "7")
	}
	if len(out) != len(in) {
		t.Errorf("param count = %d, want %d", len(out), len(in))
	}
	for key, want := range in {
		if !bytes.Equal(out[key], want) {
			t.Errorf("param %q = %x, want %x", key, out[key], want)
		}
	}
}

func TestDecode_SkipsRendererKey(t *testing.T) {
	fragment := Encode("0", scheme.Params{"c": []byte("hi")}) + "&r=" + url.QueryEscape("foo/bar/baz@1.0.0")
	version, p, err := Decode(fragment)
	if err != nil {
		t.Fatalf("Decode: %v", err)
	}
	if version != "0" {
		t.Errorf("version = %q, want %q", version, "0")
	}
	if _, ok := p["r"]; ok {
		t.Error(`"r" leaked into params; it is reserved and not base64url`)
	}
}

func TestDecode_Errors(t *testing.T) {
	cases := map[string]string{
		"missing_v":  "c=aGk",
		"bad_base64": "v=1&c=!!!not-base64!!!",
		"bad_syntax": "v=1&c=%zz",
	}
	for name, fragment := range cases {
		t.Run(name, func(t *testing.T) {
			if _, _, err := Decode(fragment); err == nil {
				t.Errorf("Decode(%q) succeeded, want error", fragment)
			}
		})
	}
}
