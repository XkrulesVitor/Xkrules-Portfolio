import { useMemo, type RefObject, type SyntheticEvent } from 'react'
import { Html } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useExperienceStore } from '@/store/useExperienceStore'
import { MonitorScreen, OS_SCREEN_SIZE } from '@/ui/os/MonitorScreen'
import { LAYOUT } from '../../scene/layout'

const SCREEN = LAYOUT.monitorMain

/** O SO fica 2 mm à frente do plano `screen_monitor_main`, ao longo da normal da tela. */
const IN_FRONT_OF_SCREEN = 0.002

const POSITION: [number, number, number] = [
  SCREEN.center[0] + SCREEN.normal[0] * IN_FRONT_OF_SCREEN,
  SCREEN.center[1] + SCREEN.normal[1] * IN_FRONT_OF_SCREEN,
  SCREEN.center[2] + SCREEN.normal[2] * IN_FRONT_OF_SCREEN,
]

/** A face do wrapper aponta para +Z local (como um PlaneGeometry): gira em Y até a normal da tela (horizontal). */
const ROTATION: [number, number, number] = [0, Math.atan2(SCREEN.normal[0], SCREEN.normal[2]), 0]

/**
 * Escala. Em `transform`, o drei (Html.js, getObjectCSSMatrix) multiplica a parte linear da matriz
 * do objeto por `distanceFactor / 400` e deixa a translação intacta: 1 px CSS do wrapper mede
 * `distanceFactor / 400` unidades do mundo (metros aqui) vezes a escala do grupo. O `400` é constante
 * do drei; o `10` do padrão é o `distanceFactor` que ele assume quando a prop não vem.
 * `distanceFactor` cobre a LARGURA exata (1280 px = 1.3 m). A altura da tela é 0.73 m, e não os
 * 0.73125 m de 16:9 puro, então o eixo Y leva uma correção de escala de 0.17% (invisível) para o
 * wrapper cobrir 1.3 x 0.73 m sem sobrar nem faltar borda.
 */
const DREI_PX_DIVISOR = 400
const METERS_PER_PX_X = SCREEN.size[0] / OS_SCREEN_SIZE.width
const METERS_PER_PX_Y = SCREEN.size[1] / OS_SCREEN_SIZE.height
const DISTANCE_FACTOR = METERS_PER_PX_X * DREI_PX_DIVISOR
const SCALE: [number, number, number] = [1, METERS_PER_PX_Y / METERS_PER_PX_X, 1]

/** O Overlay (ui/overlay) usa z-10: o SO fica abaixo dele, para o botão Voltar ficar por cima. */
const Z_INDEX_RANGE: [number, number] = [9, 0]

/**
 * O R3F calcula o ponteiro 3D com `event.offsetX/Y`, que num filho do Html é relativo ao elemento
 * do SO (e não ao canvas). Sem isto, um clique no SO viraria um "clique fora" na cena e a câmera
 * voltaria para HOME. Cliques e arrastos dentro do monitor ficam dentro do monitor. O Esc (keydown)
 * não é interceptado: continua subindo até o `window`.
 */
const stopEvent = (event: SyntheticEvent) => event.stopPropagation()
const KEEP_EVENTS_INSIDE = {
  onClick: stopEvent,
  onDoubleClick: stopEvent,
  onContextMenu: stopEvent,
  onWheel: stopEvent,
  onPointerDown: stopEvent,
  onPointerUp: stopEvent,
  onPointerMove: stopEvent,
  onPointerCancel: stopEvent,
  onLostPointerCapture: stopEvent,
} as const

/**
 * O SO fictício (src/ui/os) dentro do monitor horizontal (ARCHITECTURE §6.2): drei `<Html transform>`
 * com um wrapper fixo de 1280x720 px, posição, rotação e escala derivadas de LAYOUT.monitorMain.
 *
 * Sem `occlude`: o `occlude="blending"` abre um buraco no canvas, e o EffectComposer (Fase 3) costuma
 * apagá-lo. Como o SO só aparece com a câmera parada e perpendicular à tela, basta o Html por cima do
 * canvas. Visível e interativo só em `focused` + `desk` (fade de 0.3 s); fora disso, opacidade 0,
 * sem ponteiro e `inert` (ver MonitorScreen). Com esse foco, o `Screens` (Fase 3) apaga a tela
 * emissiva do monitor para o SO aparecer sobre um fundo escuro.
 */
export function MonitorHtml() {
  // PORTAL ESTÁVEL (bug de produção): sem `portal`, o drei usa `events.connected` como alvo, que só
  // existe depois que o R3F conecta os eventos. O alvo muda no 2º render, o drei recria a raiz React
  // do Html, e em produção a raiz ANTIGA faz o primeiro commit depois da nova: o React limpa o
  // container nesse primeiro commit e o SO fica desconectado do documento (tela preta na Vercel).
  // O pai do canvas existe desde o primeiro render e nunca muda, então a raiz é criada uma vez só.
  const canvasParent = useThree((s) => s.gl.domElement.parentElement)
  const portal = useMemo(() => ({ current: canvasParent }) as RefObject<HTMLElement>, [canvasParent])

  const active = useExperienceStore(
    (s) => (s.mode === 'focused' || (s.mode === 'transitioning' && s.focus === 'desk')) && s.focus === 'desk',
  )

  return (
    <Html
      transform
      portal={portal}
      position={POSITION}
      rotation={ROTATION}
      scale={SCALE}
      distanceFactor={DISTANCE_FACTOR}
      zIndexRange={Z_INDEX_RANGE}
    >
      <MonitorScreen active={active} {...KEEP_EVENTS_INSIDE} />
    </Html>
  )
}
