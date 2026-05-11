#!/usr/bin/env bun
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dir, '../..')

const brand  = JSON.parse(readFileSync(join(ROOT, 'brand/brand.json'), 'utf8'))
const colors: Record<string, string> = brand.colors

// ── Helpers ────────────────────────────────────────────────────────────────
const c = (token: string) => `var(--${token})`
const cssVars = Object.entries(colors).map(([k, v]) => `    --${k}: ${v};`).join('\n')

function swatch({ token, usage }: { token: string; usage: string }) {
  return `
          <div class="swatch">
            <div class="swatch-chip" style="background:${c(token)}"></div>
            <div class="swatch-info">
              <div class="swatch-tw">${token}</div>
              <div class="swatch-val">${colors[token]}</div>
              <div class="swatch-use">${usage}</div>
            </div>
          </div>`
}

function paletteGroup({ name, colors: cols }: { name: string; colors: any[] }) {
  return `
        <div class="palette-group">
          <div class="palette-group-name">${name}</div>
          <div class="swatches">${cols.map(swatch).join('')}
          </div>
        </div>`
}

function typeCard({ name, role, source, note, sample, sampleClass }: any) {
  return `
      <div class="type-card">
        <div class="type-card-meta">
          <div class="type-card-name">${name}</div>
          <div class="type-card-role">${role}</div>
        </div>
        <div class="type-divider"></div>
        <div class="type-sample">
          <div class="${sampleClass}">${sample}</div>
        </div>
        <div class="type-spec">${source}<br>${note}</div>
      </div>`
}

// ── Asset catalog data ─────────────────────────────────────────────────────
const iosIconDir  = '../mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset'
const launchDir   = '../mobile/ios/Runner/Assets.xcassets/LaunchImage.imageset'
const androidBase = '../mobile/android/app/src/main/res'

const iosIconList: Array<{ name: string; px: number; usage: string }> = [
  { name: 'Icon-App-20x20@1x.png',      px: 20,   usage: 'Notification 1×' },
  { name: 'Icon-App-20x20@2x.png',      px: 40,   usage: 'Notification 2×' },
  { name: 'Icon-App-20x20@3x.png',      px: 60,   usage: 'Notification 3×' },
  { name: 'Icon-App-29x29@1x.png',      px: 29,   usage: 'Settings 1×' },
  { name: 'Icon-App-29x29@2x.png',      px: 58,   usage: 'Settings 2×' },
  { name: 'Icon-App-29x29@3x.png',      px: 87,   usage: 'Settings 3×' },
  { name: 'Icon-App-40x40@1x.png',      px: 40,   usage: 'Spotlight 1×' },
  { name: 'Icon-App-40x40@2x.png',      px: 80,   usage: 'Spotlight 2×' },
  { name: 'Icon-App-40x40@3x.png',      px: 120,  usage: 'Spotlight 3×' },
  { name: 'Icon-App-60x60@2x.png',      px: 120,  usage: 'iPhone App 2×' },
  { name: 'Icon-App-60x60@3x.png',      px: 180,  usage: 'iPhone App 3×' },
  { name: 'Icon-App-76x76@1x.png',      px: 76,   usage: 'iPad App 1×' },
  { name: 'Icon-App-76x76@2x.png',      px: 152,  usage: 'iPad App 2×' },
  { name: 'Icon-App-83.5x83.5@2x.png', px: 167,  usage: 'iPad Pro 2×' },
  { name: 'Icon-App-1024x1024@1x.png', px: 1024, usage: 'App Store' },
]

const iosSplashList: Array<{ name: string; w: number; h: number; scale: string }> = [
  { name: 'LaunchImage.png',    w: 375,  h: 667,  scale: '1×' },
  { name: 'LaunchImage@2x.png', w: 750,  h: 1334, scale: '2×' },
  { name: 'LaunchImage@3x.png', w: 1242, h: 2208, scale: '3×' },
]

const androidIconList: Array<{ density: string; px: number }> = [
  { density: 'mipmap-mdpi',    px: 48  },
  { density: 'mipmap-hdpi',    px: 72  },
  { density: 'mipmap-xhdpi',   px: 96  },
  { density: 'mipmap-xxhdpi',  px: 144 },
  { density: 'mipmap-xxxhdpi', px: 192 },
]

