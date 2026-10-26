import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ABOUT, ABOUT_BY_LOCALE } from '../about.ts'
import { HOTSPOTS, HOTSPOTS_BY_LOCALE, getHotspot, getHotspotIn } from '../hotspots.ts'
import { LOCALES, type Locale } from '../i18n.ts'
import { CONTENT_BY_LOCALE, contentFor } from '../locales.ts'
import { OS_TEXT, OS_TEXT_BY_LOCALE } from '../os.ts'
import { GAME_PROJECTS, GAME_PROJECTS_BY_LOCALE } from '../projects.games.ts'
import { PRINT_SHOWCASE, PRINT_SHOWCASE_BY_LOCALE } from '../projects.print.ts'
import { WEB_PROJECTS, WEB_PROJECTS_BY_LOCALE } from '../projects.web.ts'
import { EDITOR_CODE, EDITOR_CODE_BY_LOCALE, SCREEN_TEXT, SCREEN_TEXT_BY_LOCALE } from '../screens.ts'
import { SITE, SITE_BY_LOCALE, UI_TEXT, UI_TEXT_BY_LOCALE } from '../site.ts'
import { PRINT_PROJECT_TEXT_EN } from '../en/projects.print.ts'

// Rodar: npm test  (node --test com type stripping nativo).
// O português é a fonte; o inglês tem de ter EXATAMENTE as mesmas chaves, o mesmo comprimento de lista,
// os mesmos {modelos} e [TODO: ...], e repetir os dados que não são texto (ids, links, chaves de tecla).

