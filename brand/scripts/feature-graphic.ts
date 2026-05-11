import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "fs";

const fontB64 = readFileSync("../../mobile/assets/fonts/Bytesized-Regular.ttf").toString("base64");
const displayFontB64 = readFileSync("../fonts/FunnelDisplay-Bold.ttf").toString("base64");
const iconPath = "../../mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-1024x1024@1x.png";
const iconB64 = readFileSync(iconPath).toString("base64");

const W = 1024;
const H = 500;
const BG = "#0a0e1a";
const TEAL = "#3de0a0";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}">
  <defs>
    <style>
      @font-face {
        font-family: 'Bytesized';
        src: url('data:font/truetype;base64,${fontB64}');
      }
      @font-face {
        font-family: 'Funnel Display';
        font-weight: 700;
        src: url('data:font/truetype;base64,${displayFontB64}');
      }
    </style>
    <clipPath id="iconClip">
      <rect x="664" y="100" width="300" height="300" rx="60" ry="60"/>
    </clipPath>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="${BG}"/>

  <!-- Subtle grid lines -->
  <g stroke="${TEAL}" stroke-opacity="0.04" stroke-width="1">
    ${Array.from({ length: 20 }, (_, i) => `<line x1="${i * 54}" y1="0" x2="${i * 54}" y2="${H}"/>`).join("\n    ")}
    ${Array.from({ length: 10 }, (_, i) => `<line x1="0" y1="${i * 56}" x2="${W}" y2="${i * 56}"/>`).join("\n    ")}
  </g>

  <!-- App icon -->
  <image href="data:image/png;base64,${iconB64}" x="664" y="100" width="300" height="300" clip-path="url(#iconClip)"/>

  <!-- Logo text -->
  <text x="60" y="230" font-family="Bytesized" font-size="96" fill="${TEAL}" letter-spacing="2">txtshr</text>

  <!-- Tagline -->
  <text x="62" y="300" font-family="Funnel Display" font-size="28" font-weight="700" fill="#ffffff" opacity="0.7">Zero-knowledge text sharing</text>

  <!-- Accent line under logo -->
  <rect x="60" y="318" width="420" height="2" fill="${TEAL}" opacity="0.4" rx="1"/>
</svg>`;

const resvg = new Resvg(svg, {
  font: {
    loadSystemFonts: false,
    fontDirs: ["../../mobile/assets/fonts", "../fonts"],
    defaultFontFamily: "Funnel Display",
  },
});
const png = resvg.render().asPng();
writeFileSync("../../mobile/screenshots/feature-graphic.png", png);
console.log("Written: mobile/screenshots/feature-graphic.png");
