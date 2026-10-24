// Tipos de conteúdo. Dados puros: este módulo não importa React nem three.

export type HotspotId = 'chair' | 'desk' | 'printer' | 'shelf'

export type PanelKind = 'about' | 'os' | 'printer' | 'games'

export type PanelSide = 'left' | 'right' | 'none'

/**
 * Chaves dos presets de câmera (experience/camera/presets.ts). `shelfTv` não é sub-vista do registry:
 * é a câmera de frente para a TV enquanto um jogo roda nela (`store.playing`).
 */
export type PresetKey = 'home' | HotspotId | 'shelfDigital' | 'shelfTv'

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

/** Slugs das peças físicas da zona de jogos (nós `box_<slug>` e `cover_<slug>`, ARCHITECTURE §6.4). */
export type GameSlug =
  | 'aldeia_dorme'
  | 'conquista_galactica'
  | 'porriland'
  | 'piter'
  | 'memory_game'
  | 'o_anel'
  | 'racco'
  | 'duel_arena'

export type GameKind = 'tabuleiro' | 'digital'

/** Apps do XkrulesOS que um jogo pode abrir no monitor (os `AppRef` sem parâmetro de ui/os). */
export type PcApp = 'memory'

/** Onde o jogo roda quando o visitante clica em "Jogar" no cartão. */
export type GamePlay =
  | {
      /** Versão web (HTML5) num iframe sobre a tela da TV do quarto. */
      where: 'tv'
      /**
       * Embed OFICIAL do itch.io (`https://itch.io/embed-upload/<id>`, o do "Distribute > Embed game").
       * O endereço direto do jogo (html-classic.itch.zone/html/<id>/...) é bloqueado fora do itch.io
       * (anti-hotlink); o embed carrega o jogo por dentro do itch e aceita ser posto em outro site.
       * O jogo recebe uma área de 1280x720 e o próprio motor o escala (ui/tv/TvGameScreen.tsx).
       */
      src: string
      /**
       * Área do jogo em px, quando não é 1280x720. Jogos de canvas FIXO (GameMaker sem "scale to fit")
       * pedem a área do tamanho do canvas: menor que ele, o canvas vaza e aparecem barras de rolagem.
       */
      area?: { width: number; height: number }
    }
  | {
      /** App do XkrulesOS: a câmera vai até o monitor da mesa e a janela abre lá. */
      where: 'pc'
      app: PcApp
    }

/** Jogos (hotspot `shelf`). */
export interface GameProject {
  slug: GameSlug
  title: string
  kind: GameKind
  /** Gênero em uma linha, sob o título (ex.: "Roguelike de cartas"). */
  genre?: string
  /** Contexto curto: "Game Jam CrazyGames", "Projeto para cliente", etc. */
  context?: string
  /** Prêmio recebido (ex.: "Melhor Visual"); aparece em destaque no cartão. */
  award?: string
  role?: string
  /** Ano em que o jogo foi feito. É o único dado do jogo que a TV da zona de jogos mostra sob o título. */
  year?: number
  /** Primeiro parágrafo, sempre visível no cartão. */
  summary: string
  /** Parágrafos seguintes, revelados pelo "Ler mais" do cartão. */
  details?: readonly string[]
  /** Ferramenta ou tecnologia (ex.: "Construct 3", "React"). Só no painel lateral. */
  engine?: string
  /** Board games: número de jogadores (ex.: "6 a 12 jogadores"). */
  players?: string
  /** Board games: duração de uma partida (ex.: "20 a 40 min"). */
  playTime?: string
  /** Cor de destaque do cartão no painel e da tela de título da TV (hex), tirada da arte. */
  accent?: string
  /**
   * Capa QUADRADA: miniatura do cartão no painel e textura da caixa do jogo no quarto 3D (quadro
   * `cover_<slug>` na frente da caixa). Caminho em /public.
   */
  cover?: MediaImage
  /** Jogável dentro do quarto: na TV (iframe) ou no PC (app do XkrulesOS). */
  play?: GamePlay
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
