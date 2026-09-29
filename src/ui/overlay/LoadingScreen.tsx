import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { SITE, UI_TEXT } from '@/content/site'

interface LoadingScreenProps {
  visible: boolean
  /** 0-100. */
  progress: number
  /** Assets prontos: mostra o botão "Entrar". */
  ready: boolean
  /** Sem `onEnter` (fallback do next/dynamic) o botão nunca aparece. */
  onEnter?: () => void
}

export function LoadingScreen({ visible, progress, ready, onEnter }: LoadingScreenProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const showButton = ready && onEnter !== undefined
  const percent = Math.round(Math.min(100, Math.max(0, progress)))

  useEffect(() => {
    if (showButton) buttonRef.current?.focus({ preventScroll: true })
  }, [showButton])

  return (
    // initial={false}: o fallback do dynamic e a versão do overlay não "repiscam" a entrada.
    <AnimatePresence initial={false}>
      {visible ? (
        <motion.div
          key="loading"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-bg-canvas px-6 text-ink"
        >
          <p className="text-sm font-medium tracking-[0.2em] text-ink/70 uppercase">{SITE.shortTitle}</p>
          <div className="flex w-[min(320px,80vw)] flex-col items-center gap-3">
            <div
              role="progressbar"
              aria-label={UI_TEXT.loading.progressLabel}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              className="h-1 w-full overflow-hidden rounded-full bg-white/10"
            >
              <div
                className="h-full origin-left rounded-full bg-accent-mint transition-transform duration-300 ease-out"
                style={{ transform: `scaleX(${percent / 100})` }}
              />
            </div>
            <p className="text-xs text-ink/60" aria-live="polite">
              {showButton ? UI_TEXT.loading.ready : `${UI_TEXT.loading.title} ${percent}%`}
            </p>
          </div>
          <div className="h-11">
            {showButton ? (
              <button
                ref={buttonRef}
                type="button"
                onClick={onEnter}
                className="cursor-pointer rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] px-8 py-2.5 text-sm font-medium text-ink backdrop-blur-[var(--glass-blur)] transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-mint"
              >
                {UI_TEXT.loading.enter}
              </button>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
