import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  BAR_S,
  BEAT_S,
  BPM,
  Composer,
  LEAD_RANGE,
  PHRASES,
  SONG,
  SONG_BARS,
  SWING,
  Sequencer,
  VOICING_RANGE,
  bassMidi,
  leadPool,
  midiToHz,
  nextLeadNote,
  pitchClass,
  swingBeat,
  voiceLead,
  type Bar,
} from '../score.ts'

// Rodar: npm test  (node --test com type stripping nativo).

// PRNG determinístico (mulberry32): os testes não podem depender de Math.random.
function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function bars(count: number, seed = 1): Bar[] {
  const composer = new Composer(seeded(seed))
  return Array.from({ length: count }, () => composer.next())
}

const chordPcs = (chord: { root: number; tones: readonly number[] }) =>
  chord.tones.map((t) => (chord.root + t) % 12).sort((a, b) => a - b)

describe('score: tempo e swing', () => {
  it('andamento lo-fi (70 a 80 BPM) e um compasso de 4 batidas', () => {
    assert.ok(BPM >= 70 && BPM <= 80)
    assert.ok(Math.abs(BEAT_S * BPM - 60) < 1e-9)
    assert.ok(Math.abs(BAR_S - 4 * BEAT_S) < 1e-9)
  })

  it('swingBeat não mexe nas batidas inteiras e empurra só o contratempo', () => {
    for (const beat of [0, 1, 2, 3]) assert.equal(swingBeat(beat), beat)
    assert.ok(Math.abs(swingBeat(0.5) - (0.5 + SWING)) < 1e-12)
    assert.ok(Math.abs(swingBeat(2.5) - (2.5 + SWING)) < 1e-12)
  })

  it('swingBeat é crescente e fica dentro da batida (os 16avos acompanham o swing)', () => {
    let previous = -1
    for (let p = 0; p < 4; p += 0.0625) {
      const s = swingBeat(p)
      assert.ok(s > previous, `p=${p}`)
      assert.ok(Math.floor(s + 1e-9) === Math.floor(p + 1e-9), `p=${p} saiu da batida`)
      previous = s
    }
    assert.ok(swingBeat(0.75) > 0.75)
  })

  it('midiToHz e pitchClass', () => {
    assert.equal(midiToHz(69), 440)
    assert.ok(Math.abs(midiToHz(57) - 220) < 1e-9)
    assert.equal(pitchClass(60), 0)
    assert.equal(pitchClass(-1), 11)
  })
})

describe('score: harmonia', () => {
  it('três frases de 4 compassos formam um ciclo de 12, com 4 notas por acorde', () => {
    assert.equal(Object.keys(PHRASES).length, 3)
    assert.equal(SONG_BARS, 12)
    for (const phrase of Object.values(PHRASES)) assert.equal(phrase.length, 4)
    for (const slot of SONG) assert.equal(slot.chord.tones.length, 4)
  })

  it('acordes de sétima/nona: a terça e a sétima definem a qualidade', () => {
    for (const { chord } of SONG) {
      const intervals = chord.tones.map((t) => t % 12)
      assert.ok(intervals.includes(3) || intervals.includes(4), `${chord.name} sem terça`)
      assert.ok(intervals.includes(10) || intervals.includes(11), `${chord.name} sem sétima`)
      assert.ok(chord.tones.some((t) => t > 12), `${chord.name} sem nona`)
    }
  })

  it('voiceLead: classes de altura do acorde, em ordem, dentro da faixa e com no máximo uma segunda menor (o "crocante" 3ª+9ª do m9)', () => {
    let previous: number[] | null = null
    for (const { chord } of SONG) {
      const voicing = voiceLead(previous, chord)
      assert.equal(voicing.length, 4)
      assert.deepEqual(voicing.map(pitchClass).sort((a, b) => a - b), chordPcs(chord), chord.name)
      const gaps = voicing.slice(1).map((note, i) => note - voicing[i])
      assert.ok(gaps.every((gap) => gap >= 1), chord.name)
      assert.ok(gaps.filter((gap) => gap === 1).length <= 1, chord.name)
      assert.ok(voicing[0] >= VOICING_RANGE[0] && voicing[3] <= VOICING_RANGE[1], chord.name)
      assert.ok(voicing[3] - voicing[0] <= 16, `${chord.name} aberto demais`)
      previous = voicing
    }
  })

  it('a condução de vozes é suave em todas as emendas, inclusive do fim do ciclo para o começo', () => {
    let previous: number[] | null = null
    const all: number[][] = []
    for (let i = 0; i < SONG_BARS * 2; i++) {
      previous = voiceLead(previous, SONG[i % SONG_BARS].chord)
      all.push(previous)
    }
    for (let i = 1; i < all.length; i++) {
      const motion = all[i].reduce((sum, note, v) => sum + Math.abs(note - all[i - 1][v]), 0)
      assert.ok(motion <= 14, `compasso ${i}: ${motion} semitons de movimento`)
    }
  })

  it('o baixo fica entre Mi2 e Mib3', () => {
    for (let pc = 0; pc < 12; pc++) {
      const note = bassMidi(pc)
      assert.equal(pitchClass(note), pc)
      assert.ok(note >= 40 && note <= 51, `pc ${pc} -> ${note}`)
    }
  })

  it('melodia: só notas do acorde, dentro da faixa, com passos curtos', () => {
    const random = seeded(5)
    for (const { chord } of SONG) {
      const pool = leadPool(chord)
      assert.ok(pool.length >= 5)
      const pcs = new Set([chord.root, ...chord.tones.map((t) => (chord.root + t) % 12)])
      let note: number | null = null
      for (let i = 0; i < 200; i++) {
        const next = nextLeadNote(pool, note, random)
        assert.ok(next >= LEAD_RANGE[0] && next <= LEAD_RANGE[1])
        assert.ok(pcs.has(pitchClass(next)))
        if (note !== null) assert.ok(Math.abs(next - note) <= 12, 'salto grande demais')
        note = next
      }
    }
  })
})

