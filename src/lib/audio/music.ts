// Música lo-fi do quarto, GERADA em tempo real (nenhum arquivo de som): toca o que o `score.ts`
// compõe com vozes sintetizadas em Web Audio. Recebe um `BaseAudioContext`, então toca no
// AudioContext real e no OfflineAudioContext usado para medir o nível (`measure.ts`, só em dev).
//
// Grafo:
//   teclado ─ tremolo ─┬────────────────────────────┐
//        └─ eco (colcheia pontuada, ~0.6 s) ───────┤
//   baixo ─ passa-baixa ───────────────────────────┤
//   bumbo/caixa ───────────────────────────────────┴→ corpo → "wow/flutter" → passa-baixa quente → level → out
//   chimbal ─ passa-alta/baixa (fora do filtro quente, para não sumir) ───────────────────────────→ level
//   chiado de vinil (estalos em loop + sopro) ────────────────────────────────────────────────────→ level
//
// Agendamento: um timer curto (TICK_MS) pede ao `Sequencer` as notas que começam nos próximos
// LOOKAHEAD_S segundos do relógio do AudioContext e cria os nós SÓ dessas notas (algumas dezenas por
// segundo, cada uma se desliga e se solta sozinha). Os buffers de ruído são reaproveitados. O tempo
// vem do `currentTime`, não do timer: o atraso do timer nunca estraga o ritmo.

import { VOICE_GAIN } from './mix'
import { createCrackleBuffer } from './noise'
import { BEAT_S, Composer, Sequencer, midiToHz, type Random, type ScheduledEvent } from './score'

/** Até onde (s) o timer agenda à frente. Folgado para aguentar um timer atrasado sem falhar. */
const LOOKAHEAD_S = 1.6
const TICK_MS = 250
/** Nota que já passou mais que isto no momento de agendar é descartada (não toca atrasada, em rajada). */
const STALE_S = 0.08
const SILENCE = 0.0001
/** Atraso base do "wow/flutter" (s): o LFO oscila em torno dele. */
const WOBBLE_BASE_S = 0.008

export interface MusicOptions {
  /** Sorteio da composição (injetável para medir sempre a mesma música). */
  random?: Random
}

export interface MusicVoice {
  /** Está agendando notas. */
  readonly running: boolean
  /** Começa (ou retoma, de onde parou na partitura) a agendar notas. */
  start(): void
  /** Para de agendar. As notas já agendadas terminam sozinhas; quem silencia é o bus de saída. */
  stop(): void
  /** Agenda tudo que começa antes de `horizon` (relógio do contexto). O timer usa isto; a medição offline também. */
  pump(horizon: number): void
  dispose(): void
}

/** Nós compartilhados por todas as notas. */
interface Rig {
  ctx: BaseAudioContext
  white: AudioBuffer
  keys: AudioNode
  bass: AudioNode
  drums: AudioNode
  snareBand: AudioNode
  hats: AudioNode
}

function chain(source: AudioNode, ...rest: AudioNode[]): void {
  let previous: AudioNode = source
  for (const node of rest) {
    previous.connect(node)
    previous = node
  }
}

/** LFO senoidal somado a `target` (na unidade do parâmetro), a `hz`. Devolve o oscilador, já ligado. */
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

function loopingSource(ctx: BaseAudioContext, buffer: AudioBuffer): AudioBufferSourceNode {
  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.loop = true
  return src
}

/** Envelope percussivo: sobe linear até `peak` em `attack` e cai exponencial em `decay`. */
function percussive(param: AudioParam, when: number, peak: number, attack: number, decay: number): void {
  param.setValueAtTime(SILENCE, when)
  param.linearRampToValueAtTime(Math.max(SILENCE, peak), when + attack)
  param.exponentialRampToValueAtTime(SILENCE, when + attack + decay)
}

/** Quando a fonte termina, solta a cadeia do disparo (libera os nós). */
function releaseWhenEnded(source: AudioScheduledSourceNode, nodes: AudioNode[]): void {
  source.onended = () => {
    for (const node of nodes) node.disconnect()
  }
}

