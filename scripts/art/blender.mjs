// Wrapper do executável do Blender. Acha o binário e repassa os argumentos tal como vieram.
// spawn SEM shell: o caminho padrão tem espaço ("D:\Program Files\Blender\blender.exe").
// Uso: node scripts/art/blender.mjs -b --factory-startup -P art/blender/main.py -- --quality draft
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'

const CANDIDATES = [
  process.env.BLENDER_BIN,
  'D:/Program Files/Blender/blender.exe',
  'C:/Program Files/Blender Foundation/Blender 4.4/blender.exe',
  '/usr/bin/blender',
  '/Applications/Blender.app/Contents/MacOS/Blender',
].filter(Boolean)

const bin = CANDIDATES.find((p) => existsSync(p))
if (!bin) {
  console.error(`Blender não encontrado. Defina BLENDER_BIN. Procurei em:\n  ${CANDIDATES.join('\n  ')}`)
  process.exit(1)
}

const args = process.argv.slice(2)
const child = spawn(bin, args, {
  stdio: 'inherit',
  env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1', PYTHONDONTWRITEBYTECODE: '1' },
})
child.on('error', (err) => {
  console.error(`Falha ao iniciar o Blender (${bin}): ${err.message}`)
  process.exit(1)
})
child.on('exit', (code, signal) => {
  if (signal) console.error(`Blender terminou por sinal ${signal}`)
  process.exit(code ?? 1)
})
