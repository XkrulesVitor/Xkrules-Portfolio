// `WEB_PROJECTS` vale o português; `WEB_PROJECTS_BY_LOCALE` traz os dois idiomas: stack, URLs, ano, cor e
// imagens são compartilhados e o texto em inglês (`en/projects.web.ts`) é aplicado por cima.
import { WEB_TEXT_EN } from './en/projects.web.ts'
import type { ByLocale } from './i18n.ts'
import type { WebProject } from './types'

export const WEB_PROJECTS: readonly WebProject[] = [
  {
    slug: 'cp2ejr',
    title: 'CP2eJR Corporative',
    summary:
      'Plataforma web e PWA da CP2eJr que junta gamificação e gestão operacional. De um lado, o Mandou Bem, os badges, os rankings semestrais e eventos como o Bolão da Copa; do outro, presenças, atas, horários de sede, calendário integrado ao Google Agenda e um painel administrativo com exportação de relatórios. Tem tema claro e escuro e é a base do ecossistema que também inclui o Flow e o Quota.',
    role: 'Gerente de Projeto',
    areas: ['Gestão de projeto', 'Front-end'],
    stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Prisma', 'MariaDB'],
    year: 2026,
    images: [
      { src: '/media/web/cp2ejr/01.webp', alt: 'Dashboard do Corporative com avisos, pontuação, ranking do semestre e atalhos para reconhecer um membro e registrar presença na sede', width: 1568, height: 705 },
      { src: '/media/web/cp2ejr/02.webp', alt: 'Visão geral da empresa no modo Gestão, com atalhos para lançar pontos, cadastrar membros, criar avisos e baixar relatórios em CSV', width: 1568, height: 705 },
      { src: '/media/web/cp2ejr/03.webp', alt: 'Ranking de gamificação do semestre com pódio dos três primeiros colocados', width: 1568, height: 705 },
      { src: '/media/web/cp2ejr/04.webp', alt: 'Tela Meus horários com a agenda da semana em linhas por dia e opção de conectar o Google Agenda', width: 1568, height: 705 },
      { src: '/media/web/cp2ejr/05.webp', alt: 'Perfil do membro com nível de carreira, pontuação, prêmios, troféus e pins em destaque', width: 1568, height: 705 },
      { src: '/media/web/cp2ejr/06.webp', alt: 'Janela de cadastro de novo membro com a matriz de acessos à gestão', width: 1568, height: 751 },
    ],
    icon: { src: '/media/web/cp2ejr/icon.webp', alt: 'Ícone do Corporative', width: 256, height: 256 },
    accent: '#f54d00',
  },
  {
    slug: 'quota',
    title: 'Quota',
    summary:
      'CRM do ecossistema Corporative, criado para o funil de vendas da CP2eJr e para a passagem de bastão entre o Núcleo Comercial e o Núcleo de Projetos. Os protótipos da Sprint 1, desenhados no Figma e em revisão, cobrem o kanban de vendas com motivo de perda obrigatório, a lista de leads, o catálogo de componentes e o carrinho que soma o orçamento em tempo real. Um design system próprio, que reaproveita componentes do Corporative, guia as telas.',
    role: 'Gerente de Projeto',
    areas: ['Gestão de projeto', 'Revisão de design', 'Revisão de código'],
    stack: ['Figma', 'React', 'Next.js', 'Node.js'],
    year: 2026,
    images: [
      { src: '/media/web/quota/01.webp', alt: 'Capa do Figma do Quota, CRM do ecossistema Corporative, com os protótipos da Sprint 1 em revisão', width: 1007, height: 441 },
      { src: '/media/web/quota/02.webp', alt: 'Kanban de vendas do Quota com colunas de etapas, valor em aberto por coluna e cards de leads com temperatura e prioridade', width: 1102, height: 784 },
      { src: '/media/web/quota/03.webp', alt: 'Estado de arrastar um card para a coluna Perdido no kanban do Quota, com a dica de que o motivo será pedido', width: 1101, height: 784 },
      { src: '/media/web/quota/04.webp', alt: 'Lista de leads do Quota em tabela, com etapa, temperatura, prioridade, origem, responsável e valor', width: 1101, height: 784 },
      { src: '/media/web/quota/05.webp', alt: 'Catálogo de componentes do Quota, com preço base e situação de cada bloco usado nos orçamentos', width: 1101, height: 784 },
      { src: '/media/web/quota/06.webp', alt: 'Carrinho de orçamento do Quota, com itens do catálogo, quantidades e total calculado', width: 1101, height: 784 },
    ],
    icon: { src: '/media/web/quota/icon.webp', alt: 'Símbolo do Quota', width: 256, height: 256 },
    accent: '#6828f8',
  },
  {
    slug: 'made-by-you',
    title: 'Made By You',
    summary:
      'Plataforma no-code para criar, personalizar e publicar sites sem escrever código. O editor tem os modos Design, Lógica e Prévia: a página se monta por seções e modelos prontos, o celular se ajusta sozinho e o comportamento sai de blocos ligados por fios. Levou o 1º lugar em Complexidade Técnica, Nível 3, na 45ª FETIN.',
    role: 'Co-fundador',
    areas: ['Front-end', 'Editor visual e lógica em blocos', 'Produto'],
    stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'React Flow'],
    year: 2026,
    images: [
      { src: '/media/web/made-by-you/01.webp', alt: 'Início do Made By You com a busca de modelos, o passo a passo para criar um site e um exemplo de página de restaurante', width: 1440, height: 900 },
      { src: '/media/web/made-by-you/02.webp', alt: 'Galeria de modelos prontos do Made By You, como restaurante, viagens, moda e academia, mais a opção de página em branco', width: 1440, height: 900 },
      { src: '/media/web/made-by-you/03.webp', alt: 'Editor visual do Made By You no modo Design, com a barra de blocos à esquerda e o site Sabor Clássico no canvas', width: 1440, height: 900 },
      { src: '/media/web/made-by-you/04.webp', alt: 'Modo Lógica do Made By You, com os blocos de ação de cada seção organizados em colunas e ligados aos elementos da página', width: 1440, height: 900 },
      { src: '/media/web/made-by-you/05.webp', alt: 'Editor do Made By You no modo celular, com o site ajustado automaticamente para a tela pequena', width: 1440, height: 900 },
      { src: '/media/web/made-by-you/06.webp', alt: 'Diagrama das três fases da plataforma: criar, publicar e site no ar', width: 1600, height: 1067 },
    ],
    icon: { src: '/media/web/made-by-you/icon.webp', alt: 'Logotipo do Made By You', width: 256, height: 256 },
    accent: '#08a8f8',
  },
  {
    slug: 'lp-jessica',
    title: 'O Mundo da Sandrinha',
    summary:
      'Site do projeto Sandrinha, que ensina sobre diabetes com recursos lúdicos para crianças, famílias e profissionais de saúde. Reúne apresentação institucional, catálogo de produtos educativos, jogos autorais e contato, e traz embutido o jogo da memória, que depois virou template público. Projeto gerenciado por Rafael Corrêa e executado pela equipe da CP2eJr.',
    role: 'Desenvolvedor do jogo da memória',
    areas: ['Jogo da memória', 'Front-end'],
    stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
    liveUrl: 'https://jessicamartins.com.br/',
    year: 2026,
    images: [
      { src: '/media/web/lp-jessica/01.webp', alt: 'Início do site O Mundo da Sandrinha, com a personagem e os botões Explorar Produtos e Jogar Agora', width: 1440, height: 900 },
      { src: '/media/web/lp-jessica/02.webp', alt: 'Seção que apresenta a Sandrinha, com a mascote, a origem, a missão e os valores do projeto', width: 1440, height: 900 },
      { src: '/media/web/lp-jessica/03.webp', alt: 'Seção de jogos autorais do projeto, como Quem sou eu, Roleta de Mitos e Verdades, Tabuleiro Gigante e Torta na Cara', width: 1440, height: 900 },
      { src: '/media/web/lp-jessica/04.webp', alt: 'Jogo da memória do site com todas as cartas viradas para baixo', width: 1440, height: 900 },
      { src: '/media/web/lp-jessica/05.webp', alt: 'Jogo da memória em andamento, com pares de ilustrações já encontrados e o contador de acertos', width: 1440, height: 900 },
    ],
    icon: { src: '/media/web/lp-jessica/icon.webp', alt: 'Logotipo de Jéssica Martins', width: 256, height: 256 },
    accent: '#5e8ebf',
  },
  {
    slug: 'inatel2',
    title: 'Inatel²',
    summary:
      'Calculadora de notas das disciplinas de Engenharia do Inatel (C03, M03, F01, E10, M10 e H03). Cada matéria segue os próprios critérios de avaliação e o resultado mostra NP1, NP2, NPA e a situação na hora. Foi o projeto final do onboarding da CP2eJr e está publicado no GitHub Pages.',
    role: 'Desenvolvedor',
    areas: ['Front-end', 'Lógica de cálculo'],
    stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
    repoUrl: 'https://github.com/XkrulesVitor/Inatel2',
    liveUrl: 'https://xkrulesvitor.github.io/Inatel2/',
    year: 2025,
    images: [
      { src: '/media/web/inatel2/01.webp', alt: 'Calculadora de notas do Inatel² com a disciplina C03 selecionada e os campos de prova e exercícios', width: 1440, height: 900 },
      { src: '/media/web/inatel2/02.webp', alt: 'Calculadora do Inatel² com a disciplina F01 selecionada, com campos de prova teórica, seminário e exercícios', width: 1440, height: 900 },
    ],
    icon: { src: '/media/web/inatel2/icon.webp', alt: 'Ícone do Inatel²', width: 256, height: 256 },
    accent: '#3b82f6',
  },
  {
    slug: 'mrp-mobi',
    title: 'MRP Mobi',
    summary:
      'Landing page de indicação para o aplicativo de mobilidade MRP Mobi, pensada para converter visitas em cadastros pelo link de convite. Tem carrossel dos seis pilares do app, QR Code com botão para copiar o link, animação de entrada no topo e SEO completo com dados estruturados.',
    role: 'Desenvolvedor',
    areas: ['Front-end', 'SEO'],
    stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
    repoUrl: 'https://github.com/XkrulesVitor/MRP-Mobi',
    year: 2026,
    images: [],
    icon: { src: '/media/web/mrp-mobi/icon.webp', alt: 'Ícone do MRP Mobi', width: 256, height: 256 },
    accent: '#ff6b00',
  },
  {
    slug: 'memory-game',
    title: 'Jogo da Memória',
    summary:
      'Jogo da memória em React com cartas animadas em 3D e contador de acertos. O tabuleiro se ajusta sozinho à quantidade de imagens, então personalizar é só trocar a lista de figuras. Nasceu no site da Jéssica Martins e virou template público para quem quiser usar.',
    role: 'Desenvolvedor',
    areas: ['Front-end', 'Desenvolvimento de jogos'],
    playOnTv: 'memory_game',
    stack: ['Next.js', 'React', 'Tailwind CSS'],
    repoUrl: 'https://github.com/XkrulesVitor/Memory-Game-React',
    liveUrl: 'https://jessicamartins.com.br/#diversao',
    year: 2026,
    images: [
      { src: '/media/web/memory-game/01.webp', alt: 'Jogo da memória em React com dois pares encontrados e o contador de acertos', width: 1520, height: 760 },
      { src: '/media/web/memory-game/02.webp', alt: 'Jogo da memória em React com quatro pares encontrados de seis', width: 1520, height: 760 },
      { src: '/media/web/memory-game/03.webp', alt: 'Jogo da memória rodando no site de Jéssica Martins, com ilustrações nas cartas', width: 1440, height: 900 },
    ],
    // O repositório só tem um .ico: o ícone é a capa do jogo (public/media/games/memory_game.webp).
    icon: { src: '/media/web/memory-game/icon.webp', alt: 'Capa do Jogo da Memória', width: 256, height: 256 },
    accent: '#a855f7',
  },
  {
    slug: 'love-letter',
    title: 'Carta de Amor Interativa',
    summary:
      'Template de carta de amor digital: um envelope com selo de cera que se abre, a carta que se desdobra, polaroids, música e contador do tempo juntos. Textos, fotos e música são editados pelo próprio site, sem mexer em código, e o deploy sai com um clique na Vercel.',
    role: 'Desenvolvedor',
    areas: ['Front-end', 'Animação e interação'],
    stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Motion'],
    repoUrl: 'https://github.com/XkrulesVitor/Template-for-Love-Letter',
    year: 2026,
    images: [],
    icon: { src: '/media/web/love-letter/icon.svg', alt: 'Selo de lacre com um coração', width: 256, height: 256 },
    accent: '#f43f5e',
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
    summary:
      'Protótipo de IA aplicada a investimentos em criptomoedas. Seis carteiras simuladas seguem regras próprias a cada ciclo, algumas com apoio de modelos de linguagem, e um motor de risco protege cada posição com stop-loss. O painel em Next.js mostra carteiras, motor, relatórios e backtests; toda a execução é simulada e nenhuma ordem vai a uma corretora.',
    role: 'Desenvolvedor',
    areas: ['Back-end em Python', 'Front-end', 'IA aplicada'],
    stack: ['Python', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Supabase'],
    repoUrl: 'https://github.com/XkrulesVitor/V.A.L-Finance',
    year: 2026,
    images: [
      { src: '/media/web/val-finance/01.webp', alt: 'Painel de carteiras do V.A.L Finance, com patrimônio e curva de cada estratégia e os preços das moedas', width: 1440, height: 900 },
      { src: '/media/web/val-finance/02.webp', alt: 'Página de uma carteira, com patrimônio, curva de capital e posições abertas', width: 1440, height: 900 },
      { src: '/media/web/val-finance/03.webp', alt: 'Página do motor, com o número de decisões, as moedas compradas e a lista das decisões mais recentes', width: 1440, height: 900 },
      { src: '/media/web/val-finance/04.webp', alt: 'Página de evidência, com o resultado dos backtests da estratégia contra as baselines', width: 1440, height: 900 },
      { src: '/media/web/val-finance/05.webp', alt: 'Página de regimes de mercado, comparando o resultado de cada estratégia em alta, lateral e baixa', width: 1440, height: 900 },
    ],
    icon: { src: '/media/web/val-finance/icon.svg', alt: 'Ícone do V.A.L Finance', width: 256, height: 256 },
    accent: '#10b981',
  },
  {
    slug: 'portfolio-gab',
    title: 'Portfólio Gabriela',
    summary:
      'Portfólio de página única para Gabriela Castro Pereira. Um notebook em CSS 3D fica preso na tela, dá zoom e conta a história dela dentro da própria tela enquanto a página rola, com os projetos passando por cima em cards de vidro. A rolagem é suave com Lenis e as animações usam Motion.',
    role: 'Desenvolvedor',
    areas: ['Front-end', 'Design de interface', 'Animação'],
    stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Motion'],
    repoUrl: 'https://github.com/XkrulesVitor/Portfolio-Gab',
    liveUrl: 'https://portfolio-gabcper.vercel.app/',
    year: 2026,
    images: [
      { src: '/media/web/portfolio-gab/01.webp', alt: 'Início do portfólio com um notebook em CSS 3D e o nome da Gabriela', width: 1440, height: 900 },
      { src: '/media/web/portfolio-gab/02.webp', alt: 'Tela do notebook com a tela de bloqueio, a hora e o perfil', width: 1440, height: 900 },
      { src: '/media/web/portfolio-gab/03.webp', alt: 'Tela do notebook com a formação acadêmica em linha do tempo', width: 1440, height: 900 },
      { src: '/media/web/portfolio-gab/04.webp', alt: 'Tela do notebook com as tecnologias usadas, separadas por front-end, linguagens e ferramentas', width: 1440, height: 900 },
      { src: '/media/web/portfolio-gab/05.webp', alt: 'Notebook em perspectiva exibindo um dos projetos, com o título sobre a tela', width: 1440, height: 900 },
      { src: '/media/web/portfolio-gab/06.webp', alt: 'Cards de vidro com a descrição e as tags dos projetos sobre os notebooks', width: 1440, height: 900 },
    ],
    // O repositório gera o favicon no build (src/app/icon.tsx): monograma "G" lilás sobre roxo-escuro.
    icon: { src: '/media/web/portfolio-gab/icon.webp', alt: 'Monograma G do portfólio', width: 256, height: 256 },
    accent: '#6c4bdf',
  },
]

/** Texto de um projeto web que muda com o idioma (`role`, `areas` e `iconAlt` existem aqui quando existem no português). */
export interface WebProjectText {
  title: string
  summary: string
  details?: readonly string[]
  role?: string
  /** Áreas de atuação do autor no projeto, traduzidas. */
  areas?: readonly string[]
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
    areas: text.areas,
    icon: project.icon && text.iconAlt ? { ...project.icon, alt: text.iconAlt } : project.icon,
  }
}

export const WEB_PROJECTS_BY_LOCALE: ByLocale<readonly WebProject[]> = {
  pt: WEB_PROJECTS,
  en: WEB_PROJECTS.map((project) => localizeWeb(project, WEB_TEXT_EN[project.slug])),
}
