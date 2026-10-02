import {
  Color,
  Mesh,
  MeshBasicMaterial,
  type Material,
  type MeshStandardMaterial,
  type Object3D,
} from 'three'
import { NO_RAYCAST } from '../placeholders/raycast'

/**
 * Classificação dos nós do `room.glb` e criação dos materiais por categoria (ASSET_PIPELINE §3 e §4).
 * Puro (sem React): o `BakedRoom` chama `buildRoom` uma vez por glb carregado.
 */
export type NodeCategory = 'baked' | 'emissive' | 'screen' | 'glass' | 'fx'

/** Categoria pelo prefixo do nome; o padrão é `baked` (usa o atlas). */
export function classifyNode(name: string): NodeCategory {
  if (name.startsWith('screen_')) return 'screen'
  if (name.startsWith('glass_')) return 'glass'
  if (name.startsWith('fx_')) return 'fx'
  if (
    name.startsWith('emit_') ||
    name.startsWith('led_') ||
    name.startsWith('pc_fan_') ||
    name === 'pc_rgb' ||
    name === 'tv_backlight' ||
    name === 'printer_led'
  ) {
    return 'emissive'
  }
  return 'baked'
}

/**
 * Força do emissivo [noite, dia], os MESMOS valores com que o `art/blender/preview.py` renderiza as
 * previews (noite = clamp(emit_night, 0.6, 1.6); dia = 0 se `emit_day` <= 0.01, senão clamp(0.3, 1.2)).
 * O glb não traz `KHR_materials_emissive_strength` (o `emissiveFactor` é limitado a 1), então a força
 * vem daqui. Nó que não estiver na tabela usa `DEFAULT_EMISSIVE_STRENGTH`.
 */
export const EMISSIVE_STRENGTH: Readonly<Record<string, readonly [night: number, day: number]>> = {
  emit_ac_led: [1.6, 0.6],
  emit_bedlamp: [1.6, 1.0],
  emit_fairy: [1.6, 0.8],
  emit_ledshelf: [1.6, 0.3],
  emit_lightbar: [1.6, 0.4],
  emit_maker_light: [1.6, 1.2],
  emit_phone: [1.6, 0.3],
  emit_shelf_led: [1.6, 0.6],
  emit_window_city: [1.6, 0],
  emit_window_city_cool: [1.6, 0],
  led_case: [1.6, 0.5],
  led_console: [1.6, 0.8],
  pc_fan_bottom: [1.6, 0.4],
  pc_fan_top: [1.6, 0.4],
  pc_rgb: [1.6, 0.7],
  printer_led: [1.6, 1.0],
  tv_backlight: [1.6, 1.2],
}
const DEFAULT_EMISSIVE_STRENGTH: readonly [number, number] = [1.6, 0.4]

/**
 * `userData` de cada material emissivo (um por nó: a V.3 anima cada um). A cor final é
 * `baseColor * força do tema * gain`, escrita UMA vez por frame pelo `BakedRoom`. Para pulsar,
 * piscar ou apagar um emissivo, a V.3 muda só o `gain` (`(material.userData as EmissiveData).gain`)
 * em vez de mexer em `material.color`, que senão brigaria com o damp do tema.
 */
export interface EmissiveData {
  /** Cor do glb (`emissiveFactor` x `KHR_materials_emissive_strength`), linear, sem a força do tema. */
  baseColor: Color
  /** Força à noite e de dia (ver `EMISSIVE_STRENGTH`). */
  night: number
  day: number
  /** Multiplicador livre da V.3 (pulso, piscar). 1 = normal. */
  gain: number
}

/** Telas apagadas: escuras e levemente azuladas (a V.3 troca por canvas/vídeo e liga o `map`). */
export const SCREEN_OFF_COLOR = '#0a0e1a'

/**
 * Opacidade do vidro. O glb grava `alpha` = `glass_alpha` do Blender (0.3 no PC, 0.18 na janela) e o
 * `preview.py` o usa como TRANSMISSÃO (opacidade = 1 - alpha): as previews mostram o vidro bem mais
 * escuro que o `alpha` literal. Seguimos as previews, que são o alvo visual.
 */
export const glassOpacity = (alpha: number): number => 1 - alpha

export interface BuiltRoom {
  root: Object3D
  /** Todos os objetos nomeados do glb. */
  nodes: Map<string, Object3D>
  emissives: MeshBasicMaterial[]
  /** Materiais criados aqui (o compartilhado `baked` é de quem o passou): descartar ao desmontar. */
  owned: Material[]
}

function isMesh(object: Object3D): object is Mesh {
  return (object as Mesh).isMesh === true
}

/**
 * Clona o glb carregado (o original fica intacto no cache do `useGLTF`) e troca os materiais por
 * categoria: `baked` (compartilhado), emissivos e vidro (`MeshBasicMaterial`, `toneMapped: false`),
 * telas escuras, `fx_*` invisível. Todos os meshes saem com raycast desligado: quem recebe o
 * ponteiro são as hitboxes do layout.
 */
export function buildRoom(source: Object3D, baked: Material): BuiltRoom {
  const root = source.clone(true)
  const nodes = new Map<string, Object3D>()
  const emissives: MeshBasicMaterial[] = []
  const owned: Material[] = []

  root.traverse((object) => {
    if (object.name) nodes.set(object.name, object)
    if (!isMesh(object)) return

    object.raycast = NO_RAYCAST
    const original = Array.isArray(object.material) ? object.material[0] : object.material
    const name = object.name

    switch (classifyNode(name)) {
      case 'baked':
        object.material = baked
        break

      case 'emissive': {
        const gltfMaterial = original as MeshStandardMaterial
        const baseColor = gltfMaterial.emissive.clone().multiplyScalar(gltfMaterial.emissiveIntensity)
        // Material sem emissão (glb fora do contrato): cai na cor base, para não sumir.
        if (baseColor.r + baseColor.g + baseColor.b === 0) baseColor.copy(gltfMaterial.color)
        const [night, day] = EMISSIVE_STRENGTH[name] ?? DEFAULT_EMISSIVE_STRENGTH
        const material = new MeshBasicMaterial({
          name,
          color: baseColor.clone().multiplyScalar(night),
          toneMapped: false,
          fog: false,
          side: gltfMaterial.side,
        })
        const data: EmissiveData = { baseColor, night, day, gain: 1 }
        material.userData = data
        object.material = material
        emissives.push(material)
        owned.push(material)
        break
      }

      case 'screen': {
        const material = new MeshBasicMaterial({ name, color: new Color(SCREEN_OFF_COLOR), toneMapped: false, fog: false })
        object.material = material
        owned.push(material)
        break
      }

      case 'glass': {
        const gltfMaterial = original as MeshStandardMaterial
        const material = new MeshBasicMaterial({
          name,
          color: gltfMaterial.color,
          transparent: true,
          opacity: glassOpacity(gltfMaterial.opacity),
          depthWrite: false,
          toneMapped: false,
          fog: false,
          side: gltfMaterial.side,
        })
        object.material = material
        owned.push(material)
        break
      }

      case 'fx': {
        // Fumaça da caneca: a V.3 liga e troca o material. Por enquanto, invisível.
        const material = new MeshBasicMaterial({
          name,
          color: '#ffffff',
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
          toneMapped: false,
          fog: false,
        })
        object.material = material
        object.visible = false
        owned.push(material)
        break
      }
    }
  })

  return { root, nodes, emissives, owned }
}