describe('score: compositor', () => {
  it('é determinístico com o mesmo sorteio e muda com outro', () => {
    assert.deepEqual(bars(30, 3), bars(30, 3))
    assert.notDeepEqual(bars(30, 3), bars(30, 4))
  })

  it('segue o ciclo de 12 compassos: A, B, C, A, B, C...', () => {
    const list = bars(SONG_BARS * 3)
    list.forEach((bar, i) => {
      assert.equal(bar.index, i)
      assert.equal(bar.cycle, Math.floor(i / SONG_BARS))
      assert.equal(bar.chord, SONG[i % SONG_BARS].chord)
      assert.equal(bar.phrase, SONG[i % SONG_BARS].phrase)
    })
    assert.deepEqual(
      list.slice(0, SONG_BARS).map((b) => b.phrase),
      ['A', 'A', 'A', 'A', 'B', 'B', 'B', 'B', 'C', 'C', 'C', 'C'],
    )
  })

  it('entra em camadas: teclado, depois baixo e chimbal, depois bumbo e caixa', () => {
    const [b0, b1, b2] = bars(3)
    const kinds = (bar: Bar) => new Set(bar.events.map((e) => e.inst))
    assert.deepEqual([...kinds(b0)], ['keys'])
    assert.ok(kinds(b1).has('bass') && kinds(b1).has('hat'))
    assert.ok(!kinds(b1).has('kick') && !kinds(b1).has('snare'))
    assert.ok(kinds(b2).has('kick') && kinds(b2).has('snare'))
  })

  it('bateria: bumbo no 1, caixa nas batidas 2 e 4 (índices 1 e 3)', () => {
    for (const bar of bars(SONG_BARS * 2).slice(2)) {
      const at = (inst: string) => bar.events.filter((e) => e.inst === inst).map((e) => e.beat)
      assert.ok(at('kick').includes(0), `compasso ${bar.index}`)
      assert.ok(at('snare').includes(1) && at('snare').includes(3), `compasso ${bar.index}`)
    }
  })

  it('todo evento é válido e cada instrumento fica na sua faixa', () => {
    for (const bar of bars(SONG_BARS * 4, 9)) {
      assert.ok(bar.events.length > 0 && bar.events.length <= 45, `${bar.events.length} eventos`)
      for (const e of bar.events) {
        assert.ok(e.beat >= 0 && e.beat < 4, `beat ${e.beat}`)
        assert.ok(e.dur > 0 && e.vel > 0 && e.vel <= 1, `${e.inst} dur/vel`)
        assert.ok(Math.abs(e.nudge) < 0.08)
        if (e.inst === 'keys') {
          assert.ok(e.midi >= VOICING_RANGE[0] && e.midi <= VOICING_RANGE[1])
          assert.ok(bar.voicing.includes(e.midi))
        } else if (e.inst === 'bass') {
          assert.ok(e.midi >= 38 && e.midi <= 64, `baixo ${e.midi}`)
        } else if (e.inst === 'lead') {
          assert.ok(e.midi >= LEAD_RANGE[0] && e.midi <= LEAD_RANGE[1])
        } else {
          assert.equal(e.midi, 0)
        }
      }
    }
  })

  it('o baixo toca a fundamental do acorde no 1', () => {
    for (const bar of bars(SONG_BARS * 2).slice(1)) {
      const first = bar.events.find((e) => e.inst === 'bass' && e.beat === 0)
      assert.ok(first, `compasso ${bar.index}`)
      assert.equal(pitchClass(first.midi), bar.chord.root)
    }
  })

  it('há variação entre ciclos: bumbos, melodia e comp diferentes', () => {
    const list = bars(SONG_BARS * 6, 11).filter((b) => b.index >= 2)
    const kickShapes = new Set(list.map((b) => b.events.filter((e) => e.inst === 'kick').map((e) => e.beat).join()))
    const leadBars = list.filter((b) => b.events.some((e) => e.inst === 'lead')).length
    const compShapes = new Set(list.map((b) => b.events.filter((e) => e.inst === 'keys').map((e) => e.beat).join()))
    assert.ok(kickShapes.size >= 3, `${kickShapes.size} formas de bumbo`)
    assert.ok(compShapes.size >= 3, `${compShapes.size} formas de comp`)
    assert.ok(leadBars > 0 && leadBars < list.length, 'melodia vem e vai')
  })
})