// ── Asset catalog helpers ──────────────────────────────────────────────────
function iconChip(src: string, filename: string, dims: string, usage: string) {
  return `
          <div class="icon-chip">
            <div class="icon-chip-preview">
              <img src="${src}" alt="${filename}" class="icon-chip-img">
            </div>
            <div class="icon-chip-info">
              <div class="icon-chip-name">${filename}</div>
              <div class="icon-chip-meta">${dims}</div>
              <div class="icon-chip-usage">${usage}</div>
            </div>
          </div>`
}

function splashThumb(src: string, filename: string, dims: string, scale: string) {
  return `
          <div class="splash-thumb">
            <div class="splash-thumb-preview">
              <img src="${src}" alt="${filename}">
            </div>
            <div class="splash-thumb-info">
              <div class="icon-chip-name">${filename}</div>
              <div class="icon-chip-meta">${dims} · ${scale}</div>
            </div>
          </div>`
}

function assetSubgroup(label: string, content: string) {
  return `
        <div class="asset-subgroup">
          <div class="asset-subgroup-label">${label}</div>
          ${content}
        </div>`
}

const wm = brand.wordmark
const specRows = [
  { key: 'Typeface',  val: wm.typeface },
  { key: 'Color',     val: `${wm.colorToken} &nbsp;·&nbsp; ${colors[wm.colorToken]}` },
  { key: 'Rendering', val: wm.rendering },
  { key: 'Weight',    val: wm.weight },
].map(({ key, val }) => `
          <div class="spec-row">
            <span class="spec-key">${key}</span>
            <span class="spec-val">${val}</span>
          </div>`).join('')

