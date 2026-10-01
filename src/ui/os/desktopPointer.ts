/**
 * Converte um deslocamento de ponteiro (pixels da TELA) em % do desktop.
 *
 * O SO vive num wrapper fixo de 1280x720 que o drei transforma em CSS 3D (matrix3d + escala) dentro
 * do monitor. Os eventos de ponteiro chegam em pixels da tela, já escalados, então a conta divide pelo
 * tamanho RENDERIZADO do desktop: `getBoundingClientRect()` devolve a caixa escalada, e
 * (delta / largura renderizada) é a fração certa do desktop, qualquer que seja o fator de escala.
 * Os cantos de tela inclinados pela perspectiva do 3D não importam: a câmera do `desk` fica
 * perpendicular ao monitor. `null` quando o desktop ainda não tem tamanho.
 */
export function pointerDeltaPct(
  desktop: HTMLElement,
  dxPx: number,
  dyPx: number,
): { dx: number; dy: number } | null {
  const rect = desktop.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return null
  return { dx: (dxPx / rect.width) * 100, dy: (dyPx / rect.height) * 100 }
}
