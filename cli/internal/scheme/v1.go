package scheme

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"fmt"

	"golang.org/x/crypto/pbkdf2"
)

const (
	v1PBKDF2Iter = 600_000
	v1SaltLen    = 16
	v1NonceLen   = 12
	v1KeyLen     = 32
)

// v1 implements SPEC.md §4.1: PBKDF2-SHA256 key derivation + AES-256-GCM
// authenticated encryption. A fresh random salt and nonce are generated on
// every Encode. Payload keys: "s" (salt), "n" (nonce), "c" (ciphertext with
// the 16-byte GCM tag appended).
type v1 struct{}

func (v1) Encrypts() bool { return true }

func (v1) aead(passphrase string, salt []byte) (cipher.AEAD, error) {
	key := pbkdf2.Key([]byte(passphrase), salt, v1PBKDF2Iter, v1KeyLen, sha256.New)
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("creating cipher: %w", err)
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("creating GCM: %w", err)
	}
	return gcm, nil
}

func (s v1) Encode(plaintext []byte, passphrase string) (Params, error) {
	salt := make([]byte, v1SaltLen)
	if _, err := rand.Read(salt); err != nil {
		return nil, fmt.Errorf("generating salt: %w", err)
	}
	nonce := make([]byte, v1NonceLen)
	if _, err := rand.Read(nonce); err != nil {
		return nil, fmt.Errorf("generating nonce: %w", err)
	}

	gcm, err := s.aead(passphrase, salt)
	if err != nil {
		return nil, err
	}

	// Seal appends the 16-byte GCM authentication tag to the ciphertext.
	return Params{
		"s": salt,
		"n": nonce,
		"c": gcm.Seal(nil, nonce, plaintext, nil),
	}, nil
}

func (s v1) Decode(p Params, passphrase string) ([]byte, error) {
	salt, nonce, ciphertext := p["s"], p["n"], p["c"]
	if len(salt) != v1SaltLen {
		return nil, fmt.Errorf(`v1: salt "s" length = %d, want %d`, len(salt), v1SaltLen)
	}
	if len(nonce) != v1NonceLen {
		return nil, fmt.Errorf(`v1: nonce "n" length = %d, want %d`, len(nonce), v1NonceLen)
	}
	if ciphertext == nil {
		return nil, fmt.Errorf(`v1: payload missing ciphertext key "c"`)
	}

	gcm, err := s.aead(passphrase, salt)
	if err != nil {
		return nil, err
	}
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, fmt.Errorf("v1: decrypting (wrong passphrase or tampered payload): %w", err)
	}
	return plaintext, nil
}
