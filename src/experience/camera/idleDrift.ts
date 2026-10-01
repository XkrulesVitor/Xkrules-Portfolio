// Deriva ociosa da câmera em HOME (BACKLOG V.4), no espírito do idle da Henry Heffernan
// (REFERENCES: `Camera/CameraKeyframes.ts`, IdleKeyframe). Depois de IDLE_DELAY_S sem input, a
// câmera balança bem devagar em torno da pose em que estiver.
//
// Aplicada como DELTAS com `rotate(..., false)` (nunca `setLookAt`): a pose do usuário é sempre a
// base e nenhum erro se acumula. O módulo guarda só o que JÁ aplicou, então o balanço sempre
// devolve a câmera ao ponto de partida a cada período. Sem `three` nem React: roda em `node --test`.

/** Segundos sem input do usuário antes de a deriva começar. */
export const IDLE_DELAY_S = 3
/** Amplitude do azimute e da polar, em radianos (±1.5° e ±0.8°). */
export const DRIFT_AZIMUTH_RAD = (1.5 * Math.PI) / 180
export const DRIFT_POLAR_RAD = (0.8 * Math.PI) / 180
/** Períodos (12 a 20 s). Diferentes entre si, o caminho vira um 8 suave em vez de uma linha. */
export const DRIFT_PERIOD_AZIMUTH_S = 18
export const DRIFT_PERIOD_POLAR_S = 13
/** A amplitude sobe de 0 ao valor cheio neste tempo, para a deriva não "arrancar". */
export const DRIFT_RAMP_S = 3

/** Parte do `CameraControls` que a deriva usa (estrutural, para os testes usarem um falso). */
export interface DriftControls {
  rotate(azimuthAngle: number, polarAngle: number, enableTransition?: boolean): Promise<void>
  readonly azimuthAngle: number
  readonly polarAngle: number
}

const TWO_PI = Math.PI * 2

export class IdleDrift {
  /** Segundos sem input. */
  private quiet = 0
  /** Segundos desde que a deriva começou. */
  private t = 0
  private appliedAzimuth = 0
  private appliedPolar = 0

  /**
   * Input do usuário (arrasto, roda, toque): pausa a deriva e volta a contar. O que já foi aplicado
   * fica (a pose atual vira a nova base): não há "volta" brusca ao ponto antigo.
   */
  noteInput(): void {
    this.quiet = 0
    this.t = 0
    this.appliedAzimuth = 0
    this.appliedPolar = 0
  }

  /** Há deriva em andamento (já passou o tempo ocioso)? */
  get running(): boolean {
    return this.quiet >= IDLE_DELAY_S
  }

  /**
   * Chamar todo frame. `eligible` = modo `idle` em HOME, sem voo e sem `prefers-reduced-motion`;
   * quando falso, zera a contagem (sair e voltar ao idle conta os 3 s de novo).
   */
  update(controls: DriftControls, dt: number, eligible: boolean): void {
    if (!eligible) {
      this.noteInput()
      return
    }
    this.quiet += dt
    if (this.quiet < IDLE_DELAY_S) return

    this.t += dt
    const x = Math.min(1, this.t / DRIFT_RAMP_S)
    const ramp = x * x * (3 - 2 * x) // smoothstep
    const wantAzimuth =
      DRIFT_AZIMUTH_RAD * ramp * Math.sin((TWO_PI * this.t) / DRIFT_PERIOD_AZIMUTH_S)
    const wantPolar = DRIFT_POLAR_RAD * ramp * Math.sin((TWO_PI * this.t) / DRIFT_PERIOD_POLAR_S)

    const azimuth0 = controls.azimuthAngle
    const polar0 = controls.polarAngle
    void controls.rotate(wantAzimuth - this.appliedAzimuth, wantPolar - this.appliedPolar, false)
    // Soma o que realmente andou: os limites de órbita podem ter cortado parte do delta.
    this.appliedAzimuth += controls.azimuthAngle - azimuth0
    this.appliedPolar += controls.polarAngle - polar0
  }
}
