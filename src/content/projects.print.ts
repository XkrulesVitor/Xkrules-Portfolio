import type { PrintShowcase } from './types'

// Reino de Amestris: marca de modelagem e impressão 3D (resina e filamento). Só fatos confirmados.
export const PRINT_SHOWCASE: PrintShowcase = {
  brand: 'Reino de Amestris',
  tagline: 'Modelagem e impressão 3D em resina e filamento.',
  description: [
    'O Reino de Amestris é a minha marca de modelagem e impressão 3D.',
    'Eu modelo as peças e imprimo em resina e em filamento.',
  ],
  // [TODO] links: loja do Reino de Amestris (kind 'store') e Instagram (kind 'instagram').
  links: [],
  // [TODO] projects: fotos das peças em public/media/print/ (webp) + { slug, title, summary, material, images }.
  // Enquanto estiver vazio, o painel mostra o estado vazio da vitrine.
  projects: [],
}
