// Inglês de `content/projects.games.ts`: só o texto de cada jogo, por slug (o `Record<GameSlug, ...>` exige
// os oito). Slug, tipo, ano, motor, cor, capa, `play` e URLs vêm do português. Títulos oficiais ficam como
// são (Aldeia Dorme, PorriLand, O Anel, Racco, Duel Arena, As Aventuras de Piter, Star Wars: Conquista
// Galáctica); só o título puramente descritivo traduz.
import type { GameText } from '../projects.games.ts'
import type { GameSlug } from '../types'

export const GAME_TEXT_EN: Readonly<Record<GameSlug, GameText>> = {
  aldeia_dorme: {
    title: 'Aldeia Dorme',
    genre: 'Cards, deduction and bluffing',
    players: '6 to 12 players',
    playTime: '20 to 40 min',
    summary:
      'A card and bluffing game for 6 to 12 players, with dynamic matches of 20 to 40 minutes.',
    details: [
      'What sets it apart is the fluid gameplay, the diverse characters with unique abilities and the immersive black-and-white art style. The goal is to expand the original concept, offering more strategic depth and replayability.',
    ],
    coverAlt:
      'Cover of Aldeia Dorme: an ornate frame over aged paper, a frightened hooded villager in front of a house, and the title in golden letters.',
  },
  conquista_galactica: {
    title: 'Star Wars: Conquista Galáctica',
    genre: 'Tactical cards and area control',
    players: '2 to 5 players',
    summary:
      'A tactical card and area-control game for 2 to 5 players, focused on territorial disputes, high-stakes diplomacy and resource management.',
    details: [
      'From a shared deck, players use secret units and faction abilities to fight over dynamic planets with countdowns, combining formal alliances and strategic plays to reach the victory score.',
    ],
    coverAlt:
      'Cover of Star Wars: Conquista Galáctica: the title in yellow and silver over a starry galaxy.',
  },
  porriland: {
    title: 'PorriLand',
    genre: 'God simulator',
    context: 'CrazyGames Game Jam',
    summary:
      'They found you on a remote island. Nobody remembers how or why. Now the chubby Porris build houses, form tribes, raise temples and await Your Divine Hand.',
    details: [
      'But absolute power has a price. In PorriLand, a minimalist real-time god simulation, your greatest challenge is not winning worship, but preserving balance.',
      'Keep faith between skepticism and fanaticism. Too little faith and hope fades. Too much and the fanatics will hunt down anyone who doubts. Guide the Porris from a humble tribe to a thriving metropolis without destroying the world you are meant to protect.',
    ],
    coverAlt:
      'Cover of PorriLand in pixel art: flaming meteors fall on a green island with burning huts and frightened Porris.',
    linkLabels: ['Play on itch.io'],
  },
  piter: {
    title: 'As Aventuras de Piter',
    genre: 'Card roguelike and math puzzle',
    context: 'CPG Game Jam',
    summary: 'A card roguelike and math puzzle in which the pressure of college comes to life.',
    details: [
      'The player controls Piter, an Inatel student who, on the eve of the final exams, ends up trapped in a nightmare where numbers are literal enemies. To wake up victorious, he must use quick thinking and mathematical logic to “solve” each threat.',
    ],
    coverAlt:
      'Cover of As Aventuras de Piter in pixel art: Piter, with a game controller in his yellow hair and a T-shirt with the pi symbol, against a wooden background.',
    linkLabels: ['Play on itch.io'],
  },
  o_anel: {
    title: 'O Anel',
    genre: 'Horde action',
    summary:
      'A determined scientist decides to invade the epicenter of the apocalypse: the infamous contamination zone known as O Anel (The Ring), ground zero where the whole nightmare began.',
    details: [
      'Surrounded by violent hordes, he carries the weight of eliminating every zombie that crosses his path. Only by forcing his way through this devastated area will he get the opening he needs to investigate the origin of the infection, uncover the secret of the contamination and find the definitive solution to save humanity.',
    ],
    coverAlt:
      'Cover of O Anel: an armed scientist runs through a burning city, surrounded by red-eyed zombies and an armored soldier.',
    linkLabels: ['Play on itch.io'],
  },
  racco: {
    title: 'Racco',
    genre: 'Action platformer',
    summary:
      'Racco is a determined cat who sees her peace shattered when a band of audacious worms swipes her precious cake.',
    details: [
      'Overcome by indignation and a hunger for justice, she sets off on a relentless journey, ready to fight tooth and nail and defeat every crawling thief along the way. Her final goal is to face the dreaded Worm King in a decisive showdown to rescue the lost cake and restore her feline honor.',
    ],
    coverAlt:
      'Cover of Racco in pixel art: the black cat in a red scarf faces a pink worm in a misty forest.',
    linkLabels: ['Play on itch.io'],
  },
  memory_game: {
    title: 'React Memory Game',
    genre: 'Educational memory game',
    context: 'Client project',
    summary:
      'Built with React, this memory game was created on demand to be part of a client’s website focused on diabetes awareness.',
    details: [
      'The solution combines modern web technology with a playful, educational approach, turning concepts of health, prevention and self-care into an interactive and engaging experience for visitors.',
    ],
    coverAlt:
      'Memory Game icon in pixel art: a face-down card with a question mark next to a card with a smiling star, against a starry sky.',
    linkLabels: ['See it on the client’s website'],
  },
  duel_arena: {
    title: 'Duel Arena',
    genre: 'Combat roguelike',
    context: '1st Cubio Brasil Game Jam',
    award: 'Best Visual',
    summary: 'Duel Arena is a roguelike-style combat game, developed on the Cubio platform.',
    details: [
      'Winner of the Best Visual category at the first Cubio Brasil Game Jam, the project combines dynamic duels with upgrades and an immersive art direction, using expressive lighting and different atmospheres to enrich the experience and the environmental storytelling.',
    ],
    coverAlt:
      'Cover of Duel Arena: a floating stone arena with castles, tents, blue portals and the game’s logo at the top.',
    linkLabels: ['Download Cubio'],
  },
}
