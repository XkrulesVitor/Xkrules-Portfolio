import type { CSSProperties, FocusEvent, HTMLAttributes, PointerEvent } from 'react'
import {
  CubeIcon,
  DiceFiveIcon,
  GameControllerIcon,
  MonitorIcon,
  UserIcon,
  type Icon,
} from '@phosphor-icons/react'
import { motion, type Transition } from 'motion/react'
import type { UiText } from '@/content/site'
import type { HotspotId } from '@/content/types'
import { selectHoverOn } from '@/store/selectors'
import { useExperienceStore } from '@/store/useExperienceStore'
import { useUiText } from '../i18n/useLocale'
import { cx, fmt, FOCUS_RING, usePress, useReduceMotion } from '../primitives'

export type HotspotMarkerKey = keyof UiText['markers']['labels']

const ICONS: Record<HotspotMarkerKey, Icon> = {
  chair: UserIcon,
  desk: MonitorIcon,
  printer: CubeIcon,
  tabuleiro: DiceFiveIcon,
  digital: GameControllerIcon,
}

/** Lado da área de clique em repouso, em px. É também a altura da pílula. */
const REST_SIZE = 32
/** A superfície de vidro encolhe em repouso: um pontinho de ~20 px dentro da área de clique. */
const REST_SURFACE_SCALE = 0.62

const SPRING: Transition = { type: 'spring', stiffness: 380, damping: 26, mass: 0.9 }
const CLOSE: Transition = { duration: 0.14, ease: 'easeOut' }
const NO_SPRING: Transition = { duration: 0.12 }

// Só o que o Tailwind não expressa: laços infinitos em CSS (só transform e opacity, sem JS por frame) e o
// vidro, que troca de receita ao abrir (backdrop-filter só com a pílula aberta: em repouso são 5 pontos
// sobre um canvas que redesenha a cada frame). `--hm-i` defasa os laços, para não pulsarem juntos.
// A linha vai da base da pílula (16 px abaixo da âncora) até o objeto, a 3.7vh da âncora (HotspotMarkers).
const CSS = `
.hm-root { --hm-line: max(10px, calc(3.7vh - 16px)); }
.hm-root[data-visible='false'] { visibility: hidden; transition: visibility 0s 0.25s; }
.hm-root[data-visible='false'] * { animation-play-state: paused; }
.hm-float { animation: hm-float 5.2s ease-in-out calc(var(--hm-i) * -1.3s) infinite alternate; }
.hm-pulse {
  border: 1px solid var(--color-accent-mint);
  opacity: 0;
  animation: hm-pulse 3.8s cubic-bezier(0.22, 1, 0.36, 1) calc(var(--hm-i) * -0.76s) infinite;
}
.hm-root[data-open='true'] .hm-pulse { animation: none; }
.hm-surface {
  background-color: rgb(11 16 32 / 0.42);
  border: 1px solid rgb(255 255 255 / 0.26);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.16), 0 2px 8px rgb(2 6 23 / 0.35);
  transition: background-color 0.25s, border-color 0.25s, box-shadow 0.25s;
}
.hm-root[data-open='true'] .hm-surface {
  background-color: var(--glass-tint);
  background-image: var(--glass-sheen);
  border-color: color-mix(in srgb, var(--color-accent-mint) 45%, transparent);
  box-shadow: var(--shadow-glass);
  -webkit-backdrop-filter: blur(12px) saturate(1.4);
  backdrop-filter: blur(12px) saturate(1.4);
}
.hm-sheen {
  background: linear-gradient(105deg, transparent 30%, rgb(255 255 255 / 0.26) 50%, transparent 70%);
  transform: translateX(-110%);
}
.hm-root[data-open='true'] .hm-sheen { animation: hm-sheen 0.9s var(--ease-glass) 0.1s both; }
.hm-core { box-shadow: 0 0 8px 1px color-mix(in srgb, var(--color-accent-mint) 70%, transparent); }
.hm-glow {
  box-shadow:
    0 0 22px 1px color-mix(in srgb, var(--color-accent-mint) 42%, transparent),
    0 0 0 1px color-mix(in srgb, var(--color-accent-mint) 16%, transparent);
}
.hm-line {
  height: var(--hm-line);
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--color-accent-mint) 85%, transparent),
    color-mix(in srgb, var(--color-accent-mint) 35%, transparent)
  );
}
.hm-tip {
  top: calc(100% + var(--hm-line));
  box-shadow: 0 0 8px 1px color-mix(in srgb, var(--color-accent-mint) 80%, transparent);
}
@keyframes hm-float {
  from { transform: translateY(-2.5px); }
  to { transform: translateY(2.5px); }
}
@keyframes hm-pulse {
  0% { transform: scale(0.55); opacity: 0.55; }
  70%, 100% { transform: scale(1.3); opacity: 0; }
}
@keyframes hm-sheen {
  from { transform: translateX(-110%); }
  to { transform: translateX(110%); }
}
@media (prefers-reduced-motion: reduce) {
  .hm-float, .hm-pulse, .hm-root[data-open='true'] .hm-sheen { animation: none; }
}
`

