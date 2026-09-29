import { memo, useId } from 'react'
import type { Ref } from 'react'
import { ArrowUpRightIcon, CalendarBlankIcon, GithubLogoIcon, GlobeIcon, UserIcon } from '@phosphor-icons/react'
import { OS_TEXT } from '@/content/os'
import type { WebProject } from '@/content/types'
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
 * Detalhe de um projeto: mídia, resumo, detalhes, stack, ano e links. Só conteúdo, sem moldura:
 * o Desktop o coloca numa Window e o ProjectsApp standalone o mostra no lugar da lista.
 * Layout fluido (flex-wrap): duas colunas quando cabe, uma coluna em painéis estreitos.
 */
export const ProjectWindow = memo(function ProjectWindow({ project, headingRef, flush = false }: ProjectWindowProps) {
  const stackId = useId()
  const style: CssVars = { '--accent': project.accent }
  const hasMeta = project.year !== undefined || project.role !== undefined
  const hasLinks = project.repoUrl !== undefined || project.liveUrl !== undefined

  return (
    <article className={`${scope.scope} ${styles.root} ${flush ? styles.flush : ''}`} style={style}>
      <div className={styles.layout}>
        <div className={styles.mediaCol}>
          <ProjectMedia key={project.slug} project={project} />
        </div>

        <div className={styles.infoCol}>
          <header className={styles.header}>
            <span className={styles.bar} aria-hidden="true" />
            <h2 ref={headingRef} tabIndex={-1} className={styles.title}>
              {project.title}
            </h2>
            {hasMeta ? (
              <dl className={styles.meta}>
                {project.year !== undefined ? (
                  <div className={styles.metaItem}>
                    <dt className={shared.srOnly}>{OS_TEXT.detail.year}</dt>
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
                    <dt className={shared.srOnly}>{OS_TEXT.detail.role}</dt>
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

          {project.details && project.details.length > 0 ? (
            <div className={styles.details}>
              {project.details.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          ) : null}

          {project.stack.length > 0 ? (
            <section aria-labelledby={stackId}>
              <h3 id={stackId} className={styles.sectionLabel}>
                {OS_TEXT.detail.stack}
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

          {hasLinks ? (
            <div className={styles.actions} role="group" aria-label={OS_TEXT.detail.links}>
              {project.repoUrl ? (
                <a className={shared.action} href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                  <span className={shared.actionGlyph} aria-hidden="true">
                    <GithubLogoIcon weight="regular" />
                  </span>
                  {OS_TEXT.detail.repo}
                  <span className={shared.srOnly}>{OS_TEXT.detail.newTab}</span>
                  <span className={shared.actionArrow} aria-hidden="true">
                    <ArrowUpRightIcon weight="regular" />
                  </span>
                </a>
              ) : null}
              {project.liveUrl ? (
                <a className={shared.action} href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                  <span className={shared.actionGlyph} aria-hidden="true">
                    <GlobeIcon weight="regular" />
                  </span>
                  {OS_TEXT.detail.live}
                  <span className={shared.srOnly}>{OS_TEXT.detail.newTab}</span>
                  <span className={shared.actionArrow} aria-hidden="true">
                    <ArrowUpRightIcon weight="regular" />
                  </span>
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
})
