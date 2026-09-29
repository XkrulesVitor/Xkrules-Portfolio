import type { WebProject } from './types'

// Fonte: repositórios públicos em github.com/XkrulesVitor (READMEs e linguagens), set/2026.
// [TODO] capturas de tela em public/media/web/<slug>/ (webp, 1280x800) e vídeos curtos.
export const WEB_PROJECTS: readonly WebProject[] = [
  {
    slug: 'inatel2',
    title: 'Inatel²',
    summary: 'Calculadora de notas para os cursos do Inatel.',
    stack: ['Next.js', 'React', 'TypeScript'],
    repoUrl: 'https://github.com/XkrulesVitor/Inatel2',
    year: 2025,
    images: [],
    accent: '#3b82f6',
  },
  {
    slug: 'cp2ejr',
    title: 'CP2eJR - Corporative',
    summary: 'Replicação de site feita para o processo seletivo da CP2eJR.',
    stack: ['HTML', 'CSS', 'JavaScript'],
    repoUrl: 'https://github.com/XkrulesVitor/Case_CP2eJR',
    year: 2025,
    images: [],
    accent: '#22c55e',
  },
  {
    slug: 'mrp-mobi',
    title: 'MRP Mobi',
    summary: 'Landing page de indicação para o app MRP Mobi, pensada para conversão.',
    details: [
      'Carrossel com auto-play dos seis pilares do app, animação de entrada no hero ao rolar e QR code com cópia do link em um clique.',
      'SEO completo com Open Graph, Twitter Cards, JSON-LD, sitemap e robots.',
    ],
    stack: ['Next.js 15', 'React 19', 'TypeScript', 'Tailwind CSS v4', 'Framer Motion', 'Lucide'],
    repoUrl: 'https://github.com/XkrulesVitor/MRP-Mobi',
    liveUrl: 'https://mobi-lilac.vercel.app',
    year: 2026,
    images: [],
    accent: '#ff6b00',
  },
  {
    slug: 'memory-game',
    title: 'Jogo da Memória',
    summary:
      'Jogo da memória responsivo feito para o ecossistema de sites da CP2eJR. O tabuleiro se ajusta à quantidade de imagens.',
    stack: ['Next.js', 'React', 'Tailwind CSS'],
    repoUrl: 'https://github.com/XkrulesVitor/Memory-Game-React',
    year: 2026,
    images: [],
    accent: '#a855f7',
  },
  {
    slug: 'love-letter',
    title: 'Carta de Amor Interativa',
    summary:
      'Template de carta digital com envelope animado, carrossel de fotos e trilha sonora, configurável por um único arquivo.',
    stack: ['Next.js 14', 'TypeScript', 'Tailwind CSS', 'Lottie'],
    repoUrl: 'https://github.com/XkrulesVitor/Template-for-Love-Letter',
    year: 2026,
    images: [],
    accent: '#f43f5e',
  },
]
