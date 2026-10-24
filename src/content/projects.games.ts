import type { GameProject } from './types'

// A ordem de cada aba é a ordem do painel e a da prateleira (estante e tampo do rack, da esquerda
// para a direita). Digitais do mais novo para o mais antigo.
export const GAME_PROJECTS: readonly GameProject[] = [
  {
    slug: 'aldeia_dorme',
    title: 'Aldeia Dorme',
    kind: 'tabuleiro',
    genre: 'Cartas, dedução e blefe',
    players: '6 a 12 jogadores',
    playTime: '20 a 40 min',
    summary:
      'Um jogo de cartas e blefe para 6 a 12 jogadores, com partidas dinâmicas de 20 a 40 minutos.',
    details: [
      'O diferencial está na jogabilidade fluida, nos personagens diversificados com habilidades únicas e no estilo de arte imersivo em preto e branco. O objetivo é expandir o conceito original, oferecendo mais profundidade estratégica e rejogabilidade.',
    ],
    accent: '#d9a03a',
    cover: {
      src: '/media/games/aldeia_dorme.webp',
      alt: 'Capa de Aldeia Dorme: moldura ornamentada sobre papel envelhecido, uma aldeã encapuzada e assustada diante de uma casa, e o título em letras douradas.',
      width: 1024,
      height: 1024,
    },
    images: [],
    links: [],
  },
  {
    slug: 'conquista_galactica',
    title: 'Star Wars: Conquista Galáctica',
    kind: 'tabuleiro',
    genre: 'Cartas táticas e controle de área',
    players: '2 a 5 jogadores',
    summary:
      'Um jogo tático de cartas e controle de área para 2 a 5 jogadores, focado em disputa territorial, diplomacia de alto risco e gestão de recursos.',
    details: [
      'A partir de um baralho compartilhado, os jogadores usam unidades secretas e habilidades de facção para disputar planetas dinâmicos com contagem regressiva, combinando alianças formais e jogadas estratégicas para alcançar a pontuação de vitória.',
    ],
    accent: '#f2c14e',
    cover: {
      src: '/media/games/conquista_galactica.webp',
      alt: 'Capa de Star Wars: Conquista Galáctica: o título em amarelo e prata sobre uma galáxia estrelada.',
      width: 1024,
      height: 1024,
    },
    images: [],
    links: [],
  },
  {
    slug: 'porriland',
    title: 'PorriLand',
    kind: 'digital',
    genre: 'Simulador de divindade',
    context: 'Game Jam CrazyGames',
    year: 2026,
    engine: 'Construct 3',
    summary:
      'Eles te encontraram em uma ilha remota. Ninguém se lembra como ou por quê. Agora, os rechonchudos Porris constroem casas, formam tribos, erguem templos e aguardam a Sua Mão Divina.',
    details: [
      'Mas o poder absoluto tem um preço. Em PorriLand, um jogo de simulação de divindade minimalista em tempo real, seu maior desafio não é conquistar a adoração, mas sim preservar o equilíbrio.',
      'Mantenha a fé entre o ceticismo e o fanatismo. Pouca fé e a esperança se esvai. Fé em excesso e os fanáticos caçarão qualquer um que duvide. Guie os Porris de uma tribo humilde a uma metrópole próspera sem destruir o mundo que você deve proteger.',
    ],
    accent: '#29a3e8',
    cover: {
      src: '/media/games/porriland.webp',
      alt: 'Capa de PorriLand em pixel art: meteoros em chamas caem sobre uma ilha verde com cabanas pegando fogo e Porris assustados.',
      width: 512,
      height: 512,
    },
    images: [],
    links: [{ label: 'Jogar no itch.io', href: 'https://xkrulesf3lipe.itch.io/porriland', kind: 'itch' }],
  },
  {
    slug: 'piter',
    title: 'As Aventuras de Piter',
    kind: 'digital',
    genre: 'Roguelike de cartas e puzzle matemático',
    context: 'Game Jam CPG',
    year: 2026,
    engine: 'GameMaker Studio',
    summary: 'Um roguelike de cartas e puzzle matemático em que a pressão da faculdade ganha vida.',
    details: [
      'O jogador controla Piter, um estudante do Inatel que, na véspera das provas finais, acaba preso em um pesadelo onde os números são inimigos literais. Para acordar vitorioso, ele precisa usar raciocínio rápido e lógica matemática para "resolver" cada ameaça.',
    ],
    accent: '#f4d23c',
    cover: {
      src: '/media/games/piter.webp',
      alt: 'Capa de As Aventuras de Piter em pixel art: Piter, com um controle de videogame no cabelo amarelo e camiseta com o símbolo de pi, sobre um fundo de madeira.',
      width: 512,
      height: 512,
    },
    images: [],
    links: [{ label: 'Jogar no itch.io', href: 'https://xkrulesf3lipe.itch.io/piter', kind: 'itch' }],
  },
  {
    slug: 'memory_game',
    title: 'Jogo da Memória em React',
    kind: 'digital',
    genre: 'Jogo da memória educativo',
    context: 'Projeto para cliente',
    year: 2026,
    engine: 'React',
    summary:
      'Desenvolvido em React, este jogo da memória foi criado sob demanda para integrar o site de uma cliente com foco em conscientização sobre o diabetes.',
    details: [
      'A solução alia tecnologia web moderna a uma abordagem lúdica e educativa, transformando conceitos de saúde, prevenção e autocuidado em uma experiência interativa e envolvente para os visitantes.',
    ],
    accent: '#8b5cf6',
    cover: {
      src: '/media/games/memory_game.webp',
      alt: 'Ícone do Jogo da Memória em pixel art: uma carta virada com um ponto de interrogação ao lado de uma carta com uma estrela sorridente, sobre um céu estrelado.',
      width: 512,
      height: 512,
    },
    images: [],
    links: [{ label: 'Jogar no site', href: 'https://jessicamartins.com.br/#diversao', kind: 'live' }],
  },
  {
    slug: 'o_anel',
    title: 'O Anel',
    kind: 'digital',
    genre: 'Ação contra hordas',
    year: 2025,
    engine: 'Construct 3',
    summary:
      'Um cientista determinado decide invadir o epicentro do apocalipse: a infame zona de contaminação batizada de O Anel, o ponto zero onde todo o pesadelo começou.',
    details: [
      'Cercado por hordas violentas, ele carrega nos ombros o peso de eliminar cada zumbi que cruzar o seu caminho. Apenas abrindo passagem à força por essa área devastada ele conseguirá a brecha necessária para investigar a origem da infecção, desvendar o segredo da contaminação e encontrar a solução definitiva para salvar a humanidade.',
    ],
    accent: '#f26b1d',
    cover: {
      src: '/media/games/o_anel.webp',
      alt: 'Capa de O Anel: um cientista armado corre por uma cidade em chamas, cercado por zumbis de olhos vermelhos e um soldado blindado.',
      width: 512,
      height: 512,
    },
    images: [],
    links: [
      { label: 'Jogar no itch.io', href: 'https://xkrulesf3lipe.itch.io/um-jogo-de-hordas-o-anel', kind: 'itch' },
    ],
  },
  {
    slug: 'racco',
    title: 'Racco',
    kind: 'digital',
    genre: 'Plataforma de ação',
    year: 2025,
    engine: 'Construct 3',
    summary:
      'Racco é uma gata determinada que vê sua paz destruída quando um bando de minhocas audaciosas surrupia o seu precioso bolo.',
    details: [
      'Tomada pela indignação e pela fome de justiça, ela parte em uma jornada incansável, pronta para lutar com unhas e dentes e derrotar cada uma das ladras rastejantes pelo caminho. Seu objetivo final é encarar o temido Rei Minhoca em um confronto decisivo para resgatar o bolo perdido e restaurar sua honra felina.',
    ],
    accent: '#4fa39a',
    cover: {
      src: '/media/games/racco.webp',
      alt: 'Capa de Racco em pixel art: a gata preta de cachecol vermelho encara uma minhoca rosa numa floresta enevoada.',
      width: 512,
      height: 512,
    },
    images: [],
    links: [{ label: 'Jogar no itch.io', href: 'https://beinez.itch.io/racco', kind: 'itch' }],
  },
  {
    slug: 'duel_arena',
    title: 'Duel Arena',
    kind: 'digital',
    genre: 'Roguelike de combate',
    context: '1ª Cubio Brasil Game Jam',
    award: 'Melhor Visual',
    year: 2024,
    engine: 'Cubio',
    summary: 'Duel Arena é um jogo de combate no estilo roguelike, desenvolvido na plataforma Cubio.',
    details: [
      'Vencedor da categoria de Melhor Visual na primeira Cubio Brasil Game Jam, o projeto combina duelos dinâmicos com upgrades e uma direção de arte imersiva, utilizando iluminação expressiva e diferentes atmosferas para enriquecer a experiência e a narrativa ambiental.',
    ],
    accent: '#3d9bff',
    cover: {
      src: '/media/games/duel_arena.webp',
      alt: 'Capa de Duel Arena: arena de pedra flutuante com castelos, barracas, portais azuis e o logo do jogo no alto.',
      width: 512,
      height: 512,
    },
    images: [],
    links: [],
  },
]
