import { SCREEN_TEXT } from '@/content/screens'
import { mixHex, withAlpha } from './canvasScreen'

/**
 * Desenhos da TV da zona de jogos (ARCHITECTURE §6.5): logo quicando (ociosa), estática retrô (hover
 * da zona) e tela de título tingida pelo jogo destacado (`focused` + `shelf` + vista `digital`).
 * Todos sobre um overlay de "tubo" (scanlines + vinheta) criado uma vez.
 */

export const TV_WIDTH = 1024
export const TV_HEIGHT = 576

const BG_DEEP = '#04060d'
const BG_MID = '#0a1124'
const MINT = '#7ff5d0'
const BLUE = '#6aa8ff'
const FONT_SANS = 'system-ui, "Segoe UI", -apple-system, sans-serif'
/** Cores do logo a cada quique (as do SO e da fita da TV). */
const LOGO_COLORS = [MINT, BLUE, '#ff7ab0', '#f2c14e', '#b583ff'] as const

const LOGO_W = 372
const LOGO_H = 96
const LOGO_SPEED_X = 150
const LOGO_SPEED_Y = 98

/** Cor padrão da tela de título sem jogo destacado. */
export const NEUTRAL_ACCENT = BLUE

// Overlay do tubo ------------------------------------------------------------------------------

/** Scanlines + vinheta num canvas à parte (copiado por cima de cada quadro). */
export function createTubeOverlay(width: number, height: number): HTMLCanvasElement | null {
  const overlay = document.createElement('canvas')
  overlay.width = width
  overlay.height = height
  const ctx = overlay.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
  for (let y = 0; y < height; y += 4) ctx.fillRect(0, y, width, 1.5)
  const vignette = ctx.createRadialGradient(width / 2, height / 2, height * 0.35, width / 2, height / 2, width * 0.62)
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, width, height)
  return overlay
}

// Estática -------------------------------------------------------------------------------------

export interface NoiseBuffer {
  canvas: HTMLCanvasElement
  image: ImageData
}

/** Buffer pequeno de ruído (ampliado sem suavização: grão grosso de TV de tubo). */
export function createNoiseBuffer(): NoiseBuffer | null {
  const canvas = document.createElement('canvas')
  canvas.width = 192
  canvas.height = 108
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  return { canvas, image: ctx.createImageData(canvas.width, canvas.height) }
}

/** Estática retrô: ruído em cinza azulado + faixa clara descendo (rolagem vertical) + sinal chiando. */
export function paintStatic(
  ctx: CanvasRenderingContext2D,
  noise: NoiseBuffer,
  overlay: HTMLCanvasElement | null,
  time: number,
): void {
  const data = noise.image.data
  for (let i = 0; i < data.length; i += 4) {
    // Teto de ~200/255: a estática não deve estourar o Bloom do quarto.
    const v = 34 + Math.random() * 166
    data[i] = v * 0.92
    data[i + 1] = v * 0.97
    data[i + 2] = v
    data[i + 3] = 255
  }
  const nctx = noise.canvas.getContext('2d')
  if (nctx) nctx.putImageData(noise.image, 0, 0)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(noise.canvas, 0, 0, TV_WIDTH, TV_HEIGHT)
  ctx.imageSmoothingEnabled = true

  // Faixa de rolagem.
  const bandH = 110
  const y = ((time * 0.45) % 1.3) * (TV_HEIGHT + bandH) - bandH
  const band = ctx.createLinearGradient(0, y, 0, y + bandH)
  band.addColorStop(0, 'rgba(255, 255, 255, 0)')
  band.addColorStop(0.5, 'rgba(255, 255, 255, 0.16)')
  band.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = band
  ctx.fillRect(0, y, TV_WIDTH, bandH)

  ctx.fillStyle = withAlpha(BLUE, 0.07)
  ctx.fillRect(0, 0, TV_WIDTH, TV_HEIGHT)
  if (overlay) ctx.drawImage(overlay, 0, 0)
}

// Logo quicando --------------------------------------------------------------------------------

export interface LogoState {
  x: number
  y: number
  vx: number
  vy: number
  colorIndex: number
}

export function createLogoState(): LogoState {
  return { x: 140, y: 90, vx: LOGO_SPEED_X, vy: LOGO_SPEED_Y, colorIndex: 0 }
}

/** Logo parado no centro (reduced-motion). */
export function createCenteredLogoState(): LogoState {
  return { x: (TV_WIDTH - LOGO_W) / 2, y: (TV_HEIGHT - LOGO_H) / 2, vx: 0, vy: 0, colorIndex: 0 }
}

/** Avança o logo (por tempo, não por frame) e troca a cor a cada quique. */
export function stepLogo(logo: LogoState, dt: number): void {
  logo.x += logo.vx * dt
  logo.y += logo.vy * dt
  let bounced = false
  if (logo.x < 0) {
    logo.x = 0
    logo.vx = Math.abs(logo.vx)
    bounced = true
  } else if (logo.x > TV_WIDTH - LOGO_W) {
    logo.x = TV_WIDTH - LOGO_W
    logo.vx = -Math.abs(logo.vx)
    bounced = true
  }
  if (logo.y < 0) {
    logo.y = 0
    logo.vy = Math.abs(logo.vy)
    bounced = true
  } else if (logo.y > TV_HEIGHT - LOGO_H) {
    logo.y = TV_HEIGHT - LOGO_H
    logo.vy = -Math.abs(logo.vy)
    bounced = true
  }
  if (bounced) logo.colorIndex = (logo.colorIndex + 1) % LOGO_COLORS.length
}

