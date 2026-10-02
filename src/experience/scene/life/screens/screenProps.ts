import type { MeshBasicMaterial } from 'three'

/** Props comuns das telas vivas (`WallpaperScreen`, `CodeEditorScreen`, `TvScreen`). */
export interface ScreenProps {
  /** Material da tela (`screen_*` do glb ou o do plano do grey-box). `null` até existir. */
  material: MeshBasicMaterial | null
  /** Plano do grey-box: a UV tem v = 1 no topo (a do glb tem v = 0). */
  flipY?: boolean
}
