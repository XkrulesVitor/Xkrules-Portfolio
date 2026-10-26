// Partitura da música lo-fi do quarto: harmonia, condução de vozes, padrões de teclado, baixo,
// bateria e melodia, e um sequenciador que entrega as notas em ordem, com lookahead.
// Módulo FOLHA e puro (sem Web Audio, sem imports locais): o `music.ts` só TOCA o que sai daqui, e
// o `node --test` consegue exercitar tudo com um sorteio determinístico.
//
// Forma: 12 compassos em 3 frases de 4 (A, B, C), um acorde por compasso, a 75 BPM (um compasso =
// 3.2 s, um ciclo = 38.4 s). As frases se encadeiam em círculo (C volta para A), então não há
// emenda: depois do ciclo 1 vem o ciclo 2, com outro humor (melodia, bumbo, chimbal) e outro sorteio.

export type Random = () => number

export const BPM = 75
export const BEATS_PER_BAR = 4
export const BEAT_S = 60 / BPM
export const BAR_S = BEAT_S * BEATS_PER_BAR
/** Atraso (em batidas) do contratempo: ~58% de swing, "arrastado" como o lo-fi pede. */
export const SWING = 0.085

export function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

export function pitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12
}

/**
 * Posição no compasso (em batidas, reta) -> posição com swing. Dentro de cada batida o ponto médio
 * (o "e") é empurrado `swing` para frente, e os 16avos acompanham de forma proporcional. Monótona,
 * com 0 -> 0 e 1 -> 1 em cada batida: o swing nunca desloca as batidas inteiras.
 */
export function swingBeat(position: number, swing: number = SWING): number {
  const beat = Math.floor(position)
  const frac = position - beat
  const mid = 0.5 + swing
  const swung = frac < 0.5 ? (frac * mid) / 0.5 : mid + ((frac - 0.5) * (1 - mid)) / 0.5
  return beat + swung
}

// ---------------------------------------------------------------------------------------------
// Harmonia (tom de Fá maior). Voicings "sem fundamental" (o baixo faz a nota grave), 4 vozes.

export interface Chord {
  name: string
  /** Classe de altura da fundamental (0 = Dó). */
  root: number
  /** Semitons acima da fundamental das 4 notas que o teclado toca (terça, quinta, sétima, nona). */
  tones: readonly number[]
}

export const CHORDS = {
  Gm9: { name: 'Gm9', root: 7, tones: [3, 7, 10, 14] },
  C9: { name: 'C9', root: 0, tones: [4, 7, 10, 14] },
  Fmaj9: { name: 'Fmaj9', root: 5, tones: [4, 7, 11, 14] },
  Dm9: { name: 'Dm9', root: 2, tones: [3, 7, 10, 14] },
  Bbmaj9: { name: 'Bbmaj9', root: 10, tones: [4, 7, 11, 14] },
  Am9: { name: 'Am9', root: 9, tones: [3, 7, 10, 14] },
} as const satisfies Record<string, Chord>

export type PhraseId = 'A' | 'B' | 'C'

/** Três progressões de 4 compassos: ii-V-I-vi, IV-iii-ii-V e I-IV-iii-vi. */
export const PHRASES: Readonly<Record<PhraseId, readonly Chord[]>> = {
  A: [CHORDS.Gm9, CHORDS.C9, CHORDS.Fmaj9, CHORDS.Dm9],
  B: [CHORDS.Bbmaj9, CHORDS.Am9, CHORDS.Gm9, CHORDS.C9],
  C: [CHORDS.Fmaj9, CHORDS.Bbmaj9, CHORDS.Am9, CHORDS.Dm9],
}

export const PHRASE_ORDER: readonly PhraseId[] = ['A', 'B', 'C']
export const BARS_PER_PHRASE = 4

export interface SongSlot {
  phrase: PhraseId
  /** Compasso dentro da frase (0..3). */
  step: number
  chord: Chord
}

/** O ciclo de 12 compassos. Termina em Dm9 e volta em Gm9 (vi -> ii), então fecha sem emenda. */
export const SONG: readonly SongSlot[] = PHRASE_ORDER.flatMap((phrase) =>
  PHRASES[phrase].map((chord, step) => ({ phrase, step, chord })),
)
export const SONG_BARS = SONG.length

