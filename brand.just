[private]
default:
    @just --justfile "{{source_file()}}" --list

# Regenerate all brand assets (brand page, SVG, icons, splash screens, feature graphic)
rebuild: _page _icon-svg-generate _icon-rasterize-svg-to-pngs _feature-graphic _splash

# Open the brand reference page in the browser
preview:
    open "{{justfile_directory()}}/brand/index.html"

_page:
    #!/usr/bin/env bash
    set -euo pipefail
    cd "{{justfile_directory()}}/brand/scripts"
    bun install --silent
    bun run gen-brand.ts

_icon-svg-generate:
    #!/usr/bin/env bash
    set -euo pipefail
    cd "{{justfile_directory()}}/brand/scripts"
    bun install --silent
    bun run gen-icon-svg.ts

_icon-rasterize-svg-to-pngs:
    #!/usr/bin/env bash
    set -euo pipefail
    cd "{{justfile_directory()}}/brand/scripts"
    bun install --silent
    bun run gen-icon-pngs.ts

_feature-graphic:
    #!/usr/bin/env bash
    set -euo pipefail
    cd "{{justfile_directory()}}/brand/scripts"
    bun install --silent
    bun run feature-graphic.ts

_splash:
    #!/usr/bin/env bash
    set -euo pipefail
    cd "{{justfile_directory()}}/brand/scripts"
    bun install --silent
    bun gen-splash.ts -w 375  -h 667  -o "{{justfile_directory()}}/mobile/ios/Runner/Assets.xcassets/LaunchImage.imageset/LaunchImage.png"
    bun gen-splash.ts -w 750  -h 1334 -o "{{justfile_directory()}}/mobile/ios/Runner/Assets.xcassets/LaunchImage.imageset/LaunchImage@2x.png"
    bun gen-splash.ts -w 1242 -h 2208 -o "{{justfile_directory()}}/mobile/ios/Runner/Assets.xcassets/LaunchImage.imageset/LaunchImage@3x.png"
