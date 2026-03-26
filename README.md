# txtshr

A secure, zero-knowledge text-sharing tool. The CLI encrypts plaintext and produces a shareable URL; the web viewer decrypts it entirely in-browser. The server never sees the plaintext or passphrase — all sensitive data lives in the URL fragment (`#`), which browsers never send to the server.

## How it works

1. Run the CLI with some text (or pipe it in)
2. Enter a passphrase when prompted
3. Get back a URL — share it with whoever needs the text
4. The recipient opens the URL and enters the passphrase to decrypt

The encryption happens locally. The URL fragment is never transmitted to the server (standard browser behavior), so the viewer host is completely zero-knowledge.

## Cryptography

- **Key derivation**: PBKDF2-SHA256, 600,000 iterations
- **Encryption**: AES-256-GCM (authenticated)
- **Encoding**: Base64-URL
- **URL fragment format**: `URLSearchParams` with keys `v` (version), `s` (salt), `n` (nonce), `c` (ciphertext)

## CLI

### Install

```bash
go install github.com/aren55555/txtshr/cli@latest
```

Or build from source:

```bash
git clone https://github.com/aren55555/txtshr
cd txtshr
go build -o txtshr ./cli
```

### Usage

```bash
# Interactive — prompts for passphrase
echo "secret message" | txtshr

# Pipe text, passphrase via flag
cat secret.txt | txtshr --password "my passphrase"

# Text via flag
txtshr --text "secret message"

# Point at a self-hosted viewer
TXTSHR_VIEWER_URL=https://your-viewer.example.com txtshr --text "hello"
# or
txtshr --viewer-url https://your-viewer.example.com --text "hello"
```

The passphrase is always read from `/dev/tty` when prompted interactively, so piped input works correctly.

## Viewer

The viewer is a static Solid.js app. It parses the URL fragment, prompts for the passphrase, and decrypts using the Web Crypto API — no server involvement.

### Self-hosting

Pull the pre-built image:

```bash
docker run -p 8080:80 aren55555/txtshr:latest
```

Or build from source:

```bash
cd viewer
npm install
npm run build
# serve the dist/ directory with any static file server
```

Set `TXTSHR_VIEWER_URL` (or `--viewer-url`) in the CLI to point at your instance.

## Development

### CLI

```bash
go run ./cli
go test ./...
```

### Viewer

```bash
cd viewer
npm install
npm run dev      # dev server (Vite)
npm run build    # production bundle
npm run preview  # preview production build
```

### Container image

```bash
./scripts/build-viewer-image-and-push
```

Requires Docker or Podman. Builds and pushes `aren55555/txtshr:latest`.

## Repository layout

```
cli/
  main.go                    # entry point — stdin/flag handling, passphrase prompt
  internal/crypto/encrypt.go # PBKDF2 + AES-GCM encryption
viewer/
  src/App.tsx                # Solid.js UI — fragment parsing, decrypt flow
  src/crypto.ts              # Web Crypto decryption (mirrors CLI scheme)
  Containerfile              # multi-stage build: Bun → static-web-server
scripts/
  build-viewer-image-and-push
```