/** Faixa do teclado (MIDI): Sol3 a Dó5. */
export const VOICING_RANGE = [55, 72] as const
/** Faixa da melodia (MIDI): Lá4 a Dó6. */
export const LEAD_RANGE = [69, 84] as const
/** Voicing de partida (Gm9), de onde o primeiro acorde conduz as vozes. */
const SEED_VOICING: readonly number[] = [58, 62, 65, 69]
/** Centro de gravidade do teclado: sem isto a condução mínima derivaria para o grave, onde embola. */
const VOICING_CENTER = 63

function voicingCost(sorted: readonly number[], reference: readonly number[]): number {
  let cost = 0
  const n = Math.min(sorted.length, reference.length)
  for (let i = 0; i < n; i++) cost += Math.abs(sorted[i] - reference[i])
  const mean = sorted.reduce((sum, note) => sum + note, 0) / sorted.length
  cost += Math.abs(mean - VOICING_CENTER) * 1.5
  const spread = sorted[sorted.length - 1] - sorted[0]
  if (spread > 14) cost += (spread - 14) * 2
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i] - sorted[i - 1]
    if (gap === 1) cost += 12 // segunda menor colada: áspera
    else if (gap < 3 && sorted[i - 1] < 57) cost += 2 // cluster no grave: embolado
  }
  return cost
}

/**
 * Escolhe a oitava de cada nota do acorde para o movimento total das vozes, em relação ao acorde
 * anterior, ser o menor possível (e sem aglomerar). É isso que faz qualquer frase se encadear com
 * outra, sem saltos. Devolve as notas MIDI em ordem crescente.
 */
export function voiceLead(
  previous: readonly number[] | null,
  chord: Chord,
  range: readonly [number, number] = VOICING_RANGE,
): number[] {
  const [lo, hi] = range
  const reference = [...(previous ?? SEED_VOICING)].sort((a, b) => a - b)
  const options = chord.tones.map((tone) => {
    const pc = (chord.root + tone) % 12
    const list: number[] = []
    for (let m = lo; m <= hi; m++) if (pitchClass(m) === pc) list.push(m)
    return list
  })
  let best: number[] = []
  let bestCost = Infinity
  const pick: number[] = []
  const walk = (i: number) => {
    if (i === options.length) {
      const sorted = [...pick].sort((a, b) => a - b)
      const cost = voicingCost(sorted, reference)
      if (cost < bestCost) {
        bestCost = cost
        best = sorted
      }
      return
    }
    for (const m of options[i]) {
      pick[i] = m
      walk(i + 1)
    }
  }
  walk(0)
  return best
}

/** Nota do baixo (MIDI) para uma fundamental: Mi2 a Mib3, audível até em alto-falante de notebook. */
export function bassMidi(rootPc: number): number {
  return 40 + ((((rootPc - 4) % 12) + 12) % 12)
}

// ---------------------------------------------------------------------------------------------
// Eventos

export type Instrument = 'keys' | 'lead' | 'bass' | 'kick' | 'snare' | 'hat' | 'openHat'

export interface NoteEvent {
  inst: Instrument
  /** Posição no compasso em batidas RETAS (0..4); o swing é aplicado pelo sequenciador. */
  beat: number
  /** Duração em batidas. */
  dur: number
  /** Nota MIDI (0 nos instrumentos de bateria). */
  midi: number
  /** Intensidade 0..1. */
  vel: number
  /** Humanização em segundos (pode ser negativa): o rolar do acorde, a bateria "atrasada". */
  nudge: number
}

export interface Bar {
  /** Contador global de compassos desde o início. */
  index: number
  cycle: number
  phrase: PhraseId
  step: number
  chord: Chord
  voicing: readonly number[]
  events: NoteEvent[]
}

type Hit = readonly [beat: number, dur: number, vel: number]

interface Weighted {
  weight: number
}

function weightedPick<T extends Weighted>(items: readonly T[], random: Random): T {
  let total = 0
  for (const item of items) total += item.weight
  let roll = random() * total
  for (const item of items) {
    roll -= item.weight
    if (roll < 0) return item
  }
  return items[items.length - 1]
}

function between(random: Random, min: number, max: number): number {
  return min + (max - min) * random()
}

