import { SCREEN_TEXT } from '@/content/screens'
import { withAlpha } from './canvasScreen'

/**
 * Papel de parede do monitor horizontal fora de foco, no estilo do XKrules OS (`ui/os/Desktop.module.css`):
 * mesmas cores, os dois brilhos radiais (menta no canto superior esquerdo, azul no inferior direito), a
 * grade que some nas bordas e os anéis de radar à direita. Desenha por cima uma barra de tarefas e os
 * atalhos, para a tela parecer o SO desligado de perto. A camada estática é desenhada UMA vez num canvas
 * à parte; a cada minuto só o relógio é refeito.
 */

/** Largura de referência do SO em px de design (`OS_SCREEN_SIZE`). */
const DESIGN_WIDTH = 1280

const INK_TOP = '#0d1530'
const INK_MID = '#0b1020'
const INK_BOTTOM = '#070b17'
const MINT = '#7ff5d0'
const BLUE = '#6aa8ff'
const TEXT = '#e8ecff'
const ICON_ACCENTS = [BLUE, '#9bb4ff', MINT, '#b583ff', '#f78fd0'] as const

const FONT_SANS = 'system-ui, "Segoe UI", -apple-system, sans-serif'

/** Brilho radial elíptico (como o `radial-gradient(rx ry at x y, cor, transparent)` do CSS). */
function radialGlow(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rx: number,
  ry: number,
  cx: number,
  cy: number,
  color: string,
  alpha: number,
  stop: number,
) {
  ctx.save()
  ctx.translate(cx * w, cy * h)
  ctx.scale(rx * w, ry * h)
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
  g.addColorStop(0, withAlpha(color, alpha))
  g.addColorStop(stop, withAlpha(color, 0))
  ctx.fillStyle = g
  ctx.fillRect(-2, -2, 4, 4)
  ctx.restore()
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

/** Fundo + grade + anéis + atalhos + marca. Tudo o que não muda com a hora. */
export function createWallpaperBase(width: number, height: number): HTMLCanvasElement | null {
  const base = document.createElement('canvas')
  base.width = width
  base.height = height
  const ctx = base.getContext('2d')
  if (!ctx) return null
  const k = width / DESIGN_WIDTH

  // Fundo: gradiente a 165deg.
  const angle = (165 * Math.PI) / 180
  const dx = Math.sin(angle)
  const dy = -Math.cos(angle)
  const len = Math.abs(width * dx) + Math.abs(height * dy)
  const gradient = ctx.createLinearGradient(
    width / 2 - (dx * len) / 2,
    height / 2 - (dy * len) / 2,
    width / 2 + (dx * len) / 2,
    height / 2 + (dy * len) / 2,
  )
  gradient.addColorStop(0, INK_TOP)
  gradient.addColorStop(0.48, INK_MID)
  gradient.addColorStop(1, INK_BOTTOM)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // Os três brilhos radiais do wallpaper do SO.
  radialGlow(ctx, width, height, 0.7, 0.9, 0.62, 0.42, '#1e2c5c', 0.55, 0.72)
  radialGlow(ctx, width, height, 0.52, 0.62, 0.14, 0.06, MINT, 0.17, 0.68)
  radialGlow(ctx, width, height, 0.48, 0.6, 0.94, 0.92, BLUE, 0.22, 0.66)

  // Grade (64 px de design) com máscara radial: some nas bordas.
  const grid = document.createElement('canvas')
  grid.width = width
  grid.height = height
  const gctx = grid.getContext('2d')
  if (gctx) {
    const step = 64 * k
    gctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    gctx.lineWidth = Math.max(1, k)
    gctx.beginPath()
    for (let x = (width / 2) % step; x < width; x += step) {
      gctx.moveTo(Math.round(x) + 0.5, 0)
      gctx.lineTo(Math.round(x) + 0.5, height)
    }
    for (let y = (height / 2) % step; y < height; y += step) {
      gctx.moveTo(0, Math.round(y) + 0.5)
      gctx.lineTo(width, Math.round(y) + 0.5)
    }
    gctx.stroke()
    gctx.globalCompositeOperation = 'destination-in'
    gctx.save()
    gctx.translate(0.55 * width, 0.45 * height)
    gctx.scale(0.75 * width, 0.85 * height)
    const mask = gctx.createRadialGradient(0, 0, 0, 0, 0, 1)
    mask.addColorStop(0.15, 'rgba(0, 0, 0, 1)')
    mask.addColorStop(0.75, 'rgba(0, 0, 0, 0)')
    gctx.fillStyle = mask
    gctx.fillRect(-2, -2, 4, 4)
    gctx.restore()
    ctx.drawImage(grid, 0, 0)
  }

  // Anéis de radar à direita, esmaecendo para fora.
  const ringCx = 0.8 * width
  const ringCy = 0.58 * height
  const ringReach = 0.46 * width
  ctx.lineWidth = Math.max(1, k)
  for (let r = 58 * k; r < ringReach; r += 58 * k) {
    ctx.strokeStyle = withAlpha(BLUE, 0.1 * (1 - r / ringReach))
    ctx.beginPath()
    ctx.arc(ringCx, ringCy, r, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Atalhos decorativos (coluna da esquerda).
  const iconSize = 46 * k
  const cell = 86 * k
  SCREEN_TEXT.wallpaper.icons.forEach((label, i) => {
    const x = 28 * k
    const y = 28 * k + i * cell
    const accent = ICON_ACCENTS[i % ICON_ACCENTS.length]
    const g = ctx.createLinearGradient(x, y, x + iconSize, y + iconSize)
    g.addColorStop(0, withAlpha(accent, 0.95))
    g.addColorStop(1, withAlpha(accent, 0.45))
    ctx.fillStyle = g
    roundRect(ctx, x, y, iconSize, iconSize, 11 * k)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)'
    ctx.lineWidth = Math.max(1, k)
    ctx.stroke()
    ctx.fillStyle = TEXT
    ctx.font = `${Math.round(12 * k * 1.1)}px ${FONT_SANS}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(label, x - 2 * k, y + iconSize + 7 * k, 90 * k)
  })

  // Marca no centro.
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.shadowColor = withAlpha(MINT, 0.35)
  ctx.shadowBlur = 28 * k
  ctx.fillStyle = TEXT
  ctx.font = `700 ${Math.round(64 * k)}px ${FONT_SANS}`
  ctx.fillText(SCREEN_TEXT.wallpaper.brand, 0.54 * width, 0.47 * height)
  ctx.shadowBlur = 0
  ctx.fillStyle = withAlpha(BLUE, 0.9)
  ctx.font = `500 ${Math.round(22 * k)}px ${FONT_SANS}`
  ctx.fillText(SCREEN_TEXT.wallpaper.tagline.toUpperCase(), 0.54 * width, 0.47 * height + 40 * k)

  return base
}

/** Barra de tarefas com o relógio. Chamado ao menos uma vez por minuto. */
function paintTaskbar(ctx: CanvasRenderingContext2D, width: number, height: number, now: Date) {
  const k = width / DESIGN_WIDTH
  const barH = 44 * k
  const y = height - barH
  ctx.fillStyle = 'rgba(8, 12, 28, 0.9)'
  ctx.fillRect(0, y, width, barH)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.09)'
  ctx.fillRect(0, y, width, Math.max(1, k))

  // Botão iniciar.
  ctx.fillStyle = withAlpha(MINT, 0.16)
  roundRect(ctx, 8 * k, y + 6 * k, 108 * k, barH - 12 * k, 8 * k)
  ctx.fill()
  ctx.strokeStyle = withAlpha(MINT, 0.5)
  ctx.lineWidth = Math.max(1, k)
  ctx.stroke()
  ctx.fillStyle = MINT
  ctx.beginPath()
  ctx.arc(26 * k, y + barH / 2, 5 * k, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = TEXT
  ctx.font = `600 ${Math.round(15 * k)}px ${FONT_SANS}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(SCREEN_TEXT.wallpaper.start, 40 * k, y + barH / 2 + k)

  // Relógio.
  const time = now.toLocaleTimeString(SCREEN_TEXT.wallpaper.clockLocale, { hour: '2-digit', minute: '2-digit' })
  ctx.textAlign = 'right'
  ctx.font = `600 ${Math.round(16 * k)}px ${FONT_SANS}`
  ctx.fillText(time, width - 16 * k, y + barH / 2 + k)
}

/** Desenha o wallpaper completo (camada estática + barra com a hora de `now`). */
export function paintWallpaper(screen: { ctx: CanvasRenderingContext2D; width: number; height: number }, base: HTMLCanvasElement, now: Date) {
  const { ctx, width, height } = screen
  ctx.drawImage(base, 0, 0)
  paintTaskbar(ctx, width, height, now)
}
