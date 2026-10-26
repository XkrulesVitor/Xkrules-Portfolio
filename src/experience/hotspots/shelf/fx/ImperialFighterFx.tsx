import { useEffect, useMemo, useRef, useState } from 'react'
import { Color, DoubleSide, MeshBasicMaterial, Matrix4, Vector3, type BufferGeometry, type Group, type MeshMatcapMaterial } from 'three'
import { NO_RAYCAST } from '../../../scene/placeholders/raycast'
import {
  EXHAUST_BASE_Z,
  GUN_MUZZLES,
  buildBolt,
  buildEngineDisc,
  buildExhaust,
  buildFighterHull,
  buildFighterWindow,
} from './fxGeometry'
import { applyTint, createAdditiveMaterial, createMatcapMaterial, createMatcapTexture } from './fxMaterials'
import {
  FIGHTER_DELAY,
  FIGHTER_PATH_TIME,
  FIGHTER_SHOTS,
  FIGHTER_TOTAL,
  fighterPose,
  smoothstep,
  type FighterPose,
} from './fxTimeline'
import { useBoardGameFx, type FxFrame } from './useBoardGameFx'

/**
 * Caça imperial genérico que sai de trás da caixa de Conquista Galáctica quando o painel a destaca
 * (ARCHITECTURE §6.4): sobe por cima da caixa, faz uma curva inclinada à esquerda, dá um rasante pela
 * frente da estante disparando 3 raios verdes, rola e sai do quadro pela direita (~2.85 s).
 * A trajetória e os tempos estão em `fxTimeline.ts`. Fora do efeito o grupo fica `visible=false`.
 */

/** Cor do vidro da cabine (multiplica o matcap brilhante). */
const GLASS_BASE = new Color('#2f7fd0')
const HULL_BASE = new Color(1, 1, 1)
/** Brilhos acima de 1 (HDR) para passar do limiar do Bloom (~0.85 à noite, 1.05 de dia). */
const ENGINE_COLOR = new Color(0.5, 1.5, 2.4)
const EXHAUST_COLOR = new Color(0.25, 0.8, 1.5)
const LASER_CORE = new Color(0.6, 2.6, 0.95)
const LASER_HALO = new Color(0.1, 1, 0.28)

/** Velocidade (m/s) e vida (s) dos raios; mais rápidos que o caça, saem do quadro antes de sumir. */
const BOLT_SPEED = 3.6
const BOLT_LIFE = 0.62
const BOLT_COUNT = FIGHTER_SHOTS.length

const Z_AXIS = new Vector3(0, 0, 1)
const forward = new Vector3()
const lateral = new Vector3()
const upward = new Vector3()
const lateralRolled = new Vector3()
const upwardRolled = new Vector3()
const muzzle = new Vector3()
const basis = new Matrix4()

interface Assets {
  hullGeometry: BufferGeometry
  windowGeometry: BufferGeometry
  engineGeometry: BufferGeometry
  exhaustGeometry: BufferGeometry
  coreGeometry: BufferGeometry
  haloGeometry: BufferGeometry
  hull: MeshMatcapMaterial
  glass: MeshMatcapMaterial
  engine: MeshBasicMaterial
  exhaust: MeshBasicMaterial
  core: MeshBasicMaterial
  halo: MeshBasicMaterial
  /** Tudo que tem `dispose` (geometrias, materiais e os matcaps), para o unmount. */
  disposables: { dispose(): void }[]
}

function createAssets(): Assets {
  const soft = createMatcapTexture('soft')
  const glossy = createMatcapTexture('glossy')
  const a = {
    hullGeometry: buildFighterHull(),
    windowGeometry: buildFighterWindow(),
    engineGeometry: buildEngineDisc(),
    exhaustGeometry: buildExhaust(),
    coreGeometry: buildBolt(0.0021, 0.13),
    haloGeometry: buildBolt(0.006, 0.14),
    hull: createMatcapMaterial(soft, true),
    glass: createMatcapMaterial(glossy, false),
    engine: new MeshBasicMaterial({ color: ENGINE_COLOR.clone(), side: DoubleSide, toneMapped: false, fog: false }),
    exhaust: createAdditiveMaterial(EXHAUST_COLOR.clone(), 0.5),
    core: new MeshBasicMaterial({ color: LASER_CORE.clone(), toneMapped: false, fog: false }),
    halo: createAdditiveMaterial(LASER_HALO.clone(), 0.38),
  }
  return { ...a, disposables: [soft, glossy, ...Object.values(a)] }
}

interface BoltState {
  fired: boolean
  born: number
  spawn: Vector3
  dir: Vector3
}

function createBolts(): BoltState[] {
  return Array.from({ length: BOLT_COUNT }, () => ({ fired: false, born: 0, spawn: new Vector3(), dir: new Vector3() }))
}

/** Base do caça: frente = direção do voo, asas ao longo de `up x frente`, rolada em `bank` em torno da frente. */
function orient(ship: Group, pose: FighterPose): void {
  forward.set(pose.fx, pose.fy, pose.fz)
  lateral.set(pose.fz, 0, -pose.fx).normalize()
  upward.crossVectors(forward, lateral)
  const c = Math.cos(pose.bank)
  const s = Math.sin(pose.bank)
  lateralRolled.copy(lateral).multiplyScalar(c).addScaledVector(upward, s)
  upwardRolled.copy(upward).multiplyScalar(c).addScaledVector(lateral, -s)
  basis.makeBasis(lateralRolled, upwardRolled, forward)
  ship.quaternion.setFromRotationMatrix(basis)
}

