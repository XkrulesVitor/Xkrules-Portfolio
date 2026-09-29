// Textos globais do site e strings de UI (chrome). Conteúdo só aqui.

export const SITE = {
  author: 'Vitor Hugo Noronha',
  title: 'Vitor Hugo Noronha — Portfólio 3D',
  shortTitle: 'Vitor Hugo · Portfólio',
  description:
    'Portfólio 3D interativo: projetos web, impressão 3D, board games e game dev num diorama isométrico.',
  themeColor: '#0b1020',
  /** Links externos (redes, repositórios). [TODO: preencher com os links reais] */
  links: [] as readonly { label: string; href: string }[],
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
  },
  noscript: {
    intro: 'Este portfólio é uma experiência 3D interativa e precisa de JavaScript para funcionar.',
    sections: 'Seções do portfólio:',
  },
} as const
