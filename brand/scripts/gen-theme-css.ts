#!/usr/bin/env bun
// Resolves brand/brand.json → viewer/src/brand.css: a Tailwind v4 @theme
// block that overrides the default palette, so utilities like `text-amber-300`
// resolve to the brand's oklch values. Color values live only in brand.json —
// the viewer references them, never duplicates them.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dir, '../..')

const colors: Record<string, string> = JSON.parse(
  readFileSync(join(ROOT, 'brand/brand.json'), 'utf8')
).colors

const lines = Object.entries(colors)
  .map(([token, value]) => `  --color-${token}: ${value};`)
  .join('\n')

const css = `/* GENERATED — do not edit. Source of truth: brand/brand.json (just brand::rebuild). */
@theme {
${lines}
}
`

writeFileSync(join(ROOT, 'viewer/src/brand.css'), css)
console.log('  ✓  viewer/src/brand.css')
