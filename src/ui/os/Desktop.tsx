import { memo, useCallback, useId, useReducer, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { OS_MEMORY_PROJECT_SLUG, type OsGlyphKey, type OsText } from '@/content/os'
import type { MediaImage, WebProject } from '@/content/types'
import { useContent } from '../i18n/useLocale'
import { CreditsApp } from './apps/CreditsApp'
import { MemoryGameApp } from './apps/MemoryGameApp'
import { ProjectsApp } from './apps/ProjectsApp'
import { ProjectWindow } from './apps/ProjectWindow'
import { TerminalApp } from './apps/TerminalApp'
import { ThisComputerApp } from './apps/ThisComputerApp'
import type { CssVars } from './cssVars'
import { DesktopIcon } from './DesktopIcon'
import { projectGlyph } from './OsGlyph'
import { PowerScreen, type PowerPhase } from './PowerScreen'
import scope from './scope.module.css'
import { StartMenu } from './StartMenu'
import { SYSTEM_APPS, type LaunchRequest } from './systemApps'
import { Taskbar, type TaskbarEntry } from './Taskbar'
import { Window } from './Window'
import {
  TASKBAR_HEIGHT_PCT,
  getActiveId,
  initWm,
  isMaximized,
  wmReducer,
  type AppRef,
  type ResizeEdges,
  type WindowGeometry,
} from './windowManager'
import styles from './Desktop.module.css'

export interface DesktopProps {
  /** Projetos. Padrão: content/projects.web.ts, no idioma ativo. */
  projects?: readonly WebProject[]
  /** Janelas abertas na montagem (padrão: nenhuma). */
  initialWindows?: readonly AppRef[]
  /**
   * Pedido de fora do SO para abrir um app (ex.: "Jogar no PC" no painel de Jogos). Cada `id` novo
   * abre (ou traz para a frente) a janela uma vez; com o SO desligado, ele liga junto.
   */
  launch?: LaunchRequest | null
  className?: string
}

interface AppMeta {
  title: string
  glyph: OsGlyphKey
  /** Ícone real do projeto (`WebProject.icon`): tem prioridade sobre o glifo onde o SO o aceita. */
  icon?: MediaImage
  accent?: string
  /** O corpo da janela não rola e o app preenche a altura (terminal, jogo). */
  fill?: boolean
}

/** Ao religar o SO a área de trabalho volta com a janela Projetos aberta. */
const REBOOT_WINDOWS: readonly AppRef[] = [{ kind: 'projects' }]

/** Título, glifo e cor de um app. `null` quando o projeto não existe mais na lista. */
function describeApp(app: AppRef, projects: readonly WebProject[], os: OsText): AppMeta | null {
  switch (app.kind) {
    case 'projects':
      return { title: os.projects.title, glyph: 'folder' }
    case 'project': {
      const project = projects.find((p) => p.slug === app.slug)
      if (!project) return null
      return {
        title: project.title,
        glyph: projectGlyph(project.slug),
        icon: project.icon,
        accent: project.accent,
      }
    }
    case 'computer':
      return { title: os.apps.computer.title, glyph: 'computer' }
    case 'terminal':
      return { title: os.apps.terminal.title, glyph: 'terminal', fill: true }
    case 'memory':
      return { title: os.apps.memory.title, glyph: 'puzzle', accent: '#b583ff', fill: true }
    case 'credits':
      return { title: os.apps.credits.title, glyph: 'heart', accent: '#f78fd0' }
  }
}

interface AppContentProps {
  app: AppRef
  projects: readonly WebProject[]
  onOpenProject: (slug: string) => void
}

const AppContent = memo(function AppContent({ app, projects, onOpenProject }: AppContentProps) {
  switch (app.kind) {
    case 'projects':
      return <ProjectsApp projects={projects} onOpenProject={onOpenProject} showHeading={false} />
    case 'project': {
      const project = projects.find((p) => p.slug === app.slug)
      return project ? <ProjectWindow project={project} /> : null
    }
    case 'computer':
      return <ThisComputerApp />
    case 'terminal':
      return <TerminalApp projects={projects} onOpenProject={onOpenProject} />
    case 'memory':
      return (
        <MemoryGameApp
          project={projects.find((p) => p.slug === OS_MEMORY_PROJECT_SLUG)}
          onOpenProject={onOpenProject}
        />
      )
    case 'credits':
      return <CreditsApp />
  }
})

const STAGE_STYLE: CssVars = { '--taskbar-h': `${TASKBAR_HEIGHT_PCT}%` }

/**
 * Raiz do SO fictício do monitor. Preenche o pai (`width/height: 100%`) e é um container
 * `container-type: size`: dentro do monitor 3D o pai mede 1280x720; no preview, qualquer tamanho
 * 16:9. Tudo escala junto (ver scope.module.css). O pai precisa ter altura definida.
 * Estado das janelas local (useReducer): não toca o store global. "Desligar" também é local:
 * a tela do SO apaga, e religar a recomeça com a janela Projetos; nada fora do SO muda.
 */
export function Desktop({ projects: given, initialWindows, launch = null, className }: DesktopProps) {
  // Textos e projetos no idioma ativo: trocar o idioma re-renderiza o SO sem fechar nenhuma janela.
  const content = useContent()
  const os = content.os
  const projects = given ?? content.web
  const [wm, dispatch] = useReducer(wmReducer, initialWindows, initWm)
  const [startOpen, setStartOpen] = useState(false)
  const [power, setPower] = useState<'on' | PowerPhase>('on')

  // Pedido de abertura de fora: atendido durante o render (ajuste de estado por prop, sem efeito),
  // uma vez por id.
  const [launchedId, setLaunchedId] = useState(0)
  if (launch && launch.id !== launchedId) {
    setLaunchedId(launch.id)
    dispatch({ type: 'open', app: launch.app })
    setStartOpen(false)
    if (power === 'off') setPower('boot')
  }
  // Verdadeiro depois do primeiro boot: a área de trabalho então entra com um fade curto.
  const [rebooted, setRebooted] = useState(false)
  const desktopRef = useRef<HTMLDivElement>(null)
  const startMenuId = useId()

  const openApp = useCallback((app: AppRef) => {
    dispatch({ type: 'open', app })
    setStartOpen(false)
  }, [])
  const openProject = useCallback((slug: string) => openApp({ kind: 'project', slug }), [openApp])
  const focusWindow = useCallback((id: string) => dispatch({ type: 'focus', id }), [])
  const minimizeWindow = useCallback((id: string) => {
    dispatch({ type: 'minimize', id })
    // O botão que tinha o foco fica dentro de uma janela inerte: devolve-o à área de trabalho.
    desktopRef.current?.focus({ preventScroll: true })
  }, [])
  const toggleMaximizeWindow = useCallback(
    (id: string) => dispatch({ type: 'toggleMaximize', id }),
    [],
  )
  const moveWindow = useCallback(
    (id: string, x: number, y: number) => dispatch({ type: 'move', id, x, y }),
    [],
  )
  const resizeWindow = useCallback(
    (id: string, edges: ResizeEdges, origin: WindowGeometry, dx: number, dy: number) =>
      dispatch({ type: 'resize', id, edges, origin, dx, dy }),
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

  // Desligar: a tela escurece com a sequência de saída; no fim a área de trabalho some (janelas
  // zeradas para o próximo boot) e fica só o botão de energia. Clicar nele liga de novo.
  const shutdown = useCallback(() => {
    setStartOpen(false)
    setPower('shutdown')
  }, [])
  const finishShutdown = useCallback(() => {
    dispatch({ type: 'reset', apps: REBOOT_WINDOWS })
    setPower('off')
  }, [])
  const powerOn = useCallback(() => setPower('boot'), [])
  const finishBoot = useCallback(() => {
    setRebooted(true)
    setPower('on')
  }, [])

  const activeId = getActiveId(wm)
  const windows = wm.windows.flatMap((win) => {
    const meta = describeApp(win.app, projects, os)
    return meta ? [{ win, meta }] : []
  })
  const entries: TaskbarEntry[] = windows.map(({ win, meta }) => ({
    id: win.id,
    title: meta.title,
    glyph: meta.glyph,
    icon: meta.icon,
    accent: meta.accent,
    active: win.id === activeId,
    minimized: win.minimized,
  }))

  const showShell = power === 'on' || power === 'shutdown'

  return (
    <div
      ref={desktopRef}
      role="region"
      aria-label={os.desktop.label}
      tabIndex={-1}
      className={[styles.desktop, className].filter(Boolean).join(' ')}
    >
      <div className={`${scope.scope} ${styles.stage}`} style={STAGE_STYLE}>
        {showShell ? (
          // Durante o desligamento o shell continua por baixo da tela preta, mas inerte.
          <div className={styles.shell} data-rebooted={rebooted} inert={power === 'shutdown'}>
            <div className={styles.wallpaper} aria-hidden="true">
              <div className={styles.rings} />
            </div>

            <ul className={styles.icons} role="list" aria-label={os.desktop.shortcuts}>
              {SYSTEM_APPS.map((entry) => (
                <DesktopIcon
                  key={entry.app.kind}
                  label={entry.title(os)}
                  glyph={entry.glyph}
                  tone="glass"
                  onOpen={() => openApp(entry.app)}
                />
              ))}
            </ul>

            <ul
              className={`${styles.icons} ${styles.iconsProjects}`}
              role="list"
              aria-label={os.desktop.projectShortcuts}
            >
              {projects.map((project) => (
                <DesktopIcon
                  key={project.slug}
                  label={project.title}
                  glyph={projectGlyph(project.slug)}
                  icon={project.icon}
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
                    icon={meta.icon}
                    accent={meta.accent}
                    geometry={win.geometry}
                    z={win.z}
                    minimized={win.minimized}
                    maximized={isMaximized(win)}
                    active={win.id === activeId}
                    fill={meta.fill}
                    desktopRef={desktopRef}
                    onFocus={focusWindow}
                    onMinimize={minimizeWindow}
                    onToggleMaximize={toggleMaximizeWindow}
                    onClose={closeWindow}
                    onMove={moveWindow}
                    onResize={resizeWindow}
                  >
                    <AppContent app={win.app} projects={projects} onOpenProject={openProject} />
                  </Window>
                ))}
              </AnimatePresence>
            </div>

            {/* Anteparo: clicar fora fecha o menu iniciar (sem listener global no document). */}
            {startOpen ? (
              <div className={styles.scrim} aria-hidden="true" onPointerDown={closeStart} />
            ) : null}

            <Taskbar
              entries={entries}
              onToggle={toggleWindow}
              startOpen={startOpen}
              startMenuId={startMenuId}
              onStartToggle={toggleStart}
              startMenu={
                startOpen ? (
                  <StartMenu
                    id={startMenuId}
                    onOpenApp={openApp}
                    onShutdown={shutdown}
                    onClose={closeStart}
                  />
                ) : null
              }
            />
          </div>
        ) : null}

        {power !== 'on' ? (
          <PowerScreen
            phase={power}
            onShutdownDone={finishShutdown}
            onPowerOn={powerOn}
            onBootDone={finishBoot}
          />
        ) : null}
      </div>
    </div>
  )
}
