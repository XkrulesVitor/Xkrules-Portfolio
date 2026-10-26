import { memo, useId } from 'react'
import type { ReactNode } from 'react'
import { ArrowUpRightIcon, GithubLogoIcon, GlobeIcon, HeartIcon } from '@phosphor-icons/react'
import { CREDITS } from '@/content/os'
import { useOsText } from '../../i18n/useLocale'
import { OsGlyph } from '../OsGlyph'
import scope from '../scope.module.css'
import shared from '../shared.module.css'
import styles from './CreditsApp.module.css'

/** Link externo: nova aba, `noreferrer`, com aviso para leitores de tela. */
function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  const newTab = useOsText().credits.newTab
  return (
    <a className={styles.link} href={href} target="_blank" rel="noreferrer">
      {children}
      <span className={styles.linkArrow} aria-hidden="true">
        <ArrowUpRightIcon weight="regular" />
      </span>
      <span className={shared.srOnly}>{newTab}</span>
    </a>
  )
}

/**
 * Créditos: as inspirações (com os repositórios), a stack do portfólio e os ícones. Nomes e links vêm de
 * `CREDITS` (content/os.ts, iguais nos idiomas); os textos, de `OS_TEXT.credits` no idioma ativo. Todo
 * link externo abre em nova aba com `rel="noreferrer"`.
 */
export const CreditsApp = memo(function CreditsApp() {
  const TEXT = useOsText().credits
  const inspirationsId = useId()
  const stackId = useId()
  const iconsId = useId()

  return (
    <div className={`${scope.scope} ${styles.root}`}>
      <header className={styles.header}>
        <span className={styles.tile} aria-hidden="true">
          <OsGlyph name="heart" />
        </span>
        <p className={styles.intro}>{TEXT.intro}</p>
      </header>

      <section aria-labelledby={inspirationsId}>
        <h2 id={inspirationsId} className={styles.sectionLabel}>
          {TEXT.inspirations.heading}
        </h2>
        <ul className={styles.cards} role="list">
          {CREDITS.inspirations.map((item) => {
            const copy = TEXT.inspirations.items[item.id]
            return (
              <li key={item.id} className={styles.card}>
                <p className={styles.name}>{item.name}</p>
                <p className={styles.work}>{copy.work}</p>
                <p className={styles.description}>{copy.description}</p>
                <div className={styles.cardLinks}>
                  {item.links.map((link) => (
                    <ExternalLink key={link.href} href={link.href}>
                      <span className={styles.linkGlyph} aria-hidden="true">
                        <GithubLogoIcon weight="regular" />
                      </span>
                      {TEXT.inspirations.links[link.id]}
                    </ExternalLink>
                  ))}
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-labelledby={stackId}>
        <h2 id={stackId} className={styles.sectionLabel}>
          {TEXT.stack.heading}
        </h2>
        <ul className={styles.stack} role="list">
          {CREDITS.stack.map((item) => (
            <li key={item.id}>
              <a className={styles.chip} href={item.href} target="_blank" rel="noreferrer">
                <span className={styles.chipName}>{item.name}</span>
                <span className={styles.chipRole}>{TEXT.stack.roles[item.id]}</span>
                <span className={shared.srOnly}>{TEXT.newTab}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby={iconsId}>
        <h2 id={iconsId} className={styles.sectionLabel}>
          {TEXT.icons.heading}
        </h2>
        <a className={styles.chip} href={CREDITS.icons.href} target="_blank" rel="noreferrer">
          <span className={styles.linkGlyph} aria-hidden="true">
            <GlobeIcon weight="duotone" />
          </span>
          <span className={styles.chipName}>{CREDITS.icons.name}</span>
          <span className={styles.chipRole}>{TEXT.icons.role}</span>
          <span className={shared.srOnly}>{TEXT.newTab}</span>
        </a>
      </section>

      <p className={styles.heart} aria-hidden="true">
        <HeartIcon weight="duotone" />
      </p>
    </div>
  )
})
