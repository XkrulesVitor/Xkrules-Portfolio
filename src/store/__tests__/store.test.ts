import { afterEach, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_VOLUMES, SOUND_PREFS_KEY } from '../../lib/audio/volumes.ts'
import { LOCALE_STORAGE_KEY } from '../../lib/locale.ts'
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
    get().setHighlightBox('piter')
    assert.equal(get().highlightBox, null)
    get().requestFocus('shelf')
    get().onCameraRest()
    get().setHighlightBox('piter')
    assert.equal(get().highlightBox, 'piter')
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
    get().setHighlightBox('aldeia_dorme')
    get().setView('digital')
    assert.equal(get().mode, 'focused')
    assert.equal(get().focus, 'shelf')
    assert.equal(get().view, 'digital')
    assert.equal(get().highlightBox, null)
    get().setView('tabuleiro')
    assert.equal(get().view, 'tabuleiro')
  })

  it('setQuality troca a qualidade', () => {
    get().setQuality('low')
    assert.equal(get().quality, 'low')
  })

  it('som: começa mudo e toggleMuted alterna mudo <-> ligado', () => {
    assert.equal(get().muted, true) // padrão: mudo (o AudioContext só nasce no 1º clique do botão)
    get().toggleMuted()
    assert.equal(get().muted, false)
    get().toggleMuted()
    assert.equal(get().muted, true)
  })

  it('som: o mudo independe do modo, do foco, da vista e do tema', () => {
    get().toggleMuted() // loading: vale
    assert.equal(get().muted, false)
    toIdle()
    get().toggleTheme()
    get().setHovered('shelf')
    get().requestFocus('shelf', 'digital')
    get().onCameraRest()
    get().setView('tabuleiro')
    get().requestHome()
    get().onCameraRest()
    assert.equal(get().muted, false) // nada disso mexe no som
    get().toggleMuted() // focused/idle: também vale
    assert.equal(get().muted, true)
  })

  it('subscribeWithSelector do mudo notifica a cada toggle', () => {
    const seen: boolean[] = []
    const unsub = useExperienceStore.subscribe(
      (s) => s.muted,
      (muted) => seen.push(muted),
    )
    get().toggleMuted()
    get().setHovered('desk') // outro slice: não notifica
    get().toggleMuted()
    unsub()
    assert.deepEqual(seen, [false, true])
  })

  it('tema: começa em night e toggleTheme alterna night <-> day em qualquer modo', () => {
    assert.equal(get().theme, 'night')
    get().toggleTheme() // loading: o tema independe do modo
    assert.equal(get().theme, 'day')
    toIdle()
    get().toggleTheme()
    assert.equal(get().theme, 'night')
    get().requestFocus('desk')
    get().onCameraRest()
    get().toggleTheme() // focused também
    assert.equal(get().theme, 'day')
  })

  it('tema não é mexido por foco, volta para home nem hover', () => {
    toIdle()
    get().toggleTheme()
    get().setHovered('desk')
    get().requestFocus('desk')
    get().onCameraRest()
    get().requestHome()
    get().onCameraRest()
    assert.equal(get().theme, 'day')
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

  it('subscribeWithSelector do tema notifica a cada toggle', () => {
    const seen: string[] = []
    const unsub = useExperienceStore.subscribe(
      (s) => s.theme,
      (theme) => seen.push(theme),
    )
    get().toggleTheme()
    get().toggleTheme()
    unsub()
    assert.deepEqual(seen, ['day', 'night'])
  })
})

