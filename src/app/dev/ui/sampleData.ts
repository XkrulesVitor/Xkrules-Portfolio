import { ABOUT } from '@/content/about'
import { GAME_PROJECTS } from '@/content/projects.games'
import type { AboutContent, ExternalLink, GameProject, LinkKind, PrintShowcase } from '@/content/types'

// Dados de EXEMPLO, só para /dev/ui: exercitam os caminhos que o conteúdo real ainda não usa
// (imagens, specs de slicer, todos os tipos de link, textos longos). Não são conteúdo do portfólio.

/** Capa de exemplo: SVG em data URI (o next/image trata data: sem otimização). */
function cover(from: string, to: string, label: string) {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="' + from + '"/><stop offset="1" stop-color="' + to + '"/>' +
    '</linearGradient></defs><rect width="800" height="600" fill="url(#g)"/>' +
    '<text x="400" y="330" font-family="sans-serif" font-size="54" text-anchor="middle" fill="rgba(255,255,255,0.85)">' +
    label + '</text></svg>'
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
}

export const SAMPLE_COVERS = [
  cover('#7ff5d0', '#2b6cb0', 'Peça 1'),
  cover('#ff9f6b', '#7b2d5b', 'Peça 2'),
  cover('#6aa8ff', '#1a1f4a', 'Peça 3'),
  cover('#f2c14e', '#6b3f1d', 'Peça 4'),
]

export const SAMPLE_LINKS: readonly ExternalLink[] = (
  ['github', 'linkedin', 'instagram', 'itch', 'site', 'store', 'repo', 'live', 'email', 'other'] as LinkKind[]
).map((kind) => ({
  label: kind,
  href: kind === 'email' ? 'mailto:exemplo@example.com' : 'https://example.com/' + kind,
  kind,
}))

export const SAMPLE_ABOUT: AboutContent = {
  ...ABOUT,
  location: 'Cidade de exemplo',
  avatar: { src: SAMPLE_COVERS[2], alt: 'Avatar de exemplo' },
  links: SAMPLE_LINKS,
}

export const SAMPLE_PRINT: PrintShowcase = {
  brand: 'Reino de Amestris',
  tagline: 'Modelagem e impressão 3D em resina e filamento.',
  description: [
    'Texto de exemplo para a descrição da marca, só para conferir quebra de linha e ritmo.',
    'Segundo parágrafo de exemplo.',
  ],
  links: SAMPLE_LINKS.slice(4, 7),
  projects: [
    {
      slug: 'exemplo-1',
      title: 'Peça de exemplo em resina',
      summary: 'Resumo de exemplo de uma peça, com alguns detalhes para conferir a legibilidade.',
      material: 'resina',
      images: [{ src: SAMPLE_COVERS[0], alt: 'Capa de exemplo 1' }],
      slicer: { printer: 'Impressora de exemplo', layerHeightMm: 0.05, infillPercent: 100, supports: 'Automáticos', printTimeH: 6.5 },
    },
    {
      slug: 'exemplo-2',
      title: 'Peça de exemplo em filamento',
      summary: 'Outra peça, sem specs de fatiamento.',
      material: 'filamento',
      images: [{ src: SAMPLE_COVERS[1], alt: 'Capa de exemplo 2' }],
    },
    {
      slug: 'exemplo-3',
      title: 'Peça sem foto',
      summary: 'Sem imagem: mostra o ladrilho padrão.',
      material: 'filamento',
      images: [],
      slicer: { layerHeightMm: 0.2, infillPercent: 15 },
    },
    {
      slug: 'exemplo-4',
      title: 'Quarta peça',
      summary: 'Só para o carrossel ter mais de três slides.',
      material: 'resina',
      images: [{ src: SAMPLE_COVERS[3], alt: 'Capa de exemplo 4' }],
    },
  ],
}

export const SAMPLE_GAMES: readonly GameProject[] = [
  ...GAME_PROJECTS.filter((g) => g.slug !== 'o_anel'),
  {
    slug: 'o_anel',
    title: 'O Anel (exemplo com capa e links)',
    kind: 'digital',
    context: 'Game Jam de exemplo com nome bem comprido',
    year: 2026,
    engine: 'GameMaker',
    summary:
      'Resumo de exemplo bem mais longo, para conferir como o cartão quebra linhas, mantém o ritmo vertical e alinha os links quando o texto ocupa várias linhas dentro do painel.',
    accent: '#f2c14e',
    images: [{ src: SAMPLE_COVERS[3], alt: 'Capa de exemplo' }],
    links: SAMPLE_LINKS.slice(3, 8),
  },
]
