import { useEffect, useId, useRef } from 'react'
import { motion, useIsPresent } from 'motion/react'
import { getHotspot } from '@/content/hotspots'
import { UI_TEXT } from '@/content/site'
import type { HotspotId } from '@/content/types'

interface PanelShellProps {
  hotspotId: HotspotId
}

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * Casca dos painéis DOM (placeholder da Fase 0: título + "em breve").
 * Fase 1 troca o miolo por conteúdo real e GlassCard.
 */
export function PanelShell({ hotspotId }: PanelShellProps) {
  const hotspot = getHotspot(hotspotId)
  const titleId = useId()
  const titleRef = useRef<HTMLHeadingElement>(null)
  // Guarda 5: painéis só recebem pointer-events enquanto presentes (não durante o exit).
  const isPresent = useIsPresent()
  const fromLeft = hotspot.side === 'left'
  const offset = fromLeft ? -40 : 40

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <motion.aside
      role="dialog"
      aria-labelledby={titleId}
      initial={{ opacity: 0, x: offset }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: offset }}
      transition={{ duration: 0.35, ease: EASE }}
      style={{ pointerEvents: isPresent ? 'auto' : 'none' }}
      className={[
        'absolute top-0 h-dvh w-[min(440px,92vw)] overflow-y-auto p-8 text-ink',
        'border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)]',
        'shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]',
        fromLeft ? 'left-0 border-r' : 'right-0 border-l',
        // Mobile: bottom-sheet (refinado na Fase 1.3)
        'max-md:inset-x-0 max-md:top-auto max-md:bottom-0 max-md:h-[70dvh] max-md:w-full',
        'max-md:rounded-t-2xl max-md:border-t max-md:border-l-0 max-md:border-r-0',
      ].join(' ')}
    >
      <h2
        id={titleId}
        ref={titleRef}
        tabIndex={-1}
        className="text-2xl font-semibold tracking-tight outline-none"
      >
        {hotspot.label}
      </h2>
      <p className="mt-3 text-sm text-ink/70">{UI_TEXT.panel.comingSoon}</p>
    </motion.aside>
  )
}