function setLetterSpacing(ctx: CanvasRenderingContext2D, px: number) {
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${px}px`
}

export function paintLogo(ctx: CanvasRenderingContext2D, logo: LogoState, overlay: HTMLCanvasElement | null): void {
  const bg = ctx.createLinearGradient(0, 0, 0, TV_HEIGHT)
  bg.addColorStop(0, BG_MID)
  bg.addColorStop(1, BG_DEEP)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, TV_WIDTH, TV_HEIGHT)

  const color = LOGO_COLORS[logo.colorIndex]
  ctx.save()
  ctx.shadowColor = withAlpha(color, 0.7)
  ctx.shadowBlur = 28
  ctx.strokeStyle = color
  ctx.lineWidth = 5
  ctx.fillStyle = withAlpha(color, 0.14)
  ctx.beginPath()
  ctx.roundRect(logo.x, logo.y, LOGO_W, LOGO_H, 22)
  ctx.fill()
  ctx.stroke()
  ctx.shadowBlur = 0
  ctx.fillStyle = color
  ctx.font = `800 58px ${FONT_SANS}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  setLetterSpacing(ctx, 7)
  ctx.fillText(SCREEN_TEXT.tv.logo, logo.x + LOGO_W / 2 + 3, logo.y + LOGO_H / 2 + 3)
  setLetterSpacing(ctx, 0)
  ctx.restore()

  if (overlay) ctx.drawImage(overlay, 0, 0)
}

// Tela de título -------------------------------------------------------------------------------

export interface TitleScreen {
  title: string
  subtitle: string
  /** Cor de destaque do jogo (hex). */
  accent: string
  /** `PRESS START` só aparece com um jogo destacado. */
  showStart: boolean
}

/** Tamanho de fonte (px) que faz `text` caber em `maxWidth`, até `maxPx`. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, weight: number, maxPx: number, maxWidth: number): number {
  ctx.font = `${weight} 100px ${FONT_SANS}`
  const natural = ctx.measureText(text).width
  return Math.max(24, Math.min(maxPx, (100 * maxWidth) / Math.max(natural, 1)))
}

export function paintTitle(
  ctx: CanvasRenderingContext2D,
  screen: TitleScreen,
  overlay: HTMLCanvasElement | null,
  time: number,
  animated: boolean,
): void {
  const { accent } = screen
  const cx = TV_WIDTH / 2
  const bg = ctx.createLinearGradient(0, 0, 0, TV_HEIGHT)
  bg.addColorStop(0, mixHex(accent, BG_DEEP, 0.8))
  bg.addColorStop(1, BG_DEEP)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, TV_WIDTH, TV_HEIGHT)

  const glow = ctx.createRadialGradient(cx, TV_HEIGHT * 0.46, 10, cx, TV_HEIGHT * 0.46, TV_WIDTH * 0.52)
  glow.addColorStop(0, withAlpha(accent, 0.34))
  glow.addColorStop(1, withAlpha(accent, 0))
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, TV_WIDTH, TV_HEIGHT)

  // Anéis de "arcade" atrás do título.
  ctx.lineWidth = 3
  for (const [r, a] of [[210, 0.28], [262, 0.14], [318, 0.07]] as const) {
    ctx.strokeStyle = withAlpha(accent, a)
    ctx.beginPath()
    ctx.arc(cx, TV_HEIGHT * 0.46, r, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Cantos: logo da casa e jogador.
  ctx.textBaseline = 'alphabetic'
  ctx.font = `700 24px ${FONT_SANS}`
  setLetterSpacing(ctx, 5)
  ctx.fillStyle = withAlpha('#ffffff', 0.55)
  ctx.textAlign = 'left'
  ctx.fillText(SCREEN_TEXT.tv.logo, 40, 58)
  ctx.textAlign = 'right'
  ctx.fillText(SCREEN_TEXT.tv.player, TV_WIDTH - 40, 58)
  setLetterSpacing(ctx, 0)

  // Título (cabe em 880 px) com brilho do jogo.
  const titleText = screen.title.toUpperCase()
  const titlePx = fitFont(ctx, titleText, 800, 104, 860)
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `800 ${titlePx}px ${FONT_SANS}`
  ctx.shadowColor = withAlpha(accent, 0.85)
  ctx.shadowBlur = 40
  ctx.fillStyle = mixHex(accent, '#ffffff', 0.62)
  ctx.fillText(titleText, cx, TV_HEIGHT * 0.44)
  ctx.restore()

  // Subtítulo.
  const subtitlePx = fitFont(ctx, screen.subtitle, 500, 30, 760)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `500 ${subtitlePx}px ${FONT_SANS}`
  ctx.fillStyle = mixHex(accent, '#ffffff', 0.35)
  ctx.fillText(screen.subtitle, cx, TV_HEIGHT * 0.44 + titlePx * 0.62 + 18)

  // PRESS START piscando (aceso fixo sem animação).
  if (screen.showStart) {
    const on = !animated || Math.floor(time * 2.6) % 2 === 0
    if (on) {
      ctx.font = `700 30px ${FONT_SANS}`
      setLetterSpacing(ctx, 9)
      ctx.fillStyle = withAlpha('#ffffff', 0.92)
      ctx.fillText(SCREEN_TEXT.tv.pressStart, cx + 4, TV_HEIGHT * 0.84)
      setLetterSpacing(ctx, 0)
    }
  }

  if (overlay) ctx.drawImage(overlay, 0, 0)
}
