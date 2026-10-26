// Textos globais do site e strings de UI (chrome). Conteúdo só aqui.
// `SITE` e `UI_TEXT` valem o português (o server component `app/page.tsx` e o `layout.tsx` os usam
// direto); `SITE_BY_LOCALE` e `UI_TEXT_BY_LOCALE` trazem os dois idiomas. O inglês está em `en/site.ts`.
import { SITE_TEXT_EN, UI_TEXT_EN } from './en/site.ts'
import type { ByLocale, Widened } from './i18n.ts'
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

/** Parte do `SITE` que muda com o idioma (o resto de `SITE` é compartilhado). */
export interface SiteText {
  title: string
  description: string
  /** Idioma no formato do OpenGraph. */
  ogLocale: string
  ogImageAlt: string
}

export const SITE_BY_LOCALE: ByLocale<SiteText> = {
  pt: {
    title: SITE.title,
    description: SITE.description,
    ogLocale: SITE.ogLocale,
    ogImageAlt: SITE.ogImage.alt,
  },
  en: SITE_TEXT_EN,
}

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
        { label: 'Sintetizador de áudio', status: 'LO-FI', tone: 'ok' },
      ] as readonly { label: string; status: string; tone: 'ok' | 'warn' }[],
      /** Tecla que aciona o botão "Entrar" (ele já nasce com o foco). */
      enterKey: 'Enter',
      /** Aviso sob o botão: entrar liga a música baixinha, e o visitante manda no som pelo HUD. */
      soundNote: 'Ao entrar toca uma música lo-fi baixinha. Ajuste ou silencie no botão Som, no canto superior direito.',
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
    /**
     * Som (menu do HUD). O botão do HUD mostra o ESTADO (ligado ou mudo) e abre um menu com o mudo geral
     * e um volume por categoria. Os botões de ação (`toOn`, `toOff`) descrevem a AÇÃO.
     */
    sound: {
      /** Texto do botão do HUD com o som ligado e mudo. */
      on: 'Som',
      off: 'Mudo',
      /** aria-label do botão do HUD; `{state}` vira `stateOn` ou `stateOff`. */
      triggerAria: 'Ajustes de som, {state}',
      stateOn: 'ligado',
      stateOff: 'mudo',
      /** Nome acessível do menu e título visível dele. */
      menuLabel: 'Ajustes de som',
      title: 'Som do quarto',
      /** Mudo geral: o texto é o nome acessível e descreve a AÇÃO. */
      toOn: 'Ligar o som',
      toOff: 'Deixar mudo',
      /** Valor de um slider; `{value}` é a porcentagem (0 a 100). */
      volumeValue: '{value}%',
      /** Um slider por categoria de som. */
      categories: {
        music: { label: 'Música', hint: 'Lo-fi tocando baixinho' },
        ambient: { label: 'Ambiente', hint: 'Zumbido do PC e ar do quarto' },
        effects: { label: 'Efeitos', hint: 'Cliques do teclado e do mouse, estática da TV' },
      },
      /** Nota no fim do menu. */
      gamesNote:
        'Nos jogos da TV, música e ambiente pausam e o som é o do próprio jogo. O volume dele só se ajusta dentro do jogo.',
    },
    /**
     * Seletor de idioma do HUD. O nome acessível do grupo vem daqui; o de cada botão é o nome do
     * idioma escrito nele mesmo (`LOCALE_INFO` em i18n.ts).
     */
    language: {
      label: 'Idioma',
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
    digital: 'Digital',
    listLabel: {
      tabuleiro: 'Jogos de tabuleiro',
      digital: 'Jogos digitais',
    },
    /** Dica sob o título: a câmera da aba Tabuleiro mostra a estante; a da Digital, a TV e o rack. */
    hint: {
      tabuleiro: 'Passe o mouse sobre um jogo para destacá-lo na estante.',
      digital: 'Passe o mouse sobre um jogo para vê-lo na TV.',
    },
    emptyTab: 'Nenhum jogo nesta categoria por enquanto.',
    /** Botão "Jogar" do cartão, por destino (`GamePlay.where`). */
    play: {
      tv: 'Jogar na TV',
      tvAria: 'Jogar {title} na TV do quarto',
      pc: 'Jogar no PC',
      pcAria: 'Abrir {title} no computador do quarto',
    },
    /** Botão do cartão que revela os parágrafos seguintes da descrição. */
    readMore: 'Ler mais',
    readLess: 'Mostrar menos',
    /** Nomes acessíveis das etiquetas do cartão (o texto visível é o valor). */
    meta: {
      year: 'Ano',
      engine: 'Feito com',
      players: 'Jogadores',
      playTime: 'Duração da partida',
      award: 'Prêmio',
    },
  },
  /** Jogo rodando na TV do quarto (ui/tv e o botão Voltar enquanto `store.playing`). */
  tvGame: {
    exit: 'Sair do jogo',
    exitAria: 'Sair do jogo e voltar à zona de jogos (Esc)',
    /** Nome acessível do iframe. */
    frameTitle: '{title}, jogo na TV',
    loading: 'Ligando {title}',
    hint: 'Clique no jogo para jogar. Para sair, clique fora da TV e aperte Esc.',
    fullscreen: 'Tela cheia',
    fullscreenAria: 'Abrir {title} em tela cheia',
    openItch: 'Abrir no itch.io',
    controlsLabel: 'Controles do jogo',
  },
} as const

/** Forma do texto de interface, sem os literais do `as const`: o inglês é escrito contra ela. */
export type UiText = Widened<typeof UI_TEXT>

export const UI_TEXT_BY_LOCALE: ByLocale<UiText> = { pt: UI_TEXT, en: UI_TEXT_EN }
