#!/usr/bin/env bun
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { formatHex, clampChroma } from "culori";

const ROOT = join(import.meta.dir, "../..");

// ── Args ───────────────────────────────────────────────────────────────────
const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    width:  { type: "string", short: "w" },
    height: { type: "string", short: "h" },
    output: { type: "string", short: "o" },
  },
});

const W = parseInt(values.width ?? "", 10);
const H = parseInt(values.height ?? "", 10);
const outPath = values.output;

if (!W || !H || !outPath) {
  console.error(
    "Usage: bun gen-splash.ts --width <px> --height <px> --output <path>"
  );
  process.exit(1);
}

// ── Colors (from brand.json, converted oklch → hex for resvg) ─────────────
const brand = JSON.parse(readFileSync(join(ROOT, "brand/brand.json"), "utf8"));
const toHex = (v: string) => formatHex(clampChroma(v, "oklch")) ?? v;
const colors = Object.fromEntries(
  Object.entries(brand.colors as Record<string, string>).map(([k, v]) => [k, toHex(v)])
);
const BG = colors["slate-950"];
const FG = colors["emerald-400"];

// ── Font ───────────────────────────────────────────────────────────────────
const fontB64 = readFileSync(
  join(ROOT, "mobile/assets/fonts/Bytesized-Regular.ttf")
).toString("base64");

// ── Bytesized metrics for "txtshr" ─────────────────────────────────────────
// Each character: advance = 0.5em  (8/16 units)
// Cap height:                0.75em (12/16 units)
const TEXT = "txtshr";
const TEXT_WIDTH_EM = 0.5 * TEXT.length; // 3.0 em
const CAP_HEIGHT_EM = 0.75;

// ── Font size ──────────────────────────────────────────────────────────────
// Guarantee padding = 15% of the shorter dimension on every side,
// regardless of portrait vs landscape orientation.
const PAD = 0.15 * Math.min(W, H);
const availW = W - 2 * PAD;
const availH = H - 2 * PAD;

const fontSize = Math.floor(Math.min(availW / TEXT_WIDTH_EM, availH / CAP_HEIGHT_EM));

// ── Golden ratio ───────────────────────────────────────────────────────────
const PHI = (1 + Math.sqrt(5)) / 2;

// ── Text position (golden ratio, closer to top) ────────────────────────────
// Visual center of cap-height block at H / φ² ≈ H × 0.382 from top.
const capHeight = fontSize * CAP_HEIGHT_EM;
const goldenY = H / (PHI * PHI);
const baselineY = goldenY + capHeight / 2;

// ── Shield grid ────────────────────────────────────────────────────────────
// Shield size tracks the font size so the pattern scales with the wordmark.
// Cell is sized to give ~45% breathing room around each shield.
const shieldSize = fontSize;
const cellSize   = shieldSize / 0.55;
const half       = shieldSize / 2;
const cols = Math.ceil(W / cellSize) + 2;
const rows = Math.ceil(H / cellSize) + 2;

const shieldUses: string[] = [];
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    const cx = c * cellSize + (r % 2 === 1 ? cellSize / 2 : 0) - cellSize / 2;
    const cy = r * cellSize - cellSize / 2;
    shieldUses.push(
      `<use href="#shield" width="${shieldSize.toFixed(2)}" height="${shieldSize.toFixed(2)}" opacity="0.10"` +
      ` transform="translate(${(cx - half).toFixed(2)},${(cy - half).toFixed(2)})"/>`
    );
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <style>
      @font-face {
        font-family: 'Bytesized';
        src: url('data:font/truetype;base64,${fontB64}');
      }
    </style>
    <!-- Shield icon: outer shield (emerald-600), inner shield (emerald-400),
         shackle + lock body (emerald-500), keyhole cutout (BG). -->
    <symbol id="shield" viewBox="0 0 512 512">
      <path d="M256,115 L367,165 L367,268 Q367,356 256,388 Q145,356 145,268 L145,165 Z"
            fill="none" stroke="${colors["emerald-600"]}" stroke-width="9" stroke-linejoin="round"/>
      <path d="M256,135 L349,177 L349,268 Q349,341 256,370 Q163,341 163,268 L163,177 Z"
            fill="none" stroke="${colors["emerald-400"]}" stroke-width="7" stroke-linejoin="round"/>
      <path d="M224,243 L224,208 A32,32 0 0,1 288,208 L288,243"
            fill="none" stroke="${colors["emerald-500"]}" stroke-width="14" stroke-linecap="butt"/>
      <rect x="206" y="226" width="100" height="88" rx="8" fill="${colors["emerald-500"]}"/>
      <circle cx="256" cy="258" r="12" fill="${BG}"/>
      <rect x="250" y="264" width="12" height="19" rx="4" fill="${BG}"/>
    </symbol>
  </defs>
  <rect width="${W}" height="${H}" fill="${BG}"/>
  ${shieldUses}
  <text
    x="${W / 2}"
    y="${baselineY.toFixed(2)}"
    font-family="Bytesized"
    font-size="${fontSize}"
    font-weight="700"
    fill="${FG}"
    text-anchor="middle"
  >${TEXT}</text>
</svg>`;

const resvg = new Resvg(svg, {
  font: {
    loadSystemFonts: false,
    fontDirs: [
      join(ROOT, "mobile/assets/fonts"),
      join(import.meta.dir, "../fonts"),
    ],
    defaultFontFamily: "Bytesized",
  },
});

const png = resvg.render().asPng();
const dest = resolve(outPath);
writeFileSync(dest, png);
console.log(`  ✓  ${dest}  (${W}×${H}, font-size ${fontSize})`);
