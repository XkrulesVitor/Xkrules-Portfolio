import { Box3, Vector3 } from 'three'

// Resolvedor de enquadramento (ARCHITECTURE §4, BACKLOG V.4). Módulo PURO: só `three` em runtime,
// sem React, sem `@/` e sem o store, para rodar em `node --test` (ver __tests__/framing.test.ts).
//
// Problema: dada a DIREÇÃO de olhar de um preset (do alvo para a câmera), uma caixa do mundo (o que
// o hotspot precisa mostrar), o aspect da viewport, o fov vertical e o painel DOM (que cobre uma
// faixa da tela), achar `position` e `target` que fazem a caixa caber inteira na área livre.

export type Vec3Tuple = readonly [number, number, number]
export type PanelSideKind = 'left' | 'right' | 'none'

/** Margem padrão (fração de cada dimensão da viewport, por lado) entre a caixa e a borda da área livre. */
export const DEFAULT_FRAMING_MARGIN = 0.06

/** Fração máxima da largura que o painel pode ocupar no cálculo (`w-[min(440px,92cqw)]`). */
export const MAX_PANEL_FRACTION = 0.92

/** A área livre nunca fica mais estreita que isto (em coordenadas NDC, onde a tela toda vale 2). */
const MIN_FREE_NDC = 0.2

export interface FramingInput {
  /** Direção do ALVO para a CÂMERA (position - target). Não precisa ser unitária. */
  direction: Vec3Tuple
  /**
   * Caixa do mundo que deve caber inteira na área livre. Aceita uma LISTA de caixas (união dos
   * cantos), para volumes que não são convexos, como o quarto em L (piso + duas paredes).
   */
  box: Box3 | readonly Box3[]
  /** Largura / altura da viewport. */
  aspect: number
  /** fov vertical, em graus. */
  fovDeg: number
  /** Fração da LARGURA da viewport coberta pelo painel (0 sem painel). */
  panelFraction: number
  panelSide: PanelSideKind
  /** Margem por lado, como fração da dimensão da viewport. Padrão: DEFAULT_FRAMING_MARGIN. */
  margin?: number
  /** Distância mínima câmera -> alvo. Padrão 0.3. */
  minDistance?: number
  /** Eixo "para cima" do mundo. Padrão +Y (o mesmo que o camera-controls usa). */
  up?: Vec3Tuple
}

export interface FramingResult {
  position: [number, number, number]
  target: [number, number, number]
  /** Distância câmera -> alvo. */
  distance: number
}

