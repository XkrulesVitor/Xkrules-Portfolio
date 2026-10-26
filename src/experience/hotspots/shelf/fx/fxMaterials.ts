import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  DoubleSide,
  MeshBasicMaterial,
  MeshMatcapMaterial,
  SRGBColorSpace,
  SpriteMaterial,
  type Texture,
} from 'three'

/**
 * Materiais dos efeitos das caixas. O quarto é baked e NÃO tem luz dinâmica, então o que nasce em
 * runtime precisa parecer iluminado sem luz: `MeshMatcapMaterial` com um matcap gerado em canvas (a
 * luz vem "de cima à esquerda e da frente", como no resto do quarto) e `flatShading` para o visual
 * facetado do diorama. O tema entra pela cor do material (`applyTint`, lido de `nightMix`); o que
 * brilha (laser, motor, lanterna, lua) usa `MeshBasicMaterial`/`SpriteMaterial` com `toneMapped:
 * false` e cor acima de 1, para passar do limiar do Bloom.
 */

// ------------------------------------------------------------------------------------ matcap

const MATCAP_SIZE = 128
/** Direção da luz do matcap (espaço da vista): de cima, da esquerda e da frente. */
const LIGHT: readonly [number, number, number] = normalize3(-0.42, 0.62, 0.66)
const HALF: readonly [number, number, number] = normalize3(LIGHT[0], LIGHT[1], LIGHT[2] + 1)

function normalize3(x: number, y: number, z: number): [number, number, number] {
  const len = Math.hypot(x, y, z)
  return [x / len, y / len, z / len]
}

export type MatcapKind = 'soft' | 'glossy'

/**
 * Matcap sintético: esfera iluminada por uma luz principal, um preenchimento frio de baixo e um
 * contorno azulado. `soft` serve para casco, madeira e roupa; `glossy` tem brilho especular para o
 * vidro da cabine. Os bytes estão em sRGB (a textura é marcada como tal), então o piso de luz fica
 * em ~0.6 para a sombra não afundar no preto.
 */
export function createMatcapTexture(kind: MatcapKind): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = MATCAP_SIZE
  canvas.height = MATCAP_SIZE
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const image = ctx.createImageData(MATCAP_SIZE, MATCAP_SIZE)
    const glossy = kind === 'glossy'
    for (let py = 0; py < MATCAP_SIZE; py++) {
      for (let px = 0; px < MATCAP_SIZE; px++) {
        let nx = ((px + 0.5) / MATCAP_SIZE) * 2 - 1
        let ny = 1 - ((py + 0.5) / MATCAP_SIZE) * 2
        const r2 = nx * nx + ny * ny
        let nz = 0
        if (r2 >= 1) {
          const r = Math.sqrt(r2)
          nx /= r
          ny /= r
        } else {
          nz = Math.sqrt(1 - r2)
        }
        const diffuse = Math.max(nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2], 0)
        const fill = Math.max(0.55 * nx - 0.6 * ny + 0.3 * nz, 0)
        const rim = (1 - nz) ** 3
        let v = (glossy ? 0.4 : 0.56) + (glossy ? 0.42 : 0.4) * diffuse ** 0.85 + 0.05 * fill
        let r = v + rim * 0.04
        let g = v + rim * 0.06
        let b = v + rim * 0.14
        if (glossy) {
          const spec = Math.max(nx * HALF[0] + ny * HALF[1] + nz * HALF[2], 0) ** 36 * 0.85
          v = ny * 0.08
          r += spec + v
          g += spec + v
          b += spec + v
        }
        const i = (py * MATCAP_SIZE + px) * 4
        image.data[i] = Math.min(255, Math.max(0, r * 255))
        image.data[i + 1] = Math.min(255, Math.max(0, g * 255))
        image.data[i + 2] = Math.min(255, Math.max(0, b * 255))
        image.data[i + 3] = 255
      }
    }
    ctx.putImageData(image, 0, 0)
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

/** Material facetado com a cor vinda do vertex color (casco do caça, meeples, moldura da lanterna). */
export function createMatcapMaterial(matcap: Texture, vertexColors: boolean): MeshMatcapMaterial {
  return new MeshMatcapMaterial({ matcap, vertexColors, flatShading: true, fog: false })
}

// ---------------------------------------------------------------------------------------- tema

/** Multiplicador de cor de dia (neutro) e de noite (mais escuro e levemente arroxeado, como o quarto). */
const DAY_TINT = new Color(1, 1, 1)
const NIGHT_TINT = new Color(0.76, 0.7, 0.8)
const tint = new Color()

/** Cor do material = cor base x tema. `night`: 1 = noite, 0 = dia (`useRoomRegistry().nightMix.current`). */
export function applyTint(material: { color: Color }, base: Color, night: number): void {
  tint.lerpColors(DAY_TINT, NIGHT_TINT, night)
  material.color.copy(base).multiply(tint)
}

/** Escala de brilho dos emissivos: de dia o sol lava o brilho (`day`), à noite vale `night`. */
export function glowLevel(night: number, day: number, nightLevel: number): number {
  return day + (nightLevel - day) * night
}

// -------------------------------------------------------------------------------------- texturas

function canvasTexture(size: number, draw: (ctx: CanvasRenderingContext2D, size: number) => void): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) draw(ctx, size)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

/** Mancha radial branca que some nas bordas (brilho da lanterna e sombra de contato dos meeples). */
export function createGlowTexture(): CanvasTexture {
  return canvasTexture(64, (ctx, s) => {
    const gradient = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.35, 'rgba(255,255,255,0.55)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, s, s)
  })
}

/** Um "Z" de traço grosso e arredondado (sem fonte: desenhado como caminho). */
export function createZTexture(): CanvasTexture {
  return canvasTexture(64, (ctx, s) => {
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    const path = () => {
      ctx.beginPath()
      ctx.moveTo(s * 0.22, s * 0.24)
      ctx.lineTo(s * 0.78, s * 0.24)
      ctx.lineTo(s * 0.22, s * 0.76)
      ctx.lineTo(s * 0.78, s * 0.76)
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'
    ctx.lineWidth = s * 0.26
    path()
    ctx.stroke()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = s * 0.15
    path()
    ctx.stroke()
  })
}

/** Lua minguante: disco branco com um disco deslocado recortado, e um halo suave por trás. */
export function createMoonTexture(): CanvasTexture {
  return canvasTexture(128, (ctx, s) => {
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(s * 0.5, s * 0.5, s * 0.34, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(s * 0.62, s * 0.42, s * 0.29, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'destination-over'
    const halo = ctx.createRadialGradient(s / 2, s / 2, s * 0.2, s / 2, s / 2, s / 2)
    halo.addColorStop(0, 'rgba(255,255,255,0.32)')
    halo.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = halo
    ctx.fillRect(0, 0, s, s)
  })
}

// ------------------------------------------------------------------------------- fábricas simples

/** Brilho que soma luz (motor, rastro, halo do laser, brilho da lanterna). Sem profundidade. */
export function createAdditiveMaterial(color: Color, opacity: number): MeshBasicMaterial {
  return new MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: AdditiveBlending,
    depthWrite: false,
    side: DoubleSide,
    toneMapped: false,
    fog: false,
  })
}

/** Sprite que olha sempre para a câmera, sem escrever profundidade nem sofrer tone mapping. */
export function createSpriteMaterial(map: Texture, color: Color, additive = false): SpriteMaterial {
  const material = new SpriteMaterial({
    map,
    color,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false,
    fog: false,
  })
  if (additive) material.blending = AdditiveBlending
  return material
}
