/* eslint-disable @next/next/no-img-element --
   <img> simples de propósito: o src é conteúdo (pode ser URL absoluta) e o next/image exigiria
   images.remotePatterns no next.config. */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, FocusEvent } from 'react'
import { CaretLeftIcon, CaretRightIcon, PauseIcon, PlayIcon } from '@phosphor-icons/react'
import type { WebProject } from '@/content/types'
import { useOsText } from '../../i18n/useLocale'
import { fmt } from '../format'
import { AppGlyph, projectGlyph } from '../OsGlyph'
import shared from '../shared.module.css'
import { useOsMotion } from '../useOsMotion'
import styles from './ProjectMedia.module.css'

/** Quanto cada slide fica à vista antes da troca automática. */
const SLIDE_MS = 5000

type MediaItem =
  | { kind: 'video'; src: string; poster?: string }
  | { kind: 'image'; src: string; alt: string; width?: number; height?: number }

function collectMedia(project: WebProject): MediaItem[] {
  const items: MediaItem[] = []
  if (project.video) items.push({ kind: 'video', src: project.video.src, poster: project.video.poster })
  for (const image of project.images) {
    items.push({ kind: 'image', src: image.src, alt: image.alt, width: image.width, height: image.height })
  }
  return items
}

/**
 * Carrega e decodifica a imagem do slide antes da troca (o vídeo só adianta o poster). Nunca rejeita:
 * se a imagem falhar, a troca segue e o `alt` aparece no lugar.
 */
function preload(item: MediaItem): Promise<void> {
  const src = item.kind === 'image' ? item.src : item.poster
  if (!src) return Promise.resolve()
  const img = new Image()
  img.src = src
  return img.decode().catch(() => undefined)
}

/**
 * A galeria está sendo vista? Aba visível, fora de um ancestral `inert` (monitor sem foco no 3D) e
 * dentro de uma janela do SO ativa. O `data-active` mais próximo é o da janela (Window) ou, fora dela,
 * o da tela do monitor (MonitorScreen); sem nenhum, vale como vista (ProjectsApp num painel DOM).
 */
function isWatched(el: HTMLElement | null): boolean {
  if (!el || document.visibilityState === 'hidden') return false
  if (el.closest('[inert]')) return false
  const owner = el.closest('[data-active]')
  return owner === null || owner.getAttribute('data-active') === 'true'
}

/** Estado vazio: janela de navegador estilizada na cor do projeto (não é uma captura real). */
function MediaPlaceholder({ project }: { project: WebProject }) {
  const caption = useOsText().media.placeholder
  return (
    <div className={styles.placeholder}>
      <div className={styles.mock} aria-hidden="true">
        <div className={styles.mockBar}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.url} />
        </div>
        <div className={styles.mockBody}>
          <div className={styles.mockHero}>
            <AppGlyph name={projectGlyph(project.slug)} icon={project.icon} />
          </div>
          <div className={styles.mockLines}>
            <span className={styles.line} />
            <span className={styles.line} />
            <span className={styles.line} />
          </div>
        </div>
      </div>
      <p className={styles.caption}>{caption}</p>
    </div>
  )
}

interface SlideProps {
  item: MediaItem
  active: boolean
  /** "Imagem 2 de 5": rótulo do slide para leitores de tela. */
  label: string
  videoLabel: string
  onVideoPlaying: (playing: boolean) => void
}

interface VideoSlideProps {
  item: Extract<MediaItem, { kind: 'video' }>
  active: boolean
  label: string
  onVideoPlaying: (playing: boolean) => void
}

/** Vídeo do projeto: pausa quando o slide deixa de ser o atual e avisa a galeria enquanto toca. */
function VideoSlide({ item, active, label, onVideoPlaying }: VideoSlideProps) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!active) ref.current?.pause()
  }, [active])

  // Desmontar tocando não dispara `pause`: libera a troca automática por conta própria.
  useEffect(() => () => onVideoPlaying(false), [onVideoPlaying])

  return (
    <>
      {item.poster ? <img className={styles.backdrop} src={item.poster} alt="" aria-hidden="true" draggable={false} /> : null}
      <video
        ref={ref}
        className={styles.shot}
        src={item.src}
        poster={item.poster}
        aria-label={label}
        controls
        playsInline
        preload={active ? 'metadata' : 'none'}
        onPlay={() => onVideoPlaying(true)}
        onPause={() => onVideoPlaying(false)}
        onEnded={() => onVideoPlaying(false)}
      />
    </>
  )
}

/**
 * Um slide: a própria imagem com `object-fit: contain` (nada é cortado, qualquer proporção) sobre uma
 * cópia dela mesma borrada e escurecida, que preenche as sobras. O slide inativo fica `inert`.
 */
function Slide({ item, active, label, videoLabel, onVideoPlaying }: SlideProps) {
  return (
    <div
      className={styles.slide}
      data-active={active}
      role="group"
      aria-roledescription="slide"
      aria-label={label}
      inert={!active}
    >
      {item.kind === 'video' ? (
        <VideoSlide item={item} active={active} label={videoLabel} onVideoPlaying={onVideoPlaying} />
      ) : (
        <>
          <img
            className={styles.backdrop}
            src={item.src}
            alt=""
            aria-hidden="true"
            decoding="async"
            draggable={false}
            fetchPriority={active ? undefined : 'low'}
          />
          <img
            className={styles.shot}
            src={item.src}
            alt={item.alt}
            width={item.width}
            height={item.height}
            decoding="async"
            draggable={false}
            fetchPriority={active ? undefined : 'low'}
          />
        </>
      )}
    </div>
  )
}

