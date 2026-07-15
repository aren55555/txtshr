#!/usr/bin/env bun
// Resolves brand/icon.template.svg + brand/brand.json → brand/icon.svg
// Also derives brand/icon-foreground.svg (same shield, transparent background)
// for the Android adaptive-icon foreground layer — single source of truth.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { formatHex, clampChroma } from 'culori'

const ROOT = join(import.meta.dir, '../..')

// brand.json stores oklch values; SVG needs sRGB hex for resvg compatibility
const raw: Record<string, string> = JSON.parse(
  readFileSync(join(ROOT, 'brand/brand.json'), 'utf8')
).colors
const colors = Object.fromEntries(
  Object.entries(raw).map(([k, v]) => [k, formatHex(clampChroma(v, 'oklch')) ?? v])
)

const resolve = (tpl: string) =>
  tpl.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const val = colors[key]
    if (!val) throw new Error(`icon template: unknown color token {{${key}}}`)
    return val
  })

const template = readFileSync(join(ROOT, 'brand/icon.template.svg'), 'utf8')

// Full icon (opaque brand-dark background + shield).
writeFileSync(join(ROOT, 'brand/icon.svg'), resolve(template))
console.log('  ✓  brand/icon.svg')

// Adaptive foreground: the same shield with the full-canvas background rect
// removed (transparent over the adaptive-icon background layer), and the 1.25×
// legacy-square magnification dropped to scale(1) so the shield sits at its
// natural size within Android's central 66dp adaptive safe zone (the 1.25×
// version pushes the shield tip past a circular mask's edge and clips).
const bgRect = /[ \t]*<rect width="512" height="512" fill="\{\{icon-bg\}\}"\/>\n/
if (!bgRect.test(template))
  throw new Error('icon.template.svg: could not find full-canvas background rect to strip')
if (!template.includes('scale(1.25)'))
  throw new Error('icon.template.svg: expected scale(1.25) to neutralize for the adaptive foreground')
const fg = template.replace(bgRect, '').replace('scale(1.25)', 'scale(1)')
writeFileSync(join(ROOT, 'brand/icon-foreground.svg'), resolve(fg))
console.log('  ✓  brand/icon-foreground.svg')
