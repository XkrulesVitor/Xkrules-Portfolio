import type { HotspotId } from '@/content/types'
import { degToRad } from '@/lib/math'
import { LAYOUT } from '../scene/layout'

export type Vec3 = readonly [number, number, number]

export interface CameraLimits {
  minDistance: number
  maxDistance: number
  /** radianos, 0 = olhando de cima */
  minPolar: number
  maxPolar: number
  /** radianos em torno de Y (0 = câmera em +Z, +90° = câmera em +X) */
  minAzimuth: number
  maxAzimuth: number
}

export interface CameraPreset {
  position: Vec3
  target: Vec3
  /** Reservado (Fase 3/4): o CameraRig ainda não anima o fov. Default do Canvas = 35. */
  fov?: number
  /** camera-controls: tempo de amortecimento da transição, em segundos. */
  smoothTime?: number
  /** Permite órbita do usuário depois de chegar? */
  userControl: boolean
  limits: CameraLimits
  /** Só o `chair` usa (Fase 3): parâmetros do DepthOfField. */
  dof?: { focusDistance: number; focalLength: number; bokehScale: number }
}

export type PresetKey = 'home' | HotspotId

/** Sem restrição: usado durante voos e nos hotspots (onde o usuário não orbita). */
export const OPEN_LIMITS: CameraLimits = {
  minDistance: 0.05,
  maxDistance: Infinity,
  minPolar: 0,
  maxPolar: Math.PI,
  minAzimuth: -Infinity,
  maxAzimuth: Infinity,
}

/** Suavização de arrasto/dolly quando o usuário orbita em HOME. */
export const USER_SMOOTH_TIME = 0.25
export const DEFAULT_SMOOTH_TIME = 0.8
export const INTRO_SMOOTH_TIME = 2.2

// Azimute de HOME: câmera na diagonal +X/+Z (45°) com ±25° de folga.
const HOME_AZIMUTH = degToRad(45)
const HOME_AZIMUTH_RANGE = degToRad(25)

/** Ponto de partida do voo de introdução (longe e mais para o lado). */
export const INTRO_START: { position: Vec3; target: Vec3 } = {
  position: [22, 14, 3],
  target: [0, 1, 0],
}

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const scale = (v: Vec3, k: number): Vec3 => [v[0] * k, v[1] * k, v[2] * k]

/**
 * Distância da câmera do `desk` até a tela do monitor horizontal. Com 1.55 m a tela ocupa ~75% da
 * largura em 16:9 e ainda cabe inteira em 4:3. É o "zoom no PC": diminuir aproxima.
 */
export const DESK_SCREEN_DISTANCE = 1.55

// ATENÇÃO: valores PROVISÓRIOS calibrados para o grey-box (docs/ARCHITECTURE §4, BACKLOG 0.3).
// Os hotspots são relativos às âncoras de scene/layout.ts: mover um móvel leva a câmera junto.
// Reafinar com o painel leva (dev) quando os modelos reais chegarem (BACKLOG 4.3).
export const PRESETS: Record<PresetKey, CameraPreset> = {
  home: {
    // Quarto 8.6 x 7.0: offset (8.2, 6.38, 8.2) = diagonal 45°, polar ~61°, distância ~13.2.
    // A ilha inteira cabe com folga em 16:9, inclusive a quina da frente.
    position: [8.5, 7.13, 8.2],
    target: [0.3, 0.75, 0],
    smoothTime: 1.1,
    userControl: true,
    limits: {
      minDistance: 7,
      maxDistance: 15,
      minPolar: degToRad(35),
      maxPolar: degToRad(70),
      minAzimuth: HOME_AZIMUTH - HOME_AZIMUTH_RANGE,
      maxAzimuth: HOME_AZIMUTH + HOME_AZIMUTH_RANGE,
    },
  },
  // Cadeira: altura do ombro, vindo de +X/+Z (o lado em que ela gira ao hover). Painel à direita,
  // por isso o alvo é deslocado para que a cadeira fique à esquerda do centro.
  chair: {
    position: add(LAYOUT.chair, [2.95, 1.5, 2.2]),
    target: add(LAYOUT.chair, [0.49, 0.75, -0.4]),
    smoothTime: 0.9,
    userControl: false,
    limits: OPEN_LIMITS,
    dof: { focusDistance: 2.8, focalLength: 0.05, bokehScale: 3 },
  },
  // Mesa: EXATAMENTE perpendicular à tela do monitor horizontal.
  // target = centro da tela; position = target + normal * DESK_SCREEN_DISTANCE.
  desk: {
    position: add(LAYOUT.monitorMain.center, scale(LAYOUT.monitorMain.normal, DESK_SCREEN_DISTANCE)),
    target: LAYOUT.monitorMain.center,
    smoothTime: 0.9,
    userControl: false,
    limits: OPEN_LIMITS,
  },
  // Impressora no canto direito do fundo: macro pela frente/direita. Painel à direita -> impressora
  // à esquerda do centro.
  printer: {
    position: add(LAYOUT.printer, [2.4, 1.3, 3.6]),
    target: add(LAYOUT.printer, [0.5, 0.25, 0]),
    smoothTime: 0.9,
    userControl: false,
    limits: OPEN_LIMITS,
  },
  // Estante: zoom nas prateleiras 2 (board games) e 3 (console + jogos digitais), a ~3 m da frente.
  // Painel à esquerda -> alvo deslocado para a esquerda, estante entre ~37% e ~93% da largura.
  // Afinado em 16:9; outros aspects dependem do BACKLOG 3.6 (enquadramento responsivo).
  shelf: {
    position: add(LAYOUT.shelf, [0.28, 1.42, 3.13]),
    target: add(LAYOUT.shelf, [-0.42, 1.25, 0.25]),
    smoothTime: 0.9,
    userControl: false,
    limits: OPEN_LIMITS,
  },
}