/** Piano elétrico estilo Rhodes: FM suave (corpo), um "ding" inarmônico curto e envelope macio. `lead` é a melodia: mais brilhante e solta. */
function playKeys(rig: Rig, e: ScheduledEvent, lead: boolean): void {
  const { ctx } = rig
  const t = e.time
  const f = midiToHz(e.midi)
  const vel = Math.max(0.05, Math.min(1, e.vel))
  const attack = lead ? 0.008 : 0.012 + (1 - vel) * 0.01
  const hold = Math.max(attack + 0.08, e.dur * BEAT_S)
  const release = lead ? 0.7 : 0.45
  const end = t + hold + release
  const peak = (lead ? 0.12 : 0.17) * Math.pow(vel, 1.2)

  const carrier = ctx.createOscillator()
  carrier.frequency.value = f
  const mod = ctx.createOscillator()
  mod.frequency.value = f
  const modDepth = ctx.createGain()
  // Índice de modulação alto no ataque (o "toc" do martelo) e quase senoide depois.
  modDepth.gain.setValueAtTime((lead ? 0.9 : 1.1 + 0.8 * vel) * f, t)
  modDepth.gain.exponentialRampToValueAtTime(0.12 * f, t + 0.7)
  mod.connect(modDepth)
  modDepth.connect(carrier.frequency)

  const env = ctx.createGain()
  env.gain.setValueAtTime(SILENCE, t)
  env.gain.linearRampToValueAtTime(peak, t + attack)
  env.gain.exponentialRampToValueAtTime(peak * 0.28, t + hold)
  env.gain.exponentialRampToValueAtTime(SILENCE, end)
  carrier.connect(env)

  const nodes: AudioNode[] = [carrier, mod, modDepth, env]
  const oscillators: OscillatorNode[] = [carrier, mod]
  const tineHz = f * 5.97
  if (tineHz < 7000) {
    const tine = ctx.createOscillator()
    tine.frequency.value = tineHz
    const tineEnv = ctx.createGain()
    tineEnv.gain.setValueAtTime(peak * (lead ? 0.6 : 0.35), t)
    tineEnv.gain.exponentialRampToValueAtTime(SILENCE, t + 0.12)
    chain(tine, tineEnv, env)
    nodes.push(tine, tineEnv)
    oscillators.push(tine)
  }

  if (typeof ctx.createStereoPanner === 'function') {
    const pan = ctx.createStereoPanner()
    pan.pan.value = Math.max(-0.6, Math.min(0.6, (e.midi - 64) / 28)) * 0.5
    chain(env, pan, rig.keys)
    nodes.push(pan)
  } else {
    env.connect(rig.keys)
  }

  for (const osc of oscillators) {
    osc.start(t)
    osc.stop(end + 0.05)
  }
  releaseWhenEnded(carrier, nodes)
}

/** Baixo: triângulo macio (o passa-baixa do bus tira o resto). */
function playBass(rig: Rig, e: ScheduledEvent): void {
  const { ctx } = rig
  const t = e.time
  const vel = Math.max(0.05, Math.min(1, e.vel))
  const hold = Math.max(0.1, e.dur * BEAT_S)
  const end = t + hold + 0.14
  const peak = 0.3 * Math.pow(vel, 1.1)

  const osc = ctx.createOscillator()
  osc.type = 'triangle'
  osc.frequency.value = midiToHz(e.midi)
  const env = ctx.createGain()
  env.gain.setValueAtTime(SILENCE, t)
  env.gain.linearRampToValueAtTime(peak, t + 0.014)
  env.gain.exponentialRampToValueAtTime(peak * 0.55, t + hold)
  env.gain.exponentialRampToValueAtTime(SILENCE, end)
  chain(osc, env, rig.bass)
  osc.start(t)
  osc.stop(end + 0.05)
  releaseWhenEnded(osc, [osc, env])
}

function playKick(rig: Rig, e: ScheduledEvent): void {
  const { ctx } = rig
  const t = e.time
  const osc = ctx.createOscillator()
  osc.frequency.setValueAtTime(135, t)
  osc.frequency.exponentialRampToValueAtTime(46, t + 0.12)
  const env = ctx.createGain()
  percussive(env.gain, t, 0.85 * e.vel, 0.004, 0.34)
  chain(osc, env, rig.drums)
  osc.start(t)
  osc.stop(t + 0.42)
  releaseWhenEnded(osc, [osc, env])
}

