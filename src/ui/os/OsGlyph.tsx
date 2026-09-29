import {
  AppWindowIcon,
  BriefcaseIcon,
  CalculatorIcon,
  CardsIcon,
  EnvelopeSimpleIcon,
  FolderOpenIcon,
  GameControllerIcon,
  GithubLogoIcon,
  GlobeIcon,
  InstagramLogoIcon,
  LinkedinLogoIcon,
  LinkIcon,
  RocketLaunchIcon,
  StorefrontIcon,
} from '@phosphor-icons/react'
import type { Icon, IconWeight } from '@phosphor-icons/react'
import { OS_PROJECT_GLYPHS, type OsGlyphKey } from '@/content/os'
import type { LinkKind } from '@/content/types'

const GLYPHS: Record<OsGlyphKey, Icon> = {
  folder: FolderOpenIcon,
  app: AppWindowIcon,
  calculator: CalculatorIcon,
  briefcase: BriefcaseIcon,
  rocket: RocketLaunchIcon,
  cards: CardsIcon,
  envelope: EnvelopeSimpleIcon,
}

const LINK_GLYPHS: Record<LinkKind, Icon> = {
  github: GithubLogoIcon,
  linkedin: LinkedinLogoIcon,
  instagram: InstagramLogoIcon,
  itch: GameControllerIcon,
  site: GlobeIcon,
  store: StorefrontIcon,
  repo: GithubLogoIcon,
  live: GlobeIcon,
  email: EnvelopeSimpleIcon,
  other: LinkIcon,
}

/** Glifo do projeto (mapa em content/os.ts). Slug sem entrada usa o ícone genérico de app. */
export function projectGlyph(slug: string): OsGlyphKey {
  return OS_PROJECT_GLYPHS[slug] ?? 'app'
}

interface OsGlyphProps {
  name: OsGlyphKey
  /** Duotone nos ícones grandes, regular nos controles pequenos. */
  weight?: IconWeight
}

/** Ícone decorativo do SO. O tamanho vem do `font-size` do pai (o SVG mede 1em). */
export function OsGlyph({ name, weight = 'duotone' }: OsGlyphProps) {
  const Glyph = GLYPHS[name]
  return <Glyph weight={weight} aria-hidden="true" />
}

interface LinkGlyphProps {
  kind: LinkKind
  weight?: IconWeight
}

export function LinkGlyph({ kind, weight = 'regular' }: LinkGlyphProps) {
  const Glyph = LINK_GLYPHS[kind]
  return <Glyph weight={weight} aria-hidden="true" />
}
