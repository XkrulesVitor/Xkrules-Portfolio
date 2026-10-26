import {
  AppWindowIcon,
  BriefcaseIcon,
  CalculatorIcon,
  CardsIcon,
  DesktopTowerIcon,
  EnvelopeSimpleIcon,
  FolderOpenIcon,
  GameControllerIcon,
  GithubLogoIcon,
  GlobeIcon,
  HeartIcon,
  InstagramLogoIcon,
  LinkedinLogoIcon,
  LinkIcon,
  PowerIcon,
  PuzzlePieceIcon,
  RocketLaunchIcon,
  StorefrontIcon,
  TerminalWindowIcon,
} from '@phosphor-icons/react'
import type { Icon, IconWeight } from '@phosphor-icons/react'
import { OS_PROJECT_GLYPHS, type OsGlyphKey } from '@/content/os'
import type { LinkKind, MediaImage } from '@/content/types'
import styles from './OsGlyph.module.css'

const GLYPHS: Record<OsGlyphKey, Icon> = {
  folder: FolderOpenIcon,
  app: AppWindowIcon,
  calculator: CalculatorIcon,
  briefcase: BriefcaseIcon,
  rocket: RocketLaunchIcon,
  cards: CardsIcon,
  envelope: EnvelopeSimpleIcon,
  computer: DesktopTowerIcon,
  terminal: TerminalWindowIcon,
  puzzle: PuzzlePieceIcon,
  heart: HeartIcon,
  power: PowerIcon,
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

interface AppGlyphProps {
  /** Glifo desenhado, usado quando não há `icon`. */
  name: OsGlyphKey
  /** Ícone real do projeto (`WebProject.icon`). Tem prioridade sobre o glifo. */
  icon?: MediaImage
  weight?: IconWeight
}

/**
 * Glifo de um app ou projeto: a imagem do projeto quando existe, o ícone desenhado quando não.
 * Os dois medem 1em (o tamanho vem do `font-size` do pai). A imagem é decorativa (alt vazio): o
 * título do app sempre aparece ao lado.
 */
export function AppGlyph({ name, icon, weight }: AppGlyphProps) {
  if (!icon) return <OsGlyph name={name} weight={weight} />
  return (
    // <img> simples: o src é conteúdo (pode ser SVG ou URL absoluta) e next/image exigiria
    // images.remotePatterns e dangerouslyAllowSVG no next.config.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={styles.image}
      src={icon.src}
      alt=""
      width={icon.width}
      height={icon.height}
      decoding="async"
      draggable={false}
    />
  )
}

interface LinkGlyphProps {
  kind: LinkKind
  weight?: IconWeight
}

export function LinkGlyph({ kind, weight = 'regular' }: LinkGlyphProps) {
  const Glyph = LINK_GLYPHS[kind]
  return <Glyph weight={weight} aria-hidden="true" />
}
