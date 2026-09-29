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
  },
  noscript: {
    intro: 'Este portfólio é uma experiência 3D interativa e precisa de JavaScript para funcionar.',
    sections: 'Seções do portfólio:',
  },
} as const
