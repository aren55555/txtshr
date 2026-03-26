package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"net/url"

	"golang.org/x/crypto/pbkdf2"
)

const (
	pbkdf2Iter = 600_000
	saltLen    = 16
	nonceLen   = 12
	keyLen     = 32
)

// Encrypt returns the URL fragment (without leading #) encoding scheme v1:
// PBKDF2-SHA256 key derivation + AES-256-GCM authenticated encryption.
// A fresh random salt and nonce are generated on every call.
func Encrypt(plaintext []byte, passphrase string) (string, error) {
	salt := make([]byte, saltLen)
	if _, err := rand.Read(salt); err != nil {
		return "", fmt.Errorf("generating salt: %w", err)
	}

	nonce := make([]byte, nonceLen)
	if _, err := rand.Read(nonce); err != nil {
		return "", fmt.Errorf("generating nonce: %w", err)
	}

	key := pbkdf2.Key([]byte(passphrase), salt, pbkdf2Iter, keyLen, sha256.New)

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("creating cipher: %w", err)
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("creating GCM: %w", err)
	}

	// Seal appends the 16-byte GCM authentication tag to the ciphertext.
	ciphertext := gcm.Seal(nil, nonce, plaintext, nil)

	enc := base64.RawURLEncoding
	params := url.Values{
		"v": {"1"},
		"s": {enc.EncodeToString(salt)},
		"n": {enc.EncodeToString(nonce)},
		"c": {enc.EncodeToString(ciphertext)},
	}
	return params.Encode(), nil
}
