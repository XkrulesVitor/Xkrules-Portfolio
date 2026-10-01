// art:optimize — compressão meshopt do glb (biblioteca do gltf-transform) e cópia das texturas WebP.
// Entrada: art/build/room.glb e art/build/*.webp. Saída: public/models/room.glb e public/textures/*.webp.
//
// Por que não `gltf-transform meshopt` direto: o comando quantiza as posições (KHR_mesh_quantization) e
// joga a escala e o deslocamento na transformação do nó. Isso tira o PIVÔ dos nós vivos do lugar
// (`chair_root`, `printer_*`, `clock_*`, `box_*`): o ponteiro giraria em torno do meio da malha e não do
// eixo do relógio. Aqui o glb é comprimido com os filtros do meshopt (`EncoderMethod.FILTER`): os dados
// continuam FLOAT e as transformações dos nós ficam exatamente como saíram do Blender.
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions'
import { prune, reorder } from '@gltf-transform/functions'
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const buildDir = path.join(root, 'art', 'build')
const glbIn = path.join(buildDir, 'room.glb')
const glbOut = path.join(root, 'public', 'models', 'room.glb')
const texOut = path.join(root, 'public', 'textures')

if (!existsSync(glbIn)) {
  console.error(`Falta ${path.relative(root, glbIn)}. Rode antes: npm run art:build`)
  process.exit(1)
}
mkdirSync(path.dirname(glbOut), { recursive: true })
mkdirSync(texOut, { recursive: true })

await MeshoptEncoder.ready
await MeshoptDecoder.ready

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.encoder': MeshoptEncoder,
  'meshopt.decoder': MeshoptDecoder,
})
const doc = await io.read(glbIn)
await doc.transform(reorder({ encoder: MeshoptEncoder, target: 'size' }), prune({ keepLeaves: true, keepAttributes: true }))
doc
  .createExtension(EXTMeshoptCompression)
  .setRequired(true)
  .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.FILTER })
await io.write(glbOut, doc)

const kb = (p) => `${(statSync(p).size / 1024).toFixed(1)} kB`
console.log(`room.glb: ${kb(glbIn)} -> ${kb(glbOut)} (meshopt, FILTER)`)

let total = 0
for (const f of readdirSync(buildDir).filter((n) => n.endsWith('.webp'))) {
  const dst = path.join(texOut, f)
  copyFileSync(path.join(buildDir, f), dst)
  total += statSync(dst).size
  console.log(`textura ${f}: ${kb(dst)}`)
}
console.log(`texturas: ${(total / 1024).toFixed(1)} kB no total`)
