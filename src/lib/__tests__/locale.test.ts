import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { LOCALE_INFO, LOCALES, isLocale } from '../../content/i18n.ts'
import {
  LOCALE_STORAGE_KEY,
  applyDocumentLang,
  detectInitialLocale,
  parseLocale,
  pickLocale,
  readStoredLocale,
  writeStoredLocale,
} from '../locale.ts'

// Rodar: npm test  (node --test com type stripping nativo; zero dependências extras).

describe('i18n: idiomas', () => {
  it('pt e en, com código de <html lang> e rótulo curto do seletor', () => {
    assert.deepEqual([...LOCALES], ['pt', 'en'])
    assert.equal(LOCALE_INFO.pt.htmlLang, 'pt-BR')
    assert.equal(LOCALE_INFO.en.htmlLang, 'en')
    assert.equal(LOCALE_INFO.pt.label, 'PT')
    assert.equal(LOCALE_INFO.en.label, 'EN')
  })

  it('isLocale só aceita os idiomas conhecidos', () => {
    assert.equal(isLocale('pt'), true)
    assert.equal(isLocale('en'), true)
    assert.equal(isLocale('pt-BR'), false)
    assert.equal(isLocale('fr'), false)
    assert.equal(isLocale(null), false)
  })
})

describe('locale: parseLocale', () => {
  it('aceita o código e as variantes regionais, sem diferenciar caixa', () => {
    assert.equal(parseLocale('pt'), 'pt')
    assert.equal(parseLocale('EN'), 'en')
    assert.equal(parseLocale('pt-BR'), 'pt')
    assert.equal(parseLocale('en_US'), 'en')
    assert.equal(parseLocale(' en-gb '), 'en')
  })

  it('o resto (vazio, ausente, outro idioma) vira null', () => {
    assert.equal(parseLocale(''), null)
    assert.equal(parseLocale(null), null)
    assert.equal(parseLocale(undefined), null)
    assert.equal(parseLocale('fr'), null)
    assert.equal(parseLocale('english'), null)
  })
})

describe('locale: pickLocale (URL > localStorage > navegador)', () => {
  it('?lang= vence o localStorage e o navegador', () => {
    assert.equal(pickLocale({ search: '?lang=en', stored: 'pt', language: 'pt-BR' }), 'en')
    assert.equal(pickLocale({ search: '?focus=desk&lang=pt', stored: 'en', language: 'en-US' }), 'pt')
    assert.equal(pickLocale({ search: 'lang=en' }), 'en')
  })

  it('sem ?lang= (ou com um inválido) vale o localStorage', () => {
    assert.equal(pickLocale({ search: '', stored: 'en', language: 'pt-BR' }), 'en')
    assert.equal(pickLocale({ search: '?lang=fr', stored: 'pt', language: 'en-US' }), 'pt')
  })

  it('localStorage inválido cai no idioma do navegador', () => {
    assert.equal(pickLocale({ stored: 'xx', language: 'pt-PT' }), 'pt')
    assert.equal(pickLocale({ stored: '', language: 'en-GB' }), 'en')
  })

  it('navegador: começa com pt é português; o resto é inglês', () => {
    assert.equal(pickLocale({ language: 'pt-BR' }), 'pt')
    assert.equal(pickLocale({ language: 'PT' }), 'pt')
    assert.equal(pickLocale({ language: 'en-US' }), 'en')
    assert.equal(pickLocale({ language: 'es-ES' }), 'en')
    assert.equal(pickLocale({ language: 'ja' }), 'en')
    assert.equal(pickLocale({}), 'en')
  })
})

describe('locale: persistência', () => {
  const bag = new Map<string, string>()
  const storage = {
    getItem: (key: string) => bag.get(key) ?? null,
    setItem: (key: string, value: string) => void bag.set(key, value),
  }

  it('grava e lê o idioma na chave portfolio3d:locale', () => {
    bag.clear()
    assert.equal(readStoredLocale(storage), null)
    writeStoredLocale('en', storage)
    assert.equal(bag.get(LOCALE_STORAGE_KEY), 'en')
    assert.equal(LOCALE_STORAGE_KEY, 'portfolio3d:locale')
    assert.equal(readStoredLocale(storage), 'en')
  })

  it('sem armazenamento ou com ele quebrado, nunca lança', () => {
    const broken = {
      getItem() {
        throw new Error('bloqueado')
      },
      setItem() {
        throw new Error('cota cheia')
      },
    }
    assert.equal(readStoredLocale(null), null)
    assert.doesNotThrow(() => writeStoredLocale('pt', null))
    assert.equal(readStoredLocale(broken), null)
    assert.doesNotThrow(() => writeStoredLocale('pt', broken))
  })
})

describe('locale: ambiente', () => {
  const globals = globalThis as { window?: unknown; document?: unknown }
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')

  afterEach(() => {
    delete globals.window
    delete globals.document
    if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator)
  })

  function fakeBrowser(options: { search: string; stored?: string; language: string }) {
    globals.window = {
      location: { search: options.search },
      localStorage: {
        getItem: (key: string) => (key === LOCALE_STORAGE_KEY ? (options.stored ?? null) : null),
        setItem: () => undefined,
      },
    }
    Object.defineProperty(globalThis, 'navigator', {
      value: { language: options.language },
      configurable: true,
      writable: true,
    })
  }

  it('fora do navegador o idioma inicial é o padrão (pt)', () => {
    assert.equal(detectInitialLocale(), 'pt')
  })

  it('no navegador junta URL, localStorage e idioma do navegador', () => {
    fakeBrowser({ search: '?lang=en', stored: 'pt', language: 'pt-BR' })
    assert.equal(detectInitialLocale(), 'en')
    fakeBrowser({ search: '', stored: 'en', language: 'pt-BR' })
    assert.equal(detectInitialLocale(), 'en')
    fakeBrowser({ search: '', language: 'pt-BR' })
    assert.equal(detectInitialLocale(), 'pt')
    fakeBrowser({ search: '', language: 'de-DE' })
    assert.equal(detectInitialLocale(), 'en')
  })

  it('applyDocumentLang põe o código no <html lang>; sem document não faz nada', () => {
    assert.doesNotThrow(() => applyDocumentLang('en'))
    const doc = { documentElement: { lang: 'pt-BR' } }
    globals.document = doc
    applyDocumentLang('en')
    assert.equal(doc.documentElement.lang, 'en')
    applyDocumentLang('pt')
    assert.equal(doc.documentElement.lang, 'pt-BR')
  })
})