/** Caixa macia: estalo de ruído por passa-faixa mais um baque de ~190 Hz. */
function playSnare(rig: Rig, e: ScheduledEvent): void {
  const { ctx, white } = rig
  const t = e.time
  const noise = ctx.createBufferSource()
  noise.buffer = white
  noise.playbackRate.value = 0.95 + Math.random() * 0.1
  const noiseEnv = ctx.createGain()
  percussive(noiseEnv.gain, t, 0.3 * e.vel, 0.002, 0.17)
  chain(noise, noiseEnv, rig.snareBand)
  noise.start(t, Math.random() * Math.max(0, white.duration - 0.4))
  noise.stop(t + 0.25)
  releaseWhenEnded(noise, [noise, noiseEnv])

  const thump = ctx.createOscillator()
  thump.frequency.setValueAtTime(190, t)
  thump.frequency.exponentialRampToValueAtTime(120, t + 0.06)
  const thumpEnv = ctx.createGain()
  percussive(thumpEnv.gain, t, 0.2 * e.vel, 0.002, 0.1)
  chain(thump, thumpEnv, rig.drums)
  thump.start(t)
  thump.stop(t + 0.16)
  releaseWhenEnded(thump, [thump, thumpEnv])
}

/** Chimbal: ruído branco com envelope curto (aberto: mais longo). O filtro é compartilhado. */
function playHat(rig: Rig, e: ScheduledEvent, open: boolean): void {
  const { ctx, white } = rig
  const t = e.time
  const noise = ctx.createBufferSource()
  noise.buffer = white
  noise.playbackRate.value = 0.9 + Math.random() * 0.2
  const env = ctx.createGain()
  const decay = open ? 0.16 : 0.035
  percussive(env.gain, t, (open ? 0.09 : 0.1) * e.vel, 0.002, decay)
  chain(noise, env, rig.hats)
  noise.start(t, Math.random() * Math.max(0, white.duration - 0.4))
  noise.stop(t + decay + 0.05)
  releaseWhenEnded(noise, [noise, env])
}

function play(rig: Rig, e: ScheduledEvent): void {
  switch (e.inst) {
    case 'keys':
      return playKeys(rig, e, false)
    case 'lead':
      return playKeys(rig, e, true)
    case 'bass':
      return playBass(rig, e)
    case 'kick':
      return playKick(rig, e)
    case 'snare':
      return playSnare(rig, e)
    case 'hat':
      return playHat(rig, e, false)
    case 'openHat':
      return playHat(rig, e, true)
  }
}

/**
 * Cria a música e a deixa PARADA: `start()` liga o agendamento. O grafo fixo (LFOs, vinil) fica de pé
 * desde já; `out` é o bus de música do motor, que cuida do volume e do silêncio.
 */
