import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Color } from 'three'
import { acesCompensatedBackground, acesFilmic, inverseAcesFilmic } from '../greyboxBackground.ts'

// Rodar: npm test. O fundo do grey-box com composer passa pelo ACES do ToneMapping; a cor enviada
// ao composer é a inversa numérica do ACES, e a saída tem de voltar ao `#0b1020`.

describe('greyboxBackground: inversa do ACES', () => {
  it('acesFilmic é crescente e preso em [0, 1]', () => {
    let prev = -1
    for (const v of [0, 0.001, 0.01, 0.05, 0.2, 0.5, 1, 4, 16]) {
      const [r] = acesFilmic([v, v, v])
      assert.ok(r >= prev, `monotonia em ${v}`)
      assert.ok(r >= 0 && r <= 1)
      prev = r
    }
  })

  it('inverseAcesFilmic leva o alvo de volta ao alvo', () => {
    for (const target of [
      [0.0033, 0.0052, 0.0144],
      [0.1, 0.2, 0.3],
      [0.5, 0.4, 0.3],
    ] as const) {
      const x = inverseAcesFilmic([...target])
      const y = acesFilmic(x)
      for (let c = 0; c < 3; c++) assert.ok(Math.abs(y[c] - target[c]) < 1e-3, `canal ${c} de ${target}: ${y[c]}`)
    }
  })

  it('o fundo #0b1020 atravessa o ACES e sai #0b1020', () => {
    const bg = acesCompensatedBackground('#0b1020')
    const out = acesFilmic([bg.r, bg.g, bg.b])
    const wanted = new Color('#0b1020')
    assert.ok(Math.abs(out[0] - wanted.r) < 1e-3)
    assert.ok(Math.abs(out[1] - wanted.g) < 1e-3)
    assert.ok(Math.abs(out[2] - wanted.b) < 1e-3)
    // e é mais claro que o fundo cru (o ACES o esmagaria)
    assert.ok(bg.b > wanted.b)
  })
})
