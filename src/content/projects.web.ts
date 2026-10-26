// `WEB_PROJECTS` vale o português; `WEB_PROJECTS_BY_LOCALE` traz os dois idiomas: stack, URLs, ano, cor e
// imagens são compartilhados e o texto em inglês (`en/projects.web.ts`) é aplicado por cima.
import { WEB_TEXT_EN } from './en/projects.web.ts'
import type { ByLocale } from './i18n.ts'
import type { WebProject } from './types'

export const WEB_PROJECTS: readonly WebProject[] = [
  {
    slug: 'inatel2',
    title: 'Inatel²',
    summary: 'Em breve.',
    stack: ['Next.js', 'React', 'TypeScript'],
    repoUrl: 'https://github.com/XkrulesVitor/Inatel2',
    year: 2025,
    images: [],
    icon: { src: '/media/web/inatel2/icon.webp', alt: 'Ícone do Inatel²', width: 256, height: 256 },
    accent: '#3b82f6',
  },
  {
    slug: 'cp2ejr',
    title: 'CP2eJR - Corporative',
    summary: 'Em breve.',
    role: 'Gerente',
    stack: ['HTML', 'CSS', 'JavaScript'],
    repoUrl: 'https://github.com/NECP2eJr/Corporative-CP2eJr',
    year: 2025,
    images: [],
    accent: '#22c55e',
  },
  {
    slug: 'mrp-mobi',
    title: 'MRP Mobi',
    summary: 'Em breve.',
    stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
    repoUrl: 'https://github.com/XkrulesVitor/MRP-Mobi',
    liveUrl: 'https://mobi-lilac.vercel.app',
    year: 2026,
    images: [],
    icon: { src: '/media/web/mrp-mobi/icon.webp', alt: 'Ícone do MRP Mobi', width: 256, height: 256 },
    accent: '#ff6b00',
  },
  {
    slug: 'memory-game',
    title: 'Jogo da Memória',
    summary: 'Em breve.',
    stack: ['Next.js', 'React', 'Tailwind CSS'],
    repoUrl: 'https://github.com/XkrulesVitor/Memory-Game-React',
    year: 2026,
    images: [],
    // O repositório só tem um .ico: o ícone é a capa do jogo (public/media/games/memory_game.webp).
    icon: { src: '/media/web/memory-game/icon.webp', alt: 'Capa do Jogo da Memória', width: 256, height: 256 },
    accent: '#a855f7',
  },
  {
    slug: 'love-letter',
    title: 'Carta de Amor Interativa',
    summary: 'Em breve.',
    stack: ['Next.js', 'TypeScript', 'Tailwind CSS'],
    repoUrl: 'https://github.com/XkrulesVitor/Template-for-Love-Letter',
    year: 2026,
    images: [],
    icon: { src: '/media/web/love-letter/icon.svg', alt: 'Selo de lacre com um coração', width: 256, height: 256 },
    accent: '#f43f5e',
  },
  {
    slug: 'made-by-you',
    title: 'Made By You',
    summary: 'Em breve.',
    role: 'Contribuinte (Privado)',
    stack: ['React', 'TypeScript'],
    repoUrl: 'https://github.com/XkrulesVitor/Made-By-You',
    year: 2026,
    images: [],
    accent: '#ec4899',
  },
  {
    slug: 'noronha-app',
    title: 'Noronha App',
    summary: 'Em breve.',
    role: 'Privado',
    stack: ['React Native', 'TypeScript'],
    repoUrl: 'https://github.com/XkrulesVitor/Noronha-App',
    year: 2026,
    images: [],
    accent: '#06b6d4',
  },
  {
    slug: 'val-finance',
    title: 'V.A.L Finance',
    summary: 'Em breve.',
    role: 'Privado',
    stack: ['Next.js', 'TypeScript', 'Tailwind CSS'],
    repoUrl: 'https://github.com/XkrulesVitor/V.A.L-Finance',
    year: 2026,
    images: [],
    icon: { src: '/media/web/val-finance/icon.svg', alt: 'Ícone do V.A.L Finance', width: 256, height: 256 },
    accent: '#10b981',
  },
  {
    slug: 'portfolio-gab',
    title: 'Portfólio Gabriela',
    summary:
      'Portfólio de Gabriela Castro Pereira em página única: um notebook em CSS 3D conta a história dela dentro da própria tela enquanto a página rola.',
    stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Motion'],
    repoUrl: 'https://github.com/XkrulesVitor/Portfolio-Gab',
    liveUrl: 'https://portfolio-gab-smoky.vercel.app',
    year: 2026,
    images: [],
    // O repositório gera o favicon no build (src/app/icon.tsx): monograma "G" lilás sobre roxo-escuro.
    icon: { src: '/media/web/portfolio-gab/icon.webp', alt: 'Monograma G do portfólio', width: 256, height: 256 },
    accent: '#6c4bdf',
  },
  {
    slug: 'lp-jessica',
    title: 'LP Jessica',
    summary: 'Em breve.',
    role: 'Contribuinte',
    stack: ['HTML', 'CSS', 'JavaScript'],
    repoUrl: 'https://github.com/NECP2eJr/LP-Jessica',
    year: 2025,
    images: [],
    accent: '#f59e0b',
  },
]

/** Texto de um projeto web que muda com o idioma (`role` e `iconAlt` existem aqui quando existem no português). */
export interface WebProjectText {
  title: string
  summary: string
  details?: readonly string[]
  role?: string
  /** Texto alternativo do ícone. */
  iconAlt?: string
}

/** O projeto com o texto trocado; sem texto para o slug, fica o do projeto-base. */
function localizeWeb(project: WebProject, text: WebProjectText | undefined): WebProject {
  if (!text) return project
  return {
    ...project,
    title: text.title,
    summary: text.summary,
    details: text.details,
    role: text.role,
    icon: project.icon && text.iconAlt ? { ...project.icon, alt: text.iconAlt } : project.icon,
  }
}

export const WEB_PROJECTS_BY_LOCALE: ByLocale<readonly WebProject[]> = {
  pt: WEB_PROJECTS,
  en: WEB_PROJECTS.map((project) => localizeWeb(project, WEB_TEXT_EN[project.slug])),
}
