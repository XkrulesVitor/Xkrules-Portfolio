import { motion, type HTMLMotionProps } from 'motion/react'
import { REVEAL, REVEAL_REDUCED, useReduceMotion } from './motion'

/**
 * Item de uma lista com stagger. Herda o estado (`hidden` -> `visible`) do motion pai que
 * define `staggerChildren` (painéis, listas de cartões). Fora de um pai animado, só renderiza.
 */
export function Reveal(props: HTMLMotionProps<'div'>) {
  const reduce = useReduceMotion()
  return <motion.div variants={reduce ? REVEAL_REDUCED : REVEAL} {...props} />
}
