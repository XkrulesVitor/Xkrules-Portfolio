import { useEffect, useRef, useSyncExternalStore, type RefObject } from 'react'
import { prefersReducedMotion } from '@/lib/device'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia?.(QUERY)
  if (!media) return () => {}
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

/** `prefers-reduced-motion` reativo (para decidir o que montar). */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false)
}

/**
 * `prefers-reduced-motion` como ref, para ler dentro de `useFrame` e dos callbacks de spring sem
 * re-renderizar (a V.3 desliga balanço, partículas, pulsos e o logo quicando; o relógio continua).
 * Nasce com o valor atual e acompanha a mudança da preferência do sistema durante a sessão.
 */
export function useReducedMotionRef(): RefObject<boolean> {
  const ref = useRef<boolean>(prefersReducedMotion())

  useEffect(() => {
    const media = window.matchMedia?.(QUERY)
    if (!media) return
    ref.current = media.matches
    const onChange = (event: MediaQueryListEvent) => {
      ref.current = event.matches
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return ref
}