/** Dispara o raio `index` da boca do canhão, na direção do voo. */
function fire(bolt: BoltState, group: Group, ship: Group, pose: FighterPose, index: number, time: number): void {
  const [mx, my, mz] = GUN_MUZZLES[index % GUN_MUZZLES.length]
  muzzle.set(mx, my, mz).applyQuaternion(ship.quaternion).add(ship.position)
  bolt.spawn.copy(muzzle)
  bolt.dir.set(pose.fx, pose.fy, pose.fz)
  bolt.born = time
  bolt.fired = true
  group.quaternion.setFromUnitVectors(Z_AXIS, bolt.dir)
}

function moveBolt(bolt: BoltState, group: Group, time: number, fade: number): void {
  const age = time - bolt.born
  if (age > BOLT_LIFE) {
    group.visible = false
    return
  }
  group.position.copy(bolt.spawn).addScaledVector(bolt.dir, BOLT_SPEED * age)
  // Cresce ao sair do cano e afina no fim da vida.
  const thin = (1 - smoothstep(BOLT_LIFE * 0.7, BOLT_LIFE, age)) * fade
  group.scale.set(thin, thin, Math.max(0.001, smoothstep(0, 0.05, age)) * fade)
  group.visible = true
}

export function ImperialFighterFx() {
  const assets = useMemo(() => createAssets(), [])
  useEffect(() => () => assets.disposables.forEach((d) => d.dispose()), [assets])

  const root = useRef<Group>(null)
  const ship = useRef<Group>(null)
  const exhaust = useRef<Group>(null)
  const boltGroups = useRef<(Group | null)[]>([])
  const [pose] = useState<FighterPose>(() => ({ x: 0, y: 0, z: 0, fx: 0, fy: 0, fz: 1, bank: 0 }))
  const [bolts] = useState(createBolts)

  useBoardGameFx('conquista_galactica', FIGHTER_TOTAL, {
    onStart: () => {
      bolts.forEach((b) => {
        b.fired = false
      })
      boltGroups.current.forEach((g) => {
        if (g) g.visible = false
      })
      if (root.current) root.current.visible = true
    },
    onEnd: () => {
      if (root.current) root.current.visible = false
      if (ship.current) ship.current.visible = false
      boltGroups.current.forEach((g) => {
        if (g) g.visible = false
      })
    },
    onFrame: (frame: FxFrame) => {
      const group = ship.current
      if (!group) return
      const t = frame.time - FIGHTER_DELAY
      // Espera atrás da caixa enquanto ela salta da prateleira.
      group.visible = t >= 0 && t <= FIGHTER_PATH_TIME
      if (t < 0) return

      fighterPose(t, pose)
      group.position.set(pose.x, pose.y, pose.z)
      orient(group, pose)
      group.scale.setScalar(Math.max(frame.fade, 0.001))
      applyTint(assets.hull, HULL_BASE, frame.night)
      applyTint(assets.glass, GLASS_BASE, frame.night)

      // Rastro do motor tremulando.
      if (exhaust.current) {
        const flicker = 1 + 0.25 * Math.sin(frame.time * 52) + 0.1 * Math.sin(frame.time * 91)
        exhaust.current.scale.set(1 + 0.08 * Math.sin(frame.time * 67), 1 + 0.08 * Math.cos(frame.time * 61), flicker)
      }

      for (let i = 0; i < bolts.length; i++) {
        const bolt = bolts[i]
        const boltGroup = boltGroups.current[i]
        if (!boltGroup) continue
        if (!bolt.fired && t >= FIGHTER_SHOTS[i]) fire(bolt, boltGroup, group, pose, i, t)
        if (bolt.fired) moveBolt(bolt, boltGroup, t, frame.fade)
      }
    },
  })

  return (
    <group ref={root} visible={false}>
      <group ref={ship} visible={false}>
        <mesh geometry={assets.hullGeometry} material={assets.hull} raycast={NO_RAYCAST} />
        <mesh geometry={assets.windowGeometry} material={assets.glass} raycast={NO_RAYCAST} />
        <mesh geometry={assets.engineGeometry} material={assets.engine} raycast={NO_RAYCAST} />
        <group ref={exhaust} position={[0, 0, EXHAUST_BASE_Z]}>
          <mesh geometry={assets.exhaustGeometry} material={assets.exhaust} raycast={NO_RAYCAST} />
        </group>
      </group>
      {FIGHTER_SHOTS.map((shot, i) => (
        <group
          key={shot}
          ref={(g) => {
            boltGroups.current[i] = g
          }}
          visible={false}
        >
          <mesh geometry={assets.coreGeometry} material={assets.core} raycast={NO_RAYCAST} />
          <mesh geometry={assets.haloGeometry} material={assets.halo} raycast={NO_RAYCAST} />
        </group>
      ))}
    </group>
  )
}
