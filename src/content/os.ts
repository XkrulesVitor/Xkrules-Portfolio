// Textos do SO fictício que roda dentro do monitor (hotspot `desk`) e do ProjectsApp
// montado como painel DOM no mobile. Dados puros: sem React (ARCHITECTURE §2, §11).
// Os componentes de src/ui/os/** só leem strings daqui; os dados dos projetos vêm de projects.web.ts,
// e os fatos do autor (Este Computador, Terminal) vêm de about.ts e site.ts. O que falta nesses
// arquivos aparece como `[TODO: ...]` (a UI do SO destaca o marcador).
//
// `OS_TEXT` vale o português; `OS_TEXT_BY_LOCALE` traz os dois idiomas (o inglês está em `en/os.ts`).
// O que NÃO é texto (ids, ordem das listas, URLs, a arte ASCII) fica nas constantes deste arquivo,
// compartilhadas pelos idiomas: assim o texto em inglês não repete dado nenhum. O locale do relógio e
// da data vem de `LOCALE_INFO` (i18n.ts).
import { OS_TEXT_EN } from './en/os.ts'
import type { ByLocale, Widened } from './i18n.ts'

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

/** Os símbolos do jogo, uma vez cada (o nome de cada um está em `OS_TEXT.memory.symbols`). */
export const MEMORY_SYMBOL_IDS: readonly MemorySymbolId[] = [
  'controller',
  'cube',
  'printer',
  'dice',
  'code',
  'mug',
  'rocket',
  'cards',
]

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

/** Ordem das linhas de Este Computador (rótulo e nota de cada uma: `OS_TEXT.computer.specs`). */
export const COMPUTER_SPEC_IDS: readonly ComputerSpecId[] = [
  'device',
  'system',
  'cpu',
  'gpu',
  'memory',
  'storage',
  'workshop',
  'peripherals',
  'lab',
  'network',
  'location',
]

/** Quantos itens do grupo aparecem no valor da linha antes do "+N". */
export const COMPUTER_SHOWN_ITEMS = 3

export type TerminalCommandName =
  | 'help'
  | 'whoami'
  | 'projects'
  | 'open'
  | 'links'
  | 'date'
  | 'neofetch'
  | 'clear'

/** Comandos do terminal, na ordem do `help` (a descrição de cada um: `OS_TEXT.terminal.commandHelp`). */
export const TERMINAL_COMMANDS: readonly { name: TerminalCommandName; usage: string }[] = [
  { name: 'help', usage: 'help' },
  { name: 'whoami', usage: 'whoami' },
  { name: 'projects', usage: 'projects' },
  { name: 'open', usage: 'open <slug>' },
  { name: 'links', usage: 'links' },
  { name: 'date', usage: 'date' },
  { name: 'neofetch', usage: 'neofetch' },
  { name: 'clear', usage: 'clear' },
]

/** Identidade do terminal (igual nos idiomas). */
export const TERMINAL_IDENTITY = {
  prompt: 'xkrules@os:~$',
  host: 'xkrules@os',
  user: 'xkrules',
} as const

/** Arte do neofetch: um "X" em ASCII, com o nome embaixo. Fonte monoespaçada, 10 colunas. */
export const TERMINAL_ART: readonly string[] = [
  '  __  __  ',
  String.raw`  \ \/ /  `,
  '   >  <   ',
  String.raw`  /_/\_\  `,
  '          ',
  ' XKRULES  ',
  '    OS    ',
]

export type CreditInspirationId = 'bruno' | 'henry' | 'julien'
/** Rótulo de cada link das inspirações (`OS_TEXT.credits.inspirations.links`). */
export type CreditLinkId = 'repo' | 'site' | 'system'
export type CreditStackId = 'next' | 'r3f' | 'drei' | 'three' | 'zustand' | 'motion' | 'tailwind'

/** Dados dos Créditos (nomes próprios, links e ordem). Os textos de cada item: `OS_TEXT.credits`. */
export const CREDITS = {
  inspirations: [
    {
      id: 'bruno',
      name: 'Bruno Simon',
      links: [{ id: 'repo', href: 'https://github.com/brunosimon/my-room-in-3d' }],
    },
    {
      id: 'henry',
      name: 'Henry Heffernan',
      links: [
        { id: 'site', href: 'https://github.com/henryjeff/portfolio-website' },
        { id: 'system', href: 'https://github.com/henryjeff/portfolio-inner-site' },
      ],
    },
    {
      id: 'julien',
      name: 'Julien Quenneville',
      links: [{ id: 'repo', href: 'https://github.com/JulienQ1/NextThree-js-Portfolio' }],
    },
  ] as readonly {
    id: CreditInspirationId
    name: string
    links: readonly { id: CreditLinkId; href: string }[]
  }[],
  stack: [
    { id: 'next', name: 'Next.js', href: 'https://nextjs.org' },
    { id: 'r3f', name: 'React Three Fiber', href: 'https://r3f.docs.pmnd.rs' },
    { id: 'drei', name: 'drei', href: 'https://github.com/pmndrs/drei' },
    { id: 'three', name: 'three', href: 'https://threejs.org' },
    { id: 'zustand', name: 'zustand', href: 'https://github.com/pmndrs/zustand' },
    { id: 'motion', name: 'motion', href: 'https://motion.dev' },
    { id: 'tailwind', name: 'Tailwind CSS', href: 'https://tailwindcss.com' },
  ] as readonly { id: CreditStackId; name: string; href: string }[],
  icons: { name: 'Phosphor Icons', href: 'https://phosphoricons.com' },
} as const

