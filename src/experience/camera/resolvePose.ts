import type { Box3 } from 'three'
import type { PanelSide } from '@/content/types'
import { PANEL_WIDTH_PX } from '@/lib/constants'
import {
  boxFromCorners,
  directionFromPose,
  panelFractionOf,
  resolveFraming,
  type Vec3Tuple,
} from './framing'
import { PRESETS, type CameraLimits, type CameraPreset, type PresetKey } from './presets'

// Cola entre os presets (dados) e o resolvedor puro (framing.ts): lê a viewport, o painel e as
// caixas do preset e devolve a pose real de um voo. Sem React e sem estado (só um cache de caixas).

/** Abaixo desta largura o painel vira bottom-sheet (ver SHEET_MAX_WIDTH no PanelShell): não reserva lateral. */
const SHEET_MAX_WIDTH = 768

export interface Viewport {
  width: number
  height: number
  /** fov vertical da câmera, em graus. */
  fovDeg: number
}

export interface ResolvedPose {
  position: [number, number, number]
  target: [number, number, number]
  /** Distância câmera -> alvo da pose. */
  distance: number
}

const boxCache = new Map<PresetKey, readonly Box3[]>()

function boxesOf(key: PresetKey, preset: CameraPreset): readonly Box3[] | null {
  if (!preset.framing) return null
  let boxes = boxCache.get(key)
  if (!boxes) {
    boxes = preset.framing.focusBoxes.map(([min, max]) => boxFromCorners(min, max))
    boxCache.set(key, boxes)
  }
  return boxes
}

/**
 * Pose real de um preset para a viewport atual. `direction` (alvo -> câmera) é opcional: o padrão
 * é a do preset de referência; HOME em `idle` passa a direção ATUAL para não desfazer a órbita do
 * usuário num resize. Sem `framing` (ou com viewport zerada), devolve a pose de referência.
 */
export function resolvePose(
  key: PresetKey,
  side: PanelSide,
  viewport: Viewport,
  direction?: Vec3Tuple,
): ResolvedPose {
  const preset = PRESETS[key]
  const boxes = boxesOf(key, preset)
  if (!boxes || !(viewport.width > 1) || !(viewport.height > 1)) {
    return {
      position: [...preset.position],
      target: [...preset.target],
      distance: Math.hypot(
        preset.position[0] - preset.target[0],
        preset.position[1] - preset.target[1],
        preset.position[2] - preset.target[2],
      ),
    }
  }
  const panelSide = viewport.width < SHEET_MAX_WIDTH ? 'none' : side
  return resolveFraming({
    direction: direction ?? directionFromPose(preset.position, preset.target),
    box: boxes,
    aspect: viewport.width / viewport.height,
    fovDeg: viewport.fovDeg,
    panelFraction: panelFractionOf(viewport.width, PANEL_WIDTH_PX),
    panelSide,
    margin: preset.framing?.margin,
  })
}

/**
 * Limites de órbita do preset ajustados à distância resolvida. Em HOME, uma tela estreita afasta a
 * câmera além do `maxDistance` fixo (e uma ultrawide a aproxima do `minDistance`): os limites
 * acompanham, mantendo a folga original de dolly. Hotspots (sem controle do usuário) não mudam.
 */
export function limitsFor(preset: CameraPreset, distance: number): CameraLimits {
  const l = preset.limits
  if (!preset.userControl || !Number.isFinite(distance)) return l
  return {
    ...l,
    minDistance: Math.min(l.minDistance, distance * 0.53),
    maxDistance: Math.max(l.maxDistance, distance * 1.13),
  }
}
