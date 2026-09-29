// Textos do SO fictício que roda dentro do monitor (hotspot `desk`) e do ProjectsApp
// montado como painel DOM no mobile. Dados puros: sem React (ARCHITECTURE §2, §11).
// Os componentes de src/ui/os/** só leem strings daqui; os dados dos projetos vêm de projects.web.ts.

/** Glifos disponíveis nos atalhos e janelas. O componente de cada um fica em ui/os/OsGlyph.tsx. */
export type OsGlyphKey =
  | 'folder'
  | 'app'
  | 'calculator'
  | 'briefcase'
  | 'rocket'
  | 'cards'
  | 'envelope'

export const OS_TEXT = {
  name: 'XKrules OS',
  /** Locale do relógio da barra de tarefas. */
  locale: 'pt-BR',
  desktop: {
    label: 'Área de trabalho do XKrules OS',
    shortcuts: 'Atalhos da área de trabalho',
  },
  taskbar: {
    label: 'Barra de tarefas',
    windows: 'Janelas abertas',
    clock: 'Data e hora',
    /** Exibido até a hidratação (o relógio real só existe no cliente). */
    clockPending: '--:--',
  },
  start: {
    menu: 'Menu iniciar',
    apps: 'Aplicativos',
    links: 'Links',
    sourceCode: 'Código-fonte deste portfólio',
  },
  window: {
    minimize: 'Minimizar',
    close: 'Fechar',
  },
  projects: {
    title: 'Projetos',
    subtitle: 'Sites e aplicações web',
    hint: 'Escolha um projeto para ver os detalhes.',
    list: 'Lista de projetos',
    back: 'Voltar aos projetos',
    empty: 'Nenhum projeto por aqui ainda.',
  },
  detail: {
    year: 'Ano',
    role: 'Papel',
    stack: 'Stack',
    links: 'Links do projeto',
    repo: 'Ver repositório',
    live: 'Abrir site',
    newTab: '(abre em nova aba)',
  },
  media: {
    gallery: 'Mídia do projeto',
    placeholder: 'Capturas de tela em breve',
    video: 'Vídeo do projeto',
  },
} as const

/**
 * Glifo de cada projeto na área de trabalho, por slug de WEB_PROJECTS.
 * Slug sem entrada usa 'app'. Só apresentação: o dado do projeto não muda.
 */
export const OS_PROJECT_GLYPHS: Readonly<Record<string, OsGlyphKey>> = {
  inatel2: 'calculator',
  cp2ejr: 'briefcase',
  'mrp-mobi': 'rocket',
  'memory-game': 'cards',
  'love-letter': 'envelope',
}
