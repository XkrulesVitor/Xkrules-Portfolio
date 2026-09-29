import { AnimatePresence, motion } from 'motion/react'
import { UI_TEXT } from '@/content/site'
import { selectShowBack } from '@/store/selectors'
import { useExperienceStore } from '@/store/useExperienceStore'

/** "← Voltar (Esc)": visível em focused e em transitioning rumo a um hotspot. */
export function BackButton() {
  const visible = useExperienceStore(selectShowBack)

  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          key="back"
          type="button"
          aria-label={UI_TEXT.back.aria}
          onClick={() => useExperienceStore.getState().requestHome()}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto absolute top-5 left-1/2 z-20 flex -translate-x-1/2 cursor-pointer items-center gap-3 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-2 text-sm font-medium text-ink backdrop-blur-[var(--glass-blur)] transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-mint"
        >
          <span aria-hidden="true">←</span>
          <span>{UI_TEXT.back.label}</span>
          <kbd
            aria-hidden="true"
            className="rounded border border-[var(--glass-border)] px-1.5 py-0.5 font-mono text-[10px] text-ink/70"
          >
            {UI_TEXT.back.key}
          </kbd>
        </motion.button>
      ) : null}
    </AnimatePresence>
  )
}
