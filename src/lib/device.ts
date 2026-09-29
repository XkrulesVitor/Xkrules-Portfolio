// Detecção simples de dispositivo. Funções (não hooks), seguras para SSR.

export function isTouch(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(pointer: coarse)').matches ?? navigator.maxTouchPoints > 0
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

export type GpuTier = 'high' | 'medium' | 'low'

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number
}

/** Heurística barata (sem benchmark): núcleos, memória e toque. */
export function gpuTier(): GpuTier {
  if (typeof navigator === 'undefined') return 'high'
  const cores = navigator.hardwareConcurrency ?? 4
  const memory = (navigator as NavigatorWithMemory).deviceMemory ?? 4
  if (isTouch() || cores <= 4 || memory <= 2) return 'medium'
  return 'high'
}
