// Inglês de `content/projects.web.ts`: só o texto de cada projeto, por slug. Stack, URLs, ano, cor e imagens
// vêm do português. Projeto sem entrada aqui continua em português (o teste de paridade acusa a falta).
import type { WebProjectText } from '../projects.web.ts'

export const WEB_TEXT_EN: Readonly<Record<string, WebProjectText>> = {
  cp2ejr: {
    title: 'CP2eJR Corporative',
    summary:
      'Web platform and PWA of CP2eJr that combines gamification and day-to-day operations. On one side, the Mandou Bem recognitions, badges, semester rankings and events such as the World Cup pool; on the other, attendance, meeting minutes, office hours, a calendar synced with Google Calendar and an admin panel that exports reports. It has light and dark themes and is the base of the ecosystem that also includes Flow and Quota.',
    role: 'Project Manager',
    areas: ['Project management', 'Front-end'],
    iconAlt: 'Corporative icon',
  },
  quota: {
    title: 'Quota',
    summary:
      'CRM of the Corporative ecosystem, built for the sales funnel of CP2eJr and for the handoff between the Sales and Projects teams. The Sprint 1 prototypes, designed in Figma and under review, cover the sales kanban with a mandatory loss reason, the lead list, the component catalog and the cart that adds up the quote in real time. A design system of its own, reusing Corporative components, guides the screens.',
    role: 'Project Manager',
    areas: ['Project management', 'Design review', 'Code review'],
    iconAlt: 'Quota symbol',
  },
  'made-by-you': {
    title: 'Made By You',
    summary:
      'No-code platform to create, customize and publish websites without writing code. The editor has Design, Logic and Preview modes: pages are built from sections and ready-made templates, the phone layout adjusts itself and behavior comes from blocks connected by wires. It won 1st place in Technical Complexity, Level 3, at the 45th FETIN.',
    role: 'Co-founder',
    areas: ['Front-end', 'Visual editor and block logic', 'Product'],
    iconAlt: 'Made By You logo',
  },
  'lp-jessica': {
    title: 'Sandrinha’s World',
    summary:
      'Website of the Sandrinha project, which teaches about diabetes through playful resources for children, families and health professionals. It brings an institutional presentation, a catalog of educational products, original games and contact, and has the memory game built in, which later became a public template. Project managed by Rafael Corrêa and carried out by the CP2eJr team.',
    role: 'Memory game developer',
    areas: ['Memory game', 'Front-end'],
    iconAlt: 'Jéssica Martins logo',
  },
  inatel2: {
    title: 'Inatel²',
    summary:
      'Grade calculator for the Engineering courses at Inatel (C03, M03, F01, E10, M10 and H03). Each course follows its own grading criteria and the result shows NP1, NP2, NPA and the pass status instantly. It was the final project of the CP2eJr onboarding and is published on GitHub Pages.',
    role: 'Developer',
    areas: ['Front-end', 'Calculation logic'],
    iconAlt: 'Inatel² icon',
  },
  'mrp-mobi': {
    title: 'MRP Mobi',
    summary:
      'Referral landing page for the MRP Mobi mobility app, built to turn visits into sign-ups through the invite link. It has a carousel of the app’s six pillars, a QR code with a copy-link button, an entrance animation in the hero and full SEO with structured data.',
    role: 'Developer',
    areas: ['Front-end', 'SEO'],
    iconAlt: 'MRP Mobi icon',
  },
  'memory-game': {
    title: 'Memory Game',
    summary:
      'Memory game in React with 3D animated cards and a score counter. The board adapts itself to the number of images, so customizing it is just swapping the list of pictures. It was born on the Jéssica Martins website and became a public template for anyone to use.',
    role: 'Developer',
    areas: ['Front-end', 'Game development'],
    iconAlt: 'Memory Game cover',
  },
  'love-letter': {
    title: 'Interactive Love Letter',
    summary:
      'Digital love letter template: an envelope with a wax seal that opens, a letter that unfolds, polaroids, music and a counter of the time together. Text, photos and music are edited on the site itself, with no code changes, and the deploy takes one click on Vercel.',
    role: 'Developer',
    areas: ['Front-end', 'Animation and interaction'],
    iconAlt: 'Wax seal with a heart',
  },
  'noronha-app': {
    title: 'Noronha App',
    summary: 'Coming soon.',
    role: 'Private',
  },
  'val-finance': {
    title: 'V.A.L Finance',
    summary:
      'Prototype of AI applied to cryptocurrency investing. Six simulated portfolios follow their own rules every cycle, some backed by language models, and a risk engine protects each position with a stop-loss. The Next.js dashboard shows portfolios, the engine, reports and backtests; all execution is simulated and no order is sent to a broker.',
    role: 'Developer',
    areas: ['Python back-end', 'Front-end', 'Applied AI'],
    iconAlt: 'V.A.L Finance icon',
  },
  'portfolio-gab': {
    title: 'Gabriela’s Portfolio',
    summary:
      'Single-page portfolio for Gabriela Castro Pereira. A notebook built in 3D CSS stays pinned to the screen, zooms in and tells her story inside its own screen as the page scrolls, with the projects passing over it in glass cards. Scrolling is smooth with Lenis and the animations use Motion.',
    role: 'Developer',
    areas: ['Front-end', 'Interface design', 'Animation'],
    iconAlt: 'G monogram of the portfolio',
  },
}
