// Mixagem do áudio do quarto: ganhos de cada voz e as curvas de distância (câmera -> fonte).
// Módulo FOLHA e puro (sem Web Audio, sem three): testado com `node --test`.
//
// Princípio: o som ACOMPANHA, não domina. Tudo aqui é bem baixo; os valores de `VOICE_GAIN` foram
// calibrados renderizando cada voz offline (`measureVoices`, só em dev) para os níveis finais
// (dBFS, já com o ganho master) ficarem perto dos alvos de `LEVEL_TARGETS_DB`.

/** Ganho master quando ligado. Desligado = 0, sempre por rampa (nada de clique). */
export const MASTER_GAIN = 0.9
/** Constante de tempo (s) da rampa do master: ~95% do alvo em 3 constantes (~150 ms). */
export const MASTER_RAMP_S = 0.05
/** Depois de mudo, o contexto é suspenso (poupa CPU/bateria) quando a rampa já terminou. */
export const SUSPEND_AFTER_MUTE_MS = 450

/** Ganho de cada voz com o nível em 1 (antes do master). */
export const VOICE_GAIN = {
  fan: 0.185,
  ambient: 0.036,
  key: 0.12,
  mouse: 0.14,
  tvStatic: 0.075,
} as const

/** Alvos de loudness FINAL (dBFS, com o master), conferidos por `measureVoices`. Referência de calibragem. */
export const LEVEL_TARGETS_DB = {
  /** RMS do zumbido da ventoinha, com a câmera junto do PC. */
  fan: -34,
  /** RMS do ambiente noturno, com a câmera longe. */
  ambient: -44,
  /** Pico de um clique de teclado. */
  key: -22,
  /** Pico de um clique de mouse. */
  mouse: -24,
  /** Pico da estática da TV. */
  tvStatic: -24,
} as const

export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

/** Hermite clássico: 0 em `edge0`, 1 em `edge1`, derivada nula nas pontas. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

interface DistanceCurve {
  /** Distância (m) a partir da qual o nível já é o máximo (ou o mínimo, conforme a curva). */
  near: number
  /** Distância (m) a partir da qual o nível já é o mínimo (ou o máximo). */
  far: number
  /** Nível no extremo "baixo" da curva (0..1). */
  floor: number
}

/** Ventoinha: forte junto do PC, quase some na visão geral (um resto de presença, `floor`). */
export const FAN_CURVE: DistanceCurve = { near: 2, far: 14, floor: 0.04 }
/** Ambiente: mais presente de longe (visão geral), mais contido quando se entra num hotspot. */
export const AMBIENT_CURVE: DistanceCurve = { near: 1.5, far: 12, floor: 0.35 }
/** Estática da TV: um pouco mais baixa quando a câmera está longe da tela. */
export const STATIC_CURVE: DistanceCurve = { near: 2, far: 14, floor: 0.4 }

/** Distância inválida (NaN) conta como "longe": nunca estoura volume por acidente. */
function safeDistance(distance: number, fallback: number): number {
  return Number.isFinite(distance) ? Math.max(0, distance) : fallback
}

/**
 * Nível 0..1 que CAI com a distância (1 perto, `floor` longe). Queda quadrática: o som some logo
 * ao se afastar (como uma fonte pontual), em vez de ficar alto até metade do caminho.
 */
function fallingLevel(c: DistanceCurve, distance: number): number {
  const t = clamp01((safeDistance(distance, c.far) - c.near) / (c.far - c.near))
  return c.floor + (1 - c.floor) * (1 - t) * (1 - t)
}

/** Nível 0..1 que SOBE com a distância (`floor` perto, 1 longe). */
function risingLevel(c: DistanceCurve, distance: number): number {
  const t = smoothstep(c.near, c.far, safeDistance(distance, c.far))
  return c.floor + (1 - c.floor) * t
}

/** Volume (0..1) do zumbido da ventoinha pela distância da câmera ao PC. */
export function fanLevel(distanceToPc: number): number {
  return fallingLevel(FAN_CURVE, distanceToPc)
}

/** Volume (0..1) do ambiente pela distância da câmera ao centro do quarto. */
export function ambientLevel(distanceToRoomCenter: number): number {
  return risingLevel(AMBIENT_CURVE, distanceToRoomCenter)
}

/** Volume (0..1) da estática pela distância da câmera à TV. */
export function staticLevel(distanceToTv: number): number {
  return fallingLevel(STATIC_CURVE, distanceToTv)
}

/** Corte do passa-baixa do ambiente (Hz): mais abafado quando a câmera entra no quarto. */
export const AMBIENT_CUTOFF_HZ = { min: 300, max: 520 } as const

export function ambientCutoffHz(level: number): number {
  const t = clamp01((level - AMBIENT_CURVE.floor) / (1 - AMBIENT_CURVE.floor))
  return AMBIENT_CUTOFF_HZ.min + (AMBIENT_CUTOFF_HZ.max - AMBIENT_CUTOFF_HZ.min) * t
}

/** Fator de frequência para uma variação aleatória de `±spreadCents` centésimos de semitom. */
export function pitchRatio(random: () => number, spreadCents: number): number {
  const cents = (random() * 2 - 1) * spreadCents
  return Math.pow(2, cents / 1200)
}

/** Linear -> dBFS (amplitude). 0 vira -Infinity. */
export function toDb(amplitude: number): number {
  return amplitude > 0 ? 20 * Math.log10(amplitude) : -Infinity
}
