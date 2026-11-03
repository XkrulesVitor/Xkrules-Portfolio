import { useMemo, type PointerEvent, type RefObject, type SyntheticEvent } from 'react'
import { Html } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import type { HotspotId } from '@/content/types'
import { HotspotMarker, type HotspotMarkerKey } from '@/ui/overlay/HotspotMarker'
import { LAYOUT } from '../scene/layout'
import type { Vec3 } from '../scene/placeholders/parts'

/**
 * Altura do marcador acima do topo do objeto, em metros. Em HOME a câmera fica a ~14 m em qualquer
 * proporção, e estes 0.4 m projetam em ~3.7% da altura da janela: é o comprimento que a linha do
 * marcador aberto percorre até o objeto (ver HotspotMarker).
 */
const LIFT = 0.4

/** Topo da cadeira (encosto alto) e da estante, a partir da âncora no piso. */
const CHAIR_HEIGHT = 1.35
const SHELF_HEIGHT = 2.605
/** Viga superior da impressora: altura acima do tampo e recuo em relação ao centro da bancada. */
const PRINTER_BEAM_HEIGHT = 1.22
const PRINTER_BEAM_BACK = 0.3

const { chair, monitorMain, tv, shelf, printer } = LAYOUT

interface MarkerSpec {
  markerKey: HotspotMarkerKey
  hotspot: HotspotId
  /** Sub-vista aberta pelo clique (a mesma `view` da hitbox correspondente). */
  view: string | null
  position: Vec3
}

// Fora da HUD e dentro da tela em HOME: em 1280x720 e 1024x768 o marcador mais alto fica a ~100 px do
// topo (a HUD vai até ~56 px) e os horizontais ficam a mais de 120 px das laterais.
const MARKERS: readonly MarkerSpec[] = [
  {
    markerKey: 'desk',
    hotspot: 'desk',
    view: null,
    position: [monitorMain.center[0], monitorMain.center[1] + monitorMain.size[1] / 2 + LIFT, monitorMain.center[2]],
  },
  {
    markerKey: 'chair',
    hotspot: 'chair',
    view: null,
    position: [chair[0], chair[1] + CHAIR_HEIGHT + LIFT, chair[2]],
  },
  {
    markerKey: 'digital',
    hotspot: 'shelf',
    view: 'digital',
    position: [tv.center[0], tv.center[1] + tv.size[1] / 2 + LIFT, tv.center[2]],
  },
  {
    markerKey: 'tabuleiro',
    hotspot: 'shelf',
    view: 'tabuleiro',
    position: [shelf[0], shelf[1] + SHELF_HEIGHT + LIFT, shelf[2]],
  },
  {
    markerKey: 'printer',
    hotspot: 'printer',
    view: null,
    position: [printer[0], printer[1] + PRINTER_BEAM_HEIGHT + LIFT, printer[2] - PRINTER_BEAM_BACK],
  },
]

/** O Overlay (ui/overlay) usa z-10: os marcadores ficam abaixo dele, atrás da HUD e dos painéis. */
const Z_INDEX_RANGE: [number, number] = [8, 1]

/**
 * O R3F calcula o ponteiro 3D com `event.offsetX/Y`, que num filho do Html é relativo ao marcador (e
 * não ao canvas). Por isso clique e movimento ficam aqui dentro, como no MonitorHtml.
 *
 * Três diferenças deliberadas, porque em HOME a órbita está ligada e o camera-controls escuta o
 * `document`: `pointerup` nunca é interceptado (soltar um arrasto sobre um marcador prenderia a órbita);
 * `pointermove` passa com botão pressionado (o arrasto continua ao cruzar um marcador); e `wheel` passa
 * (o zoom não morre com o ponteiro em cima de um deles).
 */
const stopEvent = (event: SyntheticEvent) => event.stopPropagation()
const stopMoveUnlessDragging = (event: PointerEvent) => {
  if (event.buttons === 0) event.stopPropagation()
}
const KEEP_EVENTS_INSIDE = {
  onClick: stopEvent,
  onDoubleClick: stopEvent,
  onContextMenu: stopEvent,
  onPointerDown: stopEvent,
  onPointerMove: stopMoveUnlessDragging,
} as const

/**
 * Marcadores discretos sobre cada ponto interativo do quarto, só em HOME (`mode === 'idle'`). Aqui fica
 * o que é 3D (onde cada um está no mundo); o visual e o comportamento estão em ui/overlay/HotspotMarker.
 * Cada `Html` recalcula a posição por frame, mas só escreve `transform` e `zIndex` quando ela muda, e
 * cada marcador só re-renderiza quando abre, fecha ou troca de idioma.
 */
export function HotspotMarkers() {
  // PORTAL ESTÁVEL: mesma razão do MonitorHtml (sem ele a raiz React do Html é recriada no 2º render e,
  // em produção, o conteúdo fica desconectado do documento).
  const canvasParent = useThree((s) => s.gl.domElement.parentElement)
  const portal = useMemo(() => ({ current: canvasParent }) as RefObject<HTMLElement>, [canvasParent])

  return (
    <>
      {MARKERS.map((marker, index) => (
        <Html
          key={marker.markerKey}
          center
          portal={portal}
          position={[marker.position[0], marker.position[1], marker.position[2]]}
          zIndexRange={Z_INDEX_RANGE}
        >
          <HotspotMarker
            markerKey={marker.markerKey}
            hotspot={marker.hotspot}
            view={marker.view}
            index={index}
            {...KEEP_EVENTS_INSIDE}
          />
        </Html>
      ))}
    </>
  )
}
