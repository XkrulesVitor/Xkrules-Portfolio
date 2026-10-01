import type { FocusEvent } from 'react'
import { ArrowUpRightIcon, CodeIcon, UserCircleIcon } from '@phosphor-icons/react'
import { OS_TEXT } from '@/content/os'
import { SITE } from '@/content/site'
import { LinkGlyph, OsGlyph } from './OsGlyph'
import shared from './shared.module.css'
import styles from './StartMenu.module.css'
import { SYSTEM_APPS } from './systemApps'
import type { AppRef } from './windowManager'

interface StartMenuProps {
  id: string
  onOpenApp: (app: AppRef) => void
  onShutdown: () => void
  onClose: () => void
}

/**
 * Menu do botão iniciar. Padrão de "disclosure" (botão com aria-expanded + painel adjacente no DOM):
 * fecha ao clicar fora (o Desktop desenha um anteparo) ou quando o foco sai dele. Sem Esc: o Esc
 * global da experiência já devolve a câmera à visão geral.
 */
export function StartMenu({ id, onOpenApp, onShutdown, onClose }: StartMenuProps) {
  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) onClose()
  }

  return (
    // tabIndex -1: um clique em área não focável do menu leva o foco ao próprio menu (não o fecha).
    <div
      id={id}
      role="group"
      aria-label={OS_TEXT.start.menu}
      className={styles.menu}
      tabIndex={-1}
      onBlur={handleBlur}
    >
      <div className={styles.header}>
        <span className={styles.avatar} aria-hidden="true">
          <UserCircleIcon weight="duotone" />
        </span>
        <span className={styles.who}>
          <span className={styles.name}>{SITE.author}</span>
          <span className={styles.os}>{OS_TEXT.name}</span>
        </span>
      </div>

      <p className={styles.section}>{OS_TEXT.start.apps}</p>
      <ul className={styles.list} role="list">
        {SYSTEM_APPS.map((entry) => (
          <li key={entry.app.kind}>
            <button type="button" className={styles.item} onClick={() => onOpenApp(entry.app)}>
              <span className={styles.glyph} aria-hidden="true">
                <OsGlyph name={entry.glyph} />
              </span>
              <span className={styles.itemLabel}>{entry.title}</span>
            </button>
          </li>
        ))}
      </ul>

      <p className={styles.section}>{OS_TEXT.start.links}</p>
      <ul className={styles.list} role="list">
        {SITE.links.map((link) => (
          <li key={link.href}>
            <a className={styles.item} href={link.href} target="_blank" rel="noreferrer">
              <span className={styles.glyph} aria-hidden="true">
                <LinkGlyph kind={link.kind} />
              </span>
              <span className={styles.itemLabel}>{link.label}</span>
              <span className={styles.arrow} aria-hidden="true">
                <ArrowUpRightIcon weight="regular" />
              </span>
              <span className={shared.srOnly}>{OS_TEXT.detail.newTab}</span>
            </a>
          </li>
        ))}
        <li>
          <a className={styles.item} href={SITE.sourceUrl} target="_blank" rel="noreferrer">
            <span className={styles.glyph} aria-hidden="true">
              <CodeIcon weight="duotone" />
            </span>
            <span className={styles.itemLabel}>{OS_TEXT.start.sourceCode}</span>
            <span className={styles.arrow} aria-hidden="true">
              <ArrowUpRightIcon weight="regular" />
            </span>
            <span className={shared.srOnly}>{OS_TEXT.detail.newTab}</span>
          </a>
        </li>
      </ul>

      <div className={styles.footer}>
        <button type="button" className={`${styles.item} ${styles.shutdown}`} onClick={onShutdown}>
          <span className={styles.glyph} aria-hidden="true">
            <OsGlyph name="power" />
          </span>
          <span className={styles.itemLabel}>{OS_TEXT.start.shutdown}</span>
        </button>
      </div>
    </div>
  )
}
