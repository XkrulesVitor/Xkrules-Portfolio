import { useMemo, type RefObject, type SyntheticEvent } from 'react'
import { Html } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { GAME_PROJECTS } from '@/content/projects.games'
import type { GameProject } from '@/content/types'
import { useExperienceStore } from '@/store/useExperienceStore'
import { TV_SCREEN_SIZE, TvGameScreen } from '@/ui/tv/TvGameScreen'
import { LAYOUT } from '../../scene/layout'

const SCREEN = LAYOUT.tv

/** O jogo fica 2 mm à frente do plano `screen_tv`, ao longo da normal da tela. */
const IN_FRONT_OF_SCREEN = 0.002

const POSITION: [number, number, number] = [
  SCREEN.center[0] + SCREEN.normal[0] * IN_FRONT_OF_SCREEN,
  SCREEN.center[1] + SCREEN.normal[1] * IN_FRONT_OF_SCREEN,
  SCREEN.center[2] + SCREEN.normal[2] * IN_FRONT_OF_SCREEN,
]

/** A face do wrapper aponta para +Z local: gira em Y até a normal da tela (na TV, +Z: sem giro). */
const ROTATION: [number, number, number] = [0, Math.atan2(SCREEN.normal[0], SCREEN.normal[2]), 0]

// Escala: mesma conta do MonitorHtml. No `transform` do drei, 1 px CSS mede `distanceFactor / 400`
// metros; o `distanceFactor` cobre a LARGURA (1280 px = 1.68 m) e o Y leva a correção mínima para os
// 716 px cobrirem os 0.94 m da tela.
const DREI_PX_DIVISOR = 400
const METERS_PER_PX_X = SCREEN.size[0] / TV_SCREEN_SIZE.width
const METERS_PER_PX_Y = SCREEN.size[1] / TV_SCREEN_SIZE.height
const DISTANCE_FACTOR = METERS_PER_PX_X * DREI_PX_DIVISOR
const SCALE: [number, number, number] = [1, METERS_PER_PX_Y / METERS_PER_PX_X, 1]

/** Abaixo do Overlay (z-10): o botão "Sair do jogo" e a barra de controles ficam por cima. */
const Z_INDEX_RANGE: [number, number] = [9, 0]

/**
 * Cliques na tela "Ligando..." não podem virar "clique fora" na cena (o R3F lê `offsetX/Y` relativos
 * a este elemento). Dentro do iframe os eventos já não sobem: são de outro documento.
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

const GAME_BY_SLUG: ReadonlyMap<string, GameProject> = new Map(GAME_PROJECTS.map((g) => [g.slug, g]))

/**
 * Jogo na TV da zona de jogos (ARCHITECTURE §6.6): drei `<Html transform>` com o `TvGameScreen`
 * (wrapper fixo de 1280x716 px) preso à tela da TV, posição, rotação e escala derivadas de
 * LAYOUT.tv. Como o MonitorHtml: sem `occlude` (a câmera fica parada de frente para a TV enquanto o
 * jogo roda) e com PORTAL ESTÁVEL no pai do canvas (sem ele o drei recria a raiz React do Html e,
 * em produção, o conteúdo some; ver MonitorHtml). Vazio e sem ponteiro quando `store.playing` é null.
 */
export function TvGameHtml() {
  const canvasParent = useThree((s) => s.gl.domElement.parentElement)
  const portal = useMemo(() => ({ current: canvasParent }) as RefObject<HTMLElement>, [canvasParent])
  const game = useExperienceStore((s) => (s.playing ? (GAME_BY_SLUG.get(s.playing) ?? null) : null))

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
      <TvGameScreen game={game} {...KEEP_EVENTS_INSIDE} />
    </Html>
  )
}
