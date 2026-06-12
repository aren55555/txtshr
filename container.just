# Container runtime: docker if on PATH, else podman. Override with `just container_cmd=... container <recipe>`
container_cmd := `command -v docker >/dev/null && echo docker || { command -v podman >/dev/null && echo podman || true; }`

image := "aren55555/txtshr:latest"

[private]
default:
    @just --justfile "{{source_file()}}" --list

# Build the viewer container image
build:
    @test -n "{{ container_cmd }}" || { echo "error: no container runtime found (tried docker and podman)" >&2; exit 1; }
    {{ container_cmd }} build \
        --platform linux/amd64 \
        --build-arg GIT_SHA=$(git rev-parse HEAD) \
        -f "{{justfile_directory()}}/viewer/Containerfile" \
        -t {{ image }} \
        "{{justfile_directory()}}/viewer"

# Build and push the viewer container image to Docker Hub
push: build
    {{ container_cmd }} push {{ image }}