/** Como o teclado ataca o acorde no compasso. */
const COMP_PATTERNS: readonly (Weighted & { hits: readonly Hit[] })[] = [
  { weight: 3, hits: [[0, 3.2, 1], [3.5, 0.5, 0.55]] },
  { weight: 3, hits: [[0, 1.4, 1], [2.5, 1.2, 0.75], [3.5, 0.5, 0.5]] },
  { weight: 2, hits: [[0, 1, 0.95], [1.5, 2.3, 0.8]] },
  { weight: 2, hits: [[0.5, 1.2, 0.85], [2, 1, 0.7], [3, 0.9, 0.6]] },
  { weight: 1, hits: [[0, 4, 0.9]] },
]

/** Baixo: fundamental no 1, com uma volta no fim que aproxima o próximo acorde. `approach` = nota de passagem. */
type BassHit = readonly [beat: number, dur: number, vel: number, kind?: 'fifth' | 'octave' | 'approach']
const BASS_PATTERNS: readonly (Weighted & { hits: readonly BassHit[] })[] = [
  { weight: 3, hits: [[0, 1.6, 1], [2.5, 0.7, 0.7], [3.5, 0.45, 0.55, 'approach']] },
  { weight: 3, hits: [[0, 2.2, 1], [2.5, 0.6, 0.65, 'fifth'], [3.5, 0.45, 0.6, 'approach']] },
  { weight: 2, hits: [[0, 3.5, 0.95]] },
  { weight: 2, hits: [[0, 1, 1], [1.5, 0.5, 0.55, 'octave'], [2, 1.5, 0.85]] },
]

/** Bumbos (batida do 1 sempre; o resto muda). */
const KICK_SETS: readonly (readonly number[])[] = [
  [0, 2.5],
  [0, 1.75, 2.5],
  [0, 2.5, 3.25],
  [0, 1.5, 2.5],
  [0, 0.75, 2.5],
]

/** Intensidade do chimbal nos 8avos: o 1 e o 3 mais fortes, os contratempos macios. */
const HAT_VELOCITY = [0.8, 0.45, 0.62, 0.45, 0.75, 0.45, 0.62, 0.5]

/** Ritmos da melodia (batida, duração): poucas notas, muito espaço. */
const LEAD_RHYTHMS: readonly (Weighted & { hits: readonly (readonly [number, number])[] })[] = [
  { weight: 3, hits: [[0.5, 0.5], [1.5, 1]] },
  { weight: 3, hits: [[0, 0.75], [1, 0.5], [2.5, 1.5]] },
  { weight: 2, hits: [[1, 0.5], [1.5, 0.5], [3, 1]] },
  { weight: 2, hits: [[0.5, 2.5]] },
  { weight: 2, hits: [[2, 0.5], [2.5, 0.5], [3.25, 0.75]] },
]

interface Mood {
  /** Chance de o compasso ter melodia. */
  leadChance: number
  /** Bumbos que este ciclo usa (índices de `KICK_SETS`). */
  kicks: readonly number[]
  /** Chance de pular um chimbal de contratempo. */
  hatSkip: number
  /** Chance de uma virada de caixa no último compasso da frase. */
  fillChance: number
}

export class Composer {
  private index = 0
  private voicing: number[] | null = null
  private lead: number | null = null
  private lastLeadRhythm: (typeof LEAD_RHYTHMS)[number] | null = null
  private mood: Mood
  private readonly random: Random

  constructor(random: Random = Math.random) {
    this.random = random
    this.mood = this.newMood()
  }

  private newMood(): Mood {
    const r = this.random
    const first = Math.floor(r() * KICK_SETS.length)
    const second = (first + 1 + Math.floor(r() * (KICK_SETS.length - 1))) % KICK_SETS.length
    return {
      leadChance: between(r, 0.3, 0.7),
      kicks: [first, second],
      hatSkip: between(r, 0.05, 0.2),
      fillChance: between(r, 0.2, 0.5),
    }
  }

  /** O próximo compasso da música (infinito: o ciclo de 12 compassos se repete com novos humores). */
  next(): Bar {
    const index = this.index++
    const cycle = Math.floor(index / SONG_BARS)
    const pos = index % SONG_BARS
    if (pos === 0 && index > 0) this.mood = this.newMood()
    const slot = SONG[pos]
    const nextChord = SONG[(pos + 1) % SONG_BARS].chord
    const voicing = voiceLead(this.voicing, slot.chord)
    this.voicing = voicing

    const events: NoteEvent[] = []
    // Entrada em camadas: teclado sozinho, depois baixo e chimbal, depois bumbo e caixa.
    this.addKeys(events, voicing)
    if (index >= 1) this.addBass(events, slot.chord, nextChord)
    if (index >= 1) this.addHats(events)
    if (index >= 2) this.addKickAndSnare(events, slot.step === BARS_PER_PHRASE - 1)
    if (index >= 1 && this.random() < this.mood.leadChance) this.addLead(events, slot.chord)

    return { index, cycle, phrase: slot.phrase, step: slot.step, chord: slot.chord, voicing, events }
  }

