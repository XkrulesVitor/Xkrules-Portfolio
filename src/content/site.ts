// Textos globais do site e strings de UI (chrome). Conteúdo só aqui.
import type { ExternalLink } from './types'

export const SITE = {
  author: 'Vitor "XKrules" Noronha',
  title: 'Vitor "XKrules" Noronha — Portfólio 3D',
  shortTitle: 'Vitor "XKrules" Noronha',
  description:
    'Portfólio 3D interativo: projetos web, impressão 3D, board games e game dev num diorama isométrico.',
  themeColor: '#0b1020',
  /** Código-fonte deste portfólio. */
  sourceUrl: 'https://github.com/XkrulesVitor/Xkrules-Portfolio',
  /** Links globais. [TODO] LinkedIn, Instagram, itch.io e loja do Reino de Amestris. */
  links: [
    { label: 'GitHub', href: 'https://github.com/XkrulesVitor', kind: 'github' },
  ] as readonly ExternalLink[],
} as const

export const UI_TEXT = {
  loading: {
    title: 'Carregando o diorama',
    ready: 'Tudo pronto',
    enter: 'Entrar',
    progressLabel: 'Progresso do carregamento',
  },
  hud: {
    hintIdle: 'Arraste para explorar. Clique nos objetos para ver mais.',
  },
  back: {
    label: 'Voltar',
    aria: 'Voltar para a visão geral (Esc)',
    key: 'Esc',
  },
  panel: {
    comingSoon: 'Em breve.',
    /** Dica (title) dos marcadores [TODO: ...] destacados na UI. */
    todo: 'Conteúdo pendente',
  },
  noscript: {
    intro: 'Este portfólio é uma experiência 3D interativa e precisa de JavaScript para funcionar.',
    sections: 'Seções do portfólio:',
  },

  // Primitivas (src/ui/primitives). Modelos com {chaves} passam por `fmt` (ui/primitives/format.ts).
  link: {
    newTab: 'abre em nova aba',
  },
  carousel: {
    prev: 'Slide anterior',
    next: 'Próximo slide',
    slide: 'Slide {n} de {total}',
    goTo: 'Ir para o slide {n}',
  },

  // Painéis (src/ui/panels).
  about: {
    skills: 'Habilidades',
    links: 'Onde me encontrar',
    sourceCode: 'Ver o código deste portfólio',
  },
  printer: {
    eyebrow: 'Impressão 3D',
    gallery: 'Peças',
    galleryLabel: 'Galeria de peças impressas',
    prev: 'Peça anterior',
    next: 'Próxima peça',
    slide: 'Peça {n} de {total}',
    goTo: 'Ir para a peça {n}',
    emptyTitle: 'A vitrine está sendo montada',
    emptyBody: 'As fotos das peças aparecem aqui assim que forem adicionadas.',
    specs: 'Fatiamento',
    spec: {
      printer: 'Impressora',
      layerHeight: 'Altura de camada',
      infill: 'Preenchimento',
      supports: 'Suportes',
      printTime: 'Tempo de impressão',
    },
    unit: {
      layerHeight: '{value} mm',
      infill: '{value}%',
      printTime: '{value} h',
    },
    material: {
      resina: 'Resina',
      filamento: 'Filamento',
    },
    links: 'Onde encontrar',
  },
  games: {
    eyebrow: 'Jogos',
    tabsLabel: 'Categorias de jogos',
    tabuleiro: 'Tabuleiro',
    digital: 'Digital / Game Jams',
    listLabel: {
      tabuleiro: 'Jogos de tabuleiro',
      digital: 'Jogos digitais e game jams',
    },
    hint: 'Passe o mouse sobre um jogo para destacá-lo na estante.',
    emptyTab: 'Nenhum jogo nesta categoria por enquanto.',
  },
} as const
