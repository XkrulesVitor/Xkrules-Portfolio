// Inglês de `content/screens.ts`. Mesmas chaves do português: o `satisfies` acusa chave faltando ou sobrando.
import type { ScreenText } from '../screens.ts'

export const SCREEN_TEXT_EN = {
  wallpaper: {
    brand: 'XKrules OS',
    tagline: '3D Portfolio',
    icons: ['Projects', 'This Computer', 'Terminal', 'Memory 4×4', 'Credits'],
    start: 'Start',
  },

  editor: {
    fileName: 'Experience.tsx',
    language: 'TypeScript React',
    siblingTab: 'store.ts',
    status: 'Ln {line}, Col {col}',
    comments: {
      room: 'The whole room runs in the browser.',
      shelf: 'A new game on the shelf: 1 line.',
    },
  },

  tv: {
    logo: 'XKRULES',
    zoneTitle: 'Games zone',
    zoneHint: 'Hover a game in the panel',
    pressStart: 'PRESS START',
    player: '1P',
  },
} satisfies ScreenText
