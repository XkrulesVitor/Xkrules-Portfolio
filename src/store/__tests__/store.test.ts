import { beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { useExperienceStore } from '../useExperienceStore.ts'

// Rodar: npm test  (node --test com type stripping nativo; zero dependências extras).

const initial = useExperienceStore.getState()
const get = () => useExperienceStore.getState()

beforeEach(() => {
  useExperienceStore.setState(initial, true)
})

function toIdle() {
  get().setMode('intro')
  get().onCameraRest()
}

describe('store: máquina de estados', () => {
  it('começa em loading, sem foco nem hover', () => {
    assert.equal(get().mode, 'loading')
    assert.equal(get().focus, null)
    assert.equal(get().hovered, null)
    assert.equal(get().highlightBox, null)
  })

  it('intro -> idle via onCameraRest', () => {
    get().setMode('intro')
    get().onCameraRest()
    assert.equal(get().mode, 'idle')
  })

  it('guarda 1: requestFocus aceito em idle, intro e no voo de volta; ignorado no resto', () => {
    get().requestFocus('desk')
    assert.equal(get().mode, 'loading') // loading: ignorado
    toIdle()
    get().requestFocus('desk')
    assert.equal(get().mode, 'transitioning')
    assert.equal(get().focus, 'desk')
    // spam durante o voo rumo a outro hotspot é ignorado
    get().requestFocus('printer')
    assert.equal(get().focus, 'desk')
    get().onCameraRest()
    assert.equal(get().mode, 'focused')
    get().requestFocus('printer') // focused: ignorado (precisa voltar antes)
    assert.equal(get().focus, 'desk')
    // voo de volta (transitioning, focus null): aceito
    get().requestHome()
    get().requestFocus('printer')
    assert.equal(get().mode, 'transitioning')
    assert.equal(get().focus, 'printer')
    // intro: aceito
    useExperienceStore.setState(initial, true)
    get().setMode('intro')
    get().requestFocus('shelf')
    assert.equal(get().mode, 'transitioning')
    assert.equal(get().focus, 'shelf')
  })

  it('transitioning(focus) -> focused via onCameraRest', () => {
    toIdle()
    get().requestFocus('shelf')
    get().onCameraRest()
    assert.equal(get().mode, 'focused')
    assert.equal(get().focus, 'shelf')
  })

  it('guarda 2: requestHome aceito em focused e em transitioning', () => {
    toIdle()
    get().requestFocus('chair')
    get().requestHome() // cancela a entrada
    assert.equal(get().mode, 'transitioning')
    assert.equal(get().focus, null)
    get().onCameraRest()
    assert.equal(get().mode, 'idle')

    get().requestFocus('chair')
    get().onCameraRest()
    assert.equal(get().mode, 'focused')
    get().requestHome()
    assert.equal(get().mode, 'transitioning')
    assert.equal(get().focus, null)
  })

  it('requestHome em idle/loading é ignorado', () => {
    get().requestHome()
    assert.equal(get().mode, 'loading')
    toIdle()
    get().requestHome()
    assert.equal(get().mode, 'idle')
  })

  it('guarda 3: hovered só existe em idle', () => {
    get().setHovered('desk')
    assert.equal(get().hovered, null) // loading
    toIdle()
    get().setHovered('desk')
    assert.equal(get().hovered, 'desk')
    get().requestFocus('desk')
    assert.equal(get().hovered, null)
    get().setHovered('printer')
    assert.equal(get().hovered, null) // transitioning
    get().onCameraRest()
    get().setHovered('printer')
    assert.equal(get().hovered, null) // focused
  })

  it('guarda 3: setMode fora de idle limpa hovered', () => {
    toIdle()
    get().setHovered('chair')
    get().setMode('transitioning')
    assert.equal(get().hovered, null)
  })

  it('onCameraRest é no-op fora de transitioning/intro', () => {
    toIdle()
    get().onCameraRest()
    assert.equal(get().mode, 'idle')
    get().requestFocus('desk')
    get().onCameraRest()
    get().onCameraRest()
    assert.equal(get().mode, 'focused')
  })

  it('setMode(focused) sem foco é ignorado', () => {
    toIdle()
    get().setMode('focused')
    assert.equal(get().mode, 'idle')
  })

  it('highlightBox só em focused e some ao voltar', () => {
    toIdle()
    get().setHighlightBox('peter')
    assert.equal(get().highlightBox, null)
    get().requestFocus('shelf')
    get().onCameraRest()
    get().setHighlightBox('peter')
    assert.equal(get().highlightBox, 'peter')
    get().requestHome()
    assert.equal(get().highlightBox, null)
  })

  it('requestFocus guarda a sub-vista pedida (null = padrão)', () => {
    toIdle()
    get().requestFocus('shelf', 'digital')
    assert.equal(get().focus, 'shelf')
    assert.equal(get().view, 'digital')
    get().onCameraRest()
    get().requestHome()
    assert.equal(get().view, null)
    get().onCameraRest()
    get().requestFocus('desk')
    assert.equal(get().view, null)
  })

  it('setView só em focused, sem sair do foco, e limpa o highlightBox', () => {
    toIdle()
    get().setView('digital')
    assert.equal(get().view, null) // idle: ignorado
    get().requestFocus('shelf')
    get().setView('digital')
    assert.equal(get().view, null) // transitioning: ignorado
    get().onCameraRest()
    get().setHighlightBox('terra')
    get().setView('digital')
    assert.equal(get().mode, 'focused')
    assert.equal(get().focus, 'shelf')
    assert.equal(get().view, 'digital')
    assert.equal(get().highlightBox, null)
    get().setView('tabuleiro')
    assert.equal(get().view, 'tabuleiro')
  })

  it('toggleAudio e setQuality', () => {
    get().toggleAudio()
    assert.equal(get().audioEnabled, true)
    get().setQuality('low')
    assert.equal(get().quality, 'low')
  })

  it('subscribeWithSelector notifica só quando o slice muda', () => {
    toIdle()
    const seen: string[] = []
    const unsub = useExperienceStore.subscribe(
      (s) => s.mode,
      (mode) => seen.push(mode),
    )
    get().setHovered('desk') // mode não muda
    get().requestFocus('desk')
    get().onCameraRest()
    unsub()
    assert.deepEqual(seen, ['transitioning', 'focused'])
  })
})
