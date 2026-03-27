# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**txtshr** is a secure, zero-knowledge text-sharing app. The CLI encrypts plaintext and produces a shareable URL; the web viewer decrypts it entirely in-browser. The server never sees plaintext or the passphrase — everything sensitive lives in the URL fragment (`#`).

## Commands

### CLI (Go)
```bash
go build ./cli          # build the CLI binary
go run ./cli            # run directly
go test ./...           # run tests
```

### Viewer (TypeScript/Solid.js)
The `viewer/` directory uses **Bun** as the package manager and runtime (not npm).
```bash
cd viewer
bun install
bun run dev             # dev server (Vite)
bun run build           # production bundle
bun run preview         # preview production build
```

### Container
```bash
./scripts/build-viewer-image-and-push   # build multi-platform image and push to aren55555/txtshr:latest
```

## Architecture

### Cryptography (shared scheme between CLI and viewer)

Both sides implement the same scheme and must stay in sync:
- **Key derivation**: PBKDF2-SHA256, 600,000 iterations
- **Encryption**: AES-256-GCM (authenticated)
- **Encoding**: Base64-URL
- **URL fragment format**: `URLSearchParams` with keys `v` (version), `s` (salt), `n` (nonce), `c` (ciphertext), `r` (optional renderer spec)

CLI implementation: `cli/internal/crypto/encrypt.go`
Viewer implementation: `viewer/src/crypto.ts` (Web Crypto API)

### CLI (`cli/`)

- `main.go` — reads stdin, prompts for passphrase via `/dev/tty` (so piped input works), calls encrypt, prints URL
- `internal/crypto/encrypt.go` — core PBKDF2 + AES-GCM logic

### Viewer (`viewer/`)

- `src/index.tsx` — entry point; mounts the Solid.js app
- `src/App.tsx` — Solid.js component; parses URL fragment, manages form state, calls decrypt, handles renderer warn/load/success states
- `src/crypto.ts` — decryption logic mirroring the CLI scheme using the Web Crypto API
- `src/renderer.ts` — remote renderer support: parses/validates renderer specs (`owner/repo/name[@version]`), resolves them to jsDelivr CDN URLs, and dynamically imports the renderer module
- `src/renderer.test.ts` — tests for renderer spec parsing and URL resolution
- `Containerfile` — multi-stage build: Bun for building, `static-web-server` for serving

## Key Design Decisions

- The URL fragment is never sent to the server (browser behavior), so the server is truly zero-knowledge.
- Passphrase input in the CLI is read from `/dev/tty` directly to support `cat file | txtshr`.
- Versioning (`v=1` in the fragment) allows future crypto scheme changes without breaking old links.
- Remote renderers (`r` param) are loaded from jsDelivr CDN as ES modules. The viewer shows a trust warning before proceeding, since the renderer receives access to the decrypted content. Renderer specs use the format `owner/repo/name[@version]` and are validated to contain only safe URL characters.
