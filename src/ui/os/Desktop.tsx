import { useCallback, useId, useReducer, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { OS_TEXT, type OsGlyphKey } from '@/content/os'
import { WEB_PROJECTS } from '@/content/projects.web'
import type { WebProject } from '@/content/types'
import { ProjectsApp } from './apps/ProjectsApp'
import { ProjectWindow } from './apps/ProjectWindow'
import type { CssVars } from './cssVars'
import { DesktopIcon } from './DesktopIcon'
import { projectGlyph } from './OsGlyph'
import scope from './scope.module.css'
import { StartMenu } from './StartMenu'
import { Taskbar, type TaskbarEntry } from './Taskbar'
import { Window } from './Window'
import {
  TASKBAR_HEIGHT_PCT,
  getActiveId,
  initWm,
  wmReducer,
  type AppRef,
} from './windowManager'
import styles from './Desktop.module.css'

export interface DesktopProps {
  projects?: readonly WebProject[]
  /** Janelas abertas na montagem (padrão: nenhuma). */
  initialWindows?: readonly AppRef[]
  className?: string
}

interface AppMeta {
  title: string
  glyph: OsGlyphKey
  accent?: string
}

/** Título, glifo e cor de um app. `null` quando o projeto não existe mais na lista. */
function describeApp(app: AppRef, projects: readonly WebProject[]): AppMeta | null {
  if (app.kind === 'projects') return { title: OS_TEXT.projects.title, glyph: 'folder' }
  const project = projects.find((p) => p.slug === app.slug)
  if (!project) return null
  return { title: project.title, glyph: projectGlyph(project.slug), accent: project.accent }
}

interface AppContentProps {
  app: AppRef
  projects: readonly WebProject[]
  onOpenProject: (slug: string) => void
}

function AppContent({ app, projects, onOpenProject }: AppContentProps) {
  if (app.kind === 'projects') {
    return <ProjectsApp projects={projects} onOpenProject={onOpenProject} showHeading={false} />
  }
  const project = projects.find((p) => p.slug === app.slug)
  return project ? <ProjectWindow project={project} /> : null
}

const STAGE_STYLE: CssVars = { '--taskbar-h': `${TASKBAR_HEIGHT_PCT}%` }

/**
 * Raiz do SO fictício do monitor. Preenche o pai (`width/height: 100%`) e é um container
 * `container-type: size`: dentro do monitor 3D o pai mede 1280x720; no preview, qualquer tamanho
 * 16:9. Tudo escala junto (ver scope.module.css). O pai precisa ter altura definida.
 * Estado das janelas local (useReducer): não toca o store global.
 */
export function Desktop({ projects = WEB_PROJECTS, initialWindows, className }: DesktopProps) {
  const [wm, dispatch] = useReducer(wmReducer, initialWindows, initWm)
  const [startOpen, setStartOpen] = useState(false)
  const desktopRef = useRef<HTMLDivElement>(null)
  const startMenuId = useId()

  const openApp = useCallback((app: AppRef) => {
    dispatch({ type: 'open', app })
    setStartOpen(false)
  }, [])
  const openProjects = useCallback(() => openApp({ kind: 'projects' }), [openApp])
  const openProject = useCallback((slug: string) => openApp({ kind: 'project', slug }), [openApp])
  const focusWindow = useCallback((id: string) => dispatch({ type: 'focus', id }), [])
  const minimizeWindow = useCallback((id: string) => {
    dispatch({ type: 'minimize', id })
    // O botão que tinha o foco fica dentro de uma janela inerte: devolve-o à área de trabalho.
    desktopRef.current?.focus({ preventScroll: true })
  }, [])
  const moveWindow = useCallback(
    (id: string, x: number, y: number) => dispatch({ type: 'move', id, x, y }),
    [],
  )
  const closeWindow = useCallback((id: string) => {
    dispatch({ type: 'close', id })
    // A janela some com o foco dentro: devolve-o à área de trabalho (teclado não se perde).
    desktopRef.current?.focus({ preventScroll: true })
  }, [])
  const toggleWindow = useCallback((id: string) => {
    dispatch({ type: 'toggle', id })
    setStartOpen(false)
  }, [])
  const toggleStart = useCallback(() => setStartOpen((open) => !open), [])
  const closeStart = useCallback(() => setStartOpen(false), [])

  const activeId = getActiveId(wm)
  const windows = wm.windows.flatMap((win) => {
    const meta = describeApp(win.app, projects)
    return meta ? [{ win, meta }] : []
  })
  const entries: TaskbarEntry[] = windows.map(({ win, meta }) => ({
    id: win.id,
    title: meta.title,
    glyph: meta.glyph,
    accent: meta.accent,
    active: win.id === activeId,
    minimized: win.minimized,
  }))

  return (
    <div
      ref={desktopRef}
      role="region"
      aria-label={OS_TEXT.desktop.label}
      tabIndex={-1}
      className={[styles.desktop, className].filter(Boolean).join(' ')}
    >
      <div className={`${scope.scope} ${styles.stage}`} style={STAGE_STYLE}>
        <div className={styles.wallpaper} aria-hidden="true">
          <div className={styles.rings} />
        </div>

        <ul className={styles.icons} role="list" aria-label={OS_TEXT.desktop.shortcuts}>
          <DesktopIcon
            label={OS_TEXT.projects.title}
            glyph="folder"
            tone="glass"
            onOpen={openProjects}
          />
          {projects.map((project) => (
            <DesktopIcon
              key={project.slug}
              label={project.title}
              glyph={projectGlyph(project.slug)}
              accent={project.accent}
              onOpen={() => openProject(project.slug)}
            />
          ))}
        </ul>

        <div className={styles.windows}>
          <AnimatePresence>
            {windows.map(({ win, meta }) => (
              <Window
                key={win.id}
                id={win.id}
                title={meta.title}
                glyph={meta.glyph}
                accent={meta.accent}
                geometry={win.geometry}
                z={win.z}
                minimized={win.minimized}
                active={win.id === activeId}
                desktopRef={desktopRef}
                onFocus={focusWindow}
                onMinimize={minimizeWindow}
                onClose={closeWindow}
                onMove={moveWindow}
              >
                <AppContent app={win.app} projects={projects} onOpenProject={openProject} />
              </Window>
            ))}
          </AnimatePresence>
        </div>

        {/* Anteparo: clicar fora fecha o menu iniciar (sem listener global no document). */}
        {startOpen ? <div className={styles.scrim} aria-hidden="true" onPointerDown={closeStart} /> : null}

        <Taskbar
          entries={entries}
          onToggle={toggleWindow}
          startOpen={startOpen}
          startMenuId={startMenuId}
          onStartToggle={toggleStart}
          startMenu={
            startOpen ? (
              <StartMenu id={startMenuId} onOpenProjects={openProjects} onClose={closeStart} />
            ) : null
          }
        />
      </div>
    </div>
  )
}
