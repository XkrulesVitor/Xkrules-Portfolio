/**
 * Todo .glb usado pela cena entra aqui (preload na tela de loading). As texturas do bake são
 * pré-carregadas em `experience/preload.ts` (lista em `scene/baked/assets.ts`). Com `?greybox` nada
 * disso é pré-carregado. O caminho repete `ROOM_GLB_URL` de `scene/baked/assets.ts`.
 */
export const PRELOAD_LIST: readonly string[] = ['/models/room.glb']

/** Parâmetros de URL do deep-link: hotspot em foco e sub-vista (ex.: ?focus=shelf&view=digital). */
export const FOCUS_QUERY_PARAM = 'focus'
export const VIEW_QUERY_PARAM = 'view'

/**
 * Largura máxima do painel lateral DOM, em px. PRECISA bater com o `w-[min(440px,92cqw)]` do
 * `ui/panels/PanelShell.tsx`: o enquadramento responsivo da câmera (`experience/camera/framing.ts`)
 * reserva essa faixa da tela para o painel e encaixa o conteúdo do hotspot no resto.
 */
export const PANEL_WIDTH_PX = 440
