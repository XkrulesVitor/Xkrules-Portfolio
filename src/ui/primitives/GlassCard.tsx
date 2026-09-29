import type { ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import { cx } from './cx'
import { usePress } from './motion'
import { FOCUS_RING } from './styles'

/**
 * - `surface`: vidro claro (fill + blur). Para fundos escuros.
 * - `smoked`: vidro sobre tinta navy. Para sobrepor a cena, que tem paredes claras.
 * - `inset`: cartão dentro de outro vidro, sem blur (backdrop-filter aninhado só amostra o pai).
 */
export type GlassVariant = 'surface' | 'smoked' | 'inset'
export type GlassPadding = 'none' | 'sm' | 'md' | 'lg'

export interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  variant?: GlassVariant
  padding?: GlassPadding
  /** Hover eleva 2px e realça a borda. */
  interactive?: boolean
  children?: ReactNode
}

const VARIANT: Record<GlassVariant, string> = {
  surface: 'glass-fill rounded-glass',
  smoked: 'glass-fill-smoked rounded-glass',
  inset: 'glass-inset rounded-2xl',
}

const PADDING: Record<GlassPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

// A cor da borda em hover/foco pode ser trocada com a variável --glass-hover-border (ex.: cor do jogo).
const INTERACTIVE = [
  'transition-[background-color,border-color] duration-300 ease-glass',
  'hover:bg-[var(--glass-bg-hover)] hover:border-[var(--glass-hover-border,var(--glass-border-strong))]',
  'focus-within:border-[var(--glass-hover-border,var(--glass-border-strong))]',
].join(' ')

/** Cartão de vidro: fundo translúcido, borda de 1px, realce interno e raio de 16-20px. */
export function GlassCard({
  variant = 'surface',
  padding = 'md',
  interactive = false,
  className,
  children,
  ...props
}: GlassCardProps) {
  // Cartões grandes só elevam; o "press" fica para botões e links.
  const press = usePress({ disabled: !interactive, tap: false })

  return (
    <motion.div
      {...press}
      {...props}
      className={cx(
        'relative border border-[var(--glass-border)] text-ink',
        VARIANT[variant],
        PADDING[padding],
        interactive && INTERACTIVE,
        FOCUS_RING,
        className,
      )}
    >
      {children}
    </motion.div>
  )
}
