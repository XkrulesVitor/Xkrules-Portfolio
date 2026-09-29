import { useReducedMotion, type MotionProps, type Variants } from 'motion/react'

/** Curva, duração e stagger de ARCHITECTURE §8. */
export const EASE = [0.22, 1, 0.36, 1] as const
export const DURATION = 0.35
export const STAGGER = 0.05

/**
 * `prefers-reduced-motion`: sem deslocamentos, elevação nem escala; só esmaecimentos curtos.
 * `useReducedMotion` devolve `null` até o primeiro cálculo, tratado como "não reduzir".
 */
export function useReduceMotion(): boolean {
  return useReducedMotion() ?? false
}

type PressProps = Pick<MotionProps, 'whileHover' | 'whileTap'>

const LIFT: PressProps['whileHover'] = { y: -2, transition: { duration: 0.2, ease: EASE } }
const TAP: PressProps['whileTap'] = { scale: 0.98, transition: { duration: 0.12, ease: EASE } }

const BOTH: PressProps = { whileHover: LIFT, whileTap: TAP }
const LIFT_ONLY: PressProps = { whileHover: LIFT }
const TAP_ONLY: PressProps = { whileTap: TAP }
const NONE: PressProps = {}

interface PressOptions {
  /** Desliga tudo (controle inativo). */
  disabled?: boolean
  /** Hover eleva 2px. */
  lift?: boolean
  /** Press escala 0.98. */
  tap?: boolean
}

/**
 * Micro-interação de botões e links: hover eleva 2px e press escala 0.98.
 * Cartões grandes usam só `lift`; abas dentro de um controle segmentado usam só `tap`.
 * Reduced motion ou `disabled` desligam tudo.
 */
export function usePress({ disabled = false, lift = true, tap = true }: PressOptions = {}): PressProps {
  const reduce = useReduceMotion()
  if (reduce || disabled) return NONE
  if (lift && tap) return BOTH
  if (lift) return LIFT_ONLY
  if (tap) return TAP_ONLY
  return NONE
}

/** Filho de um container com `staggerChildren`: fade + subida curta. */
export const REVEAL: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION, ease: EASE } },
}

/** Versão sem deslocamento, para reduced motion. */
export const REVEAL_REDUCED: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
}
