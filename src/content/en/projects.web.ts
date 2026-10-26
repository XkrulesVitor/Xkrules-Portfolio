// Inglês de `content/projects.web.ts`: só o texto de cada projeto, por slug. Stack, URLs, ano, cor e imagens
// vêm do português. Projeto sem entrada aqui continua em português (o teste de paridade acusa a falta).
import type { WebProjectText } from '../projects.web.ts'

export const WEB_TEXT_EN: Readonly<Record<string, WebProjectText>> = {
  inatel2: {
    title: 'Inatel²',
    summary: 'Coming soon.',
    iconAlt: 'Inatel² icon',
  },
  cp2ejr: {
    title: 'CP2eJR - Corporative',
    summary: 'Coming soon.',
    role: 'Manager',
  },
  'mrp-mobi': {
    title: 'MRP Mobi',
    summary: 'Coming soon.',
    iconAlt: 'MRP Mobi icon',
  },
  'memory-game': {
    title: 'Memory Game',
    summary: 'Coming soon.',
    iconAlt: 'Memory Game cover',
  },
  'love-letter': {
    title: 'Interactive Love Letter',
    summary: 'Coming soon.',
    iconAlt: 'Wax seal with a heart',
  },
  'made-by-you': {
    title: 'Made By You',
    summary: 'Coming soon.',
    role: 'Contributor (Private)',
  },
  'noronha-app': {
    title: 'Noronha App',
    summary: 'Coming soon.',
    role: 'Private',
  },
  'val-finance': {
    title: 'V.A.L Finance',
    summary: 'Coming soon.',
    role: 'Private',
    iconAlt: 'V.A.L Finance icon',
  },
  'portfolio-gab': {
    title: 'Gabriela’s Portfolio',
    summary:
      'Single-page portfolio of Gabriela Castro Pereira: a notebook built in 3D CSS tells her story inside its own screen as the page scrolls.',
    iconAlt: 'G monogram of the portfolio',
  },
  'lp-jessica': {
    title: 'LP Jessica',
    summary: 'Coming soon.',
    role: 'Contributor',
  },
}
