// Inglês de `content/os.ts`. Mesmas chaves do português: o `satisfies` acusa chave faltando ou sobrando.
import type { OsText } from '../os.ts'

export const OS_TEXT_EN = {
  name: 'XKrules OS',
  todoHint: 'Pending content',
  desktop: {
    label: 'XKrules OS desktop',
    shortcuts: 'System shortcuts',
    projectShortcuts: 'Project shortcuts',
  },
  taskbar: {
    label: 'Taskbar',
    windows: 'Open windows',
    clock: 'Date and time',
    clockPending: '--:--',
  },
  start: {
    menu: 'Start menu',
    apps: 'Applications',
    links: 'Links',
    sourceCode: 'Source code of this portfolio',
    shutdown: 'Shut down',
  },
  window: {
    minimize: 'Minimize',
    maximize: 'Maximize',
    restore: 'Restore',
    close: 'Close',
    resize: 'Drag to resize',
  },
  apps: {
    computer: { title: 'This Computer' },
    terminal: { title: 'Terminal' },
    memory: { title: 'Memory 4×4' },
    credits: { title: 'Credits' },
  },
  projects: {
    title: 'Projects',
    subtitle: 'Websites and web apps',
    hint: 'Choose a project to see the details.',
    list: 'List of projects',
    back: 'Back to projects',
    empty: 'No projects here yet.',
  },
  detail: {
    year: 'Year',
    role: 'Role',
    stack: 'Stack',
    links: 'Project links',
    repo: 'View repository',
    live: 'Open website',
    newTab: '(opens in a new tab)',
  },
  media: {
    gallery: 'Project media',
    placeholder: 'Screenshots coming soon',
    video: 'Project video',
  },

  computer: {
    eyebrow: 'System properties',
    heading: 'Specifications',
    intro: 'The author’s spec sheet, tongue in cheek.',
    table: 'Computer specifications',
    // Têm de ser iguais aos rótulos dos grupos de `ABOUT_TEXT_EN.skills` (content/en/about.ts).
    skillGroups: {
      cpu: 'Front-end',
      gpu: '3D and interaction',
      workshop: 'Manufacturing',
      peripherals: 'Games',
      lab: 'Academic',
    },
    specs: {
      device: { label: 'Device', note: 'the author' },
      system: { label: 'System', note: 'the one you are using right now' },
      cpu: { label: 'Processor', note: 'main stack' },
      gpu: { label: 'Graphics card', note: '3D and interaction' },
      memory: { label: 'Memory', note: 'years of experience' },
      storage: { label: 'Storage', note: 'education' },
      workshop: { label: 'Workshop', note: '3D printing' },
      peripherals: { label: 'Peripherals', note: 'games' },
      lab: { label: 'Lab', note: 'academic' },
      network: { label: 'Network', note: 'public links' },
      location: { label: 'Location', note: 'where the machine is' },
    },
    cores: '{n} cores',
    coresHeading: 'Cores in use',
    coresHint: 'Each core is a front-end technology.',
    gpuNote: 'renders this whole room',
    more: '+{n}',
    todo: {
      memory: '[TODO: years of experience]',
      location: '[TODO: city]',
      group: '[TODO: {group}]',
      links: '[TODO: public links]',
    },
  },

  terminal: {
    inputLabel: 'Terminal command line',
    outputLabel: 'Terminal output',
    welcome: [
      'XKrules OS Terminal',
      'Type "help" to see the commands. Tab completes, the ↑ and ↓ arrows browse the history.',
    ],
    commandHelp: {
      help: 'shows this list',
      whoami: 'who owns this machine',
      projects: 'lists the web projects',
      open: 'opens a project window',
      links: 'the author’s public links',
      date: 'current date and time',
      neofetch: 'system summary, with art',
      clear: 'clears the screen (or Ctrl+L)',
    },
    helpTitle: 'Available commands:',
    whoami: {
      stack: 'Stack: {stack}',
    },
    projects: {
      title: 'Web projects:',
      hint: 'Use "open <slug>" to open a project window.',
      empty: 'No projects here yet.',
    },
    open: {
      usage: 'Usage: open <slug>. Type "projects" to see the slugs.',
      notFound: 'Project "{slug}" not found. Slugs: {slugs}.',
      opening: 'Opening {title}...',
    },
    links: {
      title: 'Links:',
      source: 'Source code of this portfolio',
    },
    unknown: 'Command not found: {cmd}. Type "help" to see what I can do.',
    suggestion: 'Did you mean "{cmd}"?',
    candidates: 'Options: {list}',
    neofetch: {
      os: 'OS',
      shell: 'Shell',
      stack: 'Stack',
      gpu: '3D',
      projects: 'Projects',
      education: 'Education',
      github: 'GitHub',
      osValue: 'XKrules OS',
      shellValue: 'xsh (XKrules OS terminal)',
      projectsValue: '{n} on the desktop',
      swatchLabel: 'System palette',
    },
  },

  memory: {
    heading: 'Memory Game',
    hint: 'Find the 8 pairs. Arrow keys move between the cards, Enter flips.',
    stats: 'Scoreboard',
    moves: 'Moves',
    time: 'Time',
    best: 'Best',
    bestNone: '--',
    restart: 'Restart',
    boardLabel: 'Memory game board, 4 by 4',
    card: {
      hidden: 'Card {n} of {total}, face down',
      shown: 'Card {n} of {total}: {name}',
      matched: 'Card {n} of {total}: {name}, pair found',
    },
    status: {
      start: 'Flip two matching cards to make a pair.',
      match: 'Pair found: {name}.',
      miss: 'No match. Try again.',
      won: 'You found all the pairs in {moves} moves and {time}.',
    },
    win: {
      title: 'You won!',
      summary: '{moves} moves in {time}',
      again: 'Play again',
    },
    project: {
      full: 'Full version',
      fullRepo: 'Full version on GitHub',
      details: 'View the project',
    },
    symbols: {
      controller: 'controller',
      cube: '3D cube',
      printer: '3D printer',
      dice: 'die',
      code: 'code',
      mug: 'mug',
      rocket: 'rocket',
      cards: 'cards',
    },
  },

  credits: {
    intro:
      'This portfolio did not start from scratch. These open projects showed me the way, and XKrules OS is a tribute to the monitor system by Henry Heffernan.',
    inspirations: {
      heading: 'Inspirations',
      items: {
        bruno: {
          work: 'My Room in 3D',
          description:
            'A 3D room with light baked in Blender and a shader that blends day, night and colored lights.',
        },
        henry: {
          work: 'Portfolio with an operating system',
          description:
            'A 3D monitor that runs an operating system inside it: windows, desktop and apps. The biggest inspiration for XKrules OS.',
        },
        julien: {
          work: 'Portfolio in Next and Three.js',
          description: 'A React Three Fiber room with a day and night theme switch.',
        },
      },
      links: {
        repo: 'Repository',
        site: '3D site',
        system: 'Monitor system',
      },
    },
    stack: {
      heading: 'Built with',
      roles: {
        next: 'framework',
        r3f: 'React for three',
        drei: 'R3F helpers',
        three: '3D engine',
        zustand: 'global state',
        motion: 'interface animations',
        tailwind: 'styles',
      },
    },
    icons: {
      heading: 'Icons',
      role: 'icon family, duotone weight',
    },
    newTab: '(opens in a new tab)',
  },

  power: {
    shutdownLabel: 'Shutting down XKrules OS',
    shutdownLines: [
      'Shutting down XKrules OS...',
      'Saving changes ............... ok',
      'Closing open windows ......... ok',
      'Stopping the terminal ........ ok',
      'See you soon!',
    ],
    offLabel: 'XKrules OS is off',
    button: 'Power on',
    buttonHint: 'Click the power button to turn it on again.',
    bootLabel: 'Starting XKrules OS',
    bootLines: [
      'XKrules BIOS',
      'Checking memory .............. ok',
      'Loading the desktop...',
      'Welcome back.',
    ],
  },
} satisfies OsText
