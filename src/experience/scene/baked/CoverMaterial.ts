import { DoubleSide, ShaderMaterial, Uniform, Vector2, type BufferGeometry, type Texture } from 'three'
import { BAKED_FRAGMENT_COMMON, BAKED_UNIFORM_NAMES, type BakedMaterial } from './BakedMaterial'

/**
 * Capas das caixas de jogos (ARCHITECTURE §6.4). Cada caixa do `room.glb` tem um filho `cover_<slug>`:
 * um quadro cinza-claro rente à frente, assado como o resto do quarto. O bake desse quadro guarda só a
 * LUZ que chega à capa (sombra da prateleira, LED da estante, rosa da TV); aqui a arte é multiplicada
 * por essa luz e dividida pelo albedo do cinza, e as luzes de zona entram por cima como no
 * `BakedMaterial`. Assim a capa acende e apaga com o tema e o hover igual às outras superfícies.
 *
 * A UV da arte não vem do glb (o atlas usa a UV0): sai da posição local do quadro, que é um retângulo
 * no plano XY do nó, normalizada pela caixa delimitadora da geometria.
 */

/** Albedo do quadro no bake: `COVER_GREY` (#e6e6e6) de art/blender/props/games.py, em linear. */
export const COVER_ALBEDO = 0.7913

const vertexShader = /* glsl */ `
  uniform vec2 uCoverMin;
  uniform vec2 uCoverSize;

  varying vec2 vUv;
  varying vec2 vCoverUv;

  void main() {
    vUv = uv;
    vCoverUv = (position.xy - uCoverMin) / uCoverSize;
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

/**
 * Material da capa de um jogo. Compartilha os objetos de uniform do `baked` (texturas, tema e luzes
 * de zona que o `BakedRoom` anima por frame), então não precisa de sincronização. `geometry` é a do
 * quadro `cover_<slug>`; `art` é a capa (sRGB, `flipY` padrão: v = 0 embaixo).
 */
export function createCoverMaterial(baked: BakedMaterial, geometry: BufferGeometry, art: Texture): ShaderMaterial {
  if (!geometry.boundingBox) geometry.computeBoundingBox()
  const box = geometry.boundingBox
  const min = new Vector2(box?.min.x ?? -0.5, box?.min.y ?? -0.5)
  const size = new Vector2(
    Math.max((box?.max.x ?? 0.5) - min.x, 1e-6),
    Math.max((box?.max.y ?? 0.5) - min.y, 1e-6),
  )

  const shared = Object.fromEntries(BAKED_UNIFORM_NAMES.map((name) => [name, baked.uniforms[name]]))
  const material = new ShaderMaterial({
    name: 'cover',
    vertexShader,
    fragmentShader,
    uniforms: {
      ...shared,
      uCover: new Uniform(art),
      uCoverMin: new Uniform(min),
      uCoverSize: new Uniform(size),
      uCoverGain: new Uniform(1 / COVER_ALBEDO),
    },
    side: DoubleSide,
  })
  material.toneMapped = false
  return material
}
