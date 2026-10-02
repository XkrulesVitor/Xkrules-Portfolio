// Ferramenta de DEV: mede o nível (dBFS) de cada voz renderizando-a OFFLINE (OfflineAudioContext), já
// com o ganho master. Não dá para ouvir o áudio pelo painel do browser; isto confere se cada som
// está perto do alvo de `LEVEL_TARGETS_DB` (calibragem de `VOICE_GAIN`). Só é importado em dev,
// por `experience/audio/AudioDirector.tsx` (`window.__audio.measure()`).

import { createNoiseBuffer } from './noise'
import { LEVEL_TARGETS_DB, MASTER_GAIN, VOICE_GAIN, toDb } from './mix'
import { createAmbient, createFan, playKey, playMouse, playStatic } from './voices'

export interface VoiceMeasure {
  /** Pico (dBFS). */
  peakDb: number
  /** RMS (dBFS) do trecho medido. Para disparos curtos é o RMS de toda a janela de render. */
  rmsDb: number
  /** Alvo de `LEVEL_TARGETS_DB` (pico para disparos; RMS para os laços). */
  targetDb: number
}

const SAMPLE_RATE = 44100

interface Span {
  from: number
  to: number
}

async function render(
  seconds: number,
  span: Span,
  build: (ctx: OfflineAudioContext, out: AudioNode) => void,
): Promise<{ peakDb: number; rmsDb: number }> {
  const ctx = new OfflineAudioContext(1, Math.ceil(SAMPLE_RATE * seconds), SAMPLE_RATE)
  const master = ctx.createGain()
  master.gain.value = MASTER_GAIN
  master.connect(ctx.destination)
  build(ctx, master)
  const data = (await ctx.startRendering()).getChannelData(0)
  const start = Math.floor(span.from * SAMPLE_RATE)
  const end = Math.min(data.length, Math.floor(span.to * SAMPLE_RATE))
  let peak = 0
  let sum = 0
  for (let i = start; i < end; i++) {
    const a = Math.abs(data[i])
    if (a > peak) peak = a
    sum += data[i] * data[i]
  }
  return { peakDb: toDb(peak), rmsDb: toDb(Math.sqrt(sum / Math.max(1, end - start))) }
}

/** Oito disparos espaçados em 0.3 s: pega a variação de altura e de trecho de ruído. */
const BURSTS = 8
const BURST_GAP = 0.3
const BURST_SECONDS = 0.1 + BURSTS * BURST_GAP

export async function measureVoices(): Promise<Record<string, VoiceMeasure>> {
  const result: Record<string, VoiceMeasure> = {}

  const fan = await render(4, { from: 0.8, to: 4 }, (ctx, out) => {
    const voice = createFan(ctx, createNoiseBuffer(ctx, 'white', 2), out)
    voice.level.gain.value = VOICE_GAIN.fan
  })
  result.fan = { ...fan, targetDb: LEVEL_TARGETS_DB.fan }

  const ambient = await render(5, { from: 1, to: 5 }, (ctx, out) => {
    const voice = createAmbient(ctx, createNoiseBuffer(ctx, 'brown', 6), out)
    voice.level.gain.value = VOICE_GAIN.ambient
  })
  result.ambient = { ...ambient, targetDb: LEVEL_TARGETS_DB.ambient }

  const bursts = (
    name: string,
    target: number,
    play: (ctx: OfflineAudioContext, white: AudioBuffer, out: AudioNode, when: number) => void,
  ) =>
    render(BURST_SECONDS, { from: 0, to: BURST_SECONDS }, (ctx, out) => {
      const white = createNoiseBuffer(ctx, 'white', 2)
      for (let i = 0; i < BURSTS; i++) play(ctx, white, out, 0.05 + i * BURST_GAP)
    }).then((m) => {
      result[name] = { ...m, targetDb: target }
    })

  await bursts('keyNormal', LEVEL_TARGETS_DB.key, (c, w, o, t) => playKey(c, w, o, t, 'normal'))
  await bursts('keyWide', LEVEL_TARGETS_DB.key, (c, w, o, t) => playKey(c, w, o, t, 'wide'))
  await bursts('mouseDown', LEVEL_TARGETS_DB.mouse, (c, w, o, t) => playMouse(c, w, o, t, 'down'))
  await bursts('mouseUp', LEVEL_TARGETS_DB.mouse, (c, w, o, t) => playMouse(c, w, o, t, 'up'))

  const tv = await render(1, { from: 0, to: 1 }, (ctx, out) => {
    playStatic(ctx, createNoiseBuffer(ctx, 'white', 2), out, 0.05)
  })
  result.tvStatic = { ...tv, targetDb: LEVEL_TARGETS_DB.tvStatic }

  return result
}
