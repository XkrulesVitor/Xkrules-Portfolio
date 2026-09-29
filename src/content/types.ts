// Tipos de conteúdo. Dados puros: este módulo não importa React nem three.

export type HotspotId = 'chair' | 'desk' | 'printer' | 'shelf'

export type PanelKind = 'about' | 'os' | 'printer' | 'games'

export type PanelSide = 'left' | 'right' | 'none'

/** Chaves dos presets de câmera (experience/camera/presets.ts). */
export type PresetKey = 'home' | HotspotId | 'shelfDigital'

/**
 * Sub-vista de um hotspot (ARCHITECTURE §5): muda a câmera e o lado do painel sem sair do foco.
 * No `shelf`, os ids são os valores de GameKind ('tabuleiro' | 'digital').
 */
export interface HotspotView {
  id: string
  preset: PresetKey
  side: PanelSide
}

export interface HotspotDef {
  id: HotspotId
  label: string
  description: string
  /** Qual painel o Overlay monta quando o hotspot está em `focused`. */
  panel: PanelKind
  /** Preset de câmera padrão (usado quando não há sub-vistas). */
  preset: PresetKey
  /** Lado do painel DOM (`none` = sem painel lateral, ex.: SO no monitor). */
  side: PanelSide
  /** Sub-vistas opcionais. A primeira é a padrão (`store.view === null`). */
  views?: readonly HotspotView[]
}

// ---------------------------------------------------------------------------
// Contratos de conteúdo das Fases 1 e 2 (ARCHITECTURE §8, BACKLOG "Protocolo paralelo").
// `WebProject` é CONGELADO: o SO do monitor (ui/os) e os painéis dependem dele.
// About/Print/Game podem ganhar campos OPCIONAIS; nunca remover nem tornar obrigatório.
// ---------------------------------------------------------------------------

export type LinkKind =
  | 'github'
  | 'linkedin'
  | 'instagram'
  | 'itch'
  | 'site'
  | 'store'
  | 'repo'
  | 'live'
  | 'email'
  | 'other'

export interface ExternalLink {
  label: string
  href: string
  kind: LinkKind
}

export interface MediaImage {
  /** Caminho em /public (ex.: /media/web/inatel2/cover.webp) ou URL absoluta. */
  src: string
  alt: string
  width?: number
  height?: number
}

export interface MediaVideo {
  src: string
  poster?: string
}

/** Projetos web: aparecem no SO fictício dentro do monitor (hotspot `desk`). */
export interface WebProject {
  slug: string
  title: string
  /** Uma ou duas frases. */
  summary: string
  /** Parágrafos da janela de detalhe. */
  details?: readonly string[]
  /** Papel do autor (ex.: "Front-end"). Omitir quando não se sabe. */
  role?: string
  year?: number
  stack: readonly string[]
  repoUrl?: string
  liveUrl?: string
  video?: MediaVideo
  images: readonly MediaImage[]
  /** Cor de destaque do ícone e da janela no SO (hex). */
  accent: string
}

/** Peças do Reino de Amestris (hotspot `printer`). */
export interface PrintProject {
  slug: string
  title: string
  summary: string
  material: 'resina' | 'filamento'
  images: readonly MediaImage[]
  /** Parâmetros de fatiamento exibidos como specs. */
  slicer?: {
    printer?: string
    layerHeightMm?: number
    infillPercent?: number
    supports?: string
    printTimeH?: number
  }
}

export interface PrintShowcase {
  brand: string
  tagline: string
  description: readonly string[]
  links: readonly ExternalLink[]
  projects: readonly PrintProject[]
}

/** Slugs das peças físicas da estante (nó `box_<slug>`, ARCHITECTURE §6.4). */
export type GameSlug = 'terra' | 'aldeia_dorme' | 'porrilandia' | 'peter' | 'o_anel'

export type GameKind = 'tabuleiro' | 'digital'

/** Jogos (hotspot `shelf`). */
export interface GameProject {
  slug: GameSlug
  title: string
  kind: GameKind
  /** Contexto curto: "Game Jam CrazyGames", "Expansão fan-made", etc. */
  context?: string
  role?: string
  year?: number
  summary: string
  engine?: string
  /** Cor de destaque do cartão no painel (hex). Espelha a cor da caixa 3D na estante. */
  accent?: string
  images: readonly MediaImage[]
  links: readonly ExternalLink[]
}

export interface SkillGroup {
  label: string
  items: readonly string[]
}

/** Painel "Sobre mim" (hotspot `chair`). */
export interface AboutContent {
  name: string
  headline: string
  bio: readonly string[]
  location?: string
  avatar?: MediaImage
  skills: readonly SkillGroup[]
  links: readonly ExternalLink[]
}
