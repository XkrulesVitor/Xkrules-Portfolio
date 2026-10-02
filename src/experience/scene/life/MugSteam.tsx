import { useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Material, Mesh, Object3D } from 'three'
import { useRoomNode, useRoomRegistry } from '../baked/RoomContext'
import { createSteamMaterial, updateSteamMaterial } from './steamMaterial'
import { useReducedMotionRef } from './useReducedMotion'

/** Instante (s) congelado da fumaça em `prefers-reduced-motion`: um quadro bonito, parado. */
const FROZEN_TIME = 3.7

/**
 * O plano do glb é pequeno (0.12 x 0.22 m, eixos Z e Y locais; normal em X): esticamos a largura e a
 * altura para a coluna ler como fumaça de caneca e não como um fio.
 */
const STEAM_SCALE_Y = 1.3
const STEAM_SCALE_Z = 1.9

/** Troca o material do nó e o liga (a caixa do glb nasce invisível). Devolve o material anterior. */
function swapMaterial(mesh: Mesh, material: Material | Material[], visible: boolean): Material | Material[] {
  const previous = mesh.material
  mesh.material = material
  mesh.visible = visible
  return previous
}

function setSteamScale(node: Object3D, y: number, z: number) {
  node.scale.set(1, y, z)
}

/** Gira o plano em torno de Y para a normal (X local) apontar para a câmera: a coluna nunca "some" de lado. */
function faceCamera(node: Object3D, cameraX: number, cameraZ: number) {
  node.rotation.y = Math.atan2(-(cameraZ - node.position.z), cameraX - node.position.x)
}

/**
 * Fumaça da caneca: troca o material do nó `fx_mug_steam` (hoje um plano invisível do `buildRoom`)
 * pelo shader de fumaça e o torna visível. É idle do quarto: roda sempre (à noite e de dia, com a
 * cor e a opacidade acompanhando `nightMix`). O plano gira em Y para encarar a câmera (billboard
 * cilíndrico: o glb só tem um plano, que de lado sumiria). Custa 1 draw call. `prefers-reduced-motion`:
 * quadro congelado. Ao desmontar, devolve o material original e esconde o nó de novo.
 */
export function MugSteam() {
  const node = useRoomNode('fx_mug_steam')
  const registry = useRoomRegistry()
  const reduced = useReducedMotionRef()
  const [material] = useState(createSteamMaterial)

  useEffect(() => {
    const mesh = node as Mesh | null
    if (!mesh?.isMesh) return
    const previous = swapMaterial(mesh, material, true)
    setSteamScale(mesh, STEAM_SCALE_Y, STEAM_SCALE_Z)
    return () => {
      swapMaterial(mesh, previous, false)
      setSteamScale(mesh, 1, 1)
      mesh.rotation.y = 0
    }
  }, [node, material])

  useEffect(() => () => material.dispose(), [material])

  useFrame((state) => {
    updateSteamMaterial(material, reduced.current ? FROZEN_TIME : state.clock.elapsedTime, registry.nightMix.current)
    if (node) faceCamera(node, state.camera.position.x, state.camera.position.z)
  })

  return null
}