export function createMusic(
  ctx: BaseAudioContext,
  white: AudioBuffer,
  out: AudioNode,
  options: MusicOptions = {},
): MusicVoice {
  const level = ctx.createGain()
  level.gain.value = VOICE_GAIN.music
  level.connect(out)

  // Corpo: tudo que passa pela "fita" e pelo filtro quente.
  const body = ctx.createGain()
  const wobble = ctx.createDelay(0.05)
  wobble.delayTime.value = WOBBLE_BASE_S
  const warm = ctx.createBiquadFilter()
  warm.type = 'lowpass'
  warm.frequency.value = 2900
  warm.Q.value = 0.5
  const rumble = ctx.createBiquadFilter()
  rumble.type = 'highpass'
  rumble.frequency.value = 55
  chain(body, wobble, warm, rumble, level)

  // Teclado com tremolo e eco de colcheia pontuada (75 BPM: 0.6 s).
  const keys = ctx.createGain()
  const tremolo = ctx.createGain()
  tremolo.gain.value = 0.88
  chain(keys, tremolo, body)
  const echoSend = ctx.createGain()
  echoSend.gain.value = 0.2
  const echo = ctx.createDelay(1.2)
  echo.delayTime.value = BEAT_S * 0.75
  const echoTone = ctx.createBiquadFilter()
  echoTone.type = 'lowpass'
  echoTone.frequency.value = 1700
  const echoFeedback = ctx.createGain()
  echoFeedback.gain.value = 0.33
  chain(keys, echoSend, echo, echoTone, body)
  chain(echoTone, echoFeedback, echo)

  // Baixo.
  const bass = ctx.createGain()
  const bassTone = ctx.createBiquadFilter()
  bassTone.type = 'lowpass'
  bassTone.frequency.value = 520
  bassTone.Q.value = 0.7
  chain(bass, bassTone, body)

  // Bumbo e caixa.
  const drums = ctx.createGain()
  drums.connect(body)
  const snareBand = ctx.createBiquadFilter()
  snareBand.type = 'bandpass'
  snareBand.frequency.value = 1800
  snareBand.Q.value = 0.7
  snareBand.connect(drums)

  // Chimbal: fora do filtro quente, senão o passa-baixa o apaga.
  const hats = ctx.createBiquadFilter()
  hats.type = 'highpass'
  hats.frequency.value = 6500
  hats.Q.value = 0.7
  const hatTone = ctx.createBiquadFilter()
  hatTone.type = 'lowpass'
  hatTone.frequency.value = 10000
  chain(hats, hatTone, level)

  // Chiado de vinil: dois loops de comprimentos diferentes (o conjunto demora a se repetir) e um sopro.
  const crackleHp = ctx.createBiquadFilter()
  crackleHp.type = 'highpass'
  crackleHp.frequency.value = 800
  const crackleGain = ctx.createGain()
  crackleGain.gain.value = 0.22
  chain(crackleHp, crackleGain, level)
  const crackleA = loopingSource(ctx, createCrackleBuffer(ctx, 4.1))
  const crackleB = loopingSource(ctx, createCrackleBuffer(ctx, 6.3))
  crackleA.connect(crackleHp)
  crackleB.connect(crackleHp)
  const hiss = loopingSource(ctx, white)
  const hissBand = ctx.createBiquadFilter()
  hissBand.type = 'bandpass'
  hissBand.frequency.value = 4200
  hissBand.Q.value = 0.4
  const hissGain = ctx.createGain()
  hissGain.gain.value = 0.014
  chain(hiss, hissBand, hissGain, level)

  // Vida: tremolo do piano, "wow" lento e "flutter" rápido da fita (desvios de poucos centésimos de
  // semitom) e o passa-baixa quente respirando devagar.
  const drones: AudioScheduledSourceNode[] = [
    lfo(ctx, tremolo.gain, 4.6, 0.1),
    lfo(ctx, wobble.delayTime, 0.31, 0.0013),
    lfo(ctx, wobble.delayTime, 0.083, 0.0012),
    lfo(ctx, wobble.delayTime, 6.1, 0.00005),
    lfo(ctx, warm.frequency, 0.05, 350),
    crackleA,
    crackleB,
    hiss,
  ]
  crackleA.start(0, Math.random() * 4)
  crackleB.start(0, Math.random() * 6)
  hiss.start(0, Math.random() * Math.max(0, white.duration - 0.05))
  for (const node of drones) if (node !== crackleA && node !== crackleB && node !== hiss) node.start(0)

  const rig: Rig = { ctx, white, keys, bass, drums, snareBand, hats }
  const sequencer = new Sequencer(new Composer(options.random))
  let running = false
  let primed = false
  let timer: ReturnType<typeof setTimeout> | null = null

  const pump = (horizon: number) => {
    if (!primed) {
      sequencer.resume(ctx.currentTime + 0.1)
      primed = true
    }
    const now = ctx.currentTime
    for (const event of sequencer.pull(horizon)) {
      if (event.time < now - STALE_S) continue
      play(rig, event)
    }
  }

  const tick = () => {
    timer = null
    if (!running) return
    pump(ctx.currentTime + LOOKAHEAD_S)
    timer = setTimeout(tick, TICK_MS)
  }

  const clearTimer = () => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  return {
    get running() {
      return running
    },
    start() {
      if (running) return
      running = true
      primed = false // o sequenciador decide: continua a grade em andamento ou recomeça agora
      tick()
    },
    stop() {
      running = false
      clearTimer()
    },
    pump,
    dispose() {
      running = false
      clearTimer()
      for (const node of drones) node.stop()
      level.disconnect()
    },
  }
}
