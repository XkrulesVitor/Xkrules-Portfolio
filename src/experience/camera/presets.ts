import type { HotspotId } from '@/content/types'
import { degToRad } from '@/lib/math'

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

// ATENÇÃO: valores PROVISÓRIOS calibrados para o grey-box (docs/ARCHITECTURE §4, BACKLOG 0.3).
// Reafinar com o painel leva (dev) quando os modelos reais chegarem (BACKLOG 4.3).
export const PRESETS: Record<PresetKey, CameraPreset> = {
  home: {
    // Alvo deslocado para o fundo/direita (onde está o conteúdo); offset da câmera = (9, 7, 9).
    position: [10, 8, 8],
    target: [1, 1, -1],
    smoothTime: 1.1,
    userControl: true,
    limits: {
      minDistance: 8,
      maxDistance: 16,
      minPolar: degToRad(35),
      maxPolar: degToRad(70),
      minAzimuth: HOME_AZIMUTH - HOME_AZIMUTH_RANGE,
      maxAzimuth: HOME_AZIMUTH + HOME_AZIMUTH_RANGE,
    },
  },
  // Cadeira: altura do ombro, vindo de +X/+Z (o lado em que ela gira ao hover). Painel à direita,
  // por isso o alvo é deslocado para que a cadeira fique à esquerda do centro.
  chair: {
    position: [0.2, 1.5, 1.2],
    target: [-2.26, 0.75, -1.4],
    smoothTime: 0.9,
    userControl: false,
    limits: OPEN_LIMITS,
    dof: { focusDistance: 2.8, focalLength: 0.05, bokehScale: 3 },
  },
  // Mesa: EXATAMENTE perpendicular à tela do monitor principal (normal = +X).
  // target = centro da tela; position = target + normal * d.
  desk: {
    position: [-1.919, 1.56, -1.0],
    target: [-4.319, 1.56, -1.0],
    smoothTime: 0.9,
    userControl: false,
    limits: OPEN_LIMITS,
  },
  // Impressora: macro por cima/na frente. Painel à direita -> impressora à esquerda do centro.
  printer: {
    position: [3.4, 2.2, 0.2],
    target: [1.5, 1.15, -3.4],
    smoothTime: 0.9,
    userControl: false,
    limits: OPEN_LIMITS,
  },
  // Estante: enquadra a estante inteira. Painel à esquerda -> estante à direita do centro.
  shelf: {
    position: [2.4, 1.8, 2.2],
    target: [3.6, 1.3, -3.6],
    smoothTime: 0.9,
    userControl: false,
    limits: OPEN_LIMITS,
  },
}
