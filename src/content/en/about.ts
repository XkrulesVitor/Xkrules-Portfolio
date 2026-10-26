// Inglês de `content/about.ts`: só o texto. Nome, links e o resto vêm do `ABOUT` em português.
// Os marcadores [TODO: ...] continuam marcadores (a UI os destaca), com o texto de dentro traduzido.
import type { AboutText } from '../about.ts'

export const ABOUT_TEXT_EN: AboutText = {
  headline: 'Software Engineering student at Inatel',
  bio: [
    'I am in the 3rd [TODO: year or term] of Software Engineering at Inatel (Instituto Nacional de Telecomunicações, in Brazil). I build web front ends with Next.js, React, TypeScript and Tailwind, such as Inatel², CP2eJR, MRP Mobi, the Memory Game and the Interactive Love Letter.',
    'I take part in game jams: the CrazyGames Game Jam, with PorriLand; the CPG 2026 Game Jam, with As Aventuras de Piter; and the 1st Cubio Brasil Game Jam, where Duel Arena won the Best Visual award. I also design board games, such as Aldeia Dorme and Star Wars: Conquista Galáctica.',
    'I do 3D modeling and printing in resin and filament under the Reino de Amestris brand. This 3D portfolio was built with React Three Fiber.',
  ],
  // Um item por grupo de `ABOUT.skills`, na mesma ordem. `items` só onde há texto a traduzir (os outros
  // grupos são nomes de tecnologia e ficam como estão).
  skills: [
    { label: 'Front-end' },
    { label: '3D and interaction' },
    { label: 'Games', items: ['GameMaker (GML)', 'Board game design'] },
    {
      label: 'Manufacturing',
      items: ['3D printing in resin', '3D printing in filament', '3D modeling [TODO: software]'],
    },
    { label: 'Academic' },
  ],
}
