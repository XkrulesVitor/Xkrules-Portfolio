import { GAME_PROJECTS } from '@/content/projects.games'

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

/**
 * Capas dos jogos (content/projects.games.ts) que viram textura no quadro `cover_<slug>` de cada
 * caixa. O `GameCovers` carrega `GAME_COVER_URLS` e o preload usa a MESMA lista, na mesma ordem.
 */
export const GAME_COVERS = GAME_PROJECTS.flatMap((game) => (game.cover ? [{ slug: game.slug, url: game.cover.src }] : []))
export const GAME_COVER_URLS: string[] = GAME_COVERS.map((cover) => cover.url)