describe('store: jogo na TV e app no PC', () => {
  function toShelfDigital() {
    toIdle()
    get().requestFocus('shelf', 'digital')
    get().onCameraRest()
  }

  it('startGame só vale com a zona de jogos em foco na vista digital', () => {
    toIdle()
    get().startGame('porriland')
    assert.equal(get().playing, null) // idle
    get().requestFocus('shelf')
    get().onCameraRest()
    get().startGame('porriland')
    assert.equal(get().playing, null) // vista tabuleiro
    get().setView('digital')
    get().setHighlightBox('porriland')
    get().startGame('porriland')
    assert.equal(get().playing, 'porriland')
    assert.equal(get().highlightBox, null) // o painel sai: nenhum destaque preso
  })

  it('stopGame, troca de vista e volta para HOME desligam o jogo', () => {
    toShelfDigital()
    get().startGame('piter')
    get().stopGame()
    assert.equal(get().playing, null)
    assert.equal(get().highlightBox, null)
    assert.equal(get().mode, 'focused')
    assert.equal(get().view, 'digital')

    get().startGame('piter')
    get().setView('tabuleiro')
    assert.equal(get().playing, null)

    get().setView('digital')
    get().startGame('racco')
    get().requestHome()
    assert.equal(get().playing, null)
    assert.equal(get().mode, 'transitioning')
  })

  it('openOnPc voa direto para a mesa e numera cada pedido', () => {
    toShelfDigital()
    get().startGame('o_anel')
    get().openOnPc('memory')
    assert.equal(get().mode, 'transitioning')
    assert.equal(get().focus, 'desk')
    assert.equal(get().view, null)
    assert.equal(get().playing, null)
    assert.deepEqual(get().pcLaunch, { app: 'memory', id: 1 })

    get().openOnPc('memory') // em voo: ignorado
    assert.equal(get().pcLaunch?.id, 1)

    get().onCameraRest()
    get().openOnPc('memory') // mesa já em foco: só reabre
    assert.equal(get().mode, 'focused')
    assert.equal(get().focus, 'desk')
    assert.equal(get().pcLaunch?.id, 2)
  })

  it('openOnPc de idle também vai para a mesa; em loading é ignorado', () => {
    get().openOnPc('memory')
    assert.equal(get().pcLaunch, null)
    toIdle()
    get().openOnPc('memory')
    assert.equal(get().focus, 'desk')
    assert.equal(get().mode, 'transitioning')
  })
})

describe('store: volumes e preferência de som', () => {
  // O store grava em `window.localStorage` (só existe no browser); aqui entra um falso.
  const bag = new Map<string, string>()
  const fakeWindow = {
    localStorage: {
      getItem: (key: string) => bag.get(key) ?? null,
      setItem: (key: string, value: string) => void bag.set(key, value),
    },
  }
  const globals = globalThis as { window?: unknown }
  const saved = () => JSON.parse(bag.get(SOUND_PREFS_KEY) ?? '{}')

  beforeEach(() => {
    bag.clear()
    globals.window = fakeWindow
  })
  afterEach(() => {
    delete globals.window
  })

  it('começa com os volumes padrão (música baixinha) e sem escolha de som', () => {
    assert.deepEqual({ ...get().volumes }, { ...DEFAULT_VOLUMES })
    assert.equal(get().volumes.music, 0.35)
    assert.equal(get().soundChosen, false)
  })

  it('setVolume limita a 0..1, arredonda em 1% e mexe só na categoria pedida', () => {
    get().setVolume('music', 0.6)
    assert.deepEqual({ ...get().volumes }, { ...DEFAULT_VOLUMES, music: 0.6 })
    get().setVolume('ambient', 7)
    assert.equal(get().volumes.ambient, 1)
    get().setVolume('effects', -3)
    assert.equal(get().volumes.effects, 0)
    get().setVolume('music', 0.3456)
    assert.equal(get().volumes.music, 0.35)
  })

  it('subscribeWithSelector dos volumes notifica só quando o valor muda', () => {
    const seen: number[] = []
    const unsub = useExperienceStore.subscribe(
      (s) => s.volumes,
      (volumes) => seen.push(volumes.music),
    )
    get().setVolume('music', 0.5)
    get().setVolume('music', 0.5) // igual: nada
    get().setHovered('desk') // outro slice: nada
    get().setVolume('music', 0.2)
    unsub()
    assert.deepEqual(seen, [0.5, 0.2])
  })

  it('o volume independe do modo, do foco, do jogo na TV e do mudo', () => {
    get().setVolume('ambient', 0.9)
    toIdle()
    get().requestFocus('shelf', 'digital')
    get().onCameraRest()
    get().startGame('piter')
    get().toggleMuted()
    get().stopGame()
    get().requestHome()
    assert.equal(get().volumes.ambient, 0.9)
    assert.equal(get().muted, false)
  })

  it('grava só o que o visitante mudou, no localStorage', () => {
    assert.equal(bag.size, 0)
    get().setVolume('music', 0.6)
    assert.deepEqual(saved(), { volumes: { music: 0.6 } }) // sem mudo escolhido: nada de "muted"
    get().toggleMuted()
    assert.deepEqual(saved(), { muted: false, volumes: { music: 0.6 } })
    get().setVolume('music', DEFAULT_VOLUMES.music) // volta ao padrão: sai do arquivo
    assert.deepEqual(saved(), { muted: false })
  })

  it('toggleMuted marca a escolha: o "Entrar" não liga o som por cima dela', () => {
    get().toggleMuted() // ligou
    get().toggleMuted() // silenciou de propósito
    assert.equal(get().muted, true)
    assert.equal(get().soundChosen, true)
    get().enterWithSound()
    assert.equal(get().muted, true)
  })

  it('enterWithSound liga o som de quem nunca escolheu, sem gravar escolha', () => {
    get().enterWithSound()
    assert.equal(get().muted, false)
    assert.equal(get().soundChosen, false)
    assert.equal(bag.size, 0) // não é uma preferência: na próxima visita entra de novo com som
    get().enterWithSound() // idempotente
    assert.equal(get().muted, false)
  })

  it('o localStorage quebrado não derruba o store', () => {
    globals.window = {
      localStorage: {
        getItem() {
          throw new Error('bloqueado')
        },
        setItem() {
          throw new Error('cota cheia')
        },
      },
    }
    assert.doesNotThrow(() => {
      get().setVolume('effects', 0.1)
      get().toggleMuted()
    })
    assert.equal(get().volumes.effects, 0.1)
    assert.equal(get().muted, false)
  })
})

