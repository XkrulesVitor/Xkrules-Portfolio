import { useLayoutEffect, useEffect, useMemo, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, useTexture } from '@react-three/drei'
import { damp } from 'maath/easing'
import { LinearFilter, LinearMipmapLinearFilter, NoColorSpace, SRGBColorSpace, type Texture } from 'three'
import { prefersReducedMotion } from '@/lib/device'
import type { HotspotId } from '@/content/types'
import { useExperienceStore, type ExperienceState } from '@/store/useExperienceStore'
import { BAKED_TEXTURES, ROOM_GLB_URL } from './assets'
import { BakedMaterial, ZONE_STRENGTH } from './BakedMaterial'
import { useRoomRegistry, type RoomRegistry } from './RoomContext'
import { buildRoom, type EmissiveData } from './roomNodes'
import { ZONE_LIGHT_HOTSPOT } from './zones'

/** Tempo (s) aproximado da troca dia/noite: o `uNightMix` e os emissivos fazem damp até o alvo. */
const THEME_SMOOTH_TIME = 0.45
/** Tempo (s) das luzes de zona subirem/descerem no hover e no foco. */
const ZONE_SMOOTH_TIME = 0.3
/** Em dia as luzes de zona apagam (como na preview do dia); o hover/foco ainda acende esta fração. */
const DAY_ACTIVE_LEVEL = 0.5
/** Teto do delta por frame (a aba em segundo plano devolve saltos grandes). */
const MAX_DT = 0.1

function configureTexture(texture: Texture, anisotropy: number, srgb: boolean) {
  if (texture.userData.bakedConfigured) return
  texture.userData.bakedConfigured = true
  texture.colorSpace = srgb ? SRGBColorSpace : NoColorSpace
  texture.flipY = false
  texture.generateMipmaps = true
  texture.minFilter = LinearMipmapLinearFilter
  texture.magFilter = LinearFilter
  texture.anisotropy = anisotropy
  texture.needsUpdate = true
}

/** Entrega as texturas ao material (helper de módulo: o lint de imutabilidade proíbe mexer em valores de hooks no componente). */
function bindTextures(material: BakedMaterial, night: Texture, day: Texture, lightMap: Texture) {
  material.uBakedNight = night
  material.uBakedDay = day
  material.uLightMap = lightMap
}

interface ThemeAnim {
  night: number
  tv: number
  desk: number
  pc: number
  reduced: boolean
}

/** Escreve o estado animado nos uniforms e no registro (uma vez por frame). */
function applyAnimation(material: BakedMaterial, registry: RoomRegistry, anim: ThemeAnim) {
  material.uNightMix = anim.night
  material.uLightTvStrength = anim.tv
  material.uLightDeskStrength = anim.desk
  material.uLightPcStrength = anim.pc
  registry.nightMix.current = anim.night
}

/** Hover OU foco no hotspot (o foco inclui o voo rumo a ele, em que `focus` já é o destino). */
function isHotspotOn(s: Pick<ExperienceState, 'hovered' | 'focus'>, id: HotspotId): boolean {
  return s.hovered === id || s.focus === id
}

/** Fração em que a luz de zona vale: 1 à noite; de dia só o resquício do hover/foco. */
function zoneDayLevel(night: number, active: boolean): number {
  return night + (1 - night) * (active ? DAY_ACTIVE_LEVEL : 0)
}

/**
 * O quarto baked (ARCHITECTURE §12.3): carrega `room.glb` + as 3 texturas, aplica o `BakedMaterial`
 * compartilhado nos nós baked, materiais próprios nos emissivos/telas/vidro (ver `roomNodes.ts`) e
 * publica os nós por nome (`useRoomNode`). A cada frame faz damp do tema (`uNightMix`, força dos
 * emissivos) e das luzes de zona (hover/foco), lendo o store por `getState()`: sem setState no frame.
 *
 * Suspende até tudo carregar (o `Scene` envolve num Suspense + ErrorBoundary: se falhar, cai no grey-box).
 */
export function BakedRoom() {
  const gl = useThree((s) => s.gl)
  const registry = useRoomRegistry()

  const gltf = useGLTF(ROOM_GLB_URL, false) // meshopt já vem ligado; sem Draco (o glb não usa)
  const textures = useTexture(BAKED_TEXTURES)

  const baked = useMemo(() => new BakedMaterial(), [])
  const room = useMemo(() => buildRoom(gltf.scene, baked), [gltf.scene, baked])

  // Estado animado, mutável, fora do React. Nasce no valor do tema atual (sem "voo" na montagem).
  const [anim] = useState(() => {
    const night = useExperienceStore.getState().theme === 'night' ? 1 : 0
    return {
      night,
      tv: ZONE_STRENGTH.tv.base * night,
      desk: ZONE_STRENGTH.desk.base * night,
      pc: ZONE_STRENGTH.pc.base * night,
      reduced: prefersReducedMotion(),
    }
  })

  // Texturas: espaço de cor, flipY, mipmaps e anisotropia máxima (antes do 1º upload).
  useLayoutEffect(() => {
    const anisotropy = gl.capabilities.getMaxAnisotropy()
    configureTexture(textures.night, anisotropy, true)
    configureTexture(textures.day, anisotropy, true)
    configureTexture(textures.lightMap, anisotropy, false)
    bindTextures(baked, textures.night, textures.day, textures.lightMap)
  }, [gl, textures, baked])

  // Publica os nós por nome para hotspots, Effects (contorno) e V.3.
  useLayoutEffect(() => {
    registry.publish(room.nodes)
    return () => registry.publish(null)
  }, [registry, room])

  useEffect(
    () => () => {
      room.owned.forEach((m) => m.dispose())
      baked.dispose()
    },
    [room, baked],
  )

  useFrame((_, delta) => {
    const dt = Math.min(delta, MAX_DT)
    const s = useExperienceStore.getState()
    const slow = anim.reduced ? 0.0001 : 1 // prefers-reduced-motion: tema e luzes trocam sem transição

    damp(anim, 'night', s.theme === 'night' ? 1 : 0, THEME_SMOOTH_TIME * slow, dt)
    const night = anim.night

    const tvOn = isHotspotOn(s, ZONE_LIGHT_HOTSPOT.tv)
    const deskOn = isHotspotOn(s, ZONE_LIGHT_HOTSPOT.desk)
    const pcOn = isHotspotOn(s, ZONE_LIGHT_HOTSPOT.pc)
    const tv = ZONE_STRENGTH.tv
    const desk = ZONE_STRENGTH.desk
    const pc = ZONE_STRENGTH.pc
    damp(anim, 'tv', (tvOn ? tv.active : tv.base) * zoneDayLevel(night, tvOn), ZONE_SMOOTH_TIME * slow, dt)
    damp(anim, 'desk', (deskOn ? desk.active : desk.base) * zoneDayLevel(night, deskOn), ZONE_SMOOTH_TIME * slow, dt)
    damp(anim, 'pc', (pcOn ? pc.active : pc.base) * zoneDayLevel(night, pcOn), ZONE_SMOOTH_TIME * slow, dt)

    applyAnimation(baked, registry, anim)

    // Emissivos mais fracos no dia: cor = base x força(tema) x gain (o gain é da V.3).
    for (const material of room.emissives) {
      const d = material.userData as EmissiveData
      material.color.copy(d.baseColor).multiplyScalar((d.day + (d.night - d.day) * night) * d.gain)
    }
  })

  return <primitive object={room.root} />
}