describe('score: sequenciador com lookahead', () => {
  function drain(sequencer: Sequencer, until: number, step: number) {
    const out: ReturnType<Sequencer['pull']> = []
    for (let horizon = step; horizon <= until + 1e-9; horizon += step) {
      const pulled = sequencer.pull(horizon)
      for (const event of pulled) assert.ok(event.time < horizon + 1e-9, 'nota além do horizonte')
      out.push(...pulled)
    }
    return out
  }

  it('entrega cada nota uma vez, em ordem de tempo, qualquer que seja o passo do timer', () => {
    const run = (step: number) => {
      const sequencer = new Sequencer(new Composer(seeded(2)))
      sequencer.start(0)
      return drain(sequencer, 60, step)
    }
    const fine = run(0.25)
    const coarse = run(1.7) // timer atrasado: horizontes maiores, mesmas notas
    for (let i = 1; i < fine.length; i++) assert.ok(fine[i].time >= fine[i - 1].time - 1e-12)
    const key = (e: (typeof fine)[number]) => `${e.bar}|${e.inst}|${e.beat}|${e.midi}`
    const coarseKeys = coarse.map(key)
    // O último horizonte do passo grosso é 35 * 1.7 = 59.5: até lá as duas execuções coincidem.
    const fineKeys = fine.filter((e) => e.time < 59.5 - 1e-9).map(key)
    assert.deepEqual([...fineKeys].sort(), [...coarseKeys].sort())
    assert.equal(new Set(coarseKeys).size, coarseKeys.length, 'nota repetida')
  })

  it('os compassos caem em start + n * BAR_S exatos (sem deriva em 10 minutos de música)', () => {
    const sequencer = new Sequencer(new Composer(seeded(6)))
    const start = 12.5
    sequencer.start(start)
    const events = drain(sequencer, 600, 0.4)
    const downbeats = events.filter((e) => e.inst === 'keys' && e.beat === 0 && e.time - e.nudge > start)
    assert.ok(downbeats.length > 150)
    for (const e of downbeats) {
      const expected = start + e.bar * BAR_S
      assert.ok(Math.abs(e.time - e.nudge - expected) < 1e-6, `compasso ${e.bar}`)
    }
  })

  it('nenhuma nota começa antes do ponto de partida e o swing atrasa o contratempo', () => {
    const sequencer = new Sequencer(new Composer(seeded(8)))
    sequencer.start(5)
    const events = drain(sequencer, 40, 0.25)
    assert.ok(events.every((e) => e.time >= 5))
    const hat = events.find((e) => e.inst === 'hat' && e.beat === 0.5 && e.bar >= 2)
    assert.ok(hat)
    assert.ok(Math.abs(hat.time - hat.nudge - (5 + hat.bar * BAR_S + (0.5 + SWING) * BEAT_S)) < 1e-9)
  })

  it('o lookahead gera só o necessário: nada de pré-gerar a música inteira', () => {
    const sequencer = new Sequencer(new Composer(seeded(1)))
    sequencer.start(0)
    const first = sequencer.pull(1.6)
    // Em 1.6 s só o primeiro compasso (3.2 s) existe, e poucas notas já começaram.
    assert.ok(first.length > 0 && first.length < 20)
    assert.ok(first.every((e) => e.bar === 0))
  })

  it('resume continua a grade se ainda há compasso agendado e recomeça se a pausa foi longa', () => {
    const sequencer = new Sequencer(new Composer(seeded(3)))
    sequencer.start(0)
    sequencer.pull(2) // gerou o compasso 0 (0 a 3.2 s): o próximo começa em 3.2
    sequencer.resume(2.5) // pausa curta: segue a mesma grade, sem notas dobradas
    const next = sequencer.pull(8)
    const downbeat = next.find((e) => e.bar === 1 && e.inst === 'keys' && e.beat === 0)
    assert.ok(downbeat)
    assert.ok(Math.abs(downbeat.time - downbeat.nudge - BAR_S) < 1e-9)

    sequencer.resume(100) // pausa longa: grade nova a partir de 100
    const after = sequencer.pull(104)
    assert.ok(after.length > 0 && after.every((e) => e.time >= 100))
  })
})
