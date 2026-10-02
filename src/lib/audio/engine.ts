// Motor de áudio do quarto: Web Audio puro, sintetizado, sem arquivos de som e sem three/R3F
// (importável por `ui/**` e por `experience/**`). Mudo por padrão e só cria o AudioContext depois
// de um gesto do usuário (`unlock`, chamado pelo botão de som do HUD).
//
// Grafo:  voz -> (nível da voz) -> master -> destino.
// O master sobe e desce por RAMPA (`setTargetAtTime`): ligar e desligar o som nunca estala.
// Mudo por mais que SUSPEND_AFTER_MUTE_MS suspende o contexto (CPU/bateria); ligar o retoma.

import { createNoiseBuffer } from './noise'
import {
  AMBIENT_CUTOFF_HZ,
  MASTER_GAIN,
  MASTER_RAMP_S,
  SUSPEND_AFTER_MUTE_MS,
  VOICE_GAIN,
  ambientCutoffHz,
  clamp01,
} from './mix'
import {
  createAmbient,
  createFan,
  playKey,
  playMouse,
  playStatic,
  type KeyVariant,
  type LoopVoice,
  type MousePhase,
} from './voices'

interface WindowWithWebkit extends Window {
  webkitAudioContext?: typeof AudioContext
}

/** Constante de tempo (s) das rampas dos níveis das vozes: o JS já suaviza, aqui só tira os degraus. */
const LEVEL_RAMP_S = 0.06
/** Variação mínima de nível que vale reagendar (evita encher a linha do tempo do AudioParam). */
const LEVEL_EPSILON = 0.004
/** Dois disparos de estática mais próximos que isto (ms) viram um só. */
const STATIC_MIN_GAP_MS = 250

export interface AudioDebugState {
  /** O AudioContext existe (houve gesto do usuário). */
  unlocked: boolean
  /** `AudioContext.state`, ou `none` antes do gesto. */
  state: AudioContextState | 'none'
  muted: boolean
  /** Ganhos reais lidos dos nós (0 antes do gesto). */
  gains: { master: number; fan: number; ambient: number }
  /** Corte atual do passa-baixa do ambiente (Hz). */
  ambientCutoffHz: number
  /** Disparos pedidos e efetivamente tocados (mudo ou sem contexto não toca). */
  triggers: Record<'key' | 'mouse' | 'static', { requested: number; played: number }>
}