// ── HTML ───────────────────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>txtshr — Brand</title>
  <link rel="icon" href="../viewer/public/favicon.png">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/bytesized/index.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@300..800&family=Inter:opsz,wght@14..32,100..900&display=swap" rel="stylesheet">
  <style>
    /* ── Reset ───────────────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Fonts ───────────────────────────────────────────────── */
    :root {
      --font-sans:    'Inter', ui-sans-serif, system-ui, sans-serif;
      --font-brand:   'Bytesized', 'Courier New', monospace;
      --font-display: 'Funnel Display', ui-sans-serif, system-ui, sans-serif;
    }

    /* ── Base ────────────────────────────────────────────────── */
    body {
      background: ${c('slate-950')};
      color: ${c('slate-100')};
      font-family: var(--font-sans);
      font-size: 13px;
      line-height: 1.6;
      min-height: 100vh;
      background-image: radial-gradient(circle, ${c('slate-800')} 1px, transparent 1px);
      background-size: 24px 24px;
    }
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background: radial-gradient(ellipse 80% 60% at 50% 40%, transparent 30%, ${c('slate-950')} 100%);
      pointer-events: none;
      z-index: 0;
    }

    /* ── Layout ──────────────────────────────────────────────── */
    .page {
      position: relative;
      z-index: 1;
      max-width: 960px;
      margin: 0 auto;
      padding: 56px 40px 100px;
    }

    /* ── Header ──────────────────────────────────────────────── */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 56px;
      padding-bottom: 20px;
      border-bottom: 1px solid ${c('slate-800')};
    }
    .page-title {
      font-family: var(--font-display);
      font-size: 11px;
      font-weight: 700;
      color: ${c('slate-500')};
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .page-subtitle {
      font-size: 11px;
      color: ${c('slate-600')};
      font-variant-numeric: tabular-nums;
    }

    /* ── Sections ────────────────────────────────────────────── */
    section { margin-bottom: 60px; }
    section:last-child { margin-bottom: 0; }
    .section-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: ${c('slate-600')};
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid ${c('slate-800')};
    }

    /* ── Mark ────────────────────────────────────────────────── */
    .mark-grid {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 48px;
      align-items: center;
    }
    .mark-icon-wrap {
      width: 128px;
      height: 128px;
      border-radius: 22px;
      overflow: hidden;
      border: 1px solid ${c('slate-800')};
      box-shadow: 0 0 0 1px ${c('slate-800')}, 0 8px 32px rgba(0,0,0,.5);
      flex-shrink: 0;
    }
    .mark-icon { width: 100%; height: 100%; display: block; }
    .wordmark {
      font-family: var(--font-brand);
      font-size: 88px;
      font-weight: 700;
      color: ${c('emerald-400')};
      line-height: 1;
      -webkit-font-smoothing: none;
      font-smooth: never;
      letter-spacing: -0.01em;
    }
    .wordmark-specs { display: flex; flex-direction: column; gap: 5px; margin-top: 14px; }
    .spec-row { display: flex; align-items: center; gap: 10px; font-size: 11px; }
    .spec-key { color: ${c('slate-600')}; min-width: 80px; }
    .spec-val {
      font-family: 'Courier New', monospace;
      font-size: 10px;
      color: ${c('slate-400')};
      background: ${c('slate-900')};
      border: 1px solid ${c('slate-800')};
      padding: 2px 7px;
      border-radius: 4px;
    }

    /* ── SVG asset ───────────────────────────────────────────── */
    .svg-asset {
      margin-top: 32px;
      background: ${c('slate-900')};
      border: 1px solid ${c('slate-800')};
      border-radius: 12px;
      overflow: hidden;
    }
    .svg-asset-preview {
      padding: 32px 28px;
      display: flex;
      align-items: center;
      background-image:
        linear-gradient(45deg, ${c('slate-800')} 25%, transparent 25%),
        linear-gradient(-45deg, ${c('slate-800')} 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, ${c('slate-800')} 75%),
        linear-gradient(-45deg, transparent 75%, ${c('slate-800')} 75%);
      background-size: 12px 12px;
      background-position: 0 0, 0 6px, 6px -6px, -6px 0px;
      background-color: ${c('slate-900')};
    }
    .svg-asset-preview img { height: 56px; width: auto; }
    .svg-asset-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-top: 1px solid ${c('slate-800')};
      gap: 12px;
    }
    .svg-asset-name { font-family: 'Courier New', monospace; font-size: 11px; color: ${c('slate-500')}; }
    .svg-asset-note { font-size: 10px; color: ${c('slate-600')}; flex: 1; }
    .svg-download {
      font-size: 11px;
      color: ${c('emerald-400')};
      text-decoration: none;
      font-family: var(--font-sans);
      padding: 3px 10px;
      border: 1px solid color-mix(in srgb, ${c('emerald-400')} 25%, transparent);
      border-radius: 5px;
      white-space: nowrap;
      transition: background 0.15s;
    }
    .svg-download:hover { background: color-mix(in srgb, ${c('emerald-400')} 10%, transparent); }

    /* ── Typography ──────────────────────────────────────────── */
    .type-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
    .type-card {
      background: ${c('slate-900')};
      border: 1px solid ${c('slate-800')};
      border-radius: 12px;
      padding: 22px 20px 18px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .type-card-meta { display: flex; flex-direction: column; gap: 2px; }
    .type-card-name { font-size: 12px; font-weight: 600; color: ${c('slate-100')}; }
    .type-card-role { font-size: 10px; color: ${c('slate-500')}; }
    .type-divider   { height: 1px; background: ${c('slate-800')}; }
    .type-sample    { flex: 1; }
    .sample-bytesized {
      font-family: var(--font-brand);
      font-size: 40px;
      font-weight: 700;
      color: ${c('emerald-400')};
      line-height: 1;
      -webkit-font-smoothing: none;
      font-smooth: never;
    }
    .sample-display {
      font-family: var(--font-display);
      font-size: 26px;
      font-weight: 700;
      color: ${c('slate-100')};
      line-height: 1.2;
    }
    .sample-sans {
      font-family: var(--font-sans);
      font-size: 14px;
      color: ${c('slate-300')};
      line-height: 1.5;
    }
    .type-spec { font-family: 'Courier New', monospace; font-size: 10px; color: ${c('slate-600')}; line-height: 1.5; }

    /* ── Palette ─────────────────────────────────────────────── */
    .palette       { display: flex; flex-direction: column; gap: 28px; }
    .palette-group { display: flex; flex-direction: column; gap: 10px; }
    .palette-group-name {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: ${c('slate-500')};
    }
    .swatches { display: flex; gap: 8px; flex-wrap: wrap; }
    .swatch {
      width: 114px;
      border-radius: 9px;
      overflow: hidden;
      border: 1px solid ${c('slate-800')};
    }
    .swatch-chip { height: 68px; }
    .swatch-info {
      background: ${c('slate-900')};
      padding: 8px 10px 9px;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    .swatch-tw  { font-family: 'Courier New', monospace; font-size: 10px; font-weight: 700; color: ${c('slate-200')}; }
    .swatch-val { font-family: 'Courier New', monospace; font-size: 9px; color: ${c('slate-500')}; line-height: 1.4; word-break: break-all; }
    .swatch-use { font-size: 10px; color: ${c('slate-600')}; margin-top: 3px; line-height: 1.3; }

    /* ── UI Conventions ─────────────────────────────────────── */
    .convention-grid { display: flex; flex-direction: column; gap: 20px; }
    .convention-card {
      background: ${c('slate-900')};
      border: 1px solid ${c('slate-800')};
      border-radius: 12px;
      padding: 22px 20px 18px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .convention-title { font-size: 12px; font-weight: 600; color: ${c('slate-100')}; }
    .convention-desc { font-size: 11px; color: ${c('slate-400')}; line-height: 1.6; }
    .convention-desc strong { color: ${c('slate-300')}; font-weight: 600; }
    .convention-examples { display: flex; flex-direction: column; gap: 8px; }
    .convention-row { display: flex; align-items: center; gap: 8px; }
    .convention-label { font-size: 10px; color: ${c('slate-500')}; min-width: 90px; }
    .convention-chip {
      font-family: 'Courier New', monospace;
      font-size: 10px;
      color: ${c('slate-300')};
      background: ${c('slate-800')};
      border: 1px solid ${c('slate-700')};
      padding: 2px 8px;
      border-radius: 4px;
    }
    .convention-sep { font-size: 10px; color: ${c('slate-600')}; }
    .convention-live { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }

    /* ── Asset catalog ──────────────────────────────────────── */
    .asset-subgroup { margin-bottom: 36px; }
    .asset-subgroup:last-child { margin-bottom: 0; }
    .asset-subgroup-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: ${c('slate-500')};
      margin-bottom: 12px;
    }
    .icon-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .icon-chip {
      width: 120px;
      background: ${c('slate-900')};
      border: 1px solid ${c('slate-800')};
      border-radius: 9px;
      overflow: hidden;
    }
    .icon-chip-preview {
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-image:
        linear-gradient(45deg, ${c('slate-800')} 25%, transparent 25%),
        linear-gradient(-45deg, ${c('slate-800')} 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, ${c('slate-800')} 75%),
        linear-gradient(-45deg, transparent 75%, ${c('slate-800')} 75%);
      background-size: 10px 10px;
      background-position: 0 0, 0 5px, 5px -5px, -5px 0px;
      background-color: ${c('slate-900')};
    }
    .icon-chip-img { max-width: 48px; max-height: 48px; display: block; image-rendering: pixelated; }
    .icon-chip-info { padding: 7px 9px 9px; display: flex; flex-direction: column; gap: 2px; }
    .icon-chip-name { font-family: 'Courier New', monospace; font-size: 9px; color: ${c('slate-300')}; word-break: break-all; line-height: 1.3; }
    .icon-chip-meta { font-size: 9px; color: ${c('slate-500')}; margin-top: 1px; }
    .icon-chip-usage { font-size: 9px; color: ${c('slate-600')}; }
    .splash-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-start; }
    .splash-thumb {
      background: ${c('slate-900')};
      border: 1px solid ${c('slate-800')};
      border-radius: 9px;
      overflow: hidden;
    }
    .splash-thumb-preview {
      height: 160px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px;
      background: ${c('slate-950')};
    }
    .splash-thumb-preview img {
      max-height: 136px;
      max-width: 120px;
      display: block;
      border-radius: 3px;
      box-shadow: 0 2px 12px rgba(0,0,0,.5);
    }
    .splash-thumb-info { padding: 7px 9px 9px; display: flex; flex-direction: column; gap: 2px; }
    .wide-asset-img { max-width: 100%; height: auto; display: block; border-radius: 4px; }

    /* ── Lightbox ────────────────────────────────────────────── */
    .icon-chip-preview img,
    .splash-thumb-preview img,
    .svg-asset-preview img,
    .mark-icon { cursor: zoom-in; }
    dialog.lightbox { background: transparent; border: none; padding: 0; outline: none; max-width: 90vw; max-height: 90vh; }
    dialog.lightbox::backdrop { background: rgba(0,0,0,.88); cursor: zoom-out; }
    dialog.lightbox img { display: block; max-width: 90vw; max-height: 90vh; object-fit: contain; border-radius: 8px; box-shadow: 0 0 0 1px rgba(255,255,255,.08), 0 24px 64px rgba(0,0,0,.6); }

    /* ── Responsive ──────────────────────────────────────────── */
    @media (max-width: 680px) {
      .page  { padding: 40px 20px 80px; }
      .mark-grid  { grid-template-columns: 1fr; gap: 28px; }
      .wordmark   { font-size: 64px; }
      .type-grid  { grid-template-columns: 1fr; }
    }
  </style>
  <style id="color-vars">
  /* source of truth: brand/colors.json — regenerated by: just gen-brand */
  :root {
${cssVars}
  }
  </style>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      document.fonts.ready.then(() => { document.body.style.opacity = '1'; });
    });
  </script>
