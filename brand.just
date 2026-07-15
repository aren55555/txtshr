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
    # iOS — full-screen launch images (portrait) at 1×/2×/3×
    bun gen-splash.ts -w 375  -h 667  -o "{{justfile_directory()}}/mobile/ios/Runner/Assets.xcassets/LaunchImage.imageset/LaunchImage.png"
    bun gen-splash.ts -w 750  -h 1334 -o "{{justfile_directory()}}/mobile/ios/Runner/Assets.xcassets/LaunchImage.imageset/LaunchImage@2x.png"
    bun gen-splash.ts -w 1242 -h 2208 -o "{{justfile_directory()}}/mobile/ios/Runner/Assets.xcassets/LaunchImage.imageset/LaunchImage@3x.png"
    # Android — centered launch panel (288×512 dp) per density; slate-950 window
    # background (values/colors.xml) blends seamlessly past the panel edges.
    bun gen-splash.ts -w 288  -h 512  -o "{{justfile_directory()}}/mobile/android/app/src/main/res/drawable-mdpi/launch_image.png"
    bun gen-splash.ts -w 432  -h 768  -o "{{justfile_directory()}}/mobile/android/app/src/main/res/drawable-hdpi/launch_image.png"
    bun gen-splash.ts -w 576  -h 1024 -o "{{justfile_directory()}}/mobile/android/app/src/main/res/drawable-xhdpi/launch_image.png"
    bun gen-splash.ts -w 864  -h 1536 -o "{{justfile_directory()}}/mobile/android/app/src/main/res/drawable-xxhdpi/launch_image.png"
    bun gen-splash.ts -w 1152 -h 2048 -o "{{justfile_directory()}}/mobile/android/app/src/main/res/drawable-xxxhdpi/launch_image.png"
