#!/usr/bin/env bun
// Rasterizes brand/icon.svg → favicon, iOS AppIcon, Android mipmap PNGs
import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

const ROOT = join(import.meta.dir, '../..')
const svg  = readFileSync(join(ROOT, 'brand/icon.svg'), 'utf8')
const fgSvg = readFileSync(join(ROOT, 'brand/icon-foreground.svg'), 'utf8')

// Build a width-cached renderer for a given SVG source
const renderer = (source: string) => {
  const cache = new Map<number, Buffer>()
  return (px: number): Buffer => {
    if (!cache.has(px)) {
      const r = new Resvg(source, { fitTo: { mode: 'width', value: px } })
      cache.set(px, Buffer.from(r.render().asPng()))
    }
    return cache.get(px)!
  }
}

const render   = renderer(svg)
const renderFg = renderer(fgSvg)

const saveWith = (fn: (px: number) => Buffer, path: string, px: number) => {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, fn(px))
}

const save = (path: string, px: number) => saveWith(render, path, px)

// ── Live status board ──────────────────────────────────────────────────────
const C = { reset: '\x1b[0m', green: '\x1b[32m', dim: '\x1b[2m' }

interface Row { label: string; detail: string; done: boolean }
const board: Row[] = [
  { label: 'favicon ', detail: 'generating…', done: false },
  { label: 'ios     ', detail: 'generating…', done: false },
  { label: 'android ', detail: 'generating…', done: false },
  { label: 'adaptive', detail: 'generating…', done: false },
]

let painted = false
function repaint() {
  if (painted) process.stdout.write(`\x1b[${board.length}A`)
  for (const row of board) {
    const bullet = row.done ? `${C.green}✓${C.reset}` : `${C.dim}·${C.reset}`
    const detail = row.done
      ? `${C.green}${row.detail}${C.reset}`
      : `${C.dim}${row.detail}${C.reset}`
    process.stdout.write(`\r\x1b[2K  ${bullet} ${row.label}  ${detail}\n`)
  }
  painted = true
}

function set(i: number, detail: string, done = false) {
  board[i].detail = detail
  board[i].done   = done
  repaint()
}

repaint()

// ── Favicon ────────────────────────────────────────────────────────────────
save(join(ROOT, 'viewer/public/favicon.png'), 640)
set(0, '1 file — viewer/public/favicon.png (640×640)', true)

// ── iOS ────────────────────────────────────────────────────────────────────
const iosDir = join(ROOT, 'mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset')
const iosIcons: Array<[string, number]> = [
  ['Icon-App-20x20@1x.png',        20],
  ['Icon-App-20x20@2x.png',        40],
  ['Icon-App-20x20@3x.png',        60],
  ['Icon-App-29x29@1x.png',        29],
  ['Icon-App-29x29@2x.png',        58],
  ['Icon-App-29x29@3x.png',        87],
  ['Icon-App-40x40@1x.png',        40],
  ['Icon-App-40x40@2x.png',        80],
  ['Icon-App-40x40@3x.png',       120],
  ['Icon-App-60x60@2x.png',       120],
  ['Icon-App-60x60@3x.png',       180],
  ['Icon-App-76x76@1x.png',        76],
  ['Icon-App-76x76@2x.png',       152],
  ['Icon-App-83.5x83.5@2x.png',   167],
  ['Icon-App-1024x1024@1x.png',  1024],
]
for (let n = 0; n < iosIcons.length; n++) {
  const [name, px] = iosIcons[n]
  save(join(iosDir, name), px)
  set(1, `${n + 1}/${iosIcons.length} — ${name}`)
}
set(1, `${iosIcons.length} files — AppIcon.appiconset`, true)

// ── Android ────────────────────────────────────────────────────────────────
const androidDir = join(ROOT, 'mobile/android/app/src/main/res')
const androidDensities: Array<[string, number]> = [
  ['mipmap-mdpi',      48],
  ['mipmap-hdpi',      72],
  ['mipmap-xhdpi',     96],
  ['mipmap-xxhdpi',   144],
  ['mipmap-xxxhdpi',  192],
]
for (let n = 0; n < androidDensities.length; n++) {
  const [density, px] = androidDensities[n]
  save(join(androidDir, density, 'ic_launcher.png'), px)
  set(2, `${n + 1}/${androidDensities.length} — ${density}/ic_launcher.png`)
}
set(2, `${androidDensities.length} files — mipmap-{mdpi…xxxhdpi}`, true)

// ── Android adaptive-icon foreground ─────────────────────────────────────────
// Transparent-background shield for mipmap-anydpi-v26/ic_launcher.xml. Base is
// 108dp (adaptive canvas); densities scale ×1/1.5/2/3/4.
const adaptiveDensities: Array<[string, number]> = [
  ['mipmap-mdpi',     108],
  ['mipmap-hdpi',     162],
  ['mipmap-xhdpi',    216],
  ['mipmap-xxhdpi',   324],
  ['mipmap-xxxhdpi',  432],
]
for (let n = 0; n < adaptiveDensities.length; n++) {
  const [density, px] = adaptiveDensities[n]
  saveWith(renderFg, join(androidDir, density, 'ic_launcher_foreground.png'), px)
  set(3, `${n + 1}/${adaptiveDensities.length} — ${density}/ic_launcher_foreground.png`)
}
set(3, `${adaptiveDensities.length} files — ic_launcher_foreground`, true)

process.stdout.write('\n')
