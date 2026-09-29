import { useState } from 'react'
import { PlayIcon } from '@phosphor-icons/react'
import { OS_TEXT } from '@/content/os'
import type { WebProject } from '@/content/types'
import { OsGlyph, projectGlyph } from '../OsGlyph'
import styles from './ProjectMedia.module.css'

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

/** Estado vazio: janela de navegador estilizada na cor do projeto (não é uma captura real). */
function MediaPlaceholder({ project }: { project: WebProject }) {
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
            <OsGlyph name={projectGlyph(project.slug)} />
          </div>
          <div className={styles.mockLines}>
            <span className={styles.line} />
            <span className={styles.line} />
            <span className={styles.line} />
          </div>
        </div>
      </div>
      <p className={styles.caption}>{OS_TEXT.media.placeholder}</p>
    </div>
  )
}

/**
 * Mídia do projeto: vídeo e imagens (visor + miniaturas) quando existem; senão o placeholder.
 * Quem usa deve passar `key={project.slug}` para o item selecionado reiniciar entre projetos.
 */
export function ProjectMedia({ project }: { project: WebProject }) {
  const items = collectMedia(project)
  const [selected, setSelected] = useState(0)

  if (items.length === 0) return <MediaPlaceholder project={project} />

  const index = Math.min(selected, items.length - 1)
  const current = items[index]

  return (
    <div className={styles.media}>
      <div className={styles.viewer}>
        {current.kind === 'video' ? (
          <video
            key={current.src}
            className={styles.fill}
            src={current.src}
            poster={current.poster}
            aria-label={OS_TEXT.media.video}
            controls
            playsInline
            preload="metadata"
          />
        ) : (
          // <img> simples: o src é conteúdo (pode ser URL absoluta) e next/image exigiria
          // images.remotePatterns no next.config.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={current.src}
            className={styles.fill}
            src={current.src}
            alt={current.alt}
            width={current.width}
            height={current.height}
            decoding="async"
            draggable={false}
          />
        )}
      </div>

      {items.length > 1 ? (
        <div className={styles.thumbs} role="group" aria-label={OS_TEXT.media.gallery}>
          {items.map((item, i) => (
            <button
              key={`${item.kind}:${item.src}`}
              type="button"
              className={styles.thumb}
              aria-label={item.kind === 'video' ? OS_TEXT.media.video : item.alt}
              aria-pressed={i === index}
              onClick={() => setSelected(i)}
            >
              {item.kind === 'video' ? (
                <span className={styles.thumbPlay} aria-hidden="true">
                  <PlayIcon weight="fill" />
                </span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={styles.fill} src={item.src} alt="" loading="lazy" decoding="async" draggable={false} />
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
