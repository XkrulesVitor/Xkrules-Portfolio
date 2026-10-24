import { AnimatePresence, motion } from 'motion/react'
import { UI_TEXT } from '@/content/site'
import { selectShowBack } from '@/store/selectors'
import { useExperienceStore } from '@/store/useExperienceStore'

/**
 * "← Voltar (Esc)": visível em focused e em transitioning rumo a um hotspot. Com um jogo na TV vira
 * "← Sair do jogo (Esc)" e só desliga o jogo (a câmera volta para a vista Digital, com o painel).
 * É a saída garantida: com o foco dentro do iframe, o Esc fica com o jogo.
 */
export function BackButton() {
  const visible = useExperienceStore(selectShowBack)
  const playing = useExperienceStore((s) => s.playing !== null)
  const label = playing ? UI_TEXT.tvGame.exit : UI_TEXT.back.label

  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          key="back"
          type="button"
          aria-label={playing ? UI_TEXT.tvGame.exitAria : UI_TEXT.back.aria}
          onClick={() => {
            const s = useExperienceStore.getState()
            if (s.playing !== null) s.stopGame()
            else s.requestHome()
          }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto absolute top-5 left-1/2 z-20 flex -translate-x-1/2 cursor-pointer items-center gap-3 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-2 text-sm font-medium text-ink backdrop-blur-[var(--glass-blur)] transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-mint"
        >
          <span aria-hidden="true">←</span>
          <span>{label}</span>
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
