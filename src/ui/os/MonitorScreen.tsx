import type { HTMLAttributes } from 'react'
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
 */
export function MonitorScreen({ active, ...rest }: MonitorScreenProps) {
  return (
    <div
      {...rest}
      className={styles.screen}
      style={{ width: OS_SCREEN_SIZE.width, height: OS_SCREEN_SIZE.height }}
      data-active={active}
      inert={!active}
    >
      <Desktop initialWindows={INITIAL_WINDOWS} />
    </div>
  )
}
