// `ABOUT` vale o português; `ABOUT_BY_LOCALE` traz os dois idiomas: nome, links e nomes de tecnologia são
// compartilhados, e o texto em inglês (`en/about.ts`) é aplicado por cima.
import { ABOUT_TEXT_EN } from './en/about.ts'
import type { ByLocale } from './i18n.ts'
import { SITE } from './site.ts'
import type { AboutContent, SkillGroup } from './types'

// Fonte: perfil público github.com/XkrulesVitor e informações do próprio autor.
// Só fatos confirmados. O que falta fica como [TODO: ...] explícito (a UI destaca esses marcadores).
export const ABOUT: AboutContent = {
  name: SITE.author,
  headline: 'Estudante de Engenharia de Software no Inatel',
  bio: [
    'Estou no 3º [TODO: ano ou período] de Engenharia de Software no Inatel (Instituto Nacional de Telecomunicações). Faço front-ends web com Next.js, React, TypeScript e Tailwind, como o Inatel², o CP2eJR, o MRP Mobi, o Jogo da Memória e a Carta de Amor Interativa.',
    'Participo de game jams: a Game Jam CrazyGames, com PorriLand, a Game Jam CPG 2026, com As Aventuras de Piter, e a 1ª Cubio Brasil Game Jam, em que o Duel Arena levou o prêmio de Melhor Visual. Também crio board games, como Aldeia Dorme e Star Wars: Conquista Galáctica.',
    'Faço modelagem e impressão 3D em resina e filamento com a marca Reino de Amestris. Este portfólio 3D foi construído com React Three Fiber.',
  ],
  // [TODO] avatar: foto em public/media/about/ (webp) e `avatar: { src, alt }`. Sem foto, o painel mostra as iniciais.
  // [TODO] location: cidade, quando o autor quiser exibir.
  skills: [
    {
      label: 'Front-end',
      items: [
        'Next.js',
        'React',
        'TypeScript',
        'JavaScript',
        'HTML',
        'CSS',
        'Tailwind CSS',
        'Framer Motion',
      ],
    },
    { label: '3D e interação', items: ['Three.js', 'React Three Fiber', 'Drei'] },
    { label: 'Jogos', items: ['GameMaker (GML)', 'Game design de tabuleiro'] },
    {
      label: 'Manufatura',
      items: [
        'Impressão 3D em resina',
        'Impressão 3D em filamento',
        'Modelagem 3D [TODO: software]',
      ],
    },
    { label: 'Acadêmico', items: ['Rust'] },
  ],
  // Só o GitHub por enquanto (SITE.links). Sem e-mail, de propósito.
  // [TODO] LinkedIn e Instagram: adicionar em SITE.links (content/site.ts) quando existirem.
  links: SITE.links,
}

/** Texto do `AboutContent` que muda com o idioma. */
export interface AboutText {
  headline: string
  bio: readonly string[]
  /** Um item por grupo de `ABOUT.skills`, na mesma ordem. Sem `items`, valem os do português. */
  skills: readonly { label: string; items?: readonly string[] }[]
}

function localizeAbout(base: AboutContent, text: AboutText): AboutContent {
  const skills: SkillGroup[] = base.skills.map((group, i) => ({
    label: text.skills[i]?.label ?? group.label,
    items: text.skills[i]?.items ?? group.items,
  }))
  return { ...base, headline: text.headline, bio: text.bio, skills }
}

export const ABOUT_BY_LOCALE: ByLocale<AboutContent> = {
  pt: ABOUT,
  en: localizeAbout(ABOUT, ABOUT_TEXT_EN),
}
