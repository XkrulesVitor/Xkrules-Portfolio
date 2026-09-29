import type { GameProject } from './types'

// Fonte: repositórios públicos em github.com/XkrulesVitor e informações do próprio autor.
// Os slugs são os de `GameSlug` e os mesmos das peças da estante (nó `box_<slug>`).
// `accent` espelha a cor da caixa 3D na estante (provisória no grey-box).
// [TODO] capturas de tela e capas em public/media/games/<slug>/ (webp).
// [TODO] itch.io: adicionar links `kind: 'itch'` quando os jogos forem publicados lá.
export const GAME_PROJECTS: readonly GameProject[] = [
  {
    slug: 'porrilandia',
    title: 'Porrilândia',
    kind: 'digital',
    context: 'Game Jam CrazyGames',
    year: 2026,
    summary: '[TODO: descrever]',
    accent: '#e4572e',
    images: [],
    links: [
      { label: 'Repositório', href: 'https://github.com/XkrulesVitor/PorriLand', kind: 'repo' },
    ],
  },
  {
    slug: 'peter',
    title: 'As Aventuras de Peter',
    kind: 'digital',
    context: 'Game Jam CPG 2026',
    engine: 'GameMaker',
    year: 2026,
    summary:
      'Jogo de cartas em que o jogador combina cartas numéricas e operações matemáticas para zerar a vida do inimigo. Entre as fases, escolhe 1 de 3 cartas de recompensa, no estilo roguelike.',
    accent: '#4c8bf5',
    images: [],
    links: [
      {
        label: 'Repositório',
        href: 'https://github.com/XkrulesVitor/PIter-Math-Adventure',
        kind: 'repo',
      },
    ],
  },
  {
    slug: 'o_anel',
    title: 'O Anel',
    kind: 'digital',
    context: 'Game Jam',
    summary: '[TODO: descrever]',
    accent: '#f2c14e',
    images: [],
    links: [],
  },
  {
    slug: 'terra',
    title: 'Expansão de Terra',
    kind: 'tabuleiro',
    context: 'Expansão',
    summary: '[TODO: descrever]',
    accent: '#57b894',
    images: [],
    links: [],
  },
  {
    slug: 'aldeia_dorme',
    title: 'A Aldeia Dorme',
    kind: 'tabuleiro',
    summary: '[TODO: descrever]',
    accent: '#3a3f8f',
    images: [],
    links: [],
  },
]
