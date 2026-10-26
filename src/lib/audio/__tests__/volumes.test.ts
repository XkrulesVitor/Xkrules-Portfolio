import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_VOLUMES,
  SOUND_CATEGORIES,
  SOUND_PREFS_KEY,
  busGain,
  changedVolumes,
  clampVolume,
  initialSound,
  normalizeVolume,
  parseSoundPrefs,
  readSoundPrefs,
  serializeSoundPrefs,
  writeSoundPrefs,
  type KeyValueStorage,
} from '../volumes.ts'

// Rodar: npm test  (node --test com type stripping nativo).

class FakeStorage implements KeyValueStorage {
  data = new Map<string, string>()
  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }
}

const brokenStorage: KeyValueStorage = {
  getItem() {
    throw new Error('bloqueado')
  },
  setItem() {
    throw new Error('cota cheia')
  },
}

describe('volumes: padrões e limites', () => {
  it('padrões pedidos: música 0.35, ambiente 0.5, efeitos 0.8', () => {
    assert.deepEqual({ ...DEFAULT_VOLUMES }, { music: 0.35, ambient: 0.5, effects: 0.8 })
    assert.deepEqual([...SOUND_CATEGORIES], ['music', 'ambient', 'effects'])
  })

  it('clampVolume limita a 0..1 e trata lixo como 0', () => {
    assert.equal(clampVolume(-1), 0)
    assert.equal(clampVolume(2), 1)
    assert.equal(clampVolume(0.4), 0.4)
    assert.equal(clampVolume(NaN), 0)
  })

  it('normalizeVolume arredonda em passos de 1%', () => {
    assert.equal(normalizeVolume(0.3456), 0.35)
    assert.equal(normalizeVolume(7), 1)
  })
})

describe('volumes: curva de ganho dos buses', () => {
  it('no volume padrão o ganho é 1 (a mixagem calibrada vale), e 0 é silêncio exato', () => {
    for (const c of SOUND_CATEGORIES) {
      assert.ok(Math.abs(busGain(c, DEFAULT_VOLUMES[c]) - 1) < 1e-12, c)
      assert.equal(busGain(c, 0), 0)
    }
  })

  it('cresce sempre com o volume e cai com o quadrado abaixo do padrão', () => {
    for (const c of SOUND_CATEGORIES) {
      let previous = -1
      for (let v = 0; v <= 1.0001; v += 0.05) {
        const g = busGain(c, v)
        assert.ok(g > previous || (g === 0 && previous === -1), `${c} @ ${v}`)
        previous = g
      }
      assert.ok(Math.abs(busGain(c, DEFAULT_VOLUMES[c] / 2) - 0.25) < 1e-12)
    }
  })

  it('entradas absurdas não estouram: acima de 1 vale como 1, NaN vale 0', () => {
    assert.equal(busGain('music', 5), busGain('music', 1))
    assert.equal(busGain('effects', NaN), 0)
    assert.equal(busGain('ambient', -3), 0)
  })
})

describe('volumes: preferência salva', () => {
  it('ida e volta sem perda', () => {
    const prefs = { muted: false, volumes: { music: 0.6, effects: 0.2 } }
    assert.deepEqual(parseSoundPrefs(serializeSoundPrefs(prefs)), prefs)
  })

  it('texto quebrado, vazio ou de outro tipo vira "nada salvo"', () => {
    for (const raw of [null, undefined, '', '{', 'null', '42', '"x"', '[]']) {
      assert.deepEqual(parseSoundPrefs(raw), {}, String(raw))
    }
  })

  it('descarta campos inválidos, limita volumes e ignora chaves estranhas', () => {
    const raw = JSON.stringify({
      muted: 'sim',
      volumes: { music: 9, ambient: 'alto', effects: -2, outro: 1 },
      extra: true,
    })
    assert.deepEqual(parseSoundPrefs(raw), { volumes: { music: 1, effects: 0 } })
  })

  it('lê e grava no storage com a chave do site', () => {
    const storage = new FakeStorage()
    assert.deepEqual(readSoundPrefs(storage), {})
    writeSoundPrefs({ muted: true, volumes: { music: 0.5 } }, storage)
    assert.ok(storage.data.has(SOUND_PREFS_KEY))
    assert.deepEqual(readSoundPrefs(storage), { muted: true, volumes: { music: 0.5 } })
  })

  it('sem storage, ou com storage que lança, a página segue sem preferência (nunca lança)', () => {
    assert.deepEqual(readSoundPrefs(null), {})
    assert.deepEqual(readSoundPrefs(brokenStorage), {})
    assert.doesNotThrow(() => writeSoundPrefs({ muted: false }, null))
    assert.doesNotThrow(() => writeSoundPrefs({ muted: false }, brokenStorage))
  })

  it('initialSound: sem escolha entra mudo mas "livre" para ligar sozinho; com escolha respeita', () => {
    const fresh = initialSound({})
    assert.equal(fresh.muted, true)
    assert.equal(fresh.soundChosen, false)
    assert.deepEqual(fresh.volumes, { ...DEFAULT_VOLUMES })

    const mutedBefore = initialSound({ muted: true })
    assert.equal(mutedBefore.muted, true)
    assert.equal(mutedBefore.soundChosen, true)

    const onBefore = initialSound({ muted: false, volumes: { music: 0.1 } })
    assert.equal(onBefore.muted, false)
    assert.equal(onBefore.soundChosen, true)
    assert.deepEqual(onBefore.volumes, { ...DEFAULT_VOLUMES, music: 0.1 })
  })

  it('changedVolumes guarda só o que difere do padrão', () => {
    assert.deepEqual(changedVolumes({ ...DEFAULT_VOLUMES }), {})
    assert.deepEqual(changedVolumes({ ...DEFAULT_VOLUMES, ambient: 0.9 }), { ambient: 0.9 })
  })
})
