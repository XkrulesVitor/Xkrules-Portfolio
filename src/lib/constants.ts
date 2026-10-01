/** Todo .glb usado pela cena entra aqui (preload na tela de loading). Vazio no grey-box. */
export const PRELOAD_LIST: readonly string[] = []

/** Parâmetros de URL do deep-link: hotspot em foco e sub-vista (ex.: ?focus=shelf&view=digital). */
export const FOCUS_QUERY_PARAM = 'focus'
export const VIEW_QUERY_PARAM = 'view'

/**
 * Largura máxima do painel lateral DOM, em px. PRECISA bater com o `w-[min(440px,92cqw)]` do
 * `ui/panels/PanelShell.tsx`: o enquadramento responsivo da câmera (`experience/camera/framing.ts`)
 * reserva essa faixa da tela para o painel e encaixa o conteúdo do hotspot no resto.
 */
export const PANEL_WIDTH_PX = 440
