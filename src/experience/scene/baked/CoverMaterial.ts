import { DoubleSide, ShaderMaterial, Uniform, Vector2, Vector3, type BufferGeometry, type Texture } from 'three'
import { BAKED_FRAGMENT_COMMON, BAKED_UNIFORM_NAMES, type BakedMaterial } from './BakedMaterial'

/**
 * Capas das caixas de jogos e da decoração da estante (ARCHITECTURE §6.4). Cada caixa do `room.glb` tem
 * um quadro `cover_<slug>` (ou `cover_decor_<id>`): um retângulo cinza-claro rente à face, assado como o
 * resto do quarto. O bake desse quadro guarda só a LUZ que chega à capa (sombra da prateleira, LED da
 * estante, rosa da TV); aqui a arte é multiplicada por essa luz e dividida pelo albedo do cinza, e as
 * luzes de zona entram por cima como no `BakedMaterial`. Assim a capa acende e apaga com o tema e o
 * hover igual às outras superfícies.
 *
 * A UV da arte não vem do glb (o atlas usa a UV0): sai da posição local do quadro, que é um retângulo
 * achatado num dos planos principais do nó. O eixo de MENOR extensão da caixa delimitadora é a normal;
 * os outros dois são a largura e a altura da arte, medidas pela própria caixa:
 * - quadro em pé (normal horizontal): o topo da arte é +Y e a direita é `Y x normal` (para +Z, +X);
 * - quadro deitado (normal vertical, a capa do Everdell na prateleira): o topo da arte aponta para o
 *   fundo da estante (-Z) e a direita é `normal x Z` (para +Y, +X).
 * O lado para onde o quadro olha (+ ou -) vem do sentido do primeiro triângulo.
 */

/** Albedo do quadro no bake: `COVER_GREY` (#e6e6e6) de art/blender/props/games.py, em linear. */
export const COVER_ALBEDO = 0.7913

const vertexShader = /* glsl */ `
  uniform vec3 uCoverU;
  uniform vec3 uCoverV;
  uniform vec2 uCoverMin;
  uniform vec2 uCoverSize;

  varying vec2 vUv;
  varying vec2 vCoverUv;

  void main() {
    vUv = uv;
    vCoverUv = (vec2(dot(position, uCoverU), dot(position, uCoverV)) - uCoverMin) / uCoverSize;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  ${BAKED_FRAGMENT_COMMON}

  uniform sampler2D uCover;
  uniform float uCoverGain;

  varying vec2 vCoverUv;

  void main() {
    vec3 light = bakedColor() * uCoverGain;
    vec3 art = texture2D(uCover, vCoverUv).rgb;
    gl_FragColor = vec4(applyZoneLights(art * light), 1.0);

    // Sem tone mapping, como o BakedMaterial: o AgX já está no bake.
    #include <colorspace_fragment>
  }
`

/** Eixos (no espaço local do nó) e extensão da arte no quadro. */
interface CoverFrame {
  /** Direção da largura da arte (u cresce para a direita de quem olha de frente). */
  u: Vector3
  /** Direção da altura da arte (v cresce para o topo da arte). */
  v: Vector3
  min: Vector2
  size: Vector2
}

/** Lado (+1 ou -1) para onde o primeiro triângulo da geometria olha ao longo do eixo `axis` (0 x, 1 y, 2 z). */
function facingSign(geometry: BufferGeometry, axis: 0 | 1 | 2): 1 | -1 {
  const position = geometry.getAttribute('position')
  if (!position || position.count < 3) return 1
  const index = geometry.index
  const a = new Vector3().fromBufferAttribute(position, index ? index.getX(0) : 0)
  const b = new Vector3().fromBufferAttribute(position, index ? index.getX(1) : 1)
  const c = new Vector3().fromBufferAttribute(position, index ? index.getX(2) : 2)
  const normal = b.sub(a).cross(c.sub(a))
  return normal.getComponent(axis) < 0 ? -1 : 1
}

function coverFrame(geometry: BufferGeometry): CoverFrame {
  if (!geometry.boundingBox) geometry.computeBoundingBox()
  const box = geometry.boundingBox
  const lo = box ? box.min : new Vector3(-0.5, -0.5, 0)
  const hi = box ? box.max : new Vector3(0.5, 0.5, 0)
  const ext = new Vector3().subVectors(hi, lo)

  // O eixo mais fino é a normal do quadro; o resto é o plano da arte.
  const thin: 0 | 1 | 2 = ext.x <= ext.y && ext.x <= ext.z ? 0 : ext.y <= ext.z ? 1 : 2
  const normal = new Vector3().setComponent(thin, facingSign(geometry, thin))
  const lying = thin === 1
  const v = lying ? new Vector3(0, 0, -1) : new Vector3(0, 1, 0)
  const u = lying ? normal.clone().cross(new Vector3(0, 0, 1)) : v.clone().cross(normal)

  // Os eixos são unitários e alinhados a x/y/z: os extremos saem de projetar os cantos da caixa.
  const min = new Vector2(Infinity, Infinity)
  const max = new Vector2(-Infinity, -Infinity)
  const corner = new Vector3()
  for (let i = 0; i < 8; i++) {
    corner.set(i & 1 ? hi.x : lo.x, i & 2 ? hi.y : lo.y, i & 4 ? hi.z : lo.z)
    const pu = corner.dot(u)
    const pv = corner.dot(v)
    min.set(Math.min(min.x, pu), Math.min(min.y, pv))
    max.set(Math.max(max.x, pu), Math.max(max.y, pv))
  }
  return { u, v, min, size: new Vector2(Math.max(max.x - min.x, 1e-6), Math.max(max.y - min.y, 1e-6)) }
}

/**
 * Material da capa. Compartilha os objetos de uniform do `baked` (texturas, tema e luzes de zona que o
 * `BakedRoom` anima por frame), então não precisa de sincronização. `geometry` é a do quadro
 * (`cover_<slug>` ou `cover_decor_<id>`); `art` é a capa (sRGB, `flipY` padrão: v = 0 embaixo).
 */
export function createCoverMaterial(baked: BakedMaterial, geometry: BufferGeometry, art: Texture): ShaderMaterial {
  const frame = coverFrame(geometry)

  const shared = Object.fromEntries(BAKED_UNIFORM_NAMES.map((name) => [name, baked.uniforms[name]]))
  const material = new ShaderMaterial({
    name: 'cover',
    vertexShader,
    fragmentShader,
    uniforms: {
      ...shared,
      uCover: new Uniform(art),
      uCoverU: new Uniform(frame.u),
      uCoverV: new Uniform(frame.v),
      uCoverMin: new Uniform(frame.min),
      uCoverSize: new Uniform(frame.size),
      uCoverGain: new Uniform(1 / COVER_ALBEDO),
    },
    side: DoubleSide,
  })
  material.toneMapped = false
  return material
}
