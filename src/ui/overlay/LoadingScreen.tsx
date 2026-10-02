import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { SITE, UI_TEXT } from '@/content/site'
import { Kbd } from '../primitives/Kbd'
import { useReduceMotion } from '../primitives/motion'
import styles from './LoadingScreen.module.css'

interface LoadingScreenProps {
  visible: boolean
  /** 0-100. Progresso REAL (useProgress, entregue pelo LoadingBridge). */
  progress: number
  /** Assets prontos: mostra o botão "Entrar". */
  ready: boolean
  /** Sem `onEnter` (fallback do next/dynamic) o botão nunca aparece. */
  onEnter?: () => void
}

/** `style` que aceita custom properties (`--i`) sem cast. */
type CssVars = CSSProperties & { [K in `--${string}`]?: string | number }

/**
 * A tela existe em DUAS instâncias em sequência: o fallback do `next/dynamic` (ExperienceLoader) e,
 * quando o chunk do 3D chega, a do LoadingBridge. Sem cuidado, o boot recomeçaria do zero na troca.
 * A primeira instância (a que hidrata o HTML do servidor) usa 0, igual ao servidor. As seguintes entram
 * com as linhas adiantadas do tempo desde o início da navegação (`performance.now()`, que é de quando
 * o HTML do servidor começou a animar): o delay negativo as põe onde a sequência já estava, sem replay.
 * O servidor devolve sempre 0 (nada de estado compartilhado entre pedidos).
 */
let firstInstanceMounted = false
function msSinceBootStart(): number {
  if (typeof window === 'undefined') return 0
  if (!firstInstanceMounted) {
    firstInstanceMounted = true
    return 0
  }
  return Math.round(performance.now())
}

/** Linha da sequência: `--i` é a posição (o CSS multiplica por 160 ms e desconta `--elapsed`). */
function lineStyle(index: number): CssVars {
  return { '--i': index }
}

/**
 * Boot estilo BIOS (referência: LoadingScreen do Henry Heffernan, sem copiar). Mono, linhas que
 * aparecem em sequência (CSS puro: nenhuma linha custa um setState), cursor piscando, progresso real
 * numa barra segmentada. Com `prefers-reduced-motion` tudo aparece de uma vez e o cursor fica fixo.
 */
export function LoadingScreen({ visible, progress, ready, onEnter }: LoadingScreenProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const reduceMotion = useReduceMotion()
  const [elapsed] = useState(msSinceBootStart)
  const showButton = ready && onEnter !== undefined
  const percent = Math.round(Math.min(100, Math.max(0, progress)))
  const boot = UI_TEXT.loading.boot
  const progressIndex = boot.lines.length + 1

  useEffect(() => {
    if (showButton) buttonRef.current?.focus({ preventScroll: true })
  }, [showButton])

  const rootStyle: CssVars = { '--elapsed': `${elapsed}ms` }

  return (
    // initial={false}: o fallback do dynamic e a versão do overlay não "repiscam" a entrada.
    <AnimatePresence initial={false}>
      {visible ? (
        <motion.div
          key="loading"
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.6, ease: 'easeOut' }}
          style={rootStyle}
          className={`${styles.screen} fixed inset-0 z-50 flex items-center justify-center overflow-auto px-6 py-10 text-ink`}
        >
          <div className="w-[min(640px,100%)] font-mono text-[13px] leading-6 sm:text-sm">
            <header className={styles.line} style={lineStyle(0)}>
              <p className="font-semibold tracking-[0.22em] text-accent-mint">{boot.brand}</p>
              <p className="text-ink/60">{boot.tagline}</p>
              <p className="text-ink/40">{SITE.shortTitle}</p>
            </header>

            {/* Linhas só de ambientação: nada nelas é conteúdo, então ficam fora da árvore de acessibilidade. */}
            <ul aria-hidden="true" className="mt-5 space-y-0.5">
              {boot.lines.map((line, i) => (
                <li key={line.label} className={`${styles.line} flex items-baseline gap-2`} style={lineStyle(i + 1)}>
                  <span className="text-ink/80">{line.label}</span>
                  <span className="flex-1 -translate-y-1 border-b border-dotted border-ink/25" />
                  <span className={line.tone === 'warn' ? 'text-todo' : 'text-accent-mint'}>{line.status}</span>
                </li>
              ))}
            </ul>

            <div className={`${styles.line} mt-5`} style={lineStyle(progressIndex)}>
              <p className="flex items-baseline justify-between text-ink/80">
                <span>{UI_TEXT.loading.title}</span>
                <span className="text-accent-mint tabular-nums">{percent}%</span>
              </p>
              <div
                role="progressbar"
                aria-label={UI_TEXT.loading.progressLabel}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                className="mt-1.5 h-4 w-full border border-accent-mint/40 p-[2px]"
              >
                <div className={styles.fill} style={{ width: `${percent}%` }} />
              </div>
            </div>

            {/* A tela de leitor só ouve a mudança relevante (pronto), não cada porcentagem. */}
            <p role="status" className="sr-only">
              {showButton ? UI_TEXT.loading.ready : ''}
            </p>

            <div className="mt-6 flex min-h-12 flex-wrap items-center gap-x-5 gap-y-3">
              {showButton ? (
                <>
                  <button
                    ref={buttonRef}
                    type="button"
                    onClick={onEnter}
                    className="cursor-pointer border border-accent-mint/70 bg-accent-mint/10 px-7 py-2.5 font-medium tracking-[0.18em] text-accent-mint uppercase transition-colors hover:bg-accent-mint/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-mint"
                  >
                    {UI_TEXT.loading.enter}
                  </button>
                  <span aria-hidden="true" className="flex items-center gap-2 text-ink/60">
                    {UI_TEXT.loading.ready}
                    <Kbd>{boot.enterKey}</Kbd>
                  </span>
                </>
              ) : (
                <span aria-hidden="true" className="text-ink/60">
                  {'>'}
                  <span className={styles.cursor} />
                </span>
              )}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
