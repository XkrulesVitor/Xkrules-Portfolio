import { useSyncExternalStore } from 'react'

/**
 * Qual cena renderizar (ARCHITECTURE §12.3): o quarto baked (`room.glb` + bakes) ou o grey-box
 * procedural. `?greybox` na URL força o grey-box; se o glb ou as texturas falharem ao carregar, o
 * `BakedBoundary` chama `reportBakedFailure` e a cena cai no grey-box sem quebrar a página.
 */
export type SceneMode = 'baked' | 'greybox'

const GREYBOX_PARAM = 'greybox'

let forced: boolean | null = null
let bakedFailed = false
const listeners = new Set<() => void>()

/** `?greybox` na URL. Lido uma vez (o parâmetro não muda durante a sessão). Seguro no servidor. */
export function isGreyboxForced(): boolean {
  if (typeof window === 'undefined') return false
  forced ??= new URLSearchParams(window.location.search).has(GREYBOX_PARAM)
  return forced
}

/** Chamado pelo ErrorBoundary da cena baked: a partir daqui o modo é `greybox`. */
export function reportBakedFailure(error?: unknown): void {
  if (bakedFailed) return
  bakedFailed = true
  console.warn('[experience] Falha ao carregar o quarto baked; usando o grey-box.', error)
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}

const getSnapshot = (): SceneMode => (bakedFailed || isGreyboxForced() ? 'greybox' : 'baked')
const getServerSnapshot = (): SceneMode => 'baked'

export function useSceneMode(): SceneMode {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
