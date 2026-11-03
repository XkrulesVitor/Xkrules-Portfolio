// `ABOUT` vale o português; `ABOUT_BY_LOCALE` traz os dois idiomas: nome, links, avatar (arquivo) e nomes de
// tecnologia são compartilhados, e o texto em inglês (`en/about.ts`) é aplicado por cima.
import { ABOUT_TEXT_EN } from './en/about.ts'
import type { ByLocale } from './i18n.ts'
import { SITE } from './site.ts'
import type { AboutAward, AboutContent, AboutTimelineItem, SkillGroup } from './types'

// Fonte: LinkedIn e README do perfil github.com/XkrulesVitor, conferidos com o autor. Só fatos confirmados.
// Os cinco rótulos de grupo de `skills` que o SO usa em "Este Computador" (Front-end, 3D e interação,
// Manufatura, Jogos, Acadêmico; ver `OS_TEXT.computer.skillGroups`) têm de continuar existindo aqui.
export const ABOUT: AboutContent = {
  name: SITE.author,
  headline: 'Desenvolvedor Front-End e estudante de Engenharia de Software no Inatel',
  location: 'Santa Rita do Sapucaí, Minas Gerais',
  // Foto do perfil do GitHub, recortada em torno do rosto (public/media/about/avatar.webp, 256 px).
  avatar: {
    src: '/media/about/avatar.webp',
    alt: 'Retrato de Vitor Noronha, de óculos e blusa preta.',
    width: 256,
    height: 256,
  },
  tagline:
    'Construo interfaces que chegam ao usuário final, resolvendo o caminho inteiro, do requisito à entrega.',
  bio: [
    'Sou desenvolvedor front-end e curso Engenharia de Software no Inatel. Uso React.js, Next.js e TypeScript na interface e tenho C++, C, Java e Python como base algorítmica. Gosto de transitar entre o rigor da lógica de programação e a criatividade do design de interface.',
    'Na CP2eJr, empresa júnior, sou Coordenador de Pesquisa e Desenvolvimento e Gerente de Projetos: lidero o ciclo que pesquisa, documenta, testa e implementa tecnologias, e conduzi o desenvolvimento da plataforma CP2eJR Corporative. Também sou co-fundador da Made By You, plataforma no-code para criar e publicar produtos web.',
    'Na iniciação científica do Inatel, trabalho com modelagem computacional e manufatura aditiva em resina, e com a marca Reino de Amestris faço modelagem e impressão 3D. Também desenvolvo jogos em GML e Construct 3 e crio board games.',
  ],
  // Mais recente primeiro.
  awards: [
    {
      title: '1º lugar em Complexidade Técnica, Nível 3',
      issuer: '45ª FETIN, Inatel, setembro de 2026',
      detail:
        'Prêmio conquistado com a Made By You, ao lado de Nicollas Sarzeda, Gabriel Alves Pereira e Rafael Corrêa Barbosa, com orientação do prof. Christopher Lima.',
    },
    {
      title: '2º lugar na Gamificação Interna 2026/1',
      issuer: 'CP2eJr, agosto de 2026',
      detail: 'Reconhecimento pelo desempenho na gamificação interna da empresa júnior no semestre 2026/1.',
    },
    {
      title: 'Gestão Destaque 2026/1',
      issuer: 'CP2eJr, agosto de 2026',
      detail:
        'Destaque da gestão da empresa júnior no semestre 2026/1, período em que assumi a coordenação de P&D.',
    },
    {
      title: 'Mandou Bem 2026/1',
      issuer: 'CP2eJr, agosto de 2026',
      detail: 'Concedido ao membro que mais recebeu reconhecimentos dos colegas no semestre.',
    },
    {
      title: 'Melhor Trainee 2025',
      issuer: 'CP2eJr, novembro de 2025',
      detail: 'Eleito por votação popular durante o período de trainee.',
    },
    {
      title: 'Melhor Visual',
      issuer: '1ª Cubio Brasil Game Jam, dezembro de 2024',
      detail: 'Prêmio do Duel Arena, roguelike de combate feito na plataforma Cubio.',
    },
  ],
  // Mais recente primeiro.
  timeline: [
    {
      role: 'Coordenador de P&D e Gerente de Projetos',
      place: 'CP2 Empresa Júnior',
      period: 'Set 2025 até hoje',
      detail:
        'Entrei como trainee, passei por desenvolvimento web e hoje lidero o ciclo de P&D: pesquisa, documentação, testes e implementação de tecnologias.',
    },
    {
      role: 'Pesquisador de Iniciação Científica',
      place: 'Inatel',
      period: 'Mar 2026 até hoje',
      detail:
        'Modelagem computacional, reconstrução bioestrutural e manufatura aditiva em resina, do pós-processamento à validação.',
    },
    {
      role: 'Bacharelado em Engenharia de Software',
      place: 'Inatel',
      period: 'Fev 2025 a fev 2030 (previsto)',
      detail: 'Atividades: CP2eJr e OctoDevs.',
    },
    {
      role: 'Operador de Computador I',
      place: 'Univás, Pouso Alegre',
      period: 'Jun 2023 a jan 2025',
    },
    {
      role: 'Auxiliar Administrativo II',
      place: 'Univás, Pouso Alegre',
      period: 'Mai 2019 a jun 2023',
      detail: 'Gerência de Laboratórios de Informática.',
    },
    {
      role: 'Técnico em Eletrônica com ênfase em Telecomunicações',
      place: 'ETE FMC',
      period: '2015 a 2017',
    },
  ],
  // Batem com o README do perfil (selo de tecnologias e texto). Sem e-mail, de propósito.
  skills: [
    {
      label: 'Front-end',
      items: ['React.js', 'Next.js', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Tailwind CSS'],
    },
    { label: 'Base algorítmica', items: ['C++', 'C', 'Java', 'Python'] },
    {
      label: 'Dados e ferramentas',
      items: ['Supabase', 'Firebase', 'PostgreSQL', 'MySQL', 'Git', 'GitHub', 'Figma'],
    },
    { label: '3D e interação', items: ['Three.js', 'React Three Fiber', 'Drei', 'Blender'] },
    { label: 'Jogos', items: ['GameMaker (GML)', 'Construct 3', 'Game design de tabuleiro'] },
    {
      label: 'Manufatura',
      items: ['Impressão 3D em resina', 'Impressão 3D em filamento', 'Modelagem 3D'],
    },
    {
      label: 'Acadêmico',
      items: ['Modelagem computacional', 'Reconstrução bioestrutural', 'Manufatura aditiva'],
    },
  ],
  // GitHub, LinkedIn e Made By You (SITE.links, no content/site.ts).
  links: SITE.links,
}

/** Texto do `AboutContent` que muda com o idioma. */
export interface AboutText {
  headline: string
  tagline: string
  location: string
  /** Descrição da foto (o arquivo é o do português). */
  avatarAlt: string
  bio: readonly string[]
  /** Mesma ordem e mesmo tamanho de `ABOUT.awards`. */
  awards: readonly AboutAward[]
  /** Mesma ordem e mesmo tamanho de `ABOUT.timeline`. */
  timeline: readonly AboutTimelineItem[]
  /** Um item por grupo de `ABOUT.skills`, na mesma ordem. Sem `items`, valem os do português. */
  skills: readonly { label: string; items?: readonly string[] }[]
}

function localizeAbout(base: AboutContent, text: AboutText): AboutContent {
  const skills: SkillGroup[] = base.skills.map((group, i) => ({
    label: text.skills[i]?.label ?? group.label,
    items: text.skills[i]?.items ?? group.items,
  }))
  return {
    ...base,
    headline: text.headline,
    tagline: text.tagline,
    location: text.location,
    avatar: base.avatar ? { ...base.avatar, alt: text.avatarAlt } : undefined,
    bio: text.bio,
    awards: text.awards,
    timeline: text.timeline,
    skills,
  }
}

export const ABOUT_BY_LOCALE: ByLocale<AboutContent> = {
  pt: ABOUT,
  en: localizeAbout(ABOUT, ABOUT_TEXT_EN),
}