type StoppedEvents = Pick<
  HTMLAttributes<HTMLDivElement>,
  'onClick' | 'onDoubleClick' | 'onContextMenu' | 'onPointerDown' | 'onPointerMove'
>

interface HotspotMarkerProps extends StoppedEvents {
  markerKey: HotspotMarkerKey
  hotspot: HotspotId
  /** Sub-vista que este marcador abre e à qual reage (`null` = o hotspot inteiro). */
  view: string | null
  /** Posição na lista: defasa os laços e a entrada em cascata. */
  index: number
}

/**
 * Marcador de um ponto interativo do quarto (o drei `Html` que o posiciona está em
 * experience/interaction/HotspotMarkers). Em repouso, um pontinho de vidro menta pulsando devagar. No
 * hover dele OU do objeto (`store.hovered`), e com foco de teclado, o ponto se abre numa pílula com ícone
 * e rótulo, com brilho e uma linha fina descendo até o objeto. Passar a seta aqui liga o mesmo hover da
 * hitbox, então o objeto reage junto (contorno, cadeira girando). Só existe de fato em `idle`.
 */
export function HotspotMarker({ markerKey, hotspot, view, index, ...stoppedEvents }: HotspotMarkerProps) {
  const visible = useExperienceStore((s) => s.mode === 'idle')
  const open = useExperienceStore((s) => selectHoverOn(s, hotspot, view))
  const text = useUiText().markers
  const reduce = useReduceMotion()
  const press = usePress({ lift: false })
  const label = text.labels[markerKey]
  const MarkerIcon = ICONS[markerKey]

  const hoverOn = () => useExperienceStore.getState().setHovered(hotspot, view)
  const hoverOff = () => {
    const s = useExperienceStore.getState()
    if (selectHoverOn(s, hotspot, view)) s.setHovered(null)
  }
  const onPointerEnter = (e: PointerEvent) => {
    // Um arrasto da órbita cruzando o marcador não é hover.
    if (e.pointerType !== 'touch' && e.buttons === 0) hoverOn()
  }
  const onFocus = (e: FocusEvent<HTMLButtonElement>) => {
    // Só teclado: o foco que vem de um clique não pode deixar a pílula aberta depois que o ponteiro sai.
    if (e.currentTarget.matches(':focus-visible')) hoverOn()
  }

  const spring = reduce ? NO_SPRING : SPRING
  /** Mola ao abrir, com um atraso para entrar depois da pílula; fechamento curto, sem mola. */
  const reveal = (delay: number): Transition => (open ? (reduce ? NO_SPRING : { ...SPRING, delay }) : CLOSE)
  const appearDelay = reduce ? 0 : index * 0.07

  return (
    <>
      {/* React 19: `href` + `precedence` sobem o <style> para o <head> e o deduplicam entre as 5 raízes. */}
      <style href="hotspot-marker" precedence="hotspot-marker">
        {CSS}
      </style>
      <motion.div
        {...stoppedEvents}
        data-open={open}
        data-visible={visible}
        inert={!visible}
        initial={false}
        animate={visible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: reduce ? 1 : 0.6 }}
        transition={
          visible
            ? { opacity: { duration: 0.3, delay: appearDelay }, scale: { ...spring, delay: appearDelay } }
            : { duration: 0.2 }
        }
        style={{ '--hm-i': index } as CSSProperties}
        className={cx('hm-root relative w-fit', !visible && 'pointer-events-none')}
      >
        <div className="hm-float relative">
          <span aria-hidden="true" className="hm-pulse pointer-events-none absolute inset-0 rounded-full" />
          <motion.span
            aria-hidden="true"
            initial={false}
            animate={{ opacity: open ? 1 : 0 }}
            transition={{ duration: open ? 0.25 : 0.14 }}
            className="hm-glow pointer-events-none absolute inset-0 rounded-full"
          />
          <motion.button
            type="button"
            aria-label={fmt(text.aria, { label })}
            onClick={() => useExperienceStore.getState().requestFocus(hotspot, view)}
            onPointerEnter={onPointerEnter}
            onPointerLeave={hoverOff}
            onFocus={onFocus}
            onBlur={hoverOff}
            {...press}
            initial={false}
            animate={{ width: open ? 'auto' : REST_SIZE }}
            transition={reduce ? { duration: 0 } : open ? SPRING : { type: 'spring', stiffness: 520, damping: 40 }}
            style={{ height: REST_SIZE }}
            className={cx(
              'relative flex cursor-pointer items-center overflow-hidden rounded-full select-none',
              FOCUS_RING,
            )}
          >
            <motion.span
              aria-hidden="true"
              initial={false}
              animate={{ scale: open ? 1 : REST_SURFACE_SCALE }}
              transition={open ? spring : CLOSE}
              className="hm-surface absolute inset-0 overflow-hidden rounded-full"
            >
              <span className="hm-sheen absolute inset-0" />
            </motion.span>
            <span className="relative grid size-8 shrink-0 place-items-center">
              <motion.span
                aria-hidden="true"
                initial={false}
                animate={{ scale: open ? 0 : 1, opacity: open ? 0 : 1 }}
                transition={open ? CLOSE : spring}
                className="hm-core absolute size-2 rounded-full bg-accent-mint"
              />
              <motion.span
                aria-hidden="true"
                initial={false}
                animate={{ scale: open ? 1 : 0.3, rotate: open ? 0 : -24, opacity: open ? 1 : 0 }}
                transition={reveal(0.03)}
                className="flex text-accent-mint"
              >
                <MarkerIcon size={17} weight="duotone" />
              </motion.span>
            </span>
            <motion.span
              aria-hidden="true"
              initial={false}
              animate={{ opacity: open ? 1 : 0, x: open || reduce ? 0 : -6 }}
              transition={reveal(0.06)}
              className="relative pr-3.5 text-xs font-medium tracking-wide whitespace-nowrap text-ink"
            >
              {label}
            </motion.span>
          </motion.button>
          <motion.span
            aria-hidden="true"
            initial={false}
            animate={{ scaleY: open ? 1 : 0, opacity: open ? 1 : 0 }}
            transition={reveal(0.08)}
            className="hm-line pointer-events-none absolute top-full left-1/2 w-px origin-top -translate-x-1/2"
          />
          <motion.span
            aria-hidden="true"
            initial={false}
            animate={{ scale: open ? 1 : 0, opacity: open ? 1 : 0 }}
            transition={reveal(0.16)}
            className="hm-tip pointer-events-none absolute left-1/2 size-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-mint"
          />
        </div>
      </motion.div>
    </>
  )
}
