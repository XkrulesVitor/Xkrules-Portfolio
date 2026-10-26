import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Color,
  DoubleSide,
  MeshBasicMaterial,
  type BufferGeometry,
  type Group,
  type Mesh,
  type MeshMatcapMaterial,
  type Sprite,
  type SpriteMaterial,
} from 'three'
import { NO_RAYCAST } from '../../../scene/placeholders/raycast'
import {
  LANTERN_POSITION,
  MEEPLE_LOOKS,
  buildLanternFrame,
  buildLanternGlass,
  buildMeeple,
  buildShadowPlane,
} from './fxGeometry'
import {
  applyTint,
  createGlowTexture,
  createMatcapMaterial,
  createMatcapTexture,
  createMoonTexture,
  createSpriteMaterial,
  createZTexture,
  glowLevel,
} from './fxMaterials'
import {
  BOARD_HALF_DEPTH,
  FLOOR_Y,
  MEEPLE_PLANS,
  MEEPLE_RADIUS,
  MOON,
  SLEEP_FROM,
  TOP_Y,
  VILLAGE_TOTAL,
  WATCHMAN,
  ZZZ,
  clamp01,
  createMeeplePose,
  easeOutCubic,
  meeplePose,
  smoothstep,
} from './fxTimeline'
import { BOX_REST, useBoardGameFx, type FxFrame } from './useBoardGameFx'

/**
 * Aldeia Dorme: quando o painel destaca a caixa, cinco camponeses (meeples de madeira, de chapéu de
 * palha ou capuz) saltam de trás dela, quicam em cima com squash and stretch e arcos diferentes,
 * cochilam enquanto sobe uma lua minguante e saem "z z z" do vigia (o da lanterna, que vai apagando),
 * e voltam a se esconder atrás da caixa (~3 s). A coreografia está em `fxTimeline.ts` (coordenadas
 * locais à caixa); o grupo acompanha o nó dela, que o spring empurra 15 cm para fora.
 */

const [REST_X, REST_Y, REST_Z] = BOX_REST.aldeia_dorme

const WHITE = new Color(1, 1, 1)
/** Vidro da lanterna aceso (HDR, para o Bloom); de dia o brilho cai. */
const LANTERN_COLOR = new Color(2.4, 1.5, 0.5)
const GLOW_COLOR = new Color(1, 0.62, 0.2)
const MOON_NIGHT = new Color(1.25, 1.2, 0.9)
const MOON_DAY = new Color(0.9, 0.78, 0.45)
const Z_NIGHT = new Color(1.1, 1.25, 1.6)
const Z_DAY = new Color(0.35, 0.45, 0.85)

/** Posição da lua (local à caixa): nasce atrás dela e sobe até a esquerda do topo. */
const MOON_X = -0.115
const MOON_Z = -0.075
const MOON_FROM_Y = 0.12
const MOON_TO_Y = 0.3
const MOON_SIZE = 0.075
/** Os "z" nascem sobre a cabeça do vigia. */
const ZZZ_ORIGIN = [MEEPLE_PLANS[WATCHMAN].track.land[0] + 0.012, TOP_Y + 0.05, 0.0] as const

const MEEPLE_COUNT = MEEPLE_PLANS.length
const ZZZ_COUNT = ZZZ.spawn.length

interface Assets {
  geometries: BufferGeometry[]
  lanternFrame: BufferGeometry
  lanternGlass: BufferGeometry
  shadowPlane: BufferGeometry
  body: MeshMatcapMaterial
  lanternGlassMaterial: MeshBasicMaterial
  glowMaterial: SpriteMaterial
  shadowMaterial: MeshBasicMaterial
  moonMaterial: SpriteMaterial
  zMaterials: SpriteMaterial[]
  disposables: { dispose(): void }[]
}

