import { memo, useId } from 'react'
import type { Ref } from 'react'
import {
  ArrowUpRightIcon,
  CalendarBlankIcon,
  GithubLogoIcon,
  GlobeIcon,
  TelevisionSimpleIcon,
  UserIcon,
} from '@phosphor-icons/react'
import type { WebProject } from '@/content/types'
import { useExperienceStore } from '@/store/useExperienceStore'
import { useOsText } from '../../i18n/useLocale'
import type { CssVars } from '../cssVars'
import scope from '../scope.module.css'
import shared from '../shared.module.css'
import { ProjectMedia } from './ProjectMedia'
import styles from './ProjectWindow.module.css'

export interface ProjectWindowProps {
  project: WebProject
  /** Para o host levar o foco ao título quando o detalhe abre (ProjectsApp standalone). */
  headingRef?: Ref<HTMLHeadingElement>
  /** Sem padding próprio: quando o host (ProjectsApp) já tem o dele. */
  flush?: boolean
}

/**
 * Detalhe de um projeto, de cima para baixo: galeria em destaque (carrossel), título e ano/papel,
 * resumo, ações (site, jogar na TV, repositório), detalhes, área de atuação e stack. Só conteúdo,
 * sem moldura: o Desktop o coloca numa Window e o ProjectsApp standalone o mostra no lugar da lista.
 * Coluna única e largura de leitura limitada: a galeria ocupa a janela inteira, o texto não se estica.
 */
export const ProjectWindow = memo(function ProjectWindow({ project, headingRef, flush = false }: ProjectWindowProps) {
  const areasId = useId()
  const stackId = useId()
  const os = useOsText()
  const style: CssVars = { '--accent': project.accent }
  const hasMeta = project.year !== undefined || project.role !== undefined
  const areas = project.areas ?? []
  const playOnTv = project.playOnTv
  const hasActions = project.repoUrl !== undefined || project.liveUrl !== undefined || playOnTv !== undefined
  const hasFacets = areas.length > 0 || project.stack.length > 0
  // Sem site no ar, o jogo na TV é a ação principal da janela.
  const tvClass = project.liveUrl ? shared.action : styles.primary

  return (
    <article className={`${scope.scope} ${styles.root} ${flush ? styles.flush : ''}`} style={style}>
      <div className={styles.layout}>
        <ProjectMedia key={project.slug} project={project} />

        <div className={styles.info}>
          <header className={styles.header}>
            <span className={styles.bar} aria-hidden="true" />
            <h2 ref={headingRef} tabIndex={-1} className={styles.title}>
              {project.title}
            </h2>
            {hasMeta ? (
              <dl className={styles.meta}>
                {project.year !== undefined ? (
                  <div className={styles.metaItem}>
                    <dt className={shared.srOnly}>{os.detail.year}</dt>
                    <dd className={styles.metaValue}>
                      <span className={styles.metaGlyph} aria-hidden="true">
                        <CalendarBlankIcon weight="duotone" />
                      </span>
                      {project.year}
                    </dd>
                  </div>
                ) : null}
                {project.role !== undefined ? (
                  <div className={styles.metaItem}>
                    <dt className={shared.srOnly}>{os.detail.role}</dt>
                    <dd className={styles.metaValue}>
                      <span className={styles.metaGlyph} aria-hidden="true">
                        <UserIcon weight="duotone" />
                      </span>
                      {project.role}
                    </dd>
                  </div>
                ) : null}
              </dl>
            ) : null}
          </header>

          <p className={styles.summary}>{project.summary}</p>

          {hasActions ? (
            <div className={styles.actions} role="group" aria-label={os.detail.links}>
              {project.liveUrl ? (
                <a className={styles.primary} href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                  <span className={shared.actionGlyph} aria-hidden="true">
                    <GlobeIcon weight="duotone" />
                  </span>
                  {os.detail.live}
                  <span className={shared.srOnly}>{os.detail.newTab}</span>
                  <span className={shared.actionArrow} aria-hidden="true">
                    <ArrowUpRightIcon weight="regular" />
                  </span>
                </a>
              ) : null}
              {playOnTv !== undefined ? (
                <button
                  type="button"
                  className={tvClass}
                  onClick={() => useExperienceStore.getState().startGame(playOnTv)}
                >
                  <span className={shared.actionGlyph} aria-hidden="true">
                    <TelevisionSimpleIcon weight="duotone" />
                  </span>
                  {os.detail.playTv}
                </button>
              ) : null}
              {project.repoUrl ? (
                <a className={shared.actionQuiet} href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                  <span className={shared.actionGlyph} aria-hidden="true">
                    <GithubLogoIcon weight="regular" />
                  </span>
                  {os.detail.repo}
                  <span className={shared.srOnly}>{os.detail.newTab}</span>
                  <span className={shared.actionArrow} aria-hidden="true">
                    <ArrowUpRightIcon weight="regular" />
                  </span>
                </a>
              ) : null}
            </div>
          ) : null}

          {project.details && project.details.length > 0 ? (
            <div className={styles.details}>
              {project.details.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          ) : null}

          {hasFacets ? (
            <div className={styles.facets}>
              {areas.length > 0 ? (
                <section aria-labelledby={areasId}>
                  <h3 id={areasId} className={styles.sectionLabel}>
                    {os.detail.areas}
                  </h3>
                  <ul className={styles.areas} role="list">
                    {areas.map((area) => (
                      <li key={area} className={styles.area}>
                        {area}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {project.stack.length > 0 ? (
                <section aria-labelledby={stackId}>
                  <h3 id={stackId} className={styles.sectionLabel}>
                    {os.detail.stack}
                  </h3>
                  <ul className={shared.chips} role="list">
                    {project.stack.map((tech) => (
                      <li key={tech} className={shared.chip}>
                        {tech}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
})
