// Todo o conteúdo de um idioma num objeto só. Cada módulo de conteúdo exporta o seu `*_BY_LOCALE`
// (o texto de cada idioma num mapa, o resto compartilhado); aqui eles são juntados por idioma, para a UI
// (`ui/i18n/useLocale`) e o canvas (`experience/**`, via `getState().locale`) buscarem tudo com uma chamada.
// Os objetos são criados uma vez: a referência de um idioma nunca muda (serve de dependência de memo).
import { ABOUT_BY_LOCALE } from './about.ts'
import { HOTSPOTS_BY_LOCALE, getHotspotIn } from './hotspots.ts'
import { LOCALES, type ByLocale, type Locale } from './i18n.ts'
import { OS_TEXT_BY_LOCALE, type OsText } from './os.ts'
import { GAME_PROJECTS_BY_LOCALE } from './projects.games.ts'
import { PRINT_SHOWCASE_BY_LOCALE } from './projects.print.ts'
import { WEB_PROJECTS_BY_LOCALE } from './projects.web.ts'
import { EDITOR_CODE_BY_LOCALE, SCREEN_TEXT_BY_LOCALE, type ScreenText } from './screens.ts'
import { SITE_BY_LOCALE, UI_TEXT_BY_LOCALE, type SiteText, type UiText } from './site.ts'
import type {
  AboutContent,
  GameProject,
  HotspotDef,
  HotspotId,
  PrintShowcase,
  WebProject,
} from './types'

export interface LocalizedContent {
  locale: Locale
  /** Strings de interface (chrome): HUD, painéis, primitivas, jogo na TV. */
  ui: UiText
  /** Strings do XkrulesOS. */
  os: OsText
  /** Strings das telas desenhadas em canvas (papel de parede, editor, TV). */
  screens: ScreenText
  /** Código exibido no monitor vertical. */
  editorCode: readonly string[]
  site: SiteText
  about: AboutContent
  games: readonly GameProject[]
  web: readonly WebProject[]
  print: PrintShowcase
  hotspots: readonly HotspotDef[]
  getHotspot(id: HotspotId): HotspotDef
}

function buildContent(locale: Locale): LocalizedContent {
  return {
    locale,
    ui: UI_TEXT_BY_LOCALE[locale],
    os: OS_TEXT_BY_LOCALE[locale],
    screens: SCREEN_TEXT_BY_LOCALE[locale],
    editorCode: EDITOR_CODE_BY_LOCALE[locale],
    site: SITE_BY_LOCALE[locale],
    about: ABOUT_BY_LOCALE[locale],
    games: GAME_PROJECTS_BY_LOCALE[locale],
    web: WEB_PROJECTS_BY_LOCALE[locale],
    print: PRINT_SHOWCASE_BY_LOCALE[locale],
    hotspots: HOTSPOTS_BY_LOCALE[locale],
    getHotspot: (id) => getHotspotIn(locale, id),
  }
}

export const CONTENT_BY_LOCALE: ByLocale<LocalizedContent> = Object.fromEntries(
  LOCALES.map((locale) => [locale, buildContent(locale)]),
) as Record<Locale, LocalizedContent>

/** O conteúdo no idioma pedido. */
export function contentFor(locale: Locale): LocalizedContent {
  return CONTENT_BY_LOCALE[locale]
}