function createAssets(): Assets {
  const matcap = createMatcapTexture('soft')
  const glow = createGlowTexture()
  const moon = createMoonTexture()
  const z = createZTexture()
  const geometries = MEEPLE_LOOKS.map(buildMeeple)
  const lanternFrame = buildLanternFrame()
  const lanternGlass = buildLanternGlass()
  const shadowPlane = buildShadowPlane()
  const body = createMatcapMaterial(matcap, true)
  const lanternGlassMaterial = new MeshBasicMaterial({ color: LANTERN_COLOR.clone(), toneMapped: false, fog: false })
  const glowMaterial = createSpriteMaterial(glow, GLOW_COLOR.clone(), true)
  const shadowMaterial = new MeshBasicMaterial({
    map: glow,
    color: 0x000000,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    side: DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    toneMapped: false,
    fog: false,
  })
  const moonMaterial = createSpriteMaterial(moon, MOON_NIGHT.clone())
  const zMaterials = Array.from({ length: ZZZ_COUNT }, () => createSpriteMaterial(z, Z_NIGHT.clone()))
  return {
    geometries,
    lanternFrame,
    lanternGlass,
    shadowPlane,
    body,
    lanternGlassMaterial,
    glowMaterial,
    shadowMaterial,
    moonMaterial,
    zMaterials,
    disposables: [
      matcap,
      glow,
      moon,
      z,
      ...geometries,
      lanternFrame,
      lanternGlass,
      shadowPlane,
      body,
      lanternGlassMaterial,
      glowMaterial,
      shadowMaterial,
      moonMaterial,
      ...zMaterials,
    ],
  }
}

/** Referências aos objetos da cena (preenchidas pelos `ref` do JSX); lidas só nos callbacks do frame. */
interface Rig {
  root: Group | null
  meeples: (Group | null)[]
  shadows: (Mesh | null)[]
  moon: Sprite | null
  zzz: (Sprite | null)[]
  glow: Sprite | null
}

