import type { PresetKey } from '@/content/types'
import { degToRad } from '@/lib/math'
import { LAYOUT, ROOM } from '../scene/layout'

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

/** Caixa do mundo por dois cantos (min, max). Tuplas, para o preset não depender de `three`. */
export type BoxCorners = readonly [min: Vec3, max: Vec3]

/**
 * Enquadramento responsivo (BACKLOG V.4): o que o preset precisa MOSTRAR. O `CameraRig` passa isto
 * ao resolvedor (`framing.ts`), que acha distância e deslocamento lateral para o conteúdo caber
 * inteiro fora do painel, em qualquer aspect, mantendo a direção de olhar de `position - target`.
 */
export interface PresetFraming {
  /** Volume a enquadrar. Lista de caixas quando o volume não é convexo (o quarto em L). */
  focusBoxes: readonly BoxCorners[]
  /** Margem por lado, em fração da viewport. Padrão: DEFAULT_FRAMING_MARGIN (framing.ts). */
  margin?: number
}

export interface CameraPreset {
  /**
   * Pose de REFERÊNCIA em 16:9 (1920x1080 com o painel de 440 px). Dela vêm a direção de olhar do
   * enquadramento responsivo e o fallback; quem lê os presets de fora (export-layout do V.1,
   * leva) continua enxergando `position` e `target`.
   */
  position: Vec3
  target: Vec3
  /** Se existir, `position`/`target` reais de cada voo são recalculados por aspect (ver `framing`). */
  framing?: PresetFraming
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

// A chave dos presets é declarada em content/types.ts, porque o registry (content/hotspots.ts)
// referencia presets por chave nas sub-vistas.
export type { PresetKey }

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
/** Caixa com `min`/`max` dados como deslocamentos de uma âncora do layout. */
const around = (anchor: Vec3, min: Vec3, max: Vec3): BoxCorners => [add(anchor, min), add(anchor, max)]

/** Plano de uma tela como caixa de espessura zero (a normal é um eixo do mundo, no layout). */
function screenBox(screen: { center: Vec3; normal: Vec3; size: readonly [number, number] }): BoxCorners {
  const [w, h] = screen.size
  const alongX = Math.abs(screen.normal[0]) < 0.5 // normal em ±Z: a largura corre em X
  const half: Vec3 = alongX ? [w / 2, h / 2, 0] : [0, h / 2, w / 2]
  return around(screen.center, scale(half, -1), half)
}

/**
 * A ilha como três caixas: piso, parede esquerda e parede do fundo. Uma caixa só incluiria os
 * cantos de cima da frente, que são ar (as bordas +X e +Z não têm parede) e afastariam a câmera.
 */
function roomBoxes(): readonly BoxCorners[] {
  const { width: w, depth: d, wallHeight: h, wallThickness: t } = ROOM
  return [
    [[-w / 2, -0.1, -d / 2], [w / 2, 0, d / 2]],
    [[-w / 2, 0, -d / 2], [-w / 2 + t, h, d / 2]],
    [[-w / 2, 0, -d / 2], [w / 2, h, -d / 2 + t]],
  ]
}

/** Rack da TV do piso ao tampo, mais a TV (topo da tela) acima dele. */
function rackAndTvBox(): BoxCorners {
  const { rack, tv } = LAYOUT
  const top = tv.center[1] + tv.size[1] / 2
  return [
    [rack.center[0] - rack.size[0] / 2, 0, rack.center[2] - rack.size[2] / 2 - 0.015],
    [rack.center[0] + rack.size[0] / 2, top, rack.center[2] + rack.size[2] / 2 + 0.015],
  ]
}

/**
 * Distância da câmera do `desk` até a tela do monitor horizontal. Com 1.55 m a tela ocupa ~75% da
 * largura em 16:9 e ainda cabe inteira em 4:3. É o "zoom no PC": diminuir aproxima.
 */
export const DESK_SCREEN_DISTANCE = 1.55

// ATENÇÃO: valores PROVISÓRIOS calibrados para o grey-box (docs/ARCHITECTURE §4, BACKLOG 0.3).
// `position`/`target` são a pose de REFERÊNCIA em 16:9; o `framing` de cada preset (caixas derivadas
// das âncoras de scene/layout.ts) recalcula a pose real por aspect em cada voo (camera/framing.ts).
// Mover um móvel leva a câmera junto. Reafinar com o painel leva (dev) quando os modelos reais chegarem.
export const PRESETS: Record<PresetKey, CameraPreset> = {
  home: {
    // Quarto 8.6 x 7.0: offset (8.2, 6.38, 8.2) = diagonal 45°, polar ~61°, distância ~13.2.
    // A ilha inteira cabe com folga em 16:9, inclusive a quina da frente.
    position: [8.5, 7.13, 8.2],
    target: [0.3, 0.75, 0],
    // Ilha inteira, sem painel. Margem curta, para o quarto continuar grande como na referência.
    framing: { focusBoxes: roomBoxes(), margin: 0.03 },
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
    // Cadeira inteira (encosto alto de ~1.35 m) com folga em cima e dos lados.
    framing: { focusBoxes: [around(LAYOUT.chair, [-0.55, 0, -0.55], [0.55, 1.7, 0.55])] },
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
    // A tela inteira (plano 1.3 x 0.73 perpendicular à câmera), sem painel. A margem de 12% por lado
    // reproduz os ~1.55 m de DESK_SCREEN_DISTANCE em 16:9 e deixa respirar a moldura do monitor.
    framing: { focusBoxes: [screenBox(LAYOUT.monitorMain)], margin: 0.12 },
    smoothTime: 0.9,
    userControl: false,
    limits: OPEN_LIMITS,
  },
  // Impressora no canto direito do fundo: macro pela frente/direita. Painel à direita -> impressora
  // à esquerda do centro.
  printer: {
    position: add(LAYOUT.printer, [2.4, 1.3, 3.6]),
    target: add(LAYOUT.printer, [0.5, 0.25, 0]),
    // Impressora e a parte útil da bancada (2.1 m de largura), do tampo -0.4 até +1.35 de folga em
    // cima; a parede do fundo é o limite em -Z.
    framing: { focusBoxes: [around(LAYOUT.printer, [-1.05, -0.4, -0.58], [1.05, 1.35, 0.55])] },
    smoothTime: 0.9,
    userControl: false,
    limits: OPEN_LIMITS,
  },
  // Zona de jogos, aba Tabuleiro: zoom nas prateleiras 2 e 3 da estante, a ~3 m da frente.
  // Painel à esquerda -> alvo deslocado para a esquerda, estante entre ~37% e ~93% da largura.
  // Afinado em 16:9; nos outros aspects o `framing` recalcula distância e deslocamento.
  shelf: {
    position: add(LAYOUT.shelf, [0.28, 1.42, 3.13]),
    target: add(LAYOUT.shelf, [-0.42, 1.25, 0.25]),
    // Prateleiras 2 e 3 (do topo da 1 ao topo da 3, ~0.66 a 2.0), na largura inteira da estante.
    framing: { focusBoxes: [around(LAYOUT.shelf, [-0.93, 0.66, -0.25], [0.93, 2.0, 0.25])] },
    smoothTime: 0.9,
    userControl: false,
    limits: OPEN_LIMITS,
  },
  // Zona de jogos, aba Digital: TV + rack com o console. Painel à DIREITA -> TV e rack entre ~21% e
  // ~57% da largura. A câmera vem da direita, em diagonal: de frente, a cadeira (que fica diante do
  // monitor) entra no caminho e cobre a ponta esquerda do rack.
  shelfDigital: {
    position: add(LAYOUT.rack.center, [2.4, 1.05, 3.435]),
    target: add(LAYOUT.rack.center, [0.55, 0.55, -0.05]),
    // Rack inteiro (piso ao tampo, com o console e as capinhas) mais a TV acima dele.
    framing: { focusBoxes: [rackAndTvBox()] },
    smoothTime: 0.9,
    userControl: false,
    limits: OPEN_LIMITS,
  },
}
