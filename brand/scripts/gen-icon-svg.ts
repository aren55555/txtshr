#!/usr/bin/env bun
// Resolves brand/icon.template.svg + brand/brand.json → brand/icon.svg
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

const template = readFileSync(join(ROOT, 'brand/icon.template.svg'), 'utf8')
const svg = template.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
  const val = colors[key]
  if (!val) throw new Error(`icon.template.svg: unknown color token {{${key}}}`)
  return val
})

writeFileSync(join(ROOT, 'brand/icon.svg'), svg)
console.log('  ✓  brand/icon.svg')