function createRig(): Rig {
  return {
    root: null,
    meeples: Array.from({ length: MEEPLE_COUNT }, () => null),
    shadows: Array.from({ length: MEEPLE_COUNT }, () => null),
    moon: null,
    zzz: Array.from({ length: ZZZ_COUNT }, () => null),
    glow: null,
  }
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

function updateMeeples(rig: Rig, assets: Assets, pose: ReturnType<typeof createMeeplePose>, f: FxFrame): void {
  for (let i = 0; i < MEEPLE_COUNT; i++) {
    const group = rig.meeples[i]
    const shadow = rig.shadows[i]
    if (!group) continue
    meeplePose(MEEPLE_PLANS[i], f.time, pose)
    group.visible = pose.visible
    group.position.set(pose.x, pose.y, pose.z)
    group.scale.set(pose.sx, pose.sy, pose.sz)
    group.rotation.set(0, pose.rotY, pose.rotZ)
    if (!shadow) continue
    // Sombra de contato: só sobre o topo da caixa, menor quanto mais alto o meeple.
    const onTop =
      pose.visible &&
      pose.z > -BOARD_HALF_DEPTH + 0.004 &&
      pose.z < BOARD_HALF_DEPTH &&
      pose.y >= TOP_Y - 0.002
    const diameter = onTop ? MEEPLE_RADIUS * 2.2 * (1 - 0.65 * clamp01((pose.y - TOP_Y) / 0.11)) : 0
    shadow.visible = diameter > 0
    shadow.position.set(pose.x, TOP_Y + 0.0012, pose.z)
    shadow.scale.set(diameter, 1, diameter)
  }

  // O vigia cochila: a lanterna vai apagando e treme de leve.
  const level = 1 - 0.85 * smoothstep(SLEEP_FROM, 2.3, f.time)
  const flicker = 1 + 0.1 * Math.sin(f.time * 23) + 0.05 * Math.sin(f.time * 41 + 1)
  const day = glowLevel(f.night, 0.7, 1)
  assets.lanternGlassMaterial.color.copy(LANTERN_COLOR).multiplyScalar(level * flicker * day)
  if (rig.glow) {
    const size = 0.07 * (0.8 + 0.2 * level) * flicker
    rig.glow.scale.set(size, size, 1)
    assets.glowMaterial.opacity = 0.6 * level * glowLevel(f.night, 0.3, 1)
  }
}

function updateSky(rig: Rig, assets: Assets, f: FxFrame): void {
  const t = f.time
  // Lua: nasce atrás da caixa, sobe suave e some no fim.
  const moon = rig.moon
  if (moon) {
    const rise = easeOutCubic((t - MOON.riseAt) / MOON.riseTime)
    const alpha = smoothstep(MOON.riseAt, MOON.riseAt + 0.35, t) * (1 - smoothstep(MOON.fadeOutAt, MOON.fadeOutAt + MOON.fadeOutTime, t))
    moon.visible = alpha > 0.001
    moon.position.set(MOON_X, lerp(MOON_FROM_Y, MOON_TO_Y, rise) + 0.004 * Math.sin(t * 3), MOON_Z)
    moon.scale.set(MOON_SIZE, MOON_SIZE, 1)
    assets.moonMaterial.color.lerpColors(MOON_DAY, MOON_NIGHT, f.night)
    assets.moonMaterial.opacity = alpha * 0.95
  }

  // "z z z": sobem do vigia, crescendo e sumindo.
  for (let k = 0; k < ZZZ_COUNT; k++) {
    const sprite = rig.zzz[k]
    if (!sprite) continue
    const p = (t - ZZZ.spawn[k]) / ZZZ.life
    const material = assets.zMaterials[k]
    sprite.visible = p >= 0 && p <= 1
    if (!sprite.visible) continue
    const side = k % 2 === 0 ? 1 : -1
    sprite.position.set(
      ZZZ_ORIGIN[0] + side * 0.008 * p + 0.005 * Math.sin(p * 6 + k),
      ZZZ_ORIGIN[1] + 0.085 * easeOutCubic(p),
      ZZZ_ORIGIN[2] + 0.01,
    )
    const size = (0.014 + 0.02 * p) * (0.85 + 0.15 * k)
    sprite.scale.set(size, size, 1)
    material.color.lerpColors(Z_DAY, Z_NIGHT, f.night)
    material.opacity = smoothstep(0, 0.15, p) * (1 - smoothstep(0.5, 1, p)) * 0.95
  }
}

export function VillageMeeplesFx() {
  const assets = useMemo(() => createAssets(), [])
  useEffect(() => () => assets.disposables.forEach((d) => d.dispose()), [assets])

  const [pose] = useState(createMeeplePose)
  const rigRef = useRef<Rig>(createRig())

  useBoardGameFx('aldeia_dorme', VILLAGE_TOTAL, {
    onStart: () => {
      const root = rigRef.current.root
      if (root) root.visible = true
    },
    onEnd: () => {
      const root = rigRef.current.root
      if (root) root.visible = false
    },
    onFrame: (f: FxFrame) => {
      const rig = rigRef.current
      const root = rig.root
      if (!root) return
      // Acompanha o nó da caixa (o spring a empurra para fora da prateleira).
      root.position.set(REST_X, REST_Y, REST_Z + f.boxDz)
      root.scale.setScalar(Math.max(f.fade, 0.001))
      applyTint(assets.body, WHITE, f.night)
      updateMeeples(rig, assets, pose, f)
      updateSky(rig, assets, f)
    },
  })

  return (
    <group
      ref={(g) => {
        rigRef.current.root = g
      }}
      visible={false}
    >
      {MEEPLE_LOOKS.map((look, i) => (
        <group
          key={look.cloth}
          ref={(g) => {
            rigRef.current.meeples[i] = g
          }}
          position={[0, FLOOR_Y, 0]}
          visible={false}
        >
          <mesh geometry={assets.geometries[i]} material={assets.body} raycast={NO_RAYCAST} />
          {i === WATCHMAN ? (
            <group position={[LANTERN_POSITION[0], LANTERN_POSITION[1], LANTERN_POSITION[2]]}>
              <mesh geometry={assets.lanternFrame} material={assets.body} raycast={NO_RAYCAST} />
              <mesh geometry={assets.lanternGlass} material={assets.lanternGlassMaterial} raycast={NO_RAYCAST} />
              <sprite
                ref={(s) => {
                  rigRef.current.glow = s
                }}
                material={assets.glowMaterial}
                scale={[0.07, 0.07, 1]}
                raycast={NO_RAYCAST}
              />
            </group>
          ) : null}
        </group>
      ))}
      {MEEPLE_LOOKS.map((look, i) => (
        <mesh
          key={`shadow-${look.cloth}`}
          ref={(m) => {
            rigRef.current.shadows[i] = m
          }}
          geometry={assets.shadowPlane}
          material={assets.shadowMaterial}
          visible={false}
          raycast={NO_RAYCAST}
        />
      ))}
      <sprite
        ref={(s) => {
          rigRef.current.moon = s
        }}
        material={assets.moonMaterial}
        position={[MOON_X, MOON_FROM_Y, MOON_Z]}
        visible={false}
        raycast={NO_RAYCAST}
      />
      {ZZZ.spawn.map((spawn, k) => (
        <sprite
          key={spawn}
          ref={(s) => {
            rigRef.current.zzz[k] = s
          }}
          material={assets.zMaterials[k]}
          visible={false}
          raycast={NO_RAYCAST}
        />
      ))}
    </group>
  )
}
