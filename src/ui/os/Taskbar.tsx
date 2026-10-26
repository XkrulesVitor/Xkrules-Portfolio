import type { ReactNode } from 'react'
import { UserCircleIcon } from '@phosphor-icons/react'
import type { OsGlyphKey } from '@/content/os'
import { SITE } from '@/content/site'
import type { MediaImage } from '@/content/types'
import { useOsText } from '../i18n/useLocale'
import type { CssVars } from './cssVars'
import { AppGlyph } from './OsGlyph'
import { useClock } from './useClock'
import styles from './Taskbar.module.css'

export interface TaskbarEntry {
  id: string
  title: string
  glyph: OsGlyphKey
  /** Ícone real do projeto: aparece no lugar do glifo. */
  icon?: MediaImage
  accent?: string
  /** Janela em primeiro plano (visível e no topo). */
  active: boolean
  minimized: boolean
}

interface TaskbarProps {
  entries: readonly TaskbarEntry[]
  onToggle: (id: string) => void
  startOpen: boolean
  startMenuId: string
  onStartToggle: () => void
  /** Menu iniciar, renderizado colado ao botão (ordem de Tab natural). */
  startMenu: ReactNode
}

/** Barra de tarefas: iniciar (com o nome do autor), janelas abertas e relógio. */
export function Taskbar({
  entries,
  onToggle,
  startOpen,
  startMenuId,
  onStartToggle,
  startMenu,
}: TaskbarProps) {
  const { time, date } = useClock()
  const os = useOsText()

  return (
    <nav className={styles.taskbar} aria-label={os.taskbar.label}>
      <div className={styles.startWrap}>
        <button
          type="button"
          className={styles.start}
          aria-expanded={startOpen}
          aria-controls={startOpen ? startMenuId : undefined}
          onClick={onStartToggle}
        >
          <span className={styles.startGlyph} aria-hidden="true">
            <UserCircleIcon weight="duotone" />
          </span>
          <span className={styles.startLabel}>{SITE.author}</span>
        </button>
        {startMenu}
      </div>

      <ul className={styles.tasks} role="list" aria-label={os.taskbar.windows}>
        {entries.map((entry) => {
          const style: CssVars | undefined = entry.accent ? { '--accent': entry.accent } : undefined
          return (
            <li key={entry.id} className={styles.taskItem}>
              <button
                type="button"
                className={styles.task}
                style={style}
                aria-pressed={entry.active}
                data-minimized={entry.minimized}
                onClick={() => onToggle(entry.id)}
              >
                <span className={styles.taskGlyph} aria-hidden="true">
                  <AppGlyph name={entry.glyph} icon={entry.icon} />
                </span>
                <span className={styles.taskTitle}>{entry.title}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className={styles.clock} title={os.taskbar.clock}>
        <span className={styles.time}>{time || os.taskbar.clockPending}</span>
        <span className={styles.date}>{date}</span>
      </div>
    </nav>
  )
}
