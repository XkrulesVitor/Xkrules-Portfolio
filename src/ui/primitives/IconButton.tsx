import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import { motion, type HTMLMotionProps } from 'motion/react'
import { cx } from './cx'
import { usePress } from './motion'
import { FOCUS_RING, LIFT_HITAREA } from './styles'

export type IconButtonVariant = 'glass' | 'ghost'
export type IconButtonSize = 'sm' | 'md'

export interface IconButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children' | 'aria-label'> {
  /** Nome acessível (obrigatório: o botão só tem ícone). Também vira a dica (`title`). */
  label: string
  icon: PhosphorIcon
  variant?: IconButtonVariant
  size?: IconButtonSize
}

const VARIANT: Record<IconButtonVariant, string> = {
  glass:
    'border border-[var(--glass-border)] bg-[var(--glass-bg)] hover:border-[var(--glass-border-strong)] hover:bg-[var(--glass-bg-hover)]',
  ghost: 'border border-transparent hover:bg-[var(--glass-bg-hover)]',
}

// Alvo de toque maior em ponteiros grossos (celular).
const SIZE: Record<IconButtonSize, string> = {
  sm: 'size-8 pointer-coarse:size-10',
  md: 'size-10 pointer-coarse:size-11',
}

const ICON_PX: Record<IconButtonSize, number> = { sm: 16, md: 18 }

/**
 * Botão só com ícone, em vidro. `aria-disabled` mantém o foco no lugar (ao contrário de
 * `disabled`), útil nas setas do carrossel: o botão apaga no fim do trilho sem perder o foco.
 */
export function IconButton({
  label,
  icon: Icon,
  variant = 'glass',
  size = 'md',
  type = 'button',
  className,
  ...props
}: IconButtonProps) {
  const ariaDisabled = props['aria-disabled']
  const inert = props.disabled === true || ariaDisabled === true || ariaDisabled === 'true'
  const press = usePress({ disabled: inert })

  return (
    <motion.button
      type={type}
      aria-label={label}
      title={label}
      {...press}
      {...props}
      className={cx(
        'relative inline-grid shrink-0 cursor-pointer place-items-center rounded-full text-ink/85 select-none',
        'transition-colors duration-200 ease-glass hover:text-ink',
        'disabled:cursor-not-allowed disabled:opacity-40',
        'aria-disabled:pointer-events-none aria-disabled:opacity-40',
        FOCUS_RING,
        LIFT_HITAREA,
        VARIANT[variant],
        SIZE[size],
        className,
      )}
    >
      <Icon size={ICON_PX[size]} weight="regular" aria-hidden="true" />
    </motion.button>
  )
}