/** Retângulo em NDC (x e y em [-1, 1]) que a caixa pode ocupar. */
export interface FreeArea {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

/** Fração da largura que o painel ocupa: `min(panelPx, maxFraction * largura) / largura`. */
export function panelFractionOf(
  viewportWidth: number,
  panelPx: number,
  maxFraction = MAX_PANEL_FRACTION,
): number {
  if (!(viewportWidth > 0)) return 0
  return Math.min(panelPx, maxFraction * viewportWidth) / viewportWidth
}

/** Área livre em NDC: tela inteira menos a margem e menos o painel (do lado em que ele está). */
export function freeArea(
  panelFraction: number,
  panelSide: PanelSideKind,
  margin = DEFAULT_FRAMING_MARGIN,
): FreeArea {
  const m = 2 * Math.max(0, margin) // fração da dimensão -> NDC (tela toda = 2)
  const panel = panelSide === 'none' ? 0 : 2 * Math.min(Math.max(panelFraction, 0), MAX_PANEL_FRACTION)
  let xMin = -1 + m
  let xMax = 1 - m
  if (panelSide === 'left') xMin += panel
  if (panelSide === 'right') xMax -= panel
  if (xMax - xMin < MIN_FREE_NDC) {
    const mid = (xMin + xMax) / 2
    xMin = mid - MIN_FREE_NDC / 2
    xMax = mid + MIN_FREE_NDC / 2
  }
  return { xMin, xMax, yMin: -1 + m, yMax: 1 - m }
}

/** Direção unitária do alvo para a câmera, a partir de uma pose. */
export function directionFromPose(position: Vec3Tuple, target: Vec3Tuple): [number, number, number] {
  const x = position[0] - target[0]
  const y = position[1] - target[1]
  const z = position[2] - target[2]
  const len = Math.hypot(x, y, z) || 1
  return [x / len, y / len, z / len]
}

/** Caixa do mundo a partir de dois cantos (tuplas), para os presets não importarem `three`. */
export function boxFromCorners(min: Vec3Tuple, max: Vec3Tuple): Box3 {
  return new Box3(new Vector3(min[0], min[1], min[2]), new Vector3(max[0], max[1], max[2]))
}

// Objetos temporários do módulo: o resolvedor roda por voo, não por frame, mas assim também não aloca.
const vForward = new Vector3()
const vRight = new Vector3()
const vUp = new Vector3()
const vCenter = new Vector3()
const vRel = new Vector3()
const vBounds = new Box3()

/**
 * Resolve `position` e `target` que mantêm a direção de olhar e deixam a caixa inteira na área livre.
 *
 * Matemática (base da câmera: `f` = para onde ela olha, `r` = direita, `u` = cima; as coordenadas
 * de cada canto são relativas ao centro `c` da caixa, `(x, y, z)` em `(r, u, f)`; com várias caixas, `c` é o centro da caixa envolvente):
 *  1. Com a câmera em `c + sx*r + sy*u - D*f`, o canto i projeta em NDC `(x_i - sx) / ((z_i + D) * tanH)`
 *     (e `y` com `tanV`). Exigir que caiba em `[xMin, xMax]` dá um intervalo para `sx` que só é
 *     não vazio quando `D >= ((x_i - x_j)/tanH - xMax*z_i + xMin*z_j) / (xMax - xMin)` para todo par
 *     (i, j) de cantos; idem em `y`. A menor distância é o maior desses limites (e `D >= -z_i`).
 *  2. Com `D` fixo, `sx` e `sy` ficam no ponto médio dos seus intervalos: a caixa fica centrada na
 *     área livre na direção que sobra folga, e encostada na margem na que limita.
 *  3. `target = c + sx*r + sy*u` (o ponto do eixo de visão na profundidade do centro) e
 *     `position = target - f*D`: a direção de olhar não muda.
 */
export function resolveFraming(input: FramingInput): FramingResult {
  const aspect = Math.max(input.aspect, 0.1)
  const tanV = Math.tan((input.fovDeg * Math.PI) / 360)
  const tanH = tanV * aspect
  const area = freeArea(input.panelFraction, input.panelSide, input.margin)
  const minDistance = input.minDistance ?? 0.3

  // Base da câmera: f = -direction normalizado; r = f x up; u = r x f (mesma convenção do Matrix4.lookAt).
  vForward.set(...input.direction).negate()
  if (vForward.lengthSq() < 1e-12) vForward.set(0, 0, -1)
  vForward.normalize()
  vUp.set(...(input.up ?? [0, 1, 0]))
  vRight.crossVectors(vForward, vUp)
  if (vRight.lengthSq() === 0) {
    // Olhando exatamente ao longo do "up" (de cima ou de baixo): o `Matrix4.lookAt` do three
    // perturba o eixo em 1e-4 para desempatar; repetir isso mantém a base igual à da câmera real.
    if (Math.abs(vUp.z) === 1) vForward.x -= 0.0001
    else vForward.z -= 0.0001
    vForward.normalize()
    vRight.crossVectors(vForward, vUp)
  }
  vRight.normalize()
  vUp.crossVectors(vRight, vForward).normalize()

  // `vCenter` = centro da caixa envolvente de todas as caixas; os cantos são relativos a ele.
  const boxes = Array.isArray(input.box) ? (input.box as readonly Box3[]) : [input.box as Box3]
  vBounds.makeEmpty()
  for (const b of boxes) vBounds.union(b)
  vBounds.getCenter(vCenter)

  // Cantos de todas as caixas nas coordenadas da câmera. Os extremos de qualquer projeção em
  // perspectiva de um conjunto de caixas estão sempre nos cantos.
  const xs: number[] = []
  const ys: number[] = []
  const zs: number[] = []
  for (const { min, max } of boxes) {
    for (let i = 0; i < 8; i++) {
      vRel.set(i & 1 ? max.x : min.x, i & 2 ? max.y : min.y, i & 4 ? max.z : min.z).sub(vCenter)
      xs.push(vRel.dot(vRight))
      ys.push(vRel.dot(vUp))
      zs.push(vRel.dot(vForward))
    }
  }
  const n = xs.length

  const dx = area.xMax - area.xMin
  const dy = area.yMax - area.yMin
  let distance = minDistance
  for (let i = 0; i < n; i++) {
    distance = Math.max(distance, -zs[i] + 0.05) // nenhum canto atrás (ou colado) na câmera
    for (let j = 0; j < n; j++) {
      distance = Math.max(
        distance,
        ((xs[i] - xs[j]) / tanH - area.xMax * zs[i] + area.xMin * zs[j]) / dx,
        ((ys[i] - ys[j]) / tanV - area.yMax * zs[i] + area.yMin * zs[j]) / dy,
      )
    }
  }

  // Intervalo de `sx` / `sy` na distância escolhida e ponto médio.
  let sxLo = -Infinity
  let sxHi = Infinity
  let syLo = -Infinity
  let syHi = Infinity
  for (let i = 0; i < n; i++) {
    const depthX = tanH * (zs[i] + distance)
    const depthY = tanV * (zs[i] + distance)
    sxLo = Math.max(sxLo, xs[i] - area.xMax * depthX)
    sxHi = Math.min(sxHi, xs[i] - area.xMin * depthX)
    syLo = Math.max(syLo, ys[i] - area.yMax * depthY)
    syHi = Math.min(syHi, ys[i] - area.yMin * depthY)
  }
  // Se a distância mínima forçou algo (ou erro de ponto flutuante), o intervalo pode inverter de
  // leve: o ponto médio continua sendo a melhor escolha.
  const sx = (sxLo + sxHi) / 2
  const sy = (syLo + syHi) / 2

  const tx = vCenter.x + vRight.x * sx + vUp.x * sy
  const ty = vCenter.y + vRight.y * sx + vUp.y * sy
  const tz = vCenter.z + vRight.z * sx + vUp.z * sy
  return {
    position: [tx - vForward.x * distance, ty - vForward.y * distance, tz - vForward.z * distance],
    target: [tx, ty, tz],
    distance,
  }
}