describe('store: idioma', () => {
  // `setLocale` grava no localStorage e atualiza `<html lang>`: entram falsos do window e do document.
  const bag = new Map<string, string>()
  const fakeDocument = { documentElement: { lang: 'pt-BR' } }
  const globals = globalThis as { window?: unknown; document?: unknown }

  beforeEach(() => {
    bag.clear()
    fakeDocument.documentElement.lang = 'pt-BR'
    globals.window = {
      localStorage: {
        getItem: (key: string) => bag.get(key) ?? null,
        setItem: (key: string, value: string) => void bag.set(key, value),
      },
    }
    globals.document = fakeDocument
  })
  afterEach(() => {
    delete globals.window
    delete globals.document
  })

  it('no servidor e nos testes (sem window) começa em português', () => {
    assert.equal(get().locale, 'pt')
  })

  it('setLocale troca o idioma, grava no localStorage e atualiza <html lang>', () => {
    get().setLocale('en')
    assert.equal(get().locale, 'en')
    assert.equal(bag.get(LOCALE_STORAGE_KEY), 'en')
    assert.equal(fakeDocument.documentElement.lang, 'en')
    get().setLocale('pt')
    assert.equal(get().locale, 'pt')
    assert.equal(bag.get(LOCALE_STORAGE_KEY), 'pt')
    assert.equal(fakeDocument.documentElement.lang, 'pt-BR')
  })

  it('escolher o idioma que já está ativo também grava a escolha', () => {
    assert.equal(get().locale, 'pt')
    get().setLocale('pt')
    assert.equal(bag.get(LOCALE_STORAGE_KEY), 'pt')
  })

  it('idioma inválido é ignorado', () => {
    get().setLocale('fr' as never)
    assert.equal(get().locale, 'pt')
    assert.equal(bag.size, 0)
  })

  it('subscribeWithSelector do idioma notifica só quando ele muda', () => {
    const seen: string[] = []
    const unsub = useExperienceStore.subscribe(
      (s) => s.locale,
      (locale) => seen.push(locale),
    )
    get().setLocale('en')
    get().setLocale('en') // igual: nada
    get().setHovered('desk') // outro slice: nada
    get().setLocale('pt')
    unsub()
    assert.deepEqual(seen, ['en', 'pt'])
  })

  it('o idioma independe do modo, do foco e do jogo na TV', () => {
    get().setLocale('en')
    toIdle()
    get().requestFocus('shelf', 'digital')
    get().onCameraRest()
    get().startGame('piter')
    get().stopGame()
    get().requestHome()
    assert.equal(get().locale, 'en')
  })

  it('o localStorage quebrado não derruba o store', () => {
    globals.window = {
      localStorage: {
        getItem() {
          throw new Error('bloqueado')
        },
        setItem() {
          throw new Error('cota cheia')
        },
      },
    }
    assert.doesNotThrow(() => get().setLocale('en'))
    assert.equal(get().locale, 'en')
  })
})
