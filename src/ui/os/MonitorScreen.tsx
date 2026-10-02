import type { HTMLAttributes, KeyboardEvent, PointerEvent } from 'react'
import { audio } from '@/lib/audio'
import { Desktop } from './Desktop'
import type { AppRef } from './windowManager'
import styles from './MonitorScreen.module.css'

/**
 * Tamanho fixo do wrapper do SO, em px CSS. É a referência de design do SO: o `--px` do Desktop
 * (Desktop.module.css) escala a partir de 1280x720. Quem posiciona o wrapper no 3D (MonitorHtml)
 * calibra a escala do `Html` a partir destes números.
 */
export const OS_SCREEN_SIZE = { width: 1280, height: 720 } as const

/** A tela já chega com a janela Projetos aberta: o monitor nunca mostra um desktop vazio. */
const INITIAL_WINDOWS: readonly AppRef[] = [{ kind: 'projects' }]

/** Teclas que não "digitam": modificadores soltos e o Esc (que o 3D usa para voltar) ficam mudos. */
const SILENT_KEYS: ReadonlySet<string> = new Set([
  'Shift',
  'Control',
  'Alt',
  'AltGraph',
  'Meta',
  'CapsLock',
  'Escape',
])
/** Teclas largas (espaço e Enter) fazem um clique mais grave. */
const WIDE_KEYS: ReadonlySet<string> = new Set([' ', 'Enter'])

export interface MonitorScreenProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'className' | 'style'> {
  /**
   * Monitor em foco: o SO fica visível e interativo (fade de 0.3 s). Falso: opacidade 0,
   * `pointer-events: none` e `inert` (nada do SO recebe clique nem foco de teclado).
   */
  active: boolean
}

/**
 * O SO fictício no formato em que vai para dentro do monitor 3D: um wrapper FIXO de 1280x720 px
 * (o layout interno nunca depende da janela do browser) com o Desktop dentro. Não conhece o 3D:
 * quem o embute decide `active` e pode repassar handlers de evento (`...rest`).
 *
 * Por cima do Desktop ficam as camadas de "vidro" do monitor (sujeira/reflexo e sombra nas bordas,
 * como no MonitorScreen do Henry Heffernan), sem pointer-events. E o som: cliques de teclado e de
 * mouse tocam (via `lib/audio`, mudo por padrão) quando o usuário digita ou clica no SO. Os handlers
 * são de captura, então soam mesmo que o app dentro do SO pare a propagação, e compõem com os que
 * vierem em `rest`.
 */
export function MonitorScreen({
  active,
  onKeyDownCapture,
  onPointerDownCapture,
  onPointerUpCapture,
  ...rest
}: MonitorScreenProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!event.repeat && !SILENT_KEYS.has(event.key)) {
      audio.keyClick(WIDE_KEYS.has(event.key) ? 'wide' : 'normal')
    }
    onKeyDownCapture?.(event)
  }
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button === 0) audio.mouseClick('down')
    onPointerDownCapture?.(event)
  }
  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button === 0) audio.mouseClick('up')
    onPointerUpCapture?.(event)
  }

  return (
    <div
      {...rest}
      className={styles.screen}
      style={{ width: OS_SCREEN_SIZE.width, height: OS_SCREEN_SIZE.height }}
      data-active={active}
      inert={!active}
      onKeyDownCapture={handleKeyDown}
      onPointerDownCapture={handlePointerDown}
      onPointerUpCapture={handlePointerUp}
    >
      <Desktop initialWindows={INITIAL_WINDOWS} />
      <div className={styles.glass} aria-hidden="true">
        <div className={styles.smudge} />
        <div className={styles.glare} />
        <div className={styles.shade} />
      </div>
    </div>
  )
}
