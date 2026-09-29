import type { ReactNode } from 'react'
import { cx } from './cx'

interface KbdProps {
  children: ReactNode
  className?: string
}

/** Tecla ("Esc", "←"). Tampa de tecla em vidro, com uma borda inferior mais marcada. */
export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd
      className={cx(
        'inline-flex min-w-[1.75em] items-center justify-center rounded-md border border-[var(--glass-border)]',
        'bg-white/[0.07] px-1.5 py-1 font-mono text-[11px] leading-none font-medium text-ink/80',
        'shadow-[inset_0_-1px_0_rgb(255_255_255/0.16)]',
        className,
      )}
    >
      {children}
    </kbd>
  )
}
