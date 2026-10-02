import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { TICK_OVERSHOOT, TWO_PI, handAngles } from '../clockMath.ts'
import { interactionTarget, isFocused, resolveInteraction } from '../hotspotActivity.ts'
import { tokenizeLine } from '../screens/codeHighlight.ts'

// Rodar: npm test  (node --test com type stripping nativo).
// Testa a lógica pura da V.3: congelamento da interação em `transitioning`, ângulos do relógio e o
// tokenizador do editor de código.

const idle = { mode: 'idle', focus: null, hovered: null } as const

describe('interactionTarget: interação de hotspot congelada em transitioning', () => {
  it('hover em idle liga só o hotspot sob o ponteiro', () => {
    assert.equal(interactionTarget({ ...idle, hovered: 'chair' }, 'chair'), true)
    assert.equal(interactionTarget({ ...idle, hovered: 'chair' }, 'desk'), false)
    assert.equal(interactionTarget(idle, 'chair'), false)
  })

  it('em focused liga o hotspot em foco e só ele', () => {
    const focused = { mode: 'focused', focus: 'shelf', hovered: null } as const
    assert.equal(interactionTarget(focused, 'shelf'), true)
    assert.equal(interactionTarget(focused, 'chair'), false)
  })

  it('em transitioning é null (congelado), indo ou voltando', () => {
    assert.equal(interactionTarget({ mode: 'transitioning', focus: 'chair', hovered: null }, 'chair'), null)
    assert.equal(interactionTarget({ mode: 'transitioning', focus: null, hovered: null }, 'chair'), null)
  })

  it('resolveInteraction mantém o valor anterior em transitioning', () => {
    const flying = { mode: 'transitioning', focus: 'chair', hovered: null } as const
    assert.equal(resolveInteraction(flying, 'chair', true), true)
    assert.equal(resolveInteraction(flying, 'chair', false), false)
    assert.equal(resolveInteraction(idle, 'chair', true), false) // idle resolve de verdade
  })

  it('isFocused só vale com a câmera parada no hotspot', () => {
    assert.equal(isFocused({ mode: 'focused', focus: 'printer' }, 'printer'), true)
    assert.equal(isFocused({ mode: 'transitioning', focus: 'printer' }, 'printer'), false)
    assert.equal(isFocused({ mode: 'focused', focus: 'printer' }, 'desk'), false)
  })
})

describe('handAngles: relógio com a hora real', () => {
  // 2026-10-01 22:26:03 em UTC-3 (offset de getTimezoneOffset = +180 min) = 01:26:03 UTC do dia 02.
  const utcMs = Date.UTC(2026, 9, 2, 1, 26, 3, 500)
  const offsetMs = 180 * 60_000

  it('hora, minuto e segundo batem com o horário local', () => {
    const a = handAngles(utcMs, offsetMs)
    const hours = (22 % 12) + 26 / 60 + 3 / 3600
    assert.ok(Math.abs(a.hour - (hours / 12) * TWO_PI) < 1e-6)
    assert.ok(Math.abs(a.minute - ((26 + 3 / 60) / 60) * TWO_PI) < 1e-6)
    // Segundo 3 + meio segundo de tique: o overshoot já decaiu quase todo.
    assert.ok(Math.abs(a.second - (3 / 60) * TWO_PI) < 0.01)
  })

  it('o ponteiro dos segundos passa do ponto logo depois do tique e assenta', () => {
    const base = Date.UTC(2026, 9, 2, 1, 26, 3, 0)
    const atTick = handAngles(base, offsetMs).second
    const rest = (3 / 60) * TWO_PI
    assert.ok(atTick > rest, 'logo após o salto fica à frente da posição de repouso')
    assert.ok(Math.abs(atTick - rest - TICK_OVERSHOOT) < 1e-9)
    const settled = handAngles(base + 900, offsetMs).second
    assert.ok(Math.abs(settled - rest) < 1e-3)
  })

  it('meia-noite local: tudo em zero (sem ângulo negativo)', () => {
    const midnight = Date.UTC(2026, 9, 2, 3, 0, 0, 0) // 00:00 em UTC-3
    const a = handAngles(midnight, offsetMs)
    assert.equal(a.hour, 0)
    assert.equal(a.minute, 0)
    assert.ok(a.second >= 0)
  })
})

describe('tokenizeLine: coloração do editor', () => {
  const kinds = (line: string) => tokenizeLine(line).filter((t) => t.text.trim() !== '').map((t) => [t.text, t.kind])

  it('palavra-chave, string e função', () => {
    assert.deepEqual(kinds("import { damp } from 'maath/easing'"), [
      ['import', 'keyword'],
      ['{', 'punct'],
      ['damp', 'plain'],
      ['}', 'punct'],
      ['from', 'keyword'],
      ["'maath/easing'", 'string'],
    ])
    assert.deepEqual(kinds('useFrame(dt)')[0], ['useFrame', 'function'])
  })

  it('comentário vai até o fim da linha', () => {
    assert.deepEqual(kinds('const a = 1 // tudo isto é comentário'), [
      ['const', 'keyword'],
      ['a', 'plain'],
      ['=', 'punct'],
      ['1', 'number'],
      ['// tudo isto é comentário', 'comment'],
    ])
  })

  it('tag JSX e componente', () => {
    assert.deepEqual(kinds('<BakedRoom />')[0], ['<BakedRoom', 'tag'])
  })

  it('as colunas dos tokens cobrem a linha inteira, sem sobrepor', () => {
    const line = "    damp(mix, 'value', night, 0.45, dt)"
    let col = 0
    for (const token of tokenizeLine(line)) {
      assert.equal(token.col, col)
      col += token.text.length
    }
    assert.equal(col, line.length)
  })
})
