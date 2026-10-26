/**
 * Coreografia dos efeitos das caixas de board game (Conquista Galáctica e Aldeia Dorme).
 * Lógica PURA (sem three, sem React, sem alocar por quadro): spline, balística, easing e as duas
 * linhas do tempo. Os componentes só aplicam o resultado nos objetos. Testada em
 * `__tests__/fxTimeline.test.ts`.
 *
 * Unidades: metros e segundos. O tempo de cada efeito começa no instante em que o painel destaca
 * a caixa (`store.highlightBox`).
 */

export type V3 = readonly [number, number, number]

/** Destino mutável de uma amostra (aceita um `Vector3`, que tem x/y/z). */
export interface Mutable3 {
  x: number
  y: number
  z: number
}

export const TWO_PI = Math.PI * 2

export const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v))
export const clamp01 = (v: number): number => clamp(v, 0, 1)

export function smoothstep(edge0: number, edge1: number, v: number): number {
  const t = clamp01((v - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

export const easeOutCubic = (t: number): number => 1 - (1 - clamp01(t)) ** 3

export function easeInOutCubic(t: number): number {
  const x = clamp01(t)
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2
}

/** Leva o ângulo para (-π, π]. */
export function wrapAngle(a: number): number {
  let r = a % TWO_PI
  if (r > Math.PI) r -= TWO_PI
  else if (r <= -Math.PI) r += TWO_PI
  return r
}

// ------------------------------------------------------------------------------------ spline

const catmull = (a: number, b: number, c: number, d: number, w: number, w2: number, w3: number): number =>
  0.5 * (2 * b + (c - a) * w + (2 * a - 5 * b + 4 * c - d) * w2 + (3 * b - a - 3 * c + d) * w3)

const catmullSlope = (a: number, b: number, c: number, d: number, w: number, w2: number): number =>
  0.5 * (c - a + 2 * (2 * a - 5 * b + 4 * c - d) * w + 3 * (3 * b - a - 3 * c + d) * w2)

function segment(points: readonly V3[], u: number): { i: number; w: number } {
  const n = points.length - 1
  const p = clamp01(u) * n
  const i = Math.min(Math.floor(p), n - 1)
  return { i, w: p - i }
}

/**
 * Catmull-Rom uniforme: passa por todos os pontos e `u` (0..1) gasta o MESMO tempo em cada trecho,
 * então trechos longos são percorridos mais rápido (a velocidade sobe sozinha onde os pontos se afastam).
 */
export function splinePoint(points: readonly V3[], u: number, out: Mutable3): void {
  const n = points.length - 1
  const { i, w } = segment(points, u)
  const p0 = points[Math.max(i - 1, 0)]
  const p1 = points[i]
  const p2 = points[i + 1]
  const p3 = points[Math.min(i + 2, n)]
  const w2 = w * w
  const w3 = w2 * w
  out.x = catmull(p0[0], p1[0], p2[0], p3[0], w, w2, w3)
  out.y = catmull(p0[1], p1[1], p2[1], p3[1], w, w2, w3)
  out.z = catmull(p0[2], p1[2], p2[2], p3[2], w, w2, w3)
}

/** Direção (unitária) da trajetória em `u`. */
export function splineTangent(points: readonly V3[], u: number, out: Mutable3): void {
  const n = points.length - 1
  const { i, w } = segment(points, u)
  const p0 = points[Math.max(i - 1, 0)]
  const p1 = points[i]
  const p2 = points[i + 1]
  const p3 = points[Math.min(i + 2, n)]
  const w2 = w * w
  const x = catmullSlope(p0[0], p1[0], p2[0], p3[0], w, w2)
  const y = catmullSlope(p0[1], p1[1], p2[1], p3[1], w, w2)
  const z = catmullSlope(p0[2], p1[2], p2[2], p3[2], w, w2)
  const len = Math.hypot(x, y, z)
  if (len < 1e-6) {
    out.x = 0
    out.y = 0
    out.z = 1
    return
  }
  out.x = x / len
  out.y = y / len
  out.z = z / len
}

// ---------------------------------------------------------------------------------- balística

/** Salto parabólico em Y: sobe de `y0`, passa por `peak` e pousa em `y1`. */
export interface Ballistic {
  y0: number
  v0: number
  g: number
  /** Duração do voo (s). */
  flight: number
}

export function ballistic(y0: number, y1: number, peak: number, g: number): Ballistic {
  const top = Math.max(peak, y0, y1) + 1e-4
  const v0 = Math.sqrt(2 * g * (top - y0))
  return { y0, v0, g, flight: v0 / g + Math.sqrt((2 * (top - y1)) / g) }
}

export const ballisticY = (b: Ballistic, t: number): number => b.y0 + b.v0 * t - 0.5 * b.g * t * t
export const ballisticVy = (b: Ballistic, t: number): number => b.v0 - b.g * t

// ------------------------------------------------------------------ Conquista Galáctica (caça)

/**
 * Trajetória do caça, em coordenadas do MUNDO (a caixa de Conquista Galáctica fica em
 * x 0.28..0.64, y 0.705..1.065, z -3.10..-2.95 com o destaque; a prateleira 3 começa em y 1.305 e a
 * borda da estante está em z -2.88). A câmera `shelf` olha da frente (+Z) a ~2.9 m, um pouco à direita.
 *
 *  0  escondido atrás da caixa
 *  1  aparece por cima da borda de trás da caixa, subindo
 *  2  topo da curva, à esquerda, já na frente da estante
 *  3  vira (inclinação máxima) e começa o rasante
 *  4  rasante pela frente da estante (3 disparos)
 *  5  continua para a direita (rolamento)
 *  6  sai do quadro
 *  7  longe, fora de vista
 */
export const FIGHTER_PATH: readonly V3[] = [
  [0.46, 0.92, -3.28],
  [0.34, 1.17, -3.0],
  [0.1, 1.22, -2.72],
  [0.34, 1.16, -2.44],
  [0.8, 1.02, -2.36],
  [1.42, 0.98, -2.3],
  [2.25, 1.06, -2.4],
  [3.2, 1.25, -2.6],
]

/** Espera antes de sair (a caixa leva ~0.25 s para saltar da prateleira). */
export const FIGHTER_DELAY = 0.25
/** Tempo da trajetória inteira (7 trechos de ~0.37 s). */
export const FIGHTER_PATH_TIME = 2.6
export const FIGHTER_TOTAL = FIGHTER_DELAY + FIGHTER_PATH_TIME
/** Instantes (contados do começo da trajetória) dos disparos. */
export const FIGHTER_SHOTS: readonly number[] = [1.15, 1.32, 1.49]
/** Rolamento completo (barrel roll) depois dos disparos. */
const ROLL_START = 1.45
const ROLL_DURATION = 0.7
/** Janela (s) e ganho da inclinação que acompanha a curva; limite em rad. */
const BANK_WINDOW = 0.12
const BANK_GAIN = 0.25
const BANK_MAX = 1
/** Meia altura do hexágono da asa: o espaço livre é conferido com ela. */
export const FIGHTER_RADIUS = 0.055

export interface FighterPose {
  x: number
  y: number
  z: number
  /** Direção do voo (unitária). */
  fx: number
  fy: number
  fz: number
  /** Rolagem em torno do eixo de voo (rad). Positivo = asa direita para baixo. */
  bank: number
}

const sample: Mutable3 = { x: 0, y: 0, z: 0 }
const sampleDir: Mutable3 = { x: 0, y: 0, z: 1 }

function headingAt(time: number): number {
  splineTangent(FIGHTER_PATH, time / FIGHTER_PATH_TIME, sampleDir)
  return Math.atan2(sampleDir.x, sampleDir.z)
}

/**
 * Pose do caça `time` segundos depois de sair (0..FIGHTER_PATH_TIME). A inclinação segue a taxa de
 * giro do rumo (média numa janela, para não dar tranco entre os trechos da spline); depois dos
 * disparos soma-se uma volta completa de rolamento.
 */
export function fighterPose(time: number, out: FighterPose): void {
  const t = clamp(time, 0, FIGHTER_PATH_TIME)
  const u = t / FIGHTER_PATH_TIME
  splinePoint(FIGHTER_PATH, u, sample)
  out.x = sample.x
  out.y = sample.y
  out.z = sample.z
  splineTangent(FIGHTER_PATH, u, sampleDir)
  out.fx = sampleDir.x
  out.fy = sampleDir.y
  out.fz = sampleDir.z
  const turn = wrapAngle(headingAt(t + BANK_WINDOW) - headingAt(t - BANK_WINDOW)) / (2 * BANK_WINDOW)
  // Rumo crescente (de -X para +X, vindo em +Z) é curva para a ESQUERDA do piloto: asa esquerda desce.
  out.bank = clamp(-turn * BANK_GAIN, -BANK_MAX, BANK_MAX) + TWO_PI * smoothstep(ROLL_START, ROLL_START + ROLL_DURATION, t)
}

// ------------------------------------------------------------------------ Aldeia Dorme (meeples)

/**
 * Coordenadas LOCAIS à caixa da Aldeia Dorme (origem no centro dela, +Z para a frente, 0.36 x 0.36 x
 * 0.10). A caixa é projetada 15 cm para fora ao destacar; o grupo dos meeples acompanha o nó dela,
 * então nada aqui depende do quanto ela já saiu.
 */
export const BOARD_HALF = 0.18
export const BOARD_HALF_DEPTH = 0.05
/** Onde os pés encostam: topo da prateleira (embaixo da caixa) e topo da caixa. */
export const FLOOR_Y = -BOARD_HALF + 0.0008
export const TOP_Y = BOARD_HALF + 0.0008
/** Face de baixo da prateleira 3, no mesmo referencial (1.305 - 0.885). */
export const UNDER_SHELF_Y = 0.42
/** Altura do meeple e raio da base (para conferir folgas). */
export const MEEPLE_HEIGHT = 0.0395
export const MEEPLE_RADIUS = 0.0128

/** Gravidade "de desenho animado" dos quiques depois do pouso. */
const G_HOP = 7
/** Duração do achatamento ao pousar (s) e do agachar antes de sair. */
export const SQUASH = 0.11
export const CROUCH = 0.09
/** Quanto o meeple estica na velocidade máxima (fração). */
const STRETCH = 0.24
/** O meeple some do render logo depois de se esconder de novo. */
export const HIDE_AFTER = 0.12

export interface Hop {
  /** Altura do quique (m). */
  height: number
  /** Giro em Y durante o quique (rad); só múltiplos de 2π, para não dar tranco ao pousar. */
  spin?: number
}

export interface MeepleTrack {
  /** Onde espera escondido: no tampo da prateleira, atrás da caixa. */
  hide: V3
  /** Onde pousa: no topo da caixa. */
  land: V3
  /** Instante do salto de entrada. */
  start: number
  /** Altura dos pés no ápice do salto de entrada. */
  peakIn: number
  gIn: number
  spinIn?: number
  hops: readonly Hop[]
  /** Instante em que começa a agachar para o salto de volta. */
  exit: number
  peakOut: number
  gOut: number
  /** Inclinação do soninho (rad, em torno de Z; pivô nos pés). */
  tilt: number
}

const HIDE_Z = -0.105
const PEAK = (above: number): number => TOP_Y + above

/** Cinco moradores. O quinto é o vigia com a lanterna, que cochila por último. */
export const MEEPLE_TRACKS: readonly MeepleTrack[] = [
  {
    hide: [-0.09, FLOOR_Y, HIDE_Z],
    land: [-0.065, TOP_Y, 0.012],
    start: 0.22,
    peakIn: PEAK(0.095),
    gIn: 6,
    hops: [{ height: 0.06 }, { height: 0.03 }],
    exit: 2.12,
    peakOut: PEAK(0.07),
    gOut: 8,
    tilt: -0.16,
  },
  {
    hide: [-0.03, FLOOR_Y, -0.11],
    land: [-0.13, TOP_Y, -0.012],
    start: 0.3,
    peakIn: PEAK(0.115),
    gIn: 6.4,
    spinIn: TWO_PI,
    hops: [{ height: 0.05, spin: TWO_PI }],
    exit: 2.19,
    peakOut: PEAK(0.075),
    gOut: 8,
    tilt: 0.12,
  },
  {
    hide: [0.03, FLOOR_Y, HIDE_Z],
    land: [0, TOP_Y, 0.02],
    start: 0.38,
    peakIn: PEAK(0.08),
    gIn: 5.6,
    hops: [{ height: 0.07 }, { height: 0.035 }],
    exit: 2.26,
    peakOut: PEAK(0.08),
    gOut: 8,
    tilt: -0.1,
  },
  {
    hide: [0.09, FLOOR_Y, -0.108],
    land: [0.07, TOP_Y, -0.005],
    start: 0.46,
    peakIn: PEAK(0.105),
    gIn: 6.2,
    hops: [{ height: 0.045 }],
    exit: 2.33,
    peakOut: PEAK(0.07),
    gOut: 8,
    tilt: 0.15,
  },
  {
    hide: [0.15, FLOOR_Y, HIDE_Z],
    land: [0.135, TOP_Y, 0],
    start: 0.54,
    peakIn: PEAK(0.09),
    gIn: 6,
    hops: [{ height: 0.03 }],
    exit: 2.42,
    peakOut: PEAK(0.07),
    gOut: 8,
    tilt: 0.2,
  },
]

/** Índice do vigia (lanterna, "z z z"). */
export const WATCHMAN = MEEPLE_TRACKS.length - 1
/** Instante em que todos começam a cochilar (inclinam). */
export const SLEEP_FROM = 1.6

export const VILLAGE_TOTAL = 3.05
/** Lua minguante: nasce atrás da caixa, sobe, e some no fim. */
export const MOON = { riseAt: 1.0, riseTime: 0.95, fadeOutAt: 2.65, fadeOutTime: 0.35 } as const
/** Os três "z" que sobem do vigia. */
export const ZZZ = { spawn: [1.7, 1.9, 2.1], life: 0.8 } as const

interface HopPlan {
  launch: number
  land: number
  v0: number
  spin: number
}

export interface MeeplePlan {
  track: MeepleTrack
  entry: Ballistic
  landAt: number
  hops: readonly HopPlan[]
  /** Fim do último achatamento: a partir daqui ele só fica de pé, cochilando. */
  standAt: number
  leave: Ballistic
  /** Pousou de volta atrás da caixa. */
  endAt: number
}

export function planMeeple(track: MeepleTrack): MeeplePlan {
  const entry = ballistic(track.hide[1], track.land[1], track.peakIn, track.gIn)
  const landAt = track.start + entry.flight
  const hops: HopPlan[] = []
  let landed = landAt
  for (const hop of track.hops) {
    const launch = landed + SQUASH
    const v0 = Math.sqrt(2 * G_HOP * hop.height)
    landed = launch + (2 * v0) / G_HOP
    hops.push({ launch, land: landed, v0, spin: hop.spin ?? 0 })
  }
  const leave = ballistic(track.land[1], track.hide[1], track.peakOut, track.gOut)
  return { track, entry, landAt, hops, standAt: landed + SQUASH, leave, endAt: track.exit + leave.flight }
}

export const MEEPLE_PLANS: readonly MeeplePlan[] = MEEPLE_TRACKS.map(planMeeple)

export interface MeeplePose {
  x: number
  y: number
  z: number
  /** Escala (squash and stretch com volume constante: sx = sz = 1 / sqrt(sy)). */
  sx: number
  sy: number
  sz: number
  rotY: number
  rotZ: number
  visible: boolean
}

export function createMeeplePose(): MeeplePose {
  return { x: 0, y: 0, z: 0, sx: 1, sy: 1, sz: 1, rotY: 0, rotZ: 0, visible: false }
}

function setStretch(out: MeeplePose, sy: number): void {
  out.sy = sy
  out.sx = out.sz = 1 / Math.sqrt(sy)
}

/** Estica com a velocidade vertical; `since` suaviza o instante da decolagem. */
function flightStretch(vy: number, vMax: number, since: number): number {
  return 1 + STRETCH * clamp01(Math.abs(vy) / vMax) * smoothstep(0, 0.05, since)
}

export function meeplePose(plan: MeeplePlan, t: number, out: MeeplePose): void {
  const tr = plan.track
  const [hx, hy, hz] = tr.hide
  const [lx, ly, lz] = tr.land
  out.rotY = 0
  out.rotZ = 0
  setStretch(out, 1)
  out.visible = t >= tr.start - 0.04 && t < plan.endAt + HIDE_AFTER

  // Esperando escondido atrás da caixa.
  if (t < tr.start) {
    out.x = hx
    out.y = hy
    out.z = hz
    return
  }

  // Salto de entrada: de trás da caixa, por cima da borda, até o topo.
  if (t < plan.landAt) {
    const tau = t - tr.start
    const f = tau / plan.entry.flight
    // Sobe quase na vertical e só avança por cima da caixa perto do ápice (não raspa na borda de trás).
    const h = f ** 1.6
    out.x = hx + (lx - hx) * h
    out.z = hz + (lz - hz) * h
    out.y = ballisticY(plan.entry, tau)
    setStretch(out, flightStretch(ballisticVy(plan.entry, tau), plan.entry.v0, tau))
    out.rotY = (tr.spinIn ?? 0) * easeOutCubic(f)
    out.rotZ = -0.22 * Math.sin(Math.PI * f) * (lx >= hx ? 1 : -1)
    return
  }

  // Quiques em cima da caixa. `landed` e `impact` guardam o último pouso (para o achatamento).
  out.x = lx
  out.z = lz
  out.y = ly
  let landed = plan.landAt
  let impact = Math.abs(ballisticVy(plan.entry, plan.entry.flight))
  for (const hop of plan.hops) {
    if (t < hop.launch) break
    if (t < hop.land) {
      const tau = t - hop.launch
      out.y = ly + hop.v0 * tau - 0.5 * G_HOP * tau * tau
      setStretch(out, flightStretch(hop.v0 - G_HOP * tau, hop.v0, tau))
      out.rotY = hop.spin * easeInOutCubic(tau / (hop.land - hop.launch))
      return
    }
    landed = hop.land
    impact = hop.v0
  }

  const since = (t - landed) / SQUASH
  if (since < 1) {
    // Achata mais quanto mais forte foi a queda.
    setStretch(out, 1 - (0.12 + 0.24 * clamp01(impact / 2.4)) * Math.sin(Math.PI * since))
  }

  // De pé, cochilando: inclina devagar e balança de leve.
  const crouch = clamp01((t - (tr.exit - CROUCH)) / CROUCH)
  const lean = tr.tilt * smoothstep(SLEEP_FROM, SLEEP_FROM + 0.4, t) * (1 - crouch)
  const sway = t >= plan.standAt ? 0.02 * Math.sin(7 * t + tr.start * 9) * (1 - crouch) : 0
  out.rotZ = lean + sway

  if (t < tr.exit - CROUCH) return
  if (t < tr.exit) {
    setStretch(out, 1 - 0.3 * Math.sin((Math.PI / 2) * crouch))
    return
  }

  // Salto de volta: por cima da borda de trás, até a prateleira escondida.
  const tau = t - tr.exit
  if (tau < plan.leave.flight) {
    const f = tau / plan.leave.flight
    // Cruza a borda de trás logo depois de decolar, ainda no alto, e cai atrás da caixa.
    const h = 1 - (1 - f) ** 2
    out.x = lx + (hx - lx) * h
    out.z = lz + (hz - lz) * h
    out.y = ballisticY(plan.leave, tau)
    setStretch(out, flightStretch(ballisticVy(plan.leave, tau), plan.leave.v0, tau))
    out.rotZ = 0.18 * Math.sin(Math.PI * f) * (hx >= lx ? 1 : -1)
    return
  }
  out.x = hx
  out.y = hy
  out.z = hz
  out.rotZ = 0
}
