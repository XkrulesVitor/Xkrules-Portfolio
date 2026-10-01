// art:optimize — meshopt no glb (gltf-transform) e cópia das texturas WebP para public/.
// Entrada: art/build/room.glb e art/build/*.webp. Saída: public/models/room.glb e public/textures/*.webp.
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const buildDir = path.join(root, 'art', 'build')
const glbIn = path.join(buildDir, 'room.glb')
const glbOut = path.join(root, 'public', 'models', 'room.glb')
const texOut = path.join(root, 'public', 'textures')
const cli = path.join(root, 'node_modules', '@gltf-transform', 'cli', 'bin', 'cli.js')

if (!existsSync(glbIn)) {
  console.error(`Falta ${path.relative(root, glbIn)}. Rode antes: npm run art:build`)
  process.exit(1)
}
mkdirSync(path.dirname(glbOut), { recursive: true })
mkdirSync(texOut, { recursive: true })

// meshopt: quantização + reordenação. Posições a 14 bits dão ~0,5 mm na ilha de 8,6 m; UV a 12 bits
// (4096 passos) cobrem atlas de até 2048.
const res = spawnSync(process.execPath, [cli, 'meshopt', glbIn, glbOut, '--level', 'high'], {
  stdio: 'inherit',
})
if (res.status !== 0) {
  console.error('gltf-transform meshopt falhou')
  process.exit(res.status ?? 1)
}

const kb = (p) => `${(statSync(p).size / 1024).toFixed(1)} kB`
console.log(`room.glb: ${kb(glbIn)} -> ${kb(glbOut)}`)

let total = 0
for (const f of readdirSync(buildDir).filter((n) => n.endsWith('.webp'))) {
  const dst = path.join(texOut, f)
  copyFileSync(path.join(buildDir, f), dst)
  total += statSync(dst).size
  console.log(`textura ${f}: ${kb(dst)}`)
}
console.log(`texturas: ${(total / 1024).toFixed(1)} kB no total`)
