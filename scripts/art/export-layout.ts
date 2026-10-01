// Exporta o layout do diorama para o Blender: `art/build/layout.json`.
// A cena em Python lê só este JSON; nada de ler TypeScript no Blender.
// Rodar: npm run art:layout (usa scripts/art/register.mjs para resolver `@/` e imports sem extensão).
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DESK_TOP_Y,
  EDGE_FRONT_Z,
  EDGE_RIGHT_X,
  LAYOUT,
  RACK_TOP_Y,
  ROOM,
  WALL_BACK_Z,
  WALL_LEFT_X,
} from '../../src/experience/scene/layout.ts'
import { PRESETS } from '../../src/experience/camera/presets.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const outDir = path.join(root, 'art', 'build')

const PRESET_KEYS = ['home', 'desk', 'shelf', 'shelfDigital', 'printer', 'chair'] as const

const presets = Object.fromEntries(
  PRESET_KEYS.map((key) => [
    key,
    { position: [...PRESETS[key].position], target: [...PRESETS[key].target], fov: PRESETS[key].fov ?? 35 },
  ]),
)

const layout = {
  _doc: 'Y-up em metros (x, y, z do layout.ts). No Blender (Z-up): (x, y, z) vira (x, -z, y).',
  room: { ...ROOM },
  walls: {
    WALL_LEFT_X,
    WALL_BACK_Z,
    EDGE_RIGHT_X,
    EDGE_FRONT_Z,
    DESK_TOP_Y,
    RACK_TOP_Y,
  },
  layout: JSON.parse(JSON.stringify(LAYOUT)),
  presets,
}

mkdirSync(outDir, { recursive: true })
const file = path.join(outDir, 'layout.json')
writeFileSync(file, `${JSON.stringify(layout, null, 2)}\n`)
console.log(`layout.json gravado em ${path.relative(root, file)} (${Object.keys(presets).length} presets)`)
