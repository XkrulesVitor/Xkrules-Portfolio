import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { fillBrown, fillWhite, rms } from '../noise.ts'

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

describe('noise: ruído branco', () => {
  it('fica em [-1, 1] com média perto de zero e RMS de ruído uniforme (~0.577)', () => {
    const data = new Float32Array(50_000)
    fillWhite(data, seeded(1))
    let sum = 0
    for (const v of data) {
      assert.ok(v >= -1 && v <= 1)
      sum += v
    }
    assert.ok(Math.abs(sum / data.length) < 0.02)
    assert.ok(Math.abs(rms(data) - Math.sqrt(1 / 3)) < 0.01)
  })
})

describe('noise: ruído marrom', () => {
  it('é normalizado para o RMS pedido, qualquer que seja o sorteio', () => {
    for (const seed of [1, 2, 3]) {
      const data = new Float32Array(44_100)
      fillBrown(data, seeded(seed), 0.2)
      assert.ok(Math.abs(rms(data) - 0.2) < 1e-4)
    }
  })

  it('o loop não dá estalo: a emenda (fim -> começo) é tão suave quanto o resto do sinal', () => {
    const data = new Float32Array(44_100)
    fillBrown(data, seeded(7), 0.2)
    // Passo típico entre amostras vizinhas no interior (marrom é "lento").
    let sum = 0
    for (let i = 1; i < data.length; i++) sum += Math.abs(data[i] - data[i - 1])
    const typicalStep = sum / (data.length - 1)
    const seam = Math.abs(data[0] - data[data.length - 1])
    assert.ok(seam < typicalStep * 6, `emenda ${seam} vs passo típico ${typicalStep}`)
  })

  it('é bem mais grave que o branco: varia pouco de uma amostra para a outra', () => {
    const brown = new Float32Array(20_000)
    const white = new Float32Array(20_000)
    fillBrown(brown, seeded(3), 0.2)
    fillWhite(white, seeded(3))
    const roughness = (d: Float32Array) => {
      let s = 0
      for (let i = 1; i < d.length; i++) s += Math.abs(d[i] - d[i - 1])
      return s / (d.length - 1) / rms(d)
    }
    assert.ok(roughness(brown) < roughness(white) / 5)
  })

  it('buffers minúsculos não quebram', () => {
    const tiny = new Float32Array(3)
    fillBrown(tiny, seeded(1))
    assert.equal(tiny.length, 3)
    fillBrown(new Float32Array(0), seeded(1))
  })
})
