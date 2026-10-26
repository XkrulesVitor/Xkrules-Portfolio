import { DECOR_COVERS } from '@/content/decor'
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
 * caixa.
 */
export const GAME_COVERS = GAME_PROJECTS.flatMap((game) => (game.cover ? [{ slug: game.slug, url: game.cover.src }] : []))
export const GAME_COVER_URLS: string[] = GAME_COVERS.map((cover) => cover.url)

/** Capas da decoração da estante (content/decor.ts): Root, Heat e Everdell, nos quadros `cover_decor_*`. */
export const DECOR_COVER_ENTRIES = DECOR_COVERS.map((decor) => ({ node: decor.node, url: decor.image.src }))
export const DECOR_COVER_URLS: string[] = DECOR_COVER_ENTRIES.map((decor) => decor.url)

/**
 * Todas as capas, na ordem do `useTexture` do `GameCovers`: primeiro as dos jogos (mesma ordem de
 * `GAME_COVERS`), depois as da decoração (mesma ordem de `DECOR_COVER_ENTRIES`). O `preload.ts` usa
 * esta MESMA lista para reaproveitar o carregamento (a chave do cache é a lista de URLs).
 */
export const COVER_URLS: string[] = [...GAME_COVER_URLS, ...DECOR_COVER_URLS]
