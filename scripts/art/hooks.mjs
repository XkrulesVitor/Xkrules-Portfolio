// Hook `resolve` (module.register): o Node 24 remove tipos de .ts sozinho, mas não resolve o alias
// `@/` do tsconfig nem import relativo sem extensão (o `presets.ts` usa os dois).
// - `@/x`   -> <raiz>/src/x
// - `./x`   -> tenta `./x`, `./x.ts` e `./x/index.ts`
// Nada em src/ muda por causa disso.
import { existsSync, statSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

function isFile(p) {
  try {
    return existsSync(p) && statSync(p).isFile()
  } catch {
    return false
  }
}

function withExtension(base) {
  if (isFile(base)) return base
  for (const candidate of [`${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]) {
    if (isFile(candidate)) return candidate
  }
  return null
}

export async function resolve(specifier, context, nextResolve) {
  let base = null
  if (specifier.startsWith('@/')) {
    base = path.join(ROOT, 'src', specifier.slice(2))
  } else if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:')) {
    base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier)
  }
  if (base) {
    const found = withExtension(base)
    if (found) return nextResolve(pathToFileURL(found).href, context)
  }
  return nextResolve(specifier, context)
}
