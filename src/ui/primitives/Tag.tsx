import type { ReactNode } from 'react'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import { cx } from './cx'

export type TagTone = 'neutral' | 'mint' | 'blue'
export type TagSize = 'sm' | 'md'

interface TagProps {
  children: ReactNode
  tone?: TagTone
  size?: TagSize
  icon?: PhosphorIcon
  className?: string
}

const TONE: Record<TagTone, string> = {
  neutral: 'border-[var(--glass-border)] bg-white/[0.06] text-ink/85',
  mint: 'border-accent-mint/30 bg-accent-mint/10 text-accent-mint',
  blue: 'border-accent-blue/30 bg-accent-blue/10 text-accent-blue',
}

const SIZE: Record<TagSize, string> = {
  sm: 'gap-1 px-2 py-[3px] text-[11px]',
  md: 'gap-1.5 px-2.5 py-1 text-xs',
}

/** Rótulo curto em pílula (tecnologias, contexto, ano). Não interativo. */
export function Tag({ children, tone = 'neutral', size = 'md', icon: Icon, className }: TagProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border leading-none font-medium whitespace-nowrap',
        TONE[tone],
        SIZE[size],
        className,
      )}
    >
      {Icon ? (
        <Icon
          size={size === 'sm' ? 12 : 14}
          weight={size === 'sm' ? 'regular' : 'duotone'}
          aria-hidden="true"
        />
      ) : null}
      {children}
    </span>
  )
}