</head>
<body style="opacity:0;transition:opacity 0.4s ease">
<div class="page">

  <header class="page-header">
    <span class="page-title">txtshr — Brand</span>
    <span class="page-subtitle">Internal reference</span>
  </header>

  <!-- Mark & Wordmark -->
  <section>
    <div class="section-label">Mark &amp; Wordmark</div>
    <div class="mark-grid">
      <div class="mark-icon-wrap">
        <img src="../viewer/public/favicon.png" alt="txtshr app icon" class="mark-icon">
      </div>
      <div>
        <div class="wordmark">${wm.text}</div>
        <div class="wordmark-specs">${specRows}
        </div>
      </div>
    </div>
    <div class="svg-asset">
      <div class="svg-asset-preview">
        <img src="icon.svg" alt="txtshr SVG icon" style="height:96px;width:96px;">
      </div>
      <div class="svg-asset-footer">
        <span class="svg-asset-name">icon.svg</span>
        <span class="svg-asset-note">Resolved from icon.template.svg — regenerate with: just gen-icons</span>
        <a href="icon.svg" download class="svg-download">↓ Download</a>
      </div>
    </div>
  </section>

  <!-- Typography -->
  <section>
    <div class="section-label">Typography</div>
    <div class="type-grid">${brand.typography.map(typeCard).join('')}
    </div>
  </section>

  <!-- Color Palette -->
  <section>
    <div class="section-label">Color Palette</div>
    <div class="palette">${brand.colorGroups.map(paletteGroup).join('')}
    </div>
  </section>

  <!-- UI Conventions -->
  <section>
    <div class="section-label">UI Conventions</div>
    <div class="convention-grid">

      <div class="convention-card">
        <div class="convention-title">Status opacity scale</div>
        <p class="convention-desc">
          Tinted backgrounds and borders use a <strong>golden ratio</strong> relationship:
          border opacity = background opacity × φ (≈ 1.618).
          This applies to all error, warning, and alert surfaces.
        </p>
        <div class="convention-examples">
          <div class="convention-row">
            <span class="convention-label">Inline alerts</span>
            <span class="convention-chip" style="background:${c('red-400')} / 10%; border:1px solid color-mix(in oklch, ${c('red-400')} 16%, transparent)">bg / 10%</span>
            <span class="convention-sep">→ border</span>
            <span class="convention-chip" style="background:transparent; border:1px solid color-mix(in oklch, ${c('red-400')} 16%, transparent); color:${c('red-400')}">16% (10 × φ)</span>
          </div>
          <div class="convention-row">
            <span class="convention-label">Floating toast</span>
            <span class="convention-chip" style="background:${c('red-400')} / 30%; border:1px solid color-mix(in oklch, ${c('red-400')} 49%, transparent)">bg / 30%</span>
            <span class="convention-sep">→ border</span>
            <span class="convention-chip" style="background:transparent; border:1px solid color-mix(in oklch, ${c('red-400')} 49%, transparent); color:${c('red-400')}">49% (30 × φ)</span>
          </div>
        </div>
        <div class="convention-live">
          <div style="background:color-mix(in oklch,${c('red-400')} 10%,transparent);border:1px solid color-mix(in oklch,${c('red-400')} 16%,transparent);border-radius:8px;padding:8px 14px;font-size:12px;color:${c('red-400')}">
            Inline error — bg/10, border/16
          </div>
          <div style="background:color-mix(in oklch,${c('amber-300')} 10%,transparent);border:1px solid color-mix(in oklch,${c('amber-300')} 16%,transparent);border-radius:8px;padding:8px 14px;font-size:12px;color:${c('amber-300')}">
            Inline warning — bg/10, border/16
          </div>
          <div style="background:color-mix(in oklch,${c('red-400')} 30%,transparent);border:1px solid color-mix(in oklch,${c('red-400')} 49%,transparent);border-radius:10px;padding:8px 14px;font-size:12px;color:${c('red-200')}">
            Toast — bg/30, border/49
          </div>
        </div>
      </div>

    </div>
  </section>

  <!-- Generated Assets -->
  <section>
    <div class="section-label">Generated Assets</div>

    ${assetSubgroup('Web', `
      <div class="icon-grid">
        ${iconChip('../viewer/public/favicon.png', 'favicon.png', '640 × 640', 'Browser tab · PWA')}
      </div>`)}

    ${assetSubgroup('iOS — App Icons', `
      <div class="icon-grid">
        ${iosIconList.map(({ name, px, usage }) =>
          iconChip(`${iosIconDir}/${name}`, name, `${px} × ${px} px`, usage)
        ).join('')}
      </div>`)}

    ${assetSubgroup('iOS — Launch Screens', `
      <div class="splash-row">
        ${iosSplashList.map(({ name, w, h, scale }) =>
          splashThumb(`${launchDir}/${name}`, name, `${w} × ${h}`, scale)
        ).join('')}
      </div>`)}

    ${assetSubgroup('Android — Launcher Icons', `
      <div class="icon-grid">
        ${androidIconList.map(({ density, px }) =>
          iconChip(`${androidBase}/${density}/ic_launcher.png`, `${density}/ic_launcher.png`, `${px} × ${px} px`, density.replace('mipmap-', ''))
        ).join('')}
      </div>`)}

    ${assetSubgroup('Store Listings', `
      <div class="svg-asset">
        <div class="svg-asset-preview" style="justify-content:center;">
          <img src="../mobile/screenshots/feature-graphic.png" alt="feature-graphic.png" class="wide-asset-img" style="max-height:220px;width:auto;">
        </div>
        <div class="svg-asset-footer">
          <span class="svg-asset-name">feature-graphic.png</span>
          <span class="svg-asset-note">Play Store &amp; App Store · 1024 × 500</span>
          <a href="../mobile/screenshots/feature-graphic.png" download class="svg-download">↓ Download</a>
        </div>
      </div>`)}

  </section>

</div>
<script>
  document.querySelectorAll('.icon-chip-preview img, .splash-thumb-preview img, .svg-asset-preview img, .mark-icon').forEach(img => {
    img.addEventListener('click', () => {
      const d = document.createElement('dialog');
      d.className = 'lightbox';
      d.innerHTML = \`<img src="\${img.src}">\`;
      d.addEventListener('click', () => d.close());
      document.body.appendChild(d);
      d.showModal();
      d.addEventListener('close', () => d.remove(), { once: true });
    });
  });
</script>
</body>
</html>
`

writeFileSync(join(ROOT, 'brand/index.html'), html)
console.log('  ✓  brand/index.html')
