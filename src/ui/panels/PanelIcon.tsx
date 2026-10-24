import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { EASE, useReduceMotion } from '../primitives'

interface PanelIconProps {
  icon: PhosphorIcon
  /**
   * Identidade do ícone. Quando muda (ex.: a aba do painel de Jogos troca o dado pelo controle), o
   * ícone novo entra girando e o antigo sai; sem `swapKey`, a troca é seca.
   */
  swapKey?: string
}

/** Ícone em ladrilho de vidro, à esquerda do título dos painéis. Decorativo. */
export function PanelIcon({ icon: Icon, swapKey }: PanelIconProps) {
  const reduce = useReduceMotion()
  return (
    <span
      aria-hidden="true"
      className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[var(--glass-border-strong)] bg-linear-to-br from-accent-mint/25 to-accent-blue/20 text-accent-mint shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_8px_20px_-10px_rgb(0_0_0/0.6)]"
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={swapKey ?? 'icon'}
          className="grid place-items-center"
          initial={reduce ? { opacity: 0 } : { opacity: 0, rotate: -90, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, rotate: 90, scale: 0.6 }}
          transition={{ duration: reduce ? 0.12 : 0.35, ease: EASE }}
        >
          <Icon size={28} weight="duotone" />
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
