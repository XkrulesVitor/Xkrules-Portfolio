import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  AMBIENT_CUTOFF_HZ,
  FAN_CURVE,
  ambientCutoffHz,
  ambientLevel,
  clamp01,
  fanLevel,
  pitchRatio,
  smoothstep,
  staticLevel,
  toDb,
} from '../mix.ts'

// Rodar: npm test  (node --test com type stripping nativo).

const samples = [0, 0.5, 1, 1.5, 2, 3, 4.7, 6, 9.3, 12, 14, 16.1, 25, 1000]

describe('mix: curvas de distância', () => {
  it('a ventoinha cai com a distância: máxima junto do PC, resto de presença longe', () => {
    assert.equal(fanLevel(0), 1)
    assert.equal(fanLevel(FAN_CURVE.near), 1)
    assert.equal(fanLevel(FAN_CURVE.far), FAN_CURVE.floor)
    assert.equal(fanLevel(100), FAN_CURVE.floor)
    for (let i = 1; i < samples.length; i++) {
      assert.ok(fanLevel(samples[i]) <= fanLevel(samples[i - 1]) + 1e-12, `fan @ ${samples[i]}`)
    }
  })

  it('o ambiente SOBE com a distância ao centro e nunca passa de 1 nem some', () => {
    for (let i = 1; i < samples.length; i++) {
      assert.ok(ambientLevel(samples[i]) >= ambientLevel(samples[i - 1]) - 1e-12, `amb @ ${samples[i]}`)
    }
    assert.equal(ambientLevel(100), 1)
    assert.ok(ambientLevel(0) > 0)
  })

  it('a estática cai com a distância à TV mas sempre se ouve', () => {
    assert.equal(staticLevel(0), 1)
    assert.ok(staticLevel(100) > 0.3)
    assert.ok(staticLevel(6) < staticLevel(2.5))
  })

  it('todos os níveis ficam em [0, 1], mesmo com entradas absurdas', () => {
    for (const d of [...samples, -5, Infinity, NaN]) {
      for (const f of [fanLevel, ambientLevel, staticLevel]) {
        const v = f(d)
        assert.ok(v >= 0 && v <= 1, `${f.name}(${d}) = ${v}`)
      }
    }
  })

  it('distância inválida (NaN) conta como "longe", nunca como perto', () => {
    assert.equal(fanLevel(NaN), fanLevel(100))
    assert.equal(ambientLevel(NaN), ambientLevel(100))
  })

  it('valores de referência dos presets: desk perto do PC, home quase mudo', () => {
    // Distâncias câmera -> PC medidas nos presets (desk ~2.1 m, cadeira ~4.7 m, impressora ~9 m, home ~16 m).
    assert.ok(fanLevel(2.1) > 0.95)
    assert.ok(fanLevel(4.7) > 0.4 && fanLevel(4.7) < 0.8)
    assert.ok(fanLevel(9.3) < 0.25)
    assert.ok(fanLevel(16.1) < 0.06)
  })
})

describe('mix: utilitários', () => {
  it('clamp01 e smoothstep', () => {
    assert.equal(clamp01(-1), 0)
    assert.equal(clamp01(2), 1)
    assert.equal(smoothstep(0, 10, 0), 0)
    assert.equal(smoothstep(0, 10, 5), 0.5)
    assert.equal(smoothstep(0, 10, 99), 1)
  })

  it('o corte do ambiente acompanha o nível entre o mínimo e o máximo', () => {
    assert.equal(ambientCutoffHz(0), AMBIENT_CUTOFF_HZ.min)
    assert.equal(ambientCutoffHz(1), AMBIENT_CUTOFF_HZ.max)
    assert.ok(ambientCutoffHz(0.7) > AMBIENT_CUTOFF_HZ.min && ambientCutoffHz(0.7) < AMBIENT_CUTOFF_HZ.max)
  })

  it('pitchRatio varia dentro de ±spread e vale 1 no meio do sorteio', () => {
    assert.equal(pitchRatio(() => 0.5, 200), 1)
    const hi = pitchRatio(() => 1, 1200)
    const lo = pitchRatio(() => 0, 1200)
    assert.ok(Math.abs(hi - 2) < 1e-9)
    assert.ok(Math.abs(lo - 0.5) < 1e-9)
  })

  it('toDb', () => {
    assert.equal(toDb(1), 0)
    assert.ok(Math.abs(toDb(0.5) + 6.0206) < 1e-3)
    assert.equal(toDb(0), -Infinity)
  })
})