class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private white: AudioBuffer | null = null
  private fan: LoopVoice | null = null
  private ambient: LoopVoice | null = null
  /** Mudo desejado. Vale antes do contexto existir: `unlock` o aplica. Padrão: mudo. */
  private muted = true
  private fanApplied = 0
  private ambientApplied = 0
  private suspendTimer: ReturnType<typeof setTimeout> | null = null
  private lastStaticAt = -Infinity
  private readonly triggers: AudioDebugState['triggers'] = {
    key: { requested: 0, played: 0 },
    mouse: { requested: 0, played: 0 },
    static: { requested: 0, played: 0 },
  }

  /** O contexto existe (já houve um gesto do usuário). */
  get unlocked(): boolean {
    return this.ctx !== null
  }

  /** Há som saindo (contexto criado, ligado e rodando): o 3D só gasta frame com isto. */
  get audible(): boolean {
    return this.ctx !== null && !this.muted && this.ctx.state === 'running'
  }

  /**
   * Cria o AudioContext (e as vozes contínuas) e o retoma. PRECISA ser chamado dentro de um gesto do
   * usuário (clique/tecla), senão o browser o deixa suspenso. Idempotente. Devolve `false` se o
   * browser não tem Web Audio.
   */
  unlock(): boolean {
    if (typeof window === 'undefined') return false
    if (this.ctx) {
      void this.ctx.resume().catch(() => undefined)
      return true
    }
    const Ctor = window.AudioContext ?? (window as WindowWithWebkit).webkitAudioContext
    if (!Ctor) return false

    const ctx = new Ctor({ latencyHint: 'interactive' })
    const master = ctx.createGain()
    master.gain.value = 0 // sempre nasce mudo; `applyMuted` sobe por rampa se for o caso
    master.connect(ctx.destination)

    const white = createNoiseBuffer(ctx, 'white', 2)
    const brown = createNoiseBuffer(ctx, 'brown', 6)

    this.ctx = ctx
    this.master = master
    this.white = white
    this.fan = createFan(ctx, white, master)
    this.ambient = createAmbient(ctx, brown, master)
    this.fanApplied = 0
    this.ambientApplied = 0

    this.applyMuted()
    void ctx.resume().catch(() => undefined)
    return true
  }

  /** Liga/desliga o som. Sem contexto, só guarda a intenção (o `unlock` a aplica). */
  setMuted(muted: boolean): void {
    this.muted = muted
    this.applyMuted()
  }

  private applyMuted(): void {
    const { ctx, master } = this
    if (!ctx || !master) return
    if (this.suspendTimer !== null) {
      clearTimeout(this.suspendTimer)
      this.suspendTimer = null
    }
    const now = ctx.currentTime
    const target = this.muted ? 0 : MASTER_GAIN
    // Rampa a partir do valor corrente: sem salto, sem clique, em qualquer sentido.
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(master.gain.value, now)
    master.gain.setTargetAtTime(target, now, MASTER_RAMP_S)

    if (this.muted) {
      this.suspendTimer = setTimeout(() => {
        this.suspendTimer = null
        if (this.muted && ctx.state === 'running') void ctx.suspend().catch(() => undefined)
      }, SUSPEND_AFTER_MUTE_MS)
    } else if (ctx.state !== 'running') {
      void ctx.resume().catch(() => undefined)
    }
  }

  /** Volume (0..1) do zumbido da ventoinha. Barato de chamar por frame: só reagenda se mudou. */
  setFanLevel(level: number): void {
    const { ctx, fan } = this
    if (!ctx || !fan) return
    const v = clamp01(level)
    if (Math.abs(v - this.fanApplied) < LEVEL_EPSILON && !(v === 0 && this.fanApplied !== 0)) return
    this.fanApplied = v
    this.rampTo(fan.level.gain, v * VOICE_GAIN.fan, LEVEL_RAMP_S)
  }

  /** Volume (0..1) do ambiente; o corte do passa-baixa acompanha (mais abafado quando baixo). */
  setAmbientLevel(level: number): void {
    const { ctx, ambient } = this
    if (!ctx || !ambient) return
    const v = clamp01(level)
    if (Math.abs(v - this.ambientApplied) < LEVEL_EPSILON && !(v === 0 && this.ambientApplied !== 0)) return
    this.ambientApplied = v
    this.rampTo(ambient.level.gain, v * VOICE_GAIN.ambient, LEVEL_RAMP_S)
    this.rampTo(ambient.filter.frequency, ambientCutoffHz(v), 0.25)
  }

  private rampTo(param: AudioParam, value: number, timeConstant: number): void {
    const ctx = this.ctx
    if (!ctx) return
    const now = ctx.currentTime
    // `cancelScheduledValues` mantém a linha do tempo curta; o novo alvo continua da curva atual.
    param.cancelScheduledValues(now)
    param.setTargetAtTime(value, now, timeConstant)
  }

  /** Pode tocar disparos? (contexto pronto, ligado e rodando). Conta o pedido. */
  private canPlay(kind: 'key' | 'mouse' | 'static'): boolean {
    this.triggers[kind].requested++
    if (!this.audible) return false
    this.triggers[kind].played++
    return true
  }

  /** Clique de tecla (rajada curta, altura aleatória). `wide` = espaço/Enter. */
  keyClick(variant: KeyVariant = 'normal'): void {
    if (!this.canPlay('key') || !this.ctx || !this.master || !this.white) return
    playKey(this.ctx, this.white, this.master, this.ctx.currentTime, variant)
  }

  /** Clique de mouse: `down` ao apertar, `up` ao soltar. */
  mouseClick(phase: MousePhase): void {
    if (!this.canPlay('mouse') || !this.ctx || !this.master || !this.white) return
    playMouse(this.ctx, this.white, this.master, this.ctx.currentTime, phase)
  }

  /** Estática curta da TV. `volume` (0..1) vem da distância da câmera à TV. */
  tvStatic(volume = 1): void {
    this.triggers.static.requested++
    const now = performance.now()
    if (now - this.lastStaticAt < STATIC_MIN_GAP_MS) return
    if (!this.audible || !this.ctx || !this.master || !this.white) return
    this.lastStaticAt = now
    this.triggers.static.played++
    playStatic(this.ctx, this.white, this.master, this.ctx.currentTime, clamp01(volume))
  }

  /** Foto do estado para a verificação em dev (`window.__audio`). */
  getDebug(): AudioDebugState {
    return {
      unlocked: this.ctx !== null,
      state: this.ctx?.state ?? 'none',
      muted: this.muted,
      gains: {
        master: this.master?.gain.value ?? 0,
        fan: this.fan?.level.gain.value ?? 0,
        ambient: this.ambient?.level.gain.value ?? 0,
      },
      ambientCutoffHz: this.ambient?.filter.frequency.value ?? AMBIENT_CUTOFF_HZ.min,
      triggers: {
        key: { ...this.triggers.key },
        mouse: { ...this.triggers.mouse },
        static: { ...this.triggers.static },
      },
    }
  }
}

/** Único motor do app. Criá-lo não toca em `window` nem em AudioContext: seguro no SSR. */
export const audio = new AudioEngine()

export type { AudioEngine }
