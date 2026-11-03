import type { Variants } from 'motion/react'
import { STAGGER } from '../../primitives'

/**
 * Lista dentro de uma seção do painel: não define estado próprio, herda o `hidden` -> `visible` do
 * painel e só escalona a entrada dos filhos (`Reveal`). Reduced motion já está nos `Reveal` (só fade).
 */
export const STAGGER_LIST: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: STAGGER } },
}
