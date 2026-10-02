// Vozes sintetizadas (Web Audio puro, nenhum arquivo de som). Cada construtor recebe um
// `BaseAudioContext`, então as mesmas vozes tocam no AudioContext real e no OfflineAudioContext
// usado para medir o nível (`measure.ts`, só em dev).
//
// Dois tipos de voz:
// - laços contínuos (ventoinha, ambiente): ruído em loop por filtros; o `level` é o ganho final,
//   ajustado de fora (engine) conforme a distância da câmera;
// - disparos curtos (teclado, mouse, estática): nascem, tocam um envelope e se desligam sozinhos.

import { VOICE_GAIN, pitchRatio } from './mix'

export interface LoopVoice {
  /** Ganho final da voz (já em unidades de `VOICE_GAIN`); o engine o move por rampa. */
  level: GainNode
  /** Passa-baixa final: o engine ajusta o corte do ambiente por aqui. */
  filter: BiquadFilterNode
  stop(): void
}

const SILENCE = 0.0001 // `exponentialRampToValueAtTime` não aceita 0

/** Envelope percussivo: sobe linear até `peak` em `attack` e cai exponencial em `decay`. */
function percussive(param: AudioParam, when: number, peak: number, attack: number, decay: number): void {
  param.setValueAtTime(SILENCE, when)
  param.linearRampToValueAtTime(peak, when + attack)
  param.exponentialRampToValueAtTime(SILENCE, when + attack + decay)
}

/** Liga o nó `source` até `out` passando pelos nós intermediários, na ordem. */
function chain(source: AudioNode, ...rest: AudioNode[]): void {
  let previous: AudioNode = source
  for (const node of rest) {
    previous.connect(node)
    previous = node
  }
}

/** Fonte de ruído em loop (quem a inicia escolhe um ponto aleatório: duas instâncias não soam em fase). */
function loopingNoise(ctx: BaseAudioContext, buffer: AudioBuffer): AudioBufferSourceNode {
  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.loop = true
  return src
}

/** LFO senoidal que soma `depth` (na unidade do parâmetro) a `target`, a `hz`. */
function lfo(ctx: BaseAudioContext, target: AudioParam, hz: number, depth: number): OscillatorNode {
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = hz
  const amount = ctx.createGain()
  amount.gain.value = depth
  osc.connect(amount)
  amount.connect(target)
  return osc
}

/**
 * Zumbido da ventoinha do PC: sopro grave (ruído branco por passa-faixa ~240 Hz e passa-baixa) mais
 * um tom de motor (seno ~94 Hz). Leve modulação: um LFO lento mexe no centro do filtro (o sopro
 * "respira") e outro, mais lento ainda, na amplitude (±7%).
 */
export function createFan(ctx: BaseAudioContext, white: AudioBuffer, out: AudioNode): LoopVoice {
  const level = ctx.createGain()
  level.gain.value = 0
  level.connect(out)

  const swell = ctx.createGain() // alvo do LFO de amplitude (base 1)
  swell.gain.value = 1

  const noise = loopingNoise(ctx, white)
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 240
  band.Q.value = 0.7
  const smooth = ctx.createBiquadFilter()
  smooth.type = 'lowpass'
  smooth.frequency.value = 900
  smooth.Q.value = 0.5
  chain(noise, band, smooth, swell)

  const motor = ctx.createOscillator()
  motor.type = 'sine'
  motor.frequency.value = 94
  const motorGain = ctx.createGain()
  motorGain.gain.value = 0.1
  chain(motor, motorGain, swell)

  swell.connect(level)

  const filterLfo = lfo(ctx, band.frequency, 0.31, 40)
  const swellLfo = lfo(ctx, swell.gain, 0.13, 0.07)

  noise.start(0, Math.random() * Math.max(0, white.duration - 0.05))
  const oscillators = [motor, filterLfo, swellLfo]
  for (const osc of oscillators) osc.start(0)

  return {
    level,
    filter: smooth,
    stop() {
      noise.stop()
      for (const osc of oscillators) osc.stop()
      level.disconnect()
    },
  }
}

/**
 * Ambiente noturno: ruído marrom muito filtrado (passa-baixa ~400 Hz e passa-alta a 40 Hz para tirar
 * o "peso" inaudível), com o corte oscilando bem devagar (±70 Hz, 22 s por ciclo): um "ar do quarto"
 * que nunca se repete de forma evidente.
 */
export function createAmbient(ctx: BaseAudioContext, brown: AudioBuffer, out: AudioNode): LoopVoice {
  const level = ctx.createGain()
  level.gain.value = 0
  level.connect(out)

  const noise = loopingNoise(ctx, brown)
  const low = ctx.createBiquadFilter()
  low.type = 'lowpass'
  low.frequency.value = 400
  low.Q.value = 0.4
  const high = ctx.createBiquadFilter()
  high.type = 'highpass'
  high.frequency.value = 40
  chain(noise, low, high, level)

  const drift = lfo(ctx, low.frequency, 0.045, 70)

  noise.start(0, Math.random() * Math.max(0, brown.duration - 0.05))
  drift.start(0)

  return {
    level,
    filter: low,
    stop() {
      noise.stop()
      drift.stop()
      level.disconnect()
    },
  }
}

/** Para a fonte em `until` e, quando ela termina, desconecta a cadeia (libera os nós do disparo). */
function scheduleDispose(source: AudioScheduledSourceNode, nodes: AudioNode[], until: number): void {
  source.stop(until)
  source.onended = () => {
    for (const node of nodes) node.disconnect()
  }
}

