package scheme

import (
	"bytes"
	"testing"
)

func TestRegistry_ContainsAllVersions(t *testing.T) {
	for _, version := range []string{V0, V1} {
		if _, ok := Registry[version]; !ok {
			t.Errorf("Registry missing version %q", version)
		}
	}
	if _, ok := Registry[Latest]; !ok {
		t.Errorf("Latest (%q) not present in Registry", Latest)
	}
	if !Registry[Latest].Encrypts() {
		t.Error("Latest must be an encrypting version (SPEC.md §4.0)")
	}
}

func TestV0_Encrypts(t *testing.T) {
	if Registry[V0].Encrypts() {
		t.Error("v0.Encrypts() = true, want false")
	}
}

func TestV0_RoundtripIgnoresPassphrase(t *testing.T) {
	s := Registry[V0]
	p, err := s.Encode([]byte("hello"), "ignored")
	if err != nil {
		t.Fatalf("Encode: %v", err)
	}
	// Decode with a different (and empty) passphrase must succeed: v0 does
	// not use one.
	got, err := s.Decode(p, "")
	if err != nil {
		t.Fatalf("Decode: %v", err)
	}
	if string(got) != "hello" {
		t.Errorf("roundtrip = %q, want %q", got, "hello")
	}
}

func TestV0_ParamsShape(t *testing.T) {
	p, err := Registry[V0].Encode([]byte("hello"), "")
	if err != nil {
		t.Fatalf("Encode: %v", err)
	}
	if len(p) != 1 {
		t.Errorf("v0 params has %d keys, want 1", len(p))
	}
	if !bytes.Equal(p["c"], []byte("hello")) {
		t.Errorf(`p["c"] = %q, want raw plaintext`, p["c"])
	}
}

func TestV0_DecodeMissingContent(t *testing.T) {
	if _, err := Registry[V0].Decode(Params{}, ""); err == nil {
		t.Error(`Decode of params without "c" succeeded, want error`)
	}
}

func TestV0_DecodeIgnoresUnknownKeys(t *testing.T) {
	// SPEC.md §3: unknown keys must be ignored for forward compatibility.
	p := Params{"c": []byte("hello"), "zz": []byte("future")}
	got, err := Registry[V0].Decode(p, "")
	if err != nil {
		t.Fatalf("Decode: %v", err)
	}
	if string(got) != "hello" {
		t.Errorf("roundtrip = %q, want %q", got, "hello")
	}
}

func TestV1_Encrypts(t *testing.T) {
	if !Registry[V1].Encrypts() {
		t.Error("v1.Encrypts() = false, want true")
	}
}

func TestV1_Roundtrip(t *testing.T) {
	s := Registry[V1]
	plaintext := []byte("héllo wörld — ünïcödé ✓ 日本語")
	p, err := s.Encode(plaintext, "correct horse battery staple")
	if err != nil {
		t.Fatalf("Encode: %v", err)
	}
	got, err := s.Decode(p, "correct horse battery staple")
	if err != nil {
		t.Fatalf("Decode: %v", err)
	}
	if !bytes.Equal(got, plaintext) {
		t.Errorf("roundtrip = %q, want %q", got, plaintext)
	}
}

func TestV1_ParamsShape(t *testing.T) {
	plaintext := []byte("hello world")
	p, err := Registry[V1].Encode(plaintext, "pw")
	if err != nil {
		t.Fatalf("Encode: %v", err)
	}
	if len(p) != 3 {
		t.Errorf("v1 params has %d keys, want 3 (s, n, c)", len(p))
	}
	if len(p["s"]) != 16 {
		t.Errorf("salt length = %d, want 16", len(p["s"]))
	}
	if len(p["n"]) != 12 {
		t.Errorf("nonce length = %d, want 12", len(p["n"]))
	}
	if want := len(plaintext) + 16; len(p["c"]) != want {
		t.Errorf("ciphertext length = %d, want %d (plaintext + 16-byte GCM tag)", len(p["c"]), want)
	}
}

func TestV1_WrongPassphraseFails(t *testing.T) {
	s := Registry[V1]
	p, err := s.Encode([]byte("secret"), "right")
	if err != nil {
		t.Fatalf("Encode: %v", err)
	}
	if _, err := s.Decode(p, "wrong"); err == nil {
		t.Error("Decode with wrong passphrase succeeded, want authentication failure")
	}
}

func TestV1_TamperDetection(t *testing.T) {
	s := Registry[V1]
	p, err := s.Encode([]byte("secret"), "pw")
	if err != nil {
		t.Fatalf("Encode: %v", err)
	}
	p["c"][0] ^= 0x01
	if _, err := s.Decode(p, "pw"); err == nil {
		t.Error("Decode of tampered ciphertext succeeded, want authentication failure")
	}
}

func TestV1_FreshRandomness(t *testing.T) {
	// SPEC.md §2.1: fresh salt and nonce every call, so encrypting the same
	// plaintext twice must yield entirely distinct params.
	s := Registry[V1]
	first, err := s.Encode([]byte("same input"), "pw")
	if err != nil {
		t.Fatalf("Encode: %v", err)
	}
	second, err := s.Encode([]byte("same input"), "pw")
	if err != nil {
		t.Fatalf("Encode: %v", err)
	}
	for _, key := range []string{"s", "n", "c"} {
		if bytes.Equal(first[key], second[key]) {
			t.Errorf("key %q identical across two Encode calls, want fresh randomness", key)
		}
	}
}

func TestV1_DecodeRejectsMissingParams(t *testing.T) {
	s := Registry[V1]
	valid, err := s.Encode([]byte("secret"), "pw")
	if err != nil {
		t.Fatalf("Encode: %v", err)
	}
	for _, missing := range []string{"s", "n", "c"} {
		t.Run("missing_"+missing, func(t *testing.T) {
			p := Params{}
			for k, v := range valid {
				if k != missing {
					p[k] = v
				}
			}
			if _, err := s.Decode(p, "pw"); err == nil {
				t.Errorf("Decode without %q succeeded, want error", missing)
			}
		})
	}
}
