// Textos globais do site e strings de UI (chrome). Conteúdo só aqui.
import type { ExternalLink } from './types'

export const SITE = {
  author: 'Vitor "XKrules" Noronha',
  title: 'Vitor "XKrules" Noronha — Portfólio 3D',
  shortTitle: 'Vitor "XKrules" Noronha',
  description:
    'Portfólio 3D interativo: projetos web, impressão 3D, board games e game dev num diorama isométrico.',
  themeColor: '#0b1020',
  /** Endereço público (metadataBase do Next: resolve as URLs relativas de OpenGraph e Twitter). */
  url: 'https://xkrules-portfolio.vercel.app',
  /** Idioma do conteúdo, no formato do OpenGraph. */
  ogLocale: 'pt_BR',
  /** Imagem de compartilhamento (OpenGraph e Twitter): captura do diorama em `public/`. */
  ogImage: {
    path: '/og.jpg',
    width: 1280,
    height: 720,
    alt: 'Diorama isométrico de um quarto gamer à noite: mesa com dois monitores, TV com luz rosa, estante de jogos, impressora 3D e cama.',
  },
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
    /**
     * Boot estilo BIOS (V.5). As linhas aparecem em sequência; `tone` pinta o status (ok = menta,
     * warn = âmbar). O progresso REAL (useProgress) vem das props da LoadingScreen, não daqui.
     */
    boot: {
      brand: 'XKRULES BIOS',
      tagline: 'Portfólio 3D, quarto gamer',
      lines: [
        { label: 'Verificando memória', status: 'OK', tone: 'ok' },
        { label: 'Detectando placa de vídeo (WebGL)', status: 'OK', tone: 'ok' },
        { label: 'Montando teclado e mouse', status: 'OK', tone: 'ok' },
        { label: 'Sintetizador de áudio', status: 'MUDO', tone: 'warn' },
      ],
      /** Tecla que aciona o botão "Entrar" (ele já nasce com o foco). */
      enterKey: 'Enter',
    },
  },
  hud: {
    hintIdle: 'Arraste para explorar. Clique nos objetos para ver mais.',
    /** Botão de tema: o texto e o aria-label descrevem a AÇÃO (para qual tema vai trocar). */
    theme: {
      toDay: 'Dia',
      toDayAria: 'Mudar para o tema claro (dia)',
      toNight: 'Noite',
      toNightAria: 'Mudar para o tema escuro (noite)',
    },
    /** Botão de som: como o de tema, descreve a AÇÃO (para onde vai trocar). Mudo por padrão. */
    sound: {
      toOn: 'Som',
      toOnAria: 'Ligar o som do quarto',
      toOff: 'Mudo',
      toOffAria: 'Deixar o quarto mudo',
    },
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
    links: 'Links:',
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
