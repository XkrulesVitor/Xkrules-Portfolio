import { CanvasTexture, SRGBColorSpace, type MeshBasicMaterial } from 'three'
import { SCREEN_OFF_COLOR } from '../../baked/roomNodes'

/**
 * Infra das telas vivas (BACKLOG V.3): um canvas 2D por tela, uma `CanvasTexture` e um
 * `MeshBasicMaterial` (o das telas do glb já é um; no grey-box o componente cria o dele).
 * Os desenhos rodam a no máximo `SCREEN_REFRESH_HZ` (nada de redesenhar todo frame) e a textura só
 * sobe para a GPU quando o mesh é desenhado (um mesh fora da câmera não paga o upload).
 */

/** Taxa máxima de atualização dos canvases (Hz). */
export const SCREEN_REFRESH_HZ = 15
const REFRESH_INTERVAL = 1 / SCREEN_REFRESH_HZ

/** Nível (multiplicador da cor) das telas "apagadas": a textura segue lá, quase preta. */
export const SCREEN_OFF_LEVEL = 0.03
/** De dia o sol lava as telas: elas ficam um pouco mais fracas (multiplicador, vs 1 à noite). */
export const SCREEN_DAY_LEVEL = 0.72

export interface CanvasScreen {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  texture: CanvasTexture
  width: number
  height: number
}

/**
 * Cria canvas + textura. A UV das telas do glb tem v = 0 no topo (glTF), então `flipY = false`: o
 * topo do canvas é o topo da tela. Os planos do grey-box (`PlaneGeometry`, v = 1 no topo) pedem
 * `flipY = true`. Devolve `null` se o navegador não der contexto 2D.
 */
export function createCanvasScreen(
  width: number,
  height: number,
  anisotropy: number,
  flipY = false,
): CanvasScreen | null {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const texture = new CanvasTexture(canvas)
  texture.flipY = flipY
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = anisotropy
  return { canvas, ctx, texture, width, height }
}

export function disposeCanvasScreen(screen: CanvasScreen): void {
  screen.texture.dispose()
}

/** Liga a textura ao material da tela (uma vez: o `map` novo recompila o programa). */
export function attachScreenMap(material: MeshBasicMaterial, screen: CanvasScreen): void {
  material.map = screen.texture
  material.color.setScalar(SCREEN_OFF_LEVEL)
  material.needsUpdate = true
}

/** Desfaz o `attachScreenMap`: a tela volta a ser o plano escuro do glb. */
export function detachScreenMap(material: MeshBasicMaterial): void {
  material.map = null
  material.color.set(SCREEN_OFF_COLOR)
  material.needsUpdate = true
}

/** Brilho da tela: multiplica a textura (a cor do material é só um escalar branco). */
export function setScreenLevel(material: MeshBasicMaterial, level: number): void {
  material.color.setScalar(level)
}

/** Marca a textura para reenviar à GPU depois de desenhar. */
export function markScreenDirty(screen: CanvasScreen): void {
  screen.texture.needsUpdate = true
}

/** Acumulador para limitar um desenho a `SCREEN_REFRESH_HZ`. */
export interface Throttle {
  accumulated: number
}

export function createThrottle(): Throttle {
  // Começa cheio: o primeiro frame já desenha.
  return { accumulated: REFRESH_INTERVAL }
}

/**
 * Soma `delta` e diz se já deu o intervalo; devolve o tempo (s) acumulado desde o último desenho
 * (para o desenho avançar a animação por tempo, não por frame) ou `0` se ainda não é hora.
 */
export function tickThrottle(throttle: Throttle, delta: number): number {
  throttle.accumulated += delta
  if (throttle.accumulated < REFRESH_INTERVAL) return 0
  const elapsed = throttle.accumulated
  throttle.accumulated = 0
  return elapsed
}

// Cores ----------------------------------------------------------------------------------------

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Mistura duas cores hex (`t` = 0 → a, 1 → b) e devolve `rgb(r, g, b)` para o canvas. */
export function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseHex(a)
  const [br, bg, bb] = parseHex(b)
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  return `rgb(${r}, ${g}, ${bl})`
}

/** Hex + alfa -> `rgba(...)`. */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = parseHex(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