/**
 * Carrossel: crossfade entre os itens, troca sozinho a cada ~5 s e pausa em hover, em foco de
 * teclado, com um vídeo tocando, sem ninguém olhando (aba oculta, monitor sem foco, janela do SO
 * inativa) ou pelo botão de pausa. `prefers-reduced-motion` desliga a troca automática e o fade.
 * Só o item atual e os dois vizinhos ficam montados: o vizinho já carrega enquanto o atual aparece,
 * e a troca automática ainda espera o decode da próxima imagem.
 */
function Carousel({ items }: { items: readonly MediaItem[] }) {
  const os = useOsText()
  const { reduced } = useOsMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [videoPlaying, setVideoPlaying] = useState(false)
  const [stopped, setStopped] = useState(false)
  // Sobe quando uma batida é pulada (ninguém olhando): rearma o relógio sem mudar de slide.
  const [beat, setBeat] = useState(0)

  const count = items.length
  const multiple = count > 1
  const index = Math.min(selected, count - 1)
  const current = items[index]
  const autoplay = multiple && !reduced && !stopped
  const running = autoplay && !hovered && !focused && !videoPlaying

  useEffect(() => {
    if (!running) return
    let cancelled = false
    const timer = window.setTimeout(() => {
      if (!isWatched(rootRef.current)) {
        setBeat((b) => b + 1)
        return
      }
      const next = (index + 1) % count
      void preload(items[next]).then(() => {
        if (!cancelled) setSelected(next)
      })
    }, SLIDE_MS)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [running, index, beat, count, items])

  const go = (delta: number) => setSelected((index + delta + count) % count)

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!multiple || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    // As setas do player de vídeo buscam no tempo: deixa passar.
    if (event.target instanceof HTMLVideoElement) return
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      go(-1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      go(1)
    }
  }

  // Só o foco de teclado pausa: clicar numa seta com o mouse deixa o foco no botão, e o hover já cobre.
  const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
    let keyboard = false
    try {
      keyboard = event.target.matches(':focus-visible')
    } catch {
      keyboard = true
    }
    setFocused(keyboard)
  }

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    const to = event.relatedTarget as Node | null
    if (!event.currentTarget.contains(to)) setFocused(false)
  }

  const labelOf = (n: number) => fmt(os.media.counter, { n, total: count })
  const currentText = current.kind === 'image' ? current.alt : os.media.video

  return (
    <div
      ref={rootRef}
      className={styles.carousel}
      role="region"
      aria-roledescription="carousel"
      aria-label={os.media.gallery}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      {items.map((item, i) => {
        const near = i === index || i === (index + 1) % count || i === (index - 1 + count) % count
        return near ? (
          <Slide
            key={i}
            item={item}
            active={i === index}
            label={labelOf(i + 1)}
            videoLabel={os.media.video}
            onVideoPlaying={setVideoPlaying}
          />
        ) : null
      })}

      {multiple ? (
        <>
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowPrev}`}
            aria-label={os.media.prev}
            onClick={() => go(-1)}
          >
            <CaretLeftIcon weight="bold" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowNext}`}
            aria-label={os.media.next}
            onClick={() => go(1)}
          >
            <CaretRightIcon weight="bold" aria-hidden="true" />
          </button>

          <div className={styles.bar}>
            <div className={styles.pill}>
              {reduced ? null : (
                <button
                  type="button"
                  className={styles.toggle}
                  aria-label={stopped ? os.media.play : os.media.pause}
                  onClick={() => setStopped((value) => !value)}
                >
                  {stopped ? (
                    <PlayIcon weight="fill" aria-hidden="true" />
                  ) : (
                    <PauseIcon weight="fill" aria-hidden="true" />
                  )}
                </button>
              )}
              <div className={styles.dots}>
                {items.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    className={styles.dotButton}
                    aria-label={item.kind === 'video' ? os.media.video : fmt(os.media.goTo, { n: i + 1 })}
                    aria-current={i === index ? 'true' : undefined}
                    onClick={() => setSelected(i)}
                  >
                    <span className={styles.dotMark} data-active={i === index} />
                  </button>
                ))}
              </div>
              <span className={styles.counter}>
                <span aria-hidden="true">
                  {index + 1} / {count}
                </span>
                {/* Anuncia o slide novo só quando a troca é do usuário; rodando sozinha, fica calada. */}
                <span className={shared.srOnly} aria-live={running ? 'off' : 'polite'} aria-atomic="true">
                  {labelOf(index + 1)}: {currentText}
                </span>
              </span>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

/**
 * Mídia do projeto: carrossel com vídeo e imagens reais quando existem; senão o placeholder.
 * Quem usa deve passar `key={project.slug}` para o slide atual reiniciar entre projetos.
 */
export function ProjectMedia({ project }: { project: WebProject }) {
  const items = useMemo(() => collectMedia(project), [project])
  if (items.length === 0) return <MediaPlaceholder project={project} />
  return <Carousel items={items} />
}
