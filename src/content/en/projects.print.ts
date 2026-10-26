// Inglês de `content/projects.print.ts`: só o texto. Links, fotos e parâmetros de fatiamento vêm do português.
import type { PrintProjectText, PrintShowcaseText } from '../projects.print.ts'

export const PRINT_TEXT_EN: PrintShowcaseText = {
  tagline: 'Resin and filament 3D modeling and printing.',
  description: [
    'Reino de Amestris is my 3D modeling and printing brand.',
    'I model the pieces and print them in resin and in filament.',
  ],
}

/**
 * Texto de cada peça da vitrine, por slug. Vazio enquanto `PRINT_SHOWCASE.projects` está vazio: ao
 * adicionar uma peça lá, adicione aqui o título e o resumo em inglês (o teste de paridade acusa a falta).
 */
export const PRINT_PROJECT_TEXT_EN: Readonly<Record<string, PrintProjectText>> = {}
