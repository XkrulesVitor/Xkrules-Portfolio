// Textos do SO fictício que roda dentro do monitor (hotspot `desk`) e do ProjectsApp
// montado como painel DOM no mobile. Dados puros: sem React (ARCHITECTURE §2, §11).
// Os componentes de src/ui/os/** só leem strings daqui; os dados dos projetos vêm de projects.web.ts,
// e os fatos do autor (Este Computador, Terminal) vêm de about.ts e site.ts. O que falta nesses
// arquivos aparece como `[TODO: ...]` (a UI do SO destaca o marcador).

/** Glifos disponíveis nos atalhos e janelas. O componente de cada um fica em ui/os/OsGlyph.tsx. */
export type OsGlyphKey =
  | 'folder'
  | 'app'
  | 'calculator'
  | 'briefcase'
  | 'rocket'
  | 'cards'
  | 'envelope'
  | 'computer'
  | 'terminal'
  | 'puzzle'
  | 'heart'
  | 'power'

/** Símbolos das cartas do Jogo da Memória (o ícone de cada um fica em apps/MemoryGameApp.tsx). */
export type MemorySymbolId =
  | 'controller'
  | 'cube'
  | 'printer'
  | 'dice'
  | 'code'
  | 'mug'
  | 'rocket'
  | 'cards'

/** Linhas da tabela de especificações de Este Computador (valores calculados em ThisComputerApp). */
export type ComputerSpecId =
  | 'device'
  | 'system'
  | 'cpu'
  | 'gpu'
  | 'memory'
  | 'storage'
  | 'workshop'
  | 'peripherals'
  | 'lab'
  | 'network'
  | 'location'

export interface CommandHelp {
  name: string
  usage: string
  description: string
}

export interface CreditLink {
  label: string
  href: string
}

