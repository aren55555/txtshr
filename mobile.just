# Version from mobile/pubspec.yaml, e.g. "1.0.2+5"
version := `sed -n -E 's/^version: *([^ ]+).*/\1/p' mobile/pubspec.yaml`

[private]
default:
    @just --justfile "{{source_file()}}" --list

# Create the mobile-v<name> tag for the current pubspec version (F-Droid builds new tags automatically)
tag:
    #!/usr/bin/env bash
    set -euo pipefail
    name="{{ version }}"; name="${name%%+*}"
    code="{{ version }}"; code="${code##*+}"
    changelog="fastlane/metadata/android/en-US/changelogs/${code}.txt"
    test -f "$changelog" || { echo "error: missing $changelog (F-Droid release notes for versionCode $code)" >&2; exit 1; }
    git diff --quiet HEAD -- mobile fastlane || { echo "error: uncommitted changes in mobile/ or fastlane/" >&2; exit 1; }
    git tag -a "mobile-v${name}" -m "txtshr mobile ${name} (${code})"
    echo "Created tag mobile-v${name}. Push it with: git push origin mobile-v${name}"
