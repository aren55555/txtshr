#!/usr/bin/env bun
import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

const ROOT = join(import.meta.dir, '..')
const svg  = readFileSync(join(ROOT, 'brand/icon.svg'), 'utf8')

// Cache by pixel width to avoid re-rendering the same size twice (e.g. iOS has duplicate px sizes)
const cache = new Map<number, Buffer>()
function render(px: number): Buffer {
  if (!cache.has(px)) {
    const r = new Resvg(svg, { fitTo: { mode: 'width', value: px } })
    cache.set(px, Buffer.from(r.render().asPng()))
  }
  return cache.get(px)!
}

function save(path: string, px: number) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, render(px))
}

// ── Live status board ──────────────────────────────────────────────────────
const C = { reset: '\x1b[0m', green: '\x1b[32m', dim: '\x1b[2m' }

interface Row { label: string; detail: string; done: boolean }
const board: Row[] = [
  { label: 'favicon', detail: 'generating…', done: false },
  { label: 'ios    ', detail: 'generating…', done: false },
  { label: 'android', detail: 'generating…', done: false },
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

repaint() // initial render

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

process.stdout.write('\n')
