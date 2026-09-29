import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { motion, useIsPresent, type Variants } from 'motion/react'
import { getHotspot } from '@/content/hotspots'
import type { HotspotId, PanelSide } from '@/content/types'
import { cx, DURATION, EASE, Reveal, STAGGER, useReduceMotion } from '../primitives'

/** Abaixo desta largura (do container, que no app é o overlay inteiro) o painel vira bottom-sheet. */
const SHEET_MAX_WIDTH = 768

interface PanelShellProps {
  hotspotId: HotspotId
  /** Título (h2, recebe o foco inicial). Padrão: rótulo do hotspot no registry. */
  title?: string
  /** Rótulo em caixa alta acima do título. */
  eyebrow?: string
  /** Linha de apoio sob o título. */
  subtitle?: string
  /** Elemento à esquerda do título (avatar, ícone). */
  leading?: ReactNode
  /** Foco inicial no título. Desligue só em pré-visualizações com vários painéis. */
  autoFocus?: boolean
  /**
   * Lado do painel. Padrão: o do registry. Painéis com sub-vistas (Jogos) passam o lado da vista
   * ativa; ao mudar, o painel desliza para o outro lado (layout animation), sem desmontar.
   */
  side?: PanelSide
  children?: ReactNode
}

/**
 * Casca dos painéis DOM (ARCHITECTURE §8): vidro fumê preso à borda do lado que o registry define.
 * Abaixo de 768px vira bottom-sheet de 70% da altura, com rolagem interna. Entra e sai com
 * deslocamento de 40px (lateral) ou 48px (sheet), 0.35s e a curva de §8; os filhos (`Reveal`)
 * entram em stagger. `role="dialog"`, foco inicial no título; o Esc é global (useKeyboard).
 *
 * O layout responde ao CONTAINER (`@container-size` no invólucro, que ocupa o overlay inteiro),
 * não à viewport: no app dá na mesma, e as molduras de /dev/ui simulam o celular de verdade.
 */
export function PanelShell({
  hotspotId,
  title,
  eyebrow,
  subtitle,
  leading,
  autoFocus = true,
  side,
  children,
}: PanelShellProps) {
  const hotspot = getHotspot(hotspotId)
  const titleId = useId()
  const eyebrowId = useId()
  const titleRef = useRef<HTMLHeadingElement>(null)
  // Guarda 5: painéis só recebem pointer-events enquanto presentes (não durante o exit).
  const isPresent = useIsPresent()
  const reduce = useReduceMotion()
  const fromLeft = (side ?? hotspot.side) === 'left'

  // O modo (lateral x sheet) precisa estar definido ANTES do primeiro frame do `aside`, porque
  // define de que lado a animação de entrada parte. O ref callback mede o invólucro no commit
  // (antes do paint) e o ResizeObserver acompanha redimensionamentos.
  const [sheet, setSheet] = useState<boolean | null>(null)
  const measureRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    const update = () => setSheet(el.clientWidth < SHEET_MAX_WIDTH)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const ready = sheet !== null
  useEffect(() => {
    if (ready && autoFocus) titleRef.current?.focus({ preventScroll: true })
  }, [ready, autoFocus])

  const dx = reduce || sheet ? 0 : fromLeft ? -40 : 40
  const dy = reduce || !sheet ? 0 : 48
  const variants: Variants = {
    hidden: { opacity: 0, x: dx, y: dy },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: DURATION, ease: EASE, delayChildren: 0.06, staggerChildren: STAGGER },
    },
    exit: { opacity: 0, x: dx, y: dy, transition: { duration: DURATION, ease: EASE } },
  }

  return (
    <div ref={measureRef} className="@container-size pointer-events-none absolute inset-0">
      {ready ? (
        <motion.aside
          // Troca de lado (sub-vista) anima a posição por FLIP; a entrada/saída segue as variants.
          layout="position"
          transition={{ layout: { duration: reduce ? 0 : 0.55, ease: EASE } }}
          role="dialog"
          aria-labelledby={eyebrow ? eyebrowId + ' ' + titleId : titleId}
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{ pointerEvents: isPresent ? 'auto' : 'none' }}
          className={cx(
            'glass-fill-smoked absolute top-0 flex h-full w-[min(440px,92cqw)] flex-col overflow-hidden text-ink',
            'border-[var(--glass-border)]',
            fromLeft ? 'left-0 border-r' : 'right-0 border-l',
            // Mobile: bottom-sheet de 70% da altura, colado na base.
            '@max-3xl:inset-x-0 @max-3xl:top-auto @max-3xl:bottom-0 @max-3xl:h-[70cqh] @max-3xl:w-full',
            '@max-3xl:rounded-t-[20px] @max-3xl:border-t @max-3xl:border-r-0 @max-3xl:border-l-0',
          )}
        >
          {/* Entre 768 e 1023px o BackButton (topo, centralizado, 144px) invade o topo do painel: o cabeçalho desce. */}
          <Reveal className="shrink-0 px-6 pt-6 pb-1 @max-3xl:px-5 @max-3xl:pt-5 @3xl:@max-5xl:pt-[4.5rem]">
            <header className="flex items-center gap-4">
              {leading}
              <div className="min-w-0">
                {eyebrow ? (
                  <p id={eyebrowId} className="label-caps flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="size-1.5 rounded-full bg-accent-mint shadow-[0_0_10px_var(--color-accent-mint)]"
                    />
                    {eyebrow}
                  </p>
                ) : null}
                <h2
                  id={titleId}
                  ref={titleRef}
                  tabIndex={-1}
                  className="mt-1.5 text-[26px] leading-tight font-semibold tracking-tight text-balance outline-none @max-3xl:text-[22px]"
                >
                  {title ?? hotspot.label}
                </h2>
                {subtitle ? (
                  <p className="mt-1.5 text-sm leading-snug text-ink/75">{subtitle}</p>
                ) : null}
              </div>
            </header>
          </Reveal>

          {/* Rolagem interna. As bordas esmaecem; o padding mantém o conteúdo em repouso fora da faixa. */}
          <div className="scroll-fade-y scrollbar-glass min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="flex flex-col gap-7 px-6 pt-4 pb-8 @max-3xl:px-5 @max-3xl:pb-[max(2rem,env(safe-area-inset-bottom))]">
              {children}
            </div>
          </div>
        </motion.aside>
      ) : null}
    </div>
  )
}