  private addKeys(events: NoteEvent[], voicing: readonly number[]): void {
    const r = this.random
    const pattern = weightedPick(COMP_PATTERNS, r)
    for (const [beat, dur, vel] of pattern.hits) {
      // Acorde "rolado" de baixo para cima, com pequenas diferenças de toque.
      voicing.forEach((midi, i) => {
        events.push({
          inst: 'keys',
          beat,
          dur,
          midi,
          vel: Math.min(1, vel * between(r, 0.85, 1.05) * (0.9 + (0.12 * i) / voicing.length)),
          nudge: i * between(r, 0.008, 0.016) + between(r, -0.008, 0.008),
        })
      })
    }
  }

  private addBass(events: NoteEvent[], chord: Chord, nextChord: Chord): void {
    const r = this.random
    const root = bassMidi(chord.root)
    const nextRoot = bassMidi(nextChord.root)
    const pattern = weightedPick(BASS_PATTERNS, r)
    for (const [beat, dur, vel, kind] of pattern.hits) {
      let midi = root
      if (kind === 'fifth') midi = root + 7
      else if (kind === 'octave') midi = root + 12
      else if (kind === 'approach') midi = nextRoot + (r() < 0.5 ? -1 : 1)
      events.push({ inst: 'bass', beat, dur, midi, vel: vel * between(r, 0.9, 1), nudge: between(r, -0.008, 0.01) })
    }
  }

  private addHats(events: NoteEvent[]): void {
    const r = this.random
    for (let i = 0; i < 8; i++) {
      const offBeat = i % 2 === 1
      if (offBeat && r() < this.mood.hatSkip) continue
      const beat = i / 2
      const open = i === 7 && r() < 0.35
      events.push({
        inst: open ? 'openHat' : 'hat',
        beat,
        dur: open ? 0.5 : 0.2,
        midi: 0,
        vel: HAT_VELOCITY[i] * between(r, 0.8, 1.1),
        nudge: between(r, -0.008, 0.008),
      })
    }
    // Um 16avo fantasma de vez em quando.
    if (r() < 0.3) {
      events.push({ inst: 'hat', beat: r() < 0.5 ? 1.75 : 3.75, dur: 0.2, midi: 0, vel: between(r, 0.25, 0.4), nudge: 0 })
    }
  }

  private addKickAndSnare(events: NoteEvent[], lastBarOfPhrase: boolean): void {
    const r = this.random
    const kicks = KICK_SETS[this.mood.kicks[r() < 0.6 ? 0 : 1]]
    for (const beat of kicks) {
      events.push({
        inst: 'kick',
        beat,
        dur: 0.4,
        midi: 0,
        vel: (beat === 0 ? 1 : 0.8) * between(r, 0.9, 1),
        nudge: between(r, -0.006, 0.006),
      })
    }
    // Caixa nas batidas 2 e 4, atrasada (a "preguiça" do lo-fi).
    events.push({ inst: 'snare', beat: 1, dur: 0.3, midi: 0, vel: between(r, 0.85, 1), nudge: between(r, 0.012, 0.024) })
    events.push({ inst: 'snare', beat: 3, dur: 0.3, midi: 0, vel: between(r, 0.8, 0.95), nudge: between(r, 0.012, 0.024) })
    if (r() < 0.25) {
      events.push({ inst: 'snare', beat: 2.75, dur: 0.2, midi: 0, vel: between(r, 0.2, 0.32), nudge: 0.01 })
    }
    if (lastBarOfPhrase && r() < this.mood.fillChance) {
      events.push({ inst: 'snare', beat: 3.5, dur: 0.2, midi: 0, vel: between(r, 0.4, 0.55), nudge: 0.01 })
      events.push({ inst: 'snare', beat: 3.75, dur: 0.2, midi: 0, vel: between(r, 0.6, 0.75), nudge: 0.01 })
    }
  }

