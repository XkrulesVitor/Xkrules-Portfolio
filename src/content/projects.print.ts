// `PRINT_SHOWCASE` vale o português; `PRINT_SHOWCASE_BY_LOCALE` traz os dois idiomas (o inglês está em
// `en/projects.print.ts`; marca, links, fotos e fatiamento são compartilhados).
import { PRINT_PROJECT_TEXT_EN, PRINT_TEXT_EN } from './en/projects.print.ts'
import type { ByLocale } from './i18n.ts'
import type { PrintProject, PrintShowcase } from './types'

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

/** Texto da vitrine que muda com o idioma. */
export interface PrintShowcaseText {
  tagline: string
  description: readonly string[]
}

/** Texto de uma peça que muda com o idioma. */
export interface PrintProjectText {
  title: string
  summary: string
  supports?: string
}

function localizePiece(piece: PrintProject): PrintProject {
  const text = PRINT_PROJECT_TEXT_EN[piece.slug]
  if (!text) return piece
  return {
    ...piece,
    title: text.title,
    summary: text.summary,
    slicer: piece.slicer ? { ...piece.slicer, supports: text.supports ?? piece.slicer.supports } : piece.slicer,
  }
}

export const PRINT_SHOWCASE_BY_LOCALE: ByLocale<PrintShowcase> = {
  pt: PRINT_SHOWCASE,
  en: {
    ...PRINT_SHOWCASE,
    tagline: PRINT_TEXT_EN.tagline,
    description: PRINT_TEXT_EN.description,
    projects: PRINT_SHOWCASE.projects.map(localizePiece),
  },
}