export const OS_TEXT = {
  name: 'XKrules OS',
  /** Locale do relógio da barra de tarefas. */
  locale: 'pt-BR',
  /** Dica (title) dos marcadores [TODO: ...] destacados no SO. */
  todoHint: 'Conteúdo pendente',
  desktop: {
    label: 'Área de trabalho do XKrules OS',
    shortcuts: 'Atalhos do sistema',
    projectShortcuts: 'Atalhos dos projetos',
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
    shutdown: 'Desligar',
  },
  window: {
    minimize: 'Minimizar',
    maximize: 'Maximizar',
    restore: 'Restaurar',
    close: 'Fechar',
    /** Dica (title) das bordas e dos cantos de redimensionar. */
    resize: 'Arraste para redimensionar',
  },
  /** Título e glifo de cada app novo (o de Projetos fica em `projects.title`). */
  apps: {
    computer: { title: 'Este Computador' },
    terminal: { title: 'Terminal' },
    memory: { title: 'Memória 4×4' },
    credits: { title: 'Créditos' },
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

  // Este Computador ------------------------------------------------------------------------------
  computer: {
    eyebrow: 'Propriedades do sistema',
    heading: 'Especificações',
    intro: 'Ficha técnica do autor, em tom de brincadeira.',
    table: 'Especificações do computador',
    /** Grupos de habilidades de about.ts que alimentam cada linha (o rótulo tem de existir lá). */
    skillGroups: {
      cpu: 'Front-end',
      gpu: '3D e interação',
      workshop: 'Manufatura',
      peripherals: 'Jogos',
      lab: 'Acadêmico',
    },
    specs: [
      { id: 'device', label: 'Dispositivo', note: 'o autor' },
      { id: 'system', label: 'Sistema', note: 'este aqui que você está usando' },
      { id: 'cpu', label: 'Processador', note: 'stack principal' },
      { id: 'gpu', label: 'Placa de vídeo', note: '3D e interação' },
      { id: 'memory', label: 'Memória', note: 'anos de experiência' },
      { id: 'storage', label: 'Armazenamento', note: 'formação' },
      { id: 'workshop', label: 'Oficina', note: 'impressão 3D' },
      { id: 'peripherals', label: 'Periféricos', note: 'jogos' },
      { id: 'lab', label: 'Laboratório', note: 'acadêmico' },
      { id: 'network', label: 'Rede', note: 'links públicos' },
      { id: 'location', label: 'Localização', note: 'onde a máquina está' },
    ] as readonly { id: ComputerSpecId; label: string; note: string }[],
    /** Quantos itens do grupo aparecem no valor da linha antes do "+N". */
    shownItems: 3,
    /** Modelos com {chaves}. */
    cores: '{n} núcleos',
    coresHeading: 'Núcleos em uso',
    coresHint: 'Cada núcleo é uma tecnologia do front-end.',
    gpuNote: 'renderiza este quarto inteiro',
    more: '+{n}',
    todo: {
      memory: '[TODO: anos de experiência]',
      location: '[TODO: cidade]',
      group: '[TODO: {group}]',
      links: '[TODO: links públicos]',
    },
  },

  // Terminal -------------------------------------------------------------------------------------
  terminal: {
    prompt: 'xkrules@os:~$',
    host: 'xkrules@os',
    inputLabel: 'Linha de comando do terminal',
    outputLabel: 'Saída do terminal',
    welcome: [
      'XKrules OS Terminal',
      'Digite "help" para ver os comandos. Tab completa, as setas ↑ e ↓ percorrem o histórico.',
    ],
    commands: [
      { name: 'help', usage: 'help', description: 'mostra esta lista' },
      { name: 'whoami', usage: 'whoami', description: 'quem é o dono desta máquina' },
      { name: 'projects', usage: 'projects', description: 'lista os projetos web' },
      { name: 'open', usage: 'open <slug>', description: 'abre a janela de um projeto' },
      { name: 'links', usage: 'links', description: 'links públicos do autor' },
      { name: 'date', usage: 'date', description: 'data e hora atuais' },
      { name: 'neofetch', usage: 'neofetch', description: 'resumo do sistema, com arte' },
      { name: 'clear', usage: 'clear', description: 'limpa a tela (ou Ctrl+L)' },
    ] as readonly CommandHelp[],
    helpTitle: 'Comandos disponíveis:',
    whoami: {
      user: 'xkrules',
      stack: 'Stack: {stack}',
    },
    projects: {
      title: 'Projetos web:',
      hint: 'Use "open <slug>" para abrir a janela de um projeto.',
      empty: 'Nenhum projeto por aqui ainda.',
    },
    open: {
      usage: 'Uso: open <slug>. Digite "projects" para ver os slugs.',
      notFound: 'Projeto "{slug}" não encontrado. Slugs: {slugs}.',
      opening: 'Abrindo {title}...',
    },
    links: {
      title: 'Links:',
      source: 'Código-fonte deste portfólio',
    },
    unknown: 'Comando não encontrado: {cmd}. Digite "help" para ver o que eu sei fazer.',
    suggestion: 'Será que você quis dizer "{cmd}"?',
    candidates: 'Opções: {list}',
    neofetch: {
      os: 'OS',
      shell: 'Shell',
      stack: 'Stack',
      gpu: '3D',
      projects: 'Projetos',
      education: 'Formação',
      github: 'GitHub',
      osValue: 'XKrules OS',
      shellValue: 'xsh (terminal do XKrules OS)',
      projectsValue: '{n} na área de trabalho',
      swatchLabel: 'Paleta do sistema',
    },
    /** Arte do neofetch: um "X" em ASCII, com o nome embaixo. Fonte monoespaçada, 10 colunas. */
    art: [
      '  __  __  ',
      String.raw`  \ \/ /  `,
      '   >  <   ',
      String.raw`  /_/\_\  `,
      '          ',
      ' XKRULES  ',
      '    OS    ',
    ] as readonly string[],
  },

  // Jogo da Memória ------------------------------------------------------------------------------
  memory: {
    heading: 'Jogo da Memória',
    hint: 'Encontre os 8 pares. Setas andam pelas cartas, Enter vira.',
    stats: 'Placar',
    moves: 'Jogadas',
    time: 'Tempo',
    best: 'Melhor',
    bestNone: '--',
    restart: 'Reiniciar',
    boardLabel: 'Tabuleiro do jogo da memória, 4 por 4',
    card: {
      hidden: 'Carta {n} de {total}, virada para baixo',
      shown: 'Carta {n} de {total}: {name}',
      matched: 'Carta {n} de {total}: {name}, par encontrado',
    },
    status: {
      start: 'Vire duas cartas iguais para formar um par.',
      match: 'Par encontrado: {name}.',
      miss: 'Não combinaram. Tente de novo.',
      won: 'Você encontrou todos os pares em {moves} jogadas e {time}.',
    },
    win: {
      title: 'Você venceu!',
      summary: '{moves} jogadas em {time}',
      again: 'Jogar de novo',
    },
    project: {
      full: 'Versão completa',
      fullRepo: 'Versão completa no GitHub',
      details: 'Ver o projeto',
    },
    symbols: [
      { id: 'controller', name: 'controle' },
      { id: 'cube', name: 'cubo 3D' },
      { id: 'printer', name: 'impressora 3D' },
      { id: 'dice', name: 'dado' },
      { id: 'code', name: 'código' },
      { id: 'mug', name: 'caneca' },
      { id: 'rocket', name: 'foguete' },
      { id: 'cards', name: 'cartas' },
    ] as readonly { id: MemorySymbolId; name: string }[],
  },

  // Créditos -------------------------------------------------------------------------------------
  credits: {
    intro:
      'Este portfólio não nasceu do zero. Estes projetos abertos me mostraram o caminho, e o XKrules OS é uma homenagem ao sistema do monitor de Henry Heffernan.',
    inspirations: {
      heading: 'Inspirações',
      items: [
        {
          id: 'bruno',
          name: 'Bruno Simon',
          work: 'My Room in 3D',
          description:
            'Quarto em 3D com luz pré-calculada no Blender e um shader que mistura dia, noite e luzes coloridas.',
          links: [
            { label: 'Repositório', href: 'https://github.com/brunosimon/my-room-in-3d' },
          ],
        },
        {
          id: 'henry',
          name: 'Henry Heffernan',
          work: 'Portfólio com sistema operacional',
          description:
            'Um monitor 3D que roda um sistema operacional por dentro: janelas, desktop e apps. A maior inspiração do XKrules OS.',
          links: [
            { label: 'Site 3D', href: 'https://github.com/henryjeff/portfolio-website' },
            { label: 'Sistema do monitor', href: 'https://github.com/henryjeff/portfolio-inner-site' },
          ],
        },
        {
          id: 'julien',
          name: 'Julien Quenneville',
          work: 'Portfólio em Next e Three.js',
          description: 'Quarto em React Three Fiber com troca de tema entre dia e noite.',
          links: [
            { label: 'Repositório', href: 'https://github.com/JulienQ1/NextThree-js-Portfolio' },
          ],
        },
      ] as readonly {
        id: string
        name: string
        work: string
        description: string
        links: readonly CreditLink[]
      }[],
    },
    stack: {
      heading: 'Feito com',
      items: [
        { name: 'Next.js', role: 'framework', href: 'https://nextjs.org' },
        { name: 'React Three Fiber', role: 'React para o three', href: 'https://r3f.docs.pmnd.rs' },
        { name: 'drei', role: 'ajudantes do R3F', href: 'https://github.com/pmndrs/drei' },
        { name: 'three', role: 'motor 3D', href: 'https://threejs.org' },
        { name: 'zustand', role: 'estado global', href: 'https://github.com/pmndrs/zustand' },
        { name: 'motion', role: 'animações da interface', href: 'https://motion.dev' },
        { name: 'Tailwind CSS', role: 'estilos', href: 'https://tailwindcss.com' },
      ] as readonly { name: string; role: string; href: string }[],
    },
    icons: {
      heading: 'Ícones',
      name: 'Phosphor Icons',
      role: 'família de ícones, peso duotone',
      href: 'https://phosphoricons.com',
    },
    newTab: '(abre em nova aba)',
  },

  // Desligar e ligar -----------------------------------------------------------------------------
  power: {
    shutdownLabel: 'Desligando o XKrules OS',
    shutdownLines: [
      'Encerrando o XKrules OS...',
      'Salvando alterações .......... ok',
      'Fechando as janelas abertas .. ok',
      'Parando o terminal ........... ok',
      'Até logo!',
    ] as readonly string[],
    offLabel: 'XKrules OS desligado',
    button: 'Ligar',
    buttonHint: 'Clique no botão de energia para ligar de novo.',
    bootLabel: 'Ligando o XKrules OS',
    bootLines: [
      'XKrules BIOS',
      'Verificando memória .......... ok',
      'Carregando a área de trabalho...',
      'Bem-vindo de volta.',
    ] as readonly string[],
  },
} as const

/** Slug do projeto web ligado ao Jogo da Memória do SO (projects.web.ts). */
export const OS_MEMORY_PROJECT_SLUG = 'memory-game'

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
