import { memo, useEffect, useId, useRef, useState } from 'react'
import { ArrowLeftIcon, CaretRightIcon } from '@phosphor-icons/react'
import { OS_TEXT } from '@/content/os'
import { WEB_PROJECTS } from '@/content/projects.web'
import type { WebProject } from '@/content/types'
import type { CssVars } from '../cssVars'
import { OsGlyph, projectGlyph } from '../OsGlyph'
import scope from '../scope.module.css'
import shared from '../shared.module.css'
import { ProjectWindow } from './ProjectWindow'
import styles from './ProjectsApp.module.css'

/** Quantas tags de stack aparecem no cartão; o resto vira "+N". */
const MAX_TAGS = 3

/** Ancestral rolável mais próximo (o painel do host), se houver conteúdo para rolar. */
function nearestScroller(el: HTMLElement | null): HTMLElement | null {
  for (let node = el?.parentElement ?? null; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node)
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
      return node
    }
  }
  return null
}

export interface ProjectsAppProps {
  projects?: readonly WebProject[]
  /**
   * Modo controlado (Desktop): o clique só avisa o host, que abre uma janela própria.
   * Sem isto o app funciona sozinho: o detalhe abre no lugar da lista, com botão de voltar.
   */
  onOpenProject?: (slug: string) => void
  /** Título "Projetos" no topo. O Desktop o esconde porque a barra da janela já o mostra. */
  showHeading?: boolean
  className?: string
}

interface ProjectCardProps {
  project: WebProject
  onOpen: (slug: string) => void
}

function ProjectCard({ project, onOpen }: ProjectCardProps) {
  const titleId = useId()
  const summaryId = useId()
  const stackId = useId()
  const shown = project.stack.slice(0, MAX_TAGS)
  const rest = project.stack.slice(MAX_TAGS)
  const style: CssVars = { '--accent': project.accent }

  return (
    <li className={styles.item} style={style}>
      <button
        type="button"
        className={styles.card}
        data-slug={project.slug}
        aria-labelledby={titleId}
        aria-describedby={`${summaryId} ${stackId}`}
        onClick={() => onOpen(project.slug)}
      >
        <span className={styles.cardGlyph} aria-hidden="true">
          <OsGlyph name={projectGlyph(project.slug)} />
        </span>
        <span className={styles.cardMain}>
          <span className={styles.cardHead}>
            <span id={titleId} className={styles.cardTitle}>
              {project.title}
            </span>
            {project.year !== undefined ? <span className={styles.cardYear}>{project.year}</span> : null}
          </span>
          <span id={summaryId} className={styles.cardSummary}>
            {project.summary}
          </span>
          <span id={stackId} className={`${shared.chips} ${styles.cardTags}`}>
            {shown.map((tech) => (
              <span key={tech} className={shared.chip}>
                {tech}
              </span>
            ))}
            {rest.length > 0 ? (
              <span className={shared.chipMore} title={rest.join(', ')}>
                +{rest.length}
              </span>
            ) : null}
          </span>
        </span>
        <span className={styles.chevron} aria-hidden="true">
          <CaretRightIcon weight="bold" />
        </span>
      </button>
    </li>
  )
}

/**
 * Lista dos projetos web. Precisa funcionar em dois lugares: dentro de uma janela do Desktop
 * (modo controlado) e sozinho num painel DOM comum, inclusive estreito (mobile). O layout é
 * fluido (grid auto-fill) e todo tamanho vem de `--px` (1px fora do Desktop).
 */
export const ProjectsApp = memo(function ProjectsApp({
  projects = WEB_PROJECTS,
  onOpenProject,
  showHeading = true,
  className,
}: ProjectsAppProps) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const returnSlugRef = useRef<string | null>(null)

  const controlled = onOpenProject !== undefined
  const detail =
    !controlled && selectedSlug !== null ? projects.find((p) => p.slug === selectedSlug) : undefined

  // Foco e rolagem acompanham a navegação. Ao abrir o detalhe: painel do host volta ao topo e o
  // foco vai para o título. Ao voltar: o cartão de origem recebe o foco (e reaparece na vista).
  useEffect(() => {
    if (detail) {
      nearestScroller(rootRef.current)?.scrollTo({ top: 0 })
      headingRef.current?.focus({ preventScroll: true })
      return
    }
    const slug = returnSlugRef.current
    if (slug) {
      returnSlugRef.current = null
      rootRef.current?.querySelector<HTMLElement>(`[data-slug="${CSS.escape(slug)}"]`)?.focus()
    }
  }, [detail])

  const open = (slug: string) => {
    if (onOpenProject) onOpenProject(slug)
    else setSelectedSlug(slug)
  }

  const goBack = () => {
    returnSlugRef.current = selectedSlug
    setSelectedSlug(null)
  }

  return (
    <div
      ref={rootRef}
      className={[scope.scope, styles.root, className].filter(Boolean).join(' ')}
    >
      {detail ? (
        <div key="detail" className={styles.view}>
          <div className={styles.toolbar}>
            <button type="button" className={styles.back} onClick={goBack}>
              <span className={styles.backGlyph} aria-hidden="true">
                <ArrowLeftIcon weight="regular" />
              </span>
              {OS_TEXT.projects.back}
            </button>
          </div>
          <ProjectWindow project={detail} headingRef={headingRef} flush />
        </div>
      ) : (
        <div key="list" className={controlled ? styles.viewStatic : styles.view}>
          {showHeading ? (
            <header className={styles.heading}>
              <p className={styles.eyebrow}>{OS_TEXT.projects.subtitle}</p>
              <h2 className={styles.title}>{OS_TEXT.projects.title}</h2>
            </header>
          ) : null}
          <p className={styles.hint}>{OS_TEXT.projects.hint}</p>
          {projects.length === 0 ? (
            <p className={styles.empty}>{OS_TEXT.projects.empty}</p>
          ) : (
            <ul className={styles.list} role="list" aria-label={OS_TEXT.projects.list}>
              {projects.map((project) => (
                <ProjectCard key={project.slug} project={project} onOpen={open} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
})
