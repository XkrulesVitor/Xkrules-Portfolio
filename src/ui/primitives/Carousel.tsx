import {
  Children,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react'
import { UI_TEXT } from '@/content/site'
import { cx } from './cx'
import { fmt } from './format'
import { IconButton } from './IconButton'
import { useReduceMotion } from './motion'
import { FOCUS_RING } from './styles'

export interface CarouselLabels {
  prev: string
  next: string
  /** Modelo com {n} e {total}. */
  slide: string
  /** Modelo com {n}. */
  goTo: string
}

interface CarouselProps {
  /** Nome acessível da região. */
  label: string
  /** Cada filho é um slide. */
  children: ReactNode
  /** Mostra uma "espiada" do próximo slide (cada slide ocupa 86% da largura). */
  peek?: boolean
  /** Sobrescreve os textos padrão (UI_TEXT.carousel), ex.: "Peça {n} de {total}". */
  labels?: Partial<CarouselLabels>
  className?: string
}

interface Nav {
  index: number
  atStart: boolean
  atEnd: boolean
}

/**
 * Carrossel com scroll-snap nativo (toque, trackpad e roda funcionam) e controles rotulados:
 * setas, pontos e teclado (setas, Home e End com o trilho focado). Um leitor de tela ouve
 * "Slide N de M" a cada troca.
 */
export function Carousel({ label, children, peek = false, labels, className }: CarouselProps) {
  const text: CarouselLabels = {
    prev: labels?.prev ?? UI_TEXT.carousel.prev,
    next: labels?.next ?? UI_TEXT.carousel.next,
    slide: labels?.slide ?? UI_TEXT.carousel.slide,
    goTo: labels?.goTo ?? UI_TEXT.carousel.goTo,
  }
  const slides = Children.toArray(children)
  const count = slides.length
  const reduce = useReduceMotion()
  const trackRef = useRef<HTMLDivElement>(null)
  const [nav, setNav] = useState<Nav>({ index: 0, atStart: true, atEnd: count <= 1 })

  // Lê a posição real do trilho e deriva slide ativo e limites.
  const sync = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const items = Array.from(track.children) as HTMLElement[]
    const left = track.scrollLeft
    const max = track.scrollWidth - track.clientWidth
    let index = 0
    let best = Number.POSITIVE_INFINITY
    items.forEach((el, i) => {
      const distance = Math.abs(el.offsetLeft - left)
      if (distance < best) {
        best = distance
        index = i
      }
    })
    const atStart = left <= 1
    const atEnd = max <= 1 || left >= max - 1
    // No fim do trilho o último slide pode não alcançar o início; ele conta como ativo mesmo assim.
    if (atEnd && max > 1) index = items.length - 1
    setNav((prev) =>
      prev.index === index && prev.atStart === atStart && prev.atEnd === atEnd
        ? prev
        : { index, atStart, atEnd },
    )
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const observer = new ResizeObserver(() => sync())
    observer.observe(track)
    return () => observer.disconnect()
  }, [sync, count])

  const go = (target: number) => {
    const track = trackRef.current
    const slide = track?.children[Math.min(count - 1, Math.max(0, target))] as HTMLElement | undefined
    if (!track || !slide) return
    track.scrollTo({ left: slide.offsetLeft, behavior: reduce ? 'auto' : 'smooth' })
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Só quando o próprio trilho está focado: não atrapalha controles dentro dos slides.
    if (e.target !== e.currentTarget) return
    let target = -1
    if (e.key === 'ArrowRight') target = nav.index + 1
    else if (e.key === 'ArrowLeft') target = nav.index - 1
    else if (e.key === 'Home') target = 0
    else if (e.key === 'End') target = count - 1
    if (target < 0) return
    e.preventDefault()
    go(target)
  }

  const status = fmt(text.slide, { n: nav.index + 1, total: count })

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      className={cx('flex flex-col gap-3', className)}
    >
      <div
        ref={trackRef}
        tabIndex={count > 1 ? 0 : undefined}
        onScroll={sync}
        onKeyDown={onKeyDown}
        className={cx(
          'relative flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain rounded-2xl no-scrollbar',
          FOCUS_RING,
        )}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={fmt(text.slide, { n: i + 1, total: count })}
            className={cx('min-w-0 shrink-0 snap-start', peek ? 'basis-[86%]' : 'basis-full')}
          >
            {slide}
          </div>
        ))}
      </div>

      {count > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={fmt(text.goTo, { n: i + 1 })}
                aria-current={i === nav.index ? 'true' : undefined}
                onClick={() => go(i)}
                className={cx(
                  'group grid h-6 w-4 cursor-pointer place-items-center rounded-full pointer-coarse:h-9 pointer-coarse:w-5',
                  FOCUS_RING,
                )}
              >
                <span
                  className={cx(
                    'h-1.5 rounded-full transition-all duration-300 ease-glass',
                    i === nav.index
                      ? 'w-5 bg-accent-mint'
                      : 'w-1.5 bg-white/30 group-hover:bg-white/55',
                  )}
                />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <IconButton
              size="sm"
              icon={CaretLeftIcon}
              label={text.prev}
              aria-disabled={nav.atStart}
              onClick={() => go(nav.index - 1)}
            />
            <IconButton
              size="sm"
              icon={CaretRightIcon}
              label={text.next}
              aria-disabled={nav.atEnd}
              onClick={() => go(nav.index + 1)}
            />
          </div>
        </div>
      ) : null}

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {status}
      </p>
    </div>
  )
}
