import { useReducedMotion } from 'motion/react'

/** Ease único do SO (o mesmo dos painéis, ARCHITECTURE §8). */
export const OS_EASE = [0.22, 1, 0.36, 1] as const

/** Respeita prefers-reduced-motion: duração zero e sem deslocamentos. */
export function useOsMotion() {
  const reduced = useReducedMotion() ?? false
  return { reduced, duration: reduced ? 0 : 0.28, ease: OS_EASE }
}