/** Chaves cujo valor (texto) é dado, não tradução: têm de ser idênticas nos dois idiomas. */
const IDENTITY_KEYS: ReadonlySet<string> = new Set([
  'id',
  'slug',
  'kind',
  'href',
  'src',
  'tone',
  'status',
  'key',
  'enterKey',
  'accent',
])

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
const todoMarkers = (text: string) => (text.match(/\[TODO:/g) ?? []).length

/** Compara a forma de dois valores e devolve as diferenças (uma por linha, com o caminho). */
function diffShape(pt: unknown, en: unknown, path = '$'): string[] {
  if (typeof pt === 'string' && typeof en === 'string') {
    const problems: string[] = []
    const key = path.split('.').at(-1) ?? ''
    if (IDENTITY_KEYS.has(key) && pt !== en) problems.push(`${path}: dado diferente ("${pt}" x "${en}")`)
    if (placeholders(pt).join() !== placeholders(en).join()) problems.push(`${path}: {modelos} diferentes`)
    if (todoMarkers(pt) !== todoMarkers(en)) problems.push(`${path}: marcadores [TODO: ...] diferentes`)
    return problems
  }
  if (Array.isArray(pt) || Array.isArray(en)) {
    if (!Array.isArray(pt) || !Array.isArray(en)) return [`${path}: um é lista e o outro não`]
    if (pt.length !== en.length) return [`${path}: ${pt.length} itens x ${en.length}`]
    return pt.flatMap((item, i) => diffShape(item, en[i], `${path}[${i}]`))
  }
  if (typeof pt === 'object' && pt !== null && typeof en === 'object' && en !== null) {
    const ptRecord = pt as Record<string, unknown>
    const enRecord = en as Record<string, unknown>
    // `undefined` conta como ausente (campo opcional não preenchido).
    const ptKeys = Object.keys(ptRecord).filter((k) => ptRecord[k] !== undefined)
    const enKeys = Object.keys(enRecord).filter((k) => enRecord[k] !== undefined)
    const problems: string[] = []
    for (const k of ptKeys) if (!enKeys.includes(k)) problems.push(`${path}.${k}: falta no inglês`)
    for (const k of enKeys) if (!ptKeys.includes(k)) problems.push(`${path}.${k}: sobra no inglês`)
    for (const k of ptKeys) if (enKeys.includes(k)) problems.push(...diffShape(ptRecord[k], enRecord[k], `${path}.${k}`))
    return problems
  }
  return typeof pt === typeof en && pt === en ? [] : [`${path}: ${String(pt)} x ${String(en)}`]
}

function assertSameShape(pt: unknown, en: unknown, label: string) {
  assert.deepEqual(diffShape(pt, en), [], `${label}: pt e en divergem`)
}

describe('i18n: os nomes de hoje continuam valendo o português', () => {
  it('UI_TEXT, OS_TEXT, SCREEN_TEXT, ABOUT, GAME_PROJECTS, WEB_PROJECTS, PRINT_SHOWCASE e HOTSPOTS são o pt', () => {
    assert.equal(UI_TEXT_BY_LOCALE.pt, UI_TEXT)
    assert.equal(OS_TEXT_BY_LOCALE.pt, OS_TEXT)
    assert.equal(SCREEN_TEXT_BY_LOCALE.pt, SCREEN_TEXT)
    assert.equal(ABOUT_BY_LOCALE.pt, ABOUT)
    assert.equal(GAME_PROJECTS_BY_LOCALE.pt, GAME_PROJECTS)
    assert.equal(WEB_PROJECTS_BY_LOCALE.pt, WEB_PROJECTS)
    assert.equal(PRINT_SHOWCASE_BY_LOCALE.pt, PRINT_SHOWCASE)
    assert.equal(HOTSPOTS_BY_LOCALE.pt, HOTSPOTS)
    assert.equal(EDITOR_CODE_BY_LOCALE.pt, EDITOR_CODE)
    assert.equal(SITE_BY_LOCALE.pt.title, SITE.title)
    assert.equal(SITE_BY_LOCALE.pt.description, SITE.description)
    assert.equal(getHotspot('chair').label, 'Sobre mim')
  })
})

describe('i18n: pt e en têm as mesmas chaves', () => {
  it('UI_TEXT', () => assertSameShape(UI_TEXT_BY_LOCALE.pt, UI_TEXT_BY_LOCALE.en, 'UI_TEXT'))
  it('OS_TEXT', () => assertSameShape(OS_TEXT_BY_LOCALE.pt, OS_TEXT_BY_LOCALE.en, 'OS_TEXT'))
  it('SCREEN_TEXT', () => assertSameShape(SCREEN_TEXT_BY_LOCALE.pt, SCREEN_TEXT_BY_LOCALE.en, 'SCREEN_TEXT'))
  it('SITE', () => assertSameShape(SITE_BY_LOCALE.pt, SITE_BY_LOCALE.en, 'SITE'))
  it('ABOUT', () => assertSameShape(ABOUT_BY_LOCALE.pt, ABOUT_BY_LOCALE.en, 'ABOUT'))
  it('GAME_PROJECTS', () => assertSameShape(GAME_PROJECTS_BY_LOCALE.pt, GAME_PROJECTS_BY_LOCALE.en, 'GAME_PROJECTS'))
  it('WEB_PROJECTS', () => assertSameShape(WEB_PROJECTS_BY_LOCALE.pt, WEB_PROJECTS_BY_LOCALE.en, 'WEB_PROJECTS'))
  it('PRINT_SHOWCASE', () => assertSameShape(PRINT_SHOWCASE_BY_LOCALE.pt, PRINT_SHOWCASE_BY_LOCALE.en, 'PRINT_SHOWCASE'))
  it('HOTSPOTS', () => assertSameShape(HOTSPOTS_BY_LOCALE.pt, HOTSPOTS_BY_LOCALE.en, 'HOTSPOTS'))
  it('o código do editor tem as mesmas linhas, com os comentários trocados', () => {
    const pt = EDITOR_CODE_BY_LOCALE.pt
    const en = EDITOR_CODE_BY_LOCALE.en
    assert.equal(pt.length, en.length)
    const changed = pt.flatMap((line, i) => (line === en[i] ? [] : [i]))
    assert.equal(changed.length, 2)
    for (const i of changed) {
      assert.match(pt[i], /^\/\/ /)
      assert.match(en[i], /^\/\/ /)
      assert.ok(en[i].length <= 45, `linha do editor larga demais: ${en[i]}`)
    }
  })
})

describe('i18n: o inglês só troca texto', () => {
  it('jogos: slug, tipo, ano, cor, motor, capa, play e links (href e kind) são os mesmos', () => {
    const { pt, en } = GAME_PROJECTS_BY_LOCALE
    assert.deepEqual(en.map((g) => g.slug), pt.map((g) => g.slug))
    en.forEach((game, i) => {
      const base = pt[i]
      assert.equal(game.kind, base.kind)
      assert.equal(game.year, base.year)
      assert.equal(game.accent, base.accent)
      assert.equal(game.engine, base.engine)
      assert.equal(game.cover?.src, base.cover?.src)
      assert.equal(game.cover?.width, base.cover?.width)
      assert.deepEqual(game.play, base.play)
      assert.deepEqual(game.links.map((l) => [l.href, l.kind]), base.links.map((l) => [l.href, l.kind]))
    })
  })

  it('jogos: títulos oficiais ficam como são e o descritivo traduz', () => {
    const titles = Object.fromEntries(GAME_PROJECTS_BY_LOCALE.en.map((g) => [g.slug, g.title]))
    assert.equal(titles.aldeia_dorme, 'Aldeia Dorme')
    assert.equal(titles.conquista_galactica, 'Star Wars: Conquista Galáctica')
    assert.equal(titles.porriland, 'PorriLand')
    assert.equal(titles.piter, 'As Aventuras de Piter')
    assert.equal(titles.o_anel, 'O Anel')
    assert.equal(titles.racco, 'Racco')
    assert.equal(titles.duel_arena, 'Duel Arena')
    assert.equal(titles.memory_game, 'React Memory Game')
  })

  it('projetos web: slug, stack, URLs, ano, cor, imagens e ícone (src) são os mesmos', () => {
    const { pt, en } = WEB_PROJECTS_BY_LOCALE
    assert.deepEqual(en.map((p) => p.slug), pt.map((p) => p.slug))
    en.forEach((project, i) => {
      const base = pt[i]
      assert.deepEqual(project.stack, base.stack)
      assert.equal(project.repoUrl, base.repoUrl)
      assert.equal(project.liveUrl, base.liveUrl)
      assert.equal(project.year, base.year)
      assert.equal(project.accent, base.accent)
      assert.deepEqual(project.images, base.images)
      assert.equal(project.icon?.src, base.icon?.src)
    })
  })

  it('todo projeto web e toda peça da vitrine têm texto em inglês', () => {
    for (const project of WEB_PROJECTS_BY_LOCALE.en) {
      const base = WEB_PROJECTS.find((p) => p.slug === project.slug)
      assert.ok(base)
      assert.notEqual(project.summary, '', project.slug)
      if (project.slug === 'portfolio-gab') assert.notEqual(project.summary, base.summary)
      else assert.equal(project.summary, 'Coming soon.')
    }
    for (const piece of PRINT_SHOWCASE.projects) {
      assert.ok(PRINT_PROJECT_TEXT_EN[piece.slug], `peça "${piece.slug}" sem texto em inglês`)
    }
  })

  it('sobre: nome e links são os mesmos', () => {
    assert.equal(ABOUT_BY_LOCALE.en.name, ABOUT.name)
    assert.deepEqual(ABOUT_BY_LOCALE.en.links, ABOUT.links)
  })

  it('hotspots: id, painel, preset, lado e vistas são os mesmos', () => {
    HOTSPOTS_BY_LOCALE.en.forEach((hotspot, i) => {
      const base = HOTSPOTS[i]
      assert.equal(hotspot.id, base.id)
      assert.equal(hotspot.panel, base.panel)
      assert.equal(hotspot.preset, base.preset)
      assert.equal(hotspot.side, base.side)
      assert.deepEqual(hotspot.views, base.views)
      assert.notEqual(hotspot.description, base.description)
    })
    assert.equal(getHotspotIn('en', 'desk').label, 'Web projects')
    assert.equal(getHotspotIn('pt', 'desk').label, 'Projetos Web')
  })
})

describe('i18n: coerência entre os módulos', () => {
  for (const locale of LOCALES) {
    it(`${locale}: os grupos de habilidades de Este Computador existem em ABOUT`, () => {
      const labels = ABOUT_BY_LOCALE[locale].skills.map((group) => group.label)
      for (const [spec, label] of Object.entries(OS_TEXT_BY_LOCALE[locale].computer.skillGroups)) {
        assert.ok(labels.includes(label), `${locale}: grupo "${label}" (${spec}) não existe em ABOUT.skills`)
      }
    })

    it(`${locale}: o título do SO bate com o nome do atalho do papel de parede`, () => {
      const os = OS_TEXT_BY_LOCALE[locale]
      const icons: readonly string[] = SCREEN_TEXT_BY_LOCALE[locale].wallpaper.icons
      assert.deepEqual(icons, [
        os.projects.title,
        os.apps.computer.title,
        os.apps.terminal.title,
        os.apps.memory.title,
        os.apps.credits.title,
      ])
    })
  }

  it('o conteúdo de cada idioma é montado uma vez (referência estável)', () => {
    for (const locale of LOCALES) {
      assert.equal(contentFor(locale), CONTENT_BY_LOCALE[locale])
      assert.equal(contentFor(locale), contentFor(locale))
      assert.equal(contentFor(locale).locale, locale)
    }
    assert.equal(contentFor('en').getHotspot('shelf').label, 'Board games and game dev')
  })

  it('o inglês não deixa texto de interface igual ao português fora de marcas e nomes', () => {
    // Textos que podem repetir: marcas, unidades, siglas e palavras iguais nos dois idiomas.
    const allowed = new Set([
      'Links',
      'Links:',
      'framework',
      'PRESS START',
      'Stack: {stack}',
      '[TODO: {group}]',
      'XKrules OS',
      'XKRULES BIOS',
      'XKRULES',
      'Enter',
      'Esc',
      'OK',
      'LO-FI',
      'Terminal',
      'Stack',
      'Shell',
      'OS',
      '3D',
      'GitHub',
      'Front-end',
      'Experience.tsx',
      'store.ts',
      'TypeScript React',
      '1P',
      '--:--',
      '--',
      '{value}%',
      '{value} mm',
      '{value} h',
      '+{n}',
      'Ln {line}, Col {col}',
      'XKrules BIOS',
      'XKrules OS Terminal',
      'Reino de Amestris',
      'My Room in 3D',
      'Digital',
      'motion',
      'Next.js',
    ])
    const same: string[] = []
    const walk = (pt: unknown, en: unknown, path: string) => {
      if (typeof pt === 'string' && typeof en === 'string') {
        const key = path.split('.').at(-1) ?? ''
        if (pt === en && !allowed.has(pt) && !IDENTITY_KEYS.has(key)) same.push(`${path} = "${pt}"`)
      } else if (Array.isArray(pt) && Array.isArray(en)) {
        pt.forEach((item, i) => walk(item, en[i], `${path}[${i}]`))
      } else if (typeof pt === 'object' && pt && typeof en === 'object' && en) {
        for (const k of Object.keys(pt)) walk((pt as Record<string, unknown>)[k], (en as Record<string, unknown>)[k], `${path}.${k}`)
      }
    }
    const pairs: [string, unknown, unknown][] = [
      ['ui', UI_TEXT_BY_LOCALE.pt, UI_TEXT_BY_LOCALE.en],
      ['os', OS_TEXT_BY_LOCALE.pt, OS_TEXT_BY_LOCALE.en],
      ['screens', SCREEN_TEXT_BY_LOCALE.pt, SCREEN_TEXT_BY_LOCALE.en],
    ]
    for (const [name, pt, en] of pairs) walk(pt, en, name)
    assert.deepEqual(same, [], 'texto sem tradução (ou nome próprio a liberar na lista)')
  })
})

describe('i18n: locales sem repetição', () => {
  it('LOCALES é a lista de chaves de todo mapa por idioma', () => {
    const maps: Record<Locale, unknown>[] = [
      UI_TEXT_BY_LOCALE,
      OS_TEXT_BY_LOCALE,
      SCREEN_TEXT_BY_LOCALE,
      SITE_BY_LOCALE,
      ABOUT_BY_LOCALE,
      GAME_PROJECTS_BY_LOCALE,
      WEB_PROJECTS_BY_LOCALE,
      PRINT_SHOWCASE_BY_LOCALE,
      HOTSPOTS_BY_LOCALE,
      EDITOR_CODE_BY_LOCALE,
    ]
    for (const map of maps) assert.deepEqual(Object.keys(map).sort(), [...LOCALES].sort())
  })
})
