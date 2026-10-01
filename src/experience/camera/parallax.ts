import { Vector3 } from 'three'

// Parallax do mouse nos hotspots (BACKLOG V.4), como a mesa de Henry Heffernan (REFERENCES:
// `DeskKeyframe`): a câmera se desloca um pouco na direção do ponteiro. Usa `setFocalOffset` (translação
// da câmera no plano da tela, sem girar), então o alvo e a pose do preset não mudam, e zerar o
// offset devolve a pose exata. NUNCA no `desk`: o SO do monitor precisa da tela parada.

/** Deslocamento máximo da câmera, em metros (módulo do vetor, ~4 cm). */
export const PARALLAX_MAX_OFFSET = 0.04
/** Constante de suavização (1/s): o offset cobre ~63% do caminho a cada 1/λ s. */
export const PARALLAX_LAMBDA = 3.5

/** Presets com parallax. `desk` fica de fora de propósito. */
const PARALLAX_KEYS: ReadonlySet<string> = new Set(['chair', 'printer', 'shelf', 'shelfDigital'])

export function hasParallax(presetKey: string | null): boolean {
  return presetKey !== null && PARALLAX_KEYS.has(presetKey)
}

/** Parte do `CameraControls` que o parallax usa (estrutural, para os testes usarem um falso). */
export interface ParallaxControls {
  setFocalOffset(x: number, y: number, z: number, enableTransition?: boolean): Promise<void>
  getFocalOffset(out: Vector3, receiveEndValue?: boolean): Vector3
}

const tmpOffset = new Vector3()

export class MouseParallax {
  /** Ponteiro normalizado: x para a direita e y para cima, ambos em [-1, 1]. */
  private pointerX = 0
  private pointerY = 0
  /** Offset suavizado atual (coordenadas da câmera, em metros). */
  private x = 0
  private y = 0
  private engaged = false

  /** Posição do ponteiro já normalizada (-1..1, y para cima). */
  setPointer(nx: number, ny: number): void {
    this.pointerX = Math.max(-1, Math.min(1, nx))
    this.pointerY = Math.max(-1, Math.min(1, ny))
  }

  /** Ponteiro saiu da janela: o alvo volta ao centro. */
  clearPointer(): void {
    this.pointerX = 0
    this.pointerY = 0
  }

  /**
   * Chamar todo frame. `active` = `focused` num preset com parallax, sem voo e sem
   * `prefers-reduced-motion`. Ao desativar, zera o offset com transição.
   */
  update(controls: ParallaxControls, dt: number, active: boolean): void {
    if (!active) {
      if (this.engaged) this.release(controls)
      return
    }
    if (!this.engaged) {
      // Parte do offset REAL (um release recente pode ainda estar voltando a zero): sem salto.
      controls.getFocalOffset(tmpOffset, false)
      this.x = tmpOffset.x
      this.y = tmpOffset.y
      this.engaged = true
    }
    // O módulo do alvo nunca passa de PARALLAX_MAX_OFFSET (o canto da tela vale 1, não 1.41).
    const len = Math.hypot(this.pointerX, this.pointerY)
    const k = len > 1 ? 1 / len : 1
    // O camera-controls aplica o offset em Y com o sinal invertido (a câmera sobe com y < 0).
    const targetX = this.pointerX * k * PARALLAX_MAX_OFFSET
    const targetY = -this.pointerY * k * PARALLAX_MAX_OFFSET
    const a = 1 - Math.exp(-dt * PARALLAX_LAMBDA)
    this.x += (targetX - this.x) * a
    this.y += (targetY - this.y) * a
    void controls.setFocalOffset(this.x, this.y, 0, false)
  }

  /** Zera o offset (`setFocalOffset(0, 0, 0, true)`): começo de qualquer voo e saída do foco. */
  release(controls: ParallaxControls): void {
    this.engaged = false
    this.x = 0
    this.y = 0
    void controls.setFocalOffset(0, 0, 0, true)
  }
}