/** Pedaço curto de ruído branco filtrado por um passa-faixa, com envelope percussivo. */
function noiseTick(
  ctx: BaseAudioContext,
  white: AudioBuffer,
  out: AudioNode,
  when: number,
  tick: { hz: number; q: number; peak: number; attack: number; decay: number; rate: number },
): void {
  const src = ctx.createBufferSource()
  src.buffer = white
  src.playbackRate.value = tick.rate
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = tick.hz
  band.Q.value = tick.q
  const env = ctx.createGain()
  percussive(env.gain, when, tick.peak, tick.attack, tick.decay)
  chain(src, band, env, out)
  src.start(when, Math.random() * Math.max(0, white.duration - 0.2))
  scheduleDispose(src, [src, band, env], when + tick.attack + tick.decay + 0.03)
}

/** "Baque" grave de uma tecla/botão: seno que desce de `from` para `to` Hz. */
function thock(
  ctx: BaseAudioContext,
  out: AudioNode,
  when: number,
  thud: { from: number; to: number; peak: number; decay: number },
): void {
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(thud.from, when)
  osc.frequency.exponentialRampToValueAtTime(thud.to, when + thud.decay)
  const env = ctx.createGain()
  percussive(env.gain, when, thud.peak, 0.002, thud.decay)
  chain(osc, env, out)
  osc.start(when)
  scheduleDispose(osc, [osc, env], when + thud.decay + 0.03)
}

export type KeyVariant = 'normal' | 'wide'

/**
 * Clique de tecla: um "tic" de ruído em banda (~3.2 kHz) mais um baque grave curto. A altura varia
 * ±2 semitons a cada disparo (`pitchRatio`). A tecla larga (espaço/Enter) é mais grave e mais longa.
 */
export function playKey(
  ctx: BaseAudioContext,
  white: AudioBuffer,
  out: AudioNode,
  when: number,
  variant: KeyVariant = 'normal',
  volume = 1,
  random: () => number = Math.random,
): void {
  const pitch = pitchRatio(random, 200)
  const wide = variant === 'wide'
  const bus = ctx.createGain()
  bus.gain.value = VOICE_GAIN.key * volume
  bus.connect(out)
  noiseTick(ctx, white, bus, when, {
    hz: (wide ? 1900 : 3200) * pitch,
    q: 1.4,
    peak: 1,
    attack: 0.001,
    decay: wide ? 0.06 : 0.04,
    rate: pitch,
  })
  thock(ctx, bus, when, {
    from: (wide ? 150 : 200) * pitch,
    to: (wide ? 75 : 100) * pitch,
    peak: wide ? 0.5 : 0.35,
    decay: wide ? 0.07 : 0.05,
  })
  // O barramento fica vivo só até o fim dos disparos.
  disconnectLater(ctx, bus, when + 0.2)
}

export type MousePhase = 'down' | 'up'

/**
 * Clique de mouse: o "down" é um estalo seco (~2.2 kHz) com um baque; o "up" é mais agudo, curto
 * e mais baixo (a soltura do botão). Altura com variação de ±1.5 semitom.
 */
export function playMouse(
  ctx: BaseAudioContext,
  white: AudioBuffer,
  out: AudioNode,
  when: number,
  phase: MousePhase,
  volume = 1,
  random: () => number = Math.random,
): void {
  const pitch = pitchRatio(random, 150)
  const down = phase === 'down'
  const bus = ctx.createGain()
  bus.gain.value = VOICE_GAIN.mouse * volume * (down ? 1 : 0.55)
  bus.connect(out)
  noiseTick(ctx, white, bus, when, {
    hz: (down ? 2200 : 3400) * pitch,
    q: down ? 2.4 : 2,
    peak: 1,
    attack: 0.0008,
    decay: down ? 0.028 : 0.018,
    rate: pitch,
  })
  if (down) thock(ctx, bus, when, { from: 170 * pitch, to: 95 * pitch, peak: 0.3, decay: 0.035 })
  disconnectLater(ctx, bus, when + 0.12)
}

/**
 * Estática da TV: ruído branco por passa-faixa largo (~2.8 kHz) com passa-alta em 600 Hz. O ganho
 * "tremula" em degraus de 30 ms entre 55% e 100% (a imagem chiando) e some em fade. Curto: ~0.65 s.
 */
export function playStatic(
  ctx: BaseAudioContext,
  white: AudioBuffer,
  out: AudioNode,
  when: number,
  volume = 1,
  duration = 0.65,
  random: () => number = Math.random,
): void {
  const src = ctx.createBufferSource()
  src.buffer = white
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 2800
  band.Q.value = 0.45
  const high = ctx.createBiquadFilter()
  high.type = 'highpass'
  high.frequency.value = 600
  const env = ctx.createGain()
  const peak = VOICE_GAIN.tvStatic * volume
  const attack = 0.03
  const release = Math.min(0.25, duration * 0.4)
  env.gain.setValueAtTime(SILENCE, when)
  env.gain.linearRampToValueAtTime(peak, when + attack)
  for (let t = attack; t < duration - release; t += 0.03) {
    env.gain.setValueAtTime(peak * (0.55 + 0.45 * random()), when + t)
  }
  env.gain.setValueAtTime(peak * 0.8, when + duration - release)
  env.gain.exponentialRampToValueAtTime(SILENCE, when + duration)
  chain(src, band, high, env, out)
  src.start(when, Math.random() * Math.max(0, white.duration - duration - 0.05))
  scheduleDispose(src, [src, band, high, env], when + duration + 0.03)
}

/**
 * Desconecta o barramento temporário de um disparo depois que os filhos acabaram. Só o AudioContext
 * REAL precisa disso (o offline some com o render).
 */
function disconnectLater(ctx: BaseAudioContext, bus: GainNode, at: number): void {
  if (typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext) return
  const ms = Math.max(0, (at - ctx.currentTime) * 1000) + 60
  setTimeout(() => bus.disconnect(), ms)
}
