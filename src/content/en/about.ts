// Inglês de `content/about.ts`: só o texto. Nome, links, foto (arquivo) e nomes de tecnologia vêm do
// `ABOUT` em português. As listas (`awards`, `timeline`, `skills`) seguem a mesma ordem e o mesmo tamanho.
import type { AboutText } from '../about.ts'

export const ABOUT_TEXT_EN: AboutText = {
  headline: 'Front-End Developer and Software Engineering student at Inatel',
  tagline:
    'I build interfaces that reach the end user, owning the whole path, from requirement to delivery.',
  location: 'Santa Rita do Sapucaí, Minas Gerais, Brazil',
  avatarAlt: 'Portrait of Vitor Noronha, wearing glasses and a black sweater.',
  bio: [
    'I am a front-end developer studying Software Engineering at Inatel. I use React.js, Next.js and TypeScript on the interface and have C++, C, Java and Python as my algorithmic foundation. I enjoy moving between the rigor of programming logic and the creativity of interface design.',
    'At CP2eJr, a junior enterprise, I am the Research and Development Coordinator and Project Manager: I lead the cycle that researches, documents, tests and implements technologies, and I led the development of the CP2eJR Corporative platform. I am also a co-founder of Made By You, a no-code platform to create and publish web products.',
    'In undergraduate research at Inatel, I work on computational modeling and resin additive manufacturing, and under the Reino de Amestris brand I do 3D modeling and printing. I also develop games in GML and Construct 3 and design board games.',
  ],
  awards: [
    {
      title: '1st place in Technical Complexity, Level 3',
      issuer: '45th FETIN, Inatel, September 2026',
      detail:
        'Won with Made By You, alongside Nicollas Sarzeda, Gabriel Alves Pereira and Rafael Corrêa Barbosa, under the guidance of Prof. Christopher Lima.',
    },
    {
      title: '2nd place in Internal Gamification 2026/1',
      issuer: 'CP2eJr, August 2026',
      detail: 'Recognition for performance in the junior enterprise’s internal gamification in the 2026/1 term.',
    },
    {
      title: 'Outstanding Management 2026/1',
      issuer: 'CP2eJr, August 2026',
      detail:
        'A standout of the junior enterprise’s management in the 2026/1 term, the period in which I took over R&D coordination.',
    },
    {
      title: 'Mandou Bem 2026/1',
      issuer: 'CP2eJr, August 2026',
      detail: 'Given to the member who received the most peer recognitions in the term.',
    },
    {
      title: 'Best Trainee 2025',
      issuer: 'CP2eJr, November 2025',
      detail: 'Elected by popular vote during the trainee period.',
    },
    {
      title: 'Best Visual',
      issuer: '1st Cubio Brasil Game Jam, December 2024',
      detail: 'Award for Duel Arena, a combat roguelike made on the Cubio platform.',
    },
  ],
  timeline: [
    {
      role: 'R&D Coordinator and Project Manager',
      place: 'CP2 Empresa Júnior',
      period: 'Sep 2025 to present',
      detail:
        'I joined as a trainee, moved through web development and now lead the R&D cycle: research, documentation, testing and implementation of technologies.',
    },
    {
      role: 'Undergraduate Researcher',
      place: 'Inatel',
      period: 'Mar 2026 to present',
      detail:
        'Computational modeling, biostructural reconstruction and resin additive manufacturing, from post-processing to validation.',
    },
    {
      role: 'Bachelor’s degree in Software Engineering',
      place: 'Inatel',
      period: 'Feb 2025 to Feb 2030 (expected)',
      detail: 'Activities: CP2eJr and OctoDevs.',
    },
    {
      role: 'Computer Operator I',
      place: 'Univás, Pouso Alegre',
      period: 'Jun 2023 to Jan 2025',
    },
    {
      role: 'Administrative Assistant II',
      place: 'Univás, Pouso Alegre',
      period: 'May 2019 to Jun 2023',
      detail: 'Computer Labs Management office.',
    },
    {
      role: 'Electronics Technician, Telecommunications emphasis',
      place: 'ETE FMC',
      period: '2015 to 2017',
    },
  ],
  // Um item por grupo de `ABOUT.skills`, na mesma ordem. `items` só onde há texto a traduzir (os outros
  // grupos são nomes de tecnologia e ficam como estão). Os rótulos Front-end, 3D and interaction,
  // Manufacturing, Games e Academic têm de bater com `OS_TEXT_EN.computer.skillGroups`.
  skills: [
    { label: 'Front-end' },
    { label: 'Algorithmic foundation' },
    { label: 'Data and tools' },
    { label: '3D and interaction' },
    { label: 'Games', items: ['GameMaker (GML)', 'Construct 3', 'Board game design'] },
    {
      label: 'Manufacturing',
      items: ['3D printing in resin', '3D printing in filament', '3D modeling'],
    },
    {
      label: 'Academic',
      items: ['Computational modeling', 'Biostructural reconstruction', 'Additive manufacturing'],
    },
  ],
}
