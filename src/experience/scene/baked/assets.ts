/**
 * Caminhos dos assets do quarto baked (ASSET_PIPELINE §3). Fonte única: o BakedRoom carrega por
 * aqui e o `preload.ts` pré-carrega por aqui, com as MESMAS chaves de cache do `useLoader`
 * (loader + lista de URLs na mesma ordem). `PRELOAD_LIST` (lib/constants.ts) repete o caminho do glb.
 */
export const ROOM_GLB_URL = '/models/room.glb'

/**
 * Texturas do bake (mesmo atlas de UV). A ORDEM importa: `useTexture({...})` usa `Object.values`
 * como chave do cache, e o preload (`BAKED_TEXTURE_URLS`) tem de ter a mesma ordem para reaproveitar o carregamento.
 */
export const BAKED_TEXTURES = {
  night: '/textures/baked-night.webp',
  day: '/textures/baked-day.webp',
  lightMap: '/textures/lightmap.webp',
}

/** Lista na ordem de `BAKED_TEXTURES`, para `useTexture.preload`. */
export const BAKED_TEXTURE_URLS: string[] = Object.values(BAKED_TEXTURES)