export const OS_TEXT = {
  name: 'XKrules OS',
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
    /** Rótulos dos grupos de habilidades de about.ts que alimentam cada linha (têm de existir lá, no mesmo idioma). */
    skillGroups: {
      cpu: 'Front-end',
      gpu: '3D e interação',
      workshop: 'Manufatura',
      peripherals: 'Jogos',
      lab: 'Acadêmico',
    },
    specs: {
      device: { label: 'Dispositivo', note: 'o autor' },
      system: { label: 'Sistema', note: 'este aqui que você está usando' },
      cpu: { label: 'Processador', note: 'stack principal' },
      gpu: { label: 'Placa de vídeo', note: '3D e interação' },
      memory: { label: 'Memória', note: 'anos de experiência' },
      storage: { label: 'Armazenamento', note: 'formação' },
      workshop: { label: 'Oficina', note: 'impressão 3D' },
      peripherals: { label: 'Periféricos', note: 'jogos' },
      lab: { label: 'Laboratório', note: 'acadêmico' },
      network: { label: 'Rede', note: 'links públicos' },
      location: { label: 'Localização', note: 'onde a máquina está' },
    },
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
    inputLabel: 'Linha de comando do terminal',
    outputLabel: 'Saída do terminal',
    welcome: [
      'XKrules OS Terminal',
      'Digite "help" para ver os comandos. Tab completa, as setas ↑ e ↓ percorrem o histórico.',
    ],
    /** Descrição de cada comando no `help` (nome e uso: `TERMINAL_COMMANDS`). */
    commandHelp: {
      help: 'mostra esta lista',
      whoami: 'quem é o dono desta máquina',
      projects: 'lista os projetos web',
      open: 'abre a janela de um projeto',
      links: 'links públicos do autor',
      date: 'data e hora atuais',
      neofetch: 'resumo do sistema, com arte',
      clear: 'limpa a tela (ou Ctrl+L)',
    },
    helpTitle: 'Comandos disponíveis:',
    whoami: {
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
    /** Nome de cada símbolo (lido pelos leitores de tela). */
    symbols: {
      controller: 'controle',
      cube: 'cubo 3D',
      printer: 'impressora 3D',
      dice: 'dado',
      code: 'código',
      mug: 'caneca',
      rocket: 'foguete',
      cards: 'cartas',
    },
  },

  // Créditos -------------------------------------------------------------------------------------
  credits: {
    intro:
      'Este portfólio não nasceu do zero. Estes projetos abertos me mostraram o caminho, e o XKrules OS é uma homenagem ao sistema do monitor de Henry Heffernan.',
    inspirations: {
      heading: 'Inspirações',
      /** Texto de cada inspiração (nome e links: `CREDITS.inspirations`). */
      items: {
        bruno: {
          work: 'My Room in 3D',
          description:
            'Quarto em 3D com luz pré-calculada no Blender e um shader que mistura dia, noite e luzes coloridas.',
        },
        henry: {
          work: 'Portfólio com sistema operacional',
          description:
            'Um monitor 3D que roda um sistema operacional por dentro: janelas, desktop e apps. A maior inspiração do XKrules OS.',
        },
        julien: {
          work: 'Portfólio em Next e Three.js',
          description: 'Quarto em React Three Fiber com troca de tema entre dia e noite.',
        },
      },
      links: {
        repo: 'Repositório',
        site: 'Site 3D',
        system: 'Sistema do monitor',
      },
    },
    stack: {
      heading: 'Feito com',
      /** Papel de cada ferramenta (nome e link: `CREDITS.stack`). */
      roles: {
        next: 'framework',
        r3f: 'React para o three',
        drei: 'ajudantes do R3F',
        three: 'motor 3D',
        zustand: 'estado global',
        motion: 'animações da interface',
        tailwind: 'estilos',
      },
    },
    icons: {
      heading: 'Ícones',
      role: 'família de ícones, peso duotone',
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

/** Forma do texto do SO, sem os literais do `as const`: o inglês é escrito contra ela. */
export type OsText = Widened<typeof OS_TEXT>

export const OS_TEXT_BY_LOCALE: ByLocale<OsText> = { pt: OS_TEXT, en: OS_TEXT_EN }

/** Slug do projeto web ligado ao Jogo da Memória do SO (projects.web.ts). */
export const OS_MEMORY_PROJECT_SLUG = 'memory-game'

/**
 * Glifo de reserva de cada projeto, por slug de WEB_PROJECTS: vale quando o projeto não tem `icon`
 * (ícone real, em projects.web.ts); com `icon`, o SO desenha a imagem e este glifo fica sem uso.
 * Slug sem entrada usa 'app'. Só apresentação: o dado do projeto não muda.
 */
export const OS_PROJECT_GLYPHS: Readonly<Record<string, OsGlyphKey>> = {
  inatel2: 'calculator',
  cp2ejr: 'briefcase',
  'mrp-mobi': 'rocket',
  'memory-game': 'cards',
  'love-letter': 'envelope',
}
