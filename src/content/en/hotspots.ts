// Inglês de `content/hotspots.ts`: só o texto de cada hotspot (o resto do registry é compartilhado).
import type { HotspotText } from '../hotspots.ts'
import type { HotspotId } from '../types'

export const HOTSPOT_TEXT_EN: Readonly<Record<HotspotId, HotspotText>> = {
  chair: {
    label: 'About me',
    description: 'Who I am, what I do and how to find me.',
  },
  desk: {
    label: 'Web projects',
    description: 'Web development projects, inside the monitor.',
  },
  printer: {
    label: 'Reino de Amestris',
    description: '3D printing and digital manufacturing.',
  },
  shelf: {
    label: 'Board games and game dev',
    description: 'Board games and digital games that I created.',
  },
}