  private addLead(events: NoteEvent[], chord: Chord): void {
    const r = this.random
    // 40% das vezes repete o ritmo do compasso anterior: vira um motivo, não uma sequência aleatória.
    const rhythm =
      this.lastLeadRhythm !== null && r() < 0.4 ? this.lastLeadRhythm : weightedPick(LEAD_RHYTHMS, r)
    this.lastLeadRhythm = rhythm
    const pool = leadPool(chord)
    for (const [beat, dur] of rhythm.hits) {
      const midi = nextLeadNote(pool, this.lead, r)
      this.lead = midi
      events.push({ inst: 'lead', beat, dur, midi, vel: between(r, 0.55, 0.8), nudge: between(r, -0.01, 0.014) })
    }
  }
}

/** Notas do acorde (fundamental, terça, quinta, sétima e nona) dentro da faixa da melodia, em ordem. */
export function leadPool(chord: Chord): number[] {
  const pcs = new Set<number>([chord.root, ...chord.tones.map((t) => (chord.root + t) % 12)])
  const pool: number[] = []
  for (let m = LEAD_RANGE[0]; m <= LEAD_RANGE[1]; m++) if (pcs.has(pitchClass(m))) pool.push(m)
  return pool
}

/** Próxima nota da melodia: um passo curto (o mais comum é vizinho) a partir da anterior. */
export function nextLeadNote(pool: readonly number[], current: number | null, random: Random): number {
  if (current === null) return pool[Math.floor(pool.length / 2)]
  let nearest = 0
  for (let i = 1; i < pool.length; i++) {
    if (Math.abs(pool[i] - current) < Math.abs(pool[nearest] - current)) nearest = i
  }
  const roll = random()
  const magnitude = roll < 0.1 ? 0 : roll < 0.65 ? 1 : roll < 0.9 ? 2 : 3
  const direction = random() < 0.5 ? -1 : 1
  const target = Math.min(pool.length - 1, Math.max(0, nearest + direction * magnitude))
  return pool[target]
}

// ---------------------------------------------------------------------------------------------
// Sequenciador com lookahead

export interface ScheduledEvent extends NoteEvent {
  /** Instante absoluto (relógio do AudioContext) em que a nota começa. */
  time: number
  /** Compasso global de onde a nota veio. */
  bar: number
}

/** Folga para uma nota com `nudge` negativo no 1 do compasso: o compasso é gerado um pouco antes. */
const NUDGE_MARGIN_S = 0.1

/**
 * Entrega as notas em ordem de tempo, uma única vez cada. `pull(horizon)` devolve tudo que começa antes
 * de `horizon` e gera os compassos que forem preciso. Os compassos caem em `start + n * BAR_S` exatos
 * (sem acumular erro), então o ritmo não deriva nunca.
 */
export class Sequencer {
  private pending: ScheduledEvent[] = []
  private nextBarStart = 0
  private floor = 0
  private started = false
  private readonly composer: Composer

  constructor(composer: Composer = new Composer()) {
    this.composer = composer
  }

  /** (Re)começa a contar compassos em `at`, descartando o que estava pendente. */
  start(at: number): void {
    this.pending = []
    this.nextBarStart = at
    this.floor = at
    this.started = true
  }

  /**
   * Retoma depois de uma pausa. Se o que já foi agendado ainda não chegou ao fim (pausa curta, ou
   * contexto suspenso com o relógio parado), continua da mesma grade de compassos: o resto toca e a
   * música segue sem emenda nem notas dobradas. Se a pausa foi longa, recomeça em `at`.
   */
  resume(at: number): void {
    if (!this.started || this.nextBarStart < at) this.start(at)
  }

  pull(horizon: number): ScheduledEvent[] {
    if (!this.started) this.start(0)
    while (this.nextBarStart - NUDGE_MARGIN_S < horizon) {
      const bar = this.composer.next()
      for (const event of bar.events) {
        const time = this.nextBarStart + swingBeat(event.beat) * BEAT_S + event.nudge
        this.pending.push({ ...event, time: Math.max(this.floor, time), bar: bar.index })
      }
      this.nextBarStart += BAR_S
      this.pending.sort((a, b) => a.time - b.time)
    }
    let count = 0
    while (count < this.pending.length && this.pending[count].time < horizon) count++
    return this.pending.splice(0, count)
  }
}
