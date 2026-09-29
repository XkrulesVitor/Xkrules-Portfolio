import { SITE } from './site'
import type { AboutContent } from './types'

// Fonte: perfil público github.com/XkrulesVitor e informações do próprio autor.
// Só fatos confirmados. O que falta fica como [TODO: ...] explícito (a UI destaca esses marcadores).
export const ABOUT: AboutContent = {
  name: SITE.author,
  headline: 'Estudante de Engenharia de Software no Inatel',
  bio: [
    'Estou no 3º [TODO: ano ou período] de Engenharia de Software no Inatel (Instituto Nacional de Telecomunicações). Faço front-ends web com Next.js, React, TypeScript e Tailwind, como o Inatel², o CP2eJR, o MRP Mobi, o Jogo da Memória e a Carta de Amor Interativa.',
    'Participo de game jams: a Game Jam CrazyGames, com a Porrilândia, e a Game Jam CPG 2026, com As Aventuras de Peter, feito em GameMaker. Também crio board games, como a expansão de Terra e A Aldeia Dorme.',
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
