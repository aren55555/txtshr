[private]
default:
    @just --justfile "{{source_file()}}" --list

# Run the component gallery dev server (renders the viewer's actual Solid components)
dev:
    #!/usr/bin/env bash
    set -euo pipefail
    cd "{{justfile_directory()}}/gallery"
    bun install --silent
    bun run dev

# Build the gallery to gallery/dist
build:
    #!/usr/bin/env bash
    set -euo pipefail
    cd "{{justfile_directory()}}/gallery"
    bun install --silent
    bun run build

# Preview the built gallery
preview: build
    #!/usr/bin/env bash
    set -euo pipefail
    cd "{{justfile_directory()}}/gallery"
    bun run preview
