// Inglês de `content/site.ts`. Mesmas chaves do português: o `satisfies` acusa chave faltando ou sobrando.
import type { SiteText, UiText } from '../site.ts'

export const SITE_TEXT_EN = {
  title: 'Vitor "XKrules" Noronha — 3D Portfolio',
  description:
    'Interactive 3D portfolio: web projects, 3D printing, board games and game dev in an isometric diorama.',
  ogLocale: 'en_US',
  ogImageAlt:
    'Isometric diorama of a gamer room at night: a desk with two monitors, a TV with pink light, a game shelf, a 3D printer and a bed.',
} satisfies SiteText

export const UI_TEXT_EN = {
  loading: {
    title: 'Loading the diorama',
    ready: 'All set',
    enter: 'Enter',
    progressLabel: 'Loading progress',
    boot: {
      brand: 'XKRULES BIOS',
      tagline: '3D portfolio, gamer room',
      lines: [
        { label: 'Checking memory', status: 'OK', tone: 'ok' },
        { label: 'Detecting graphics card (WebGL)', status: 'OK', tone: 'ok' },
        { label: 'Assembling keyboard and mouse', status: 'OK', tone: 'ok' },
        { label: 'Audio synthesizer', status: 'LO-FI', tone: 'ok' },
      ],
      enterKey: 'Enter',
      soundNote:
        'Entering plays quiet lo-fi music. Adjust it or mute it with the Sound button, at the top right.',
    },
  },
  hud: {
    hintIdle: 'Drag to explore. Click the objects to see more.',
    theme: {
      toDay: 'Day',
      toDayAria: 'Switch to the light (day) theme',
      toNight: 'Night',
      toNightAria: 'Switch to the dark (night) theme',
    },
    sound: {
      on: 'Sound',
      off: 'Muted',
      triggerAria: 'Sound settings, {state}',
      stateOn: 'on',
      stateOff: 'muted',
      menuLabel: 'Sound settings',
      title: 'Room sound',
      toOn: 'Turn the sound on',
      toOff: 'Mute the sound',
      volumeValue: '{value}%',
      categories: {
        music: { label: 'Music', hint: 'Quiet lo-fi playing' },
        ambient: { label: 'Ambience', hint: 'PC hum and the air in the room' },
        effects: { label: 'Effects', hint: 'Keyboard and mouse clicks, TV static' },
      },
      gamesNote:
        'In the TV games, music and ambience pause and the sound is the game’s own. Its volume can only be adjusted inside the game.',
    },
    language: {
      label: 'Language',
    },
  },
  back: {
    label: 'Back',
    aria: 'Back to the overview (Esc)',
    key: 'Esc',
  },
  panel: {
    comingSoon: 'Coming soon.',
    todo: 'Pending content',
  },
  noscript: {
    intro: 'This portfolio is an interactive 3D experience and needs JavaScript to run.',
    sections: 'Portfolio sections:',
    links: 'Links:',
  },

  link: {
    newTab: 'opens in a new tab',
  },
  carousel: {
    prev: 'Previous slide',
    next: 'Next slide',
    slide: 'Slide {n} of {total}',
    goTo: 'Go to slide {n}',
  },

  about: {
    skills: 'Skills',
    links: 'Where to find me',
    sourceCode: 'View this portfolio’s source code',
  },
  printer: {
    eyebrow: '3D printing',
    gallery: 'Prints',
    galleryLabel: 'Gallery of printed pieces',
    prev: 'Previous piece',
    next: 'Next piece',
    slide: 'Piece {n} of {total}',
    goTo: 'Go to piece {n}',
    emptyTitle: 'The showcase is being set up',
    emptyBody: 'Photos of the pieces will show up here as soon as they are added.',
    specs: 'Slicer settings',
    spec: {
      printer: 'Printer',
      layerHeight: 'Layer height',
      infill: 'Infill',
      supports: 'Supports',
      printTime: 'Print time',
    },
    unit: {
      layerHeight: '{value} mm',
      infill: '{value}%',
      printTime: '{value} h',
    },
    material: {
      resina: 'Resin',
      filamento: 'Filament',
    },
    links: 'Where to find them',
  },
  games: {
    eyebrow: 'Games',
    tabsLabel: 'Game categories',
    tabuleiro: 'Board games',
    digital: 'Digital',
    listLabel: {
      tabuleiro: 'Board games',
      digital: 'Digital games',
    },
    hint: {
      tabuleiro: 'Hover a game to highlight it on the shelf.',
      digital: 'Hover a game to see it on the TV.',
    },
    emptyTab: 'No games in this category yet.',
    play: {
      tv: 'Play on the TV',
      tvAria: 'Play {title} on the room TV',
      pc: 'Play on the PC',
      pcAria: 'Open {title} on the room computer',
    },
    readMore: 'Read more',
    readLess: 'Show less',
    meta: {
      year: 'Year',
      engine: 'Made with',
      players: 'Players',
      playTime: 'Match length',
      award: 'Award',
    },
  },
  tvGame: {
    exit: 'Exit game',
    exitAria: 'Exit the game and go back to the games zone (Esc)',
    frameTitle: '{title}, game on the TV',
    loading: 'Turning on {title}',
    hint: 'Click the game to play. To leave, click outside the TV and press Esc.',
    fullscreen: 'Fullscreen',
    fullscreenAria: 'Open {title} in fullscreen',
    openItch: 'Open on itch.io',
    controlsLabel: 'Game controls',
  },
} satisfies UiText
