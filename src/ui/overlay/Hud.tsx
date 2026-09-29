import { AnimatePresence, motion } from 'motion/react'
import { getHotspot } from '@/content/hotspots'
import { SITE, UI_TEXT } from '@/content/site'
import { selectHovered, selectMode } from '@/store/selectors'
import { useExperienceStore } from '@/store/useExperienceStore'

/** Marca (topo-esquerda) e dica/rótulo do hotspot sob o cursor (base). Só em idle. */
export function Hud() {
  const mode = useExperienceStore(selectMode)
  const hovered = useExperienceStore(selectHovered)
  const idle = mode === 'idle'
  const hint = hovered ? getHotspot(hovered).label : UI_TEXT.hud.hintIdle

  return (
    <AnimatePresence>
      {idle ? (
        <>
          <motion.div
            key="brand"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute top-5 left-6 text-sm font-medium tracking-wide text-ink/90 select-none"
          >
            {SITE.shortTitle}
          </motion.div>
          <motion.div
            key="hint"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-2 text-center text-xs text-ink/80 backdrop-blur-[var(--glass-blur)] select-none"
          >
            {hint}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
