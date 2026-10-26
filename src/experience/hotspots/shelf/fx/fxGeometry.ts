import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  PlaneGeometry,
  SphereGeometry,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { FIGHTER_RADIUS, MEEPLE_HEIGHT } from './fxTimeline'

/**
 * Modelos low-poly dos efeitos (feitos em código, no estilo "quadradinho" do diorama). Cada modelo é
 * UMA geometria com vertex color (1 draw call), criada uma vez e descartada no unmount.
 */

const tint = new Color()

/** Pinta a geometria inteira com uma cor e a devolve. */
function paint(geometry: BufferGeometry, hex: string): BufferGeometry {
  tint.set(hex)
  const count = geometry.getAttribute('position').count
  const rgb = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    rgb[i * 3] = tint.r
    rgb[i * 3 + 1] = tint.g
    rgb[i * 3 + 2] = tint.b
  }
  geometry.setAttribute('color', new BufferAttribute(rgb, 3))
  return geometry
}

function merge(pieces: BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(pieces, false)
  pieces.forEach((g) => g.dispose())
  if (!merged) throw new Error('mergeGeometries falhou (atributos incompatíveis)')
  return merged
}

// ------------------------------------------------------------------------------------- caça

/** Eixo das asas = X, frente (cabine/janela) = +Z, em cima = +Y. Altura do hexágono = 2 x FIGHTER_RADIUS. */
const WING_X = 0.0475
const WING_THICKNESS = 0.009

/** Hexágono com as pontas para cima e para baixo, espessura ao longo de X. */
function hexPlate(radius: number, thickness: number, x: number): BufferGeometry {
  return new CylinderGeometry(radius, radius, thickness, 6, 1, false, Math.PI / 6).rotateZ(Math.PI / 2).translate(x, 0, 0)
}

/**
 * Casco do caça (genérico): cabine esférica facetada entre duas asas hexagonais escuras, ligadas por
 * um eixo e dois braços, com raios nos painéis, bocal do motor atrás e dois canhões embaixo da frente.
 */
export function buildFighterHull(): BufferGeometry {
  const parts: BufferGeometry[] = [
    paint(new SphereGeometry(0.021, 8, 6), '#8a93a8'),
    paint(new CylinderGeometry(0.0042, 0.0042, WING_X * 2, 8).rotateZ(Math.PI / 2), '#6a7188'),
    // Moldura da janela e bocal do motor.
    paint(new CylinderGeometry(0.0155, 0.0166, 0.004, 8).rotateX(Math.PI / 2).translate(0, 0, 0.0166), '#3b4254'),
    paint(new CylinderGeometry(0.0115, 0.0145, 0.012, 8).rotateX(Math.PI / 2).translate(0, 0, -0.022), '#474d60'),
    // Canhões.
    paint(new CylinderGeometry(0.0022, 0.0022, 0.016, 5).rotateX(Math.PI / 2).translate(-0.0075, -0.0135, 0.026), '#2b2e3a'),
    paint(new CylinderGeometry(0.0022, 0.0022, 0.016, 5).rotateX(Math.PI / 2).translate(0.0075, -0.0135, 0.026), '#2b2e3a'),
  ]
  for (const side of [-1, 1]) {
    const x = side * WING_X
    parts.push(
      paint(hexPlate(FIGHTER_RADIUS, WING_THICKNESS, x), '#5a6178'),
      paint(hexPlate(FIGHTER_RADIUS * 0.84, WING_THICKNESS + 0.0028, x), '#2f3b5e'),
      // Cubo central e braço grosso entre a cabine e a asa.
      paint(new CylinderGeometry(0.0095, 0.0095, 0.0155, 8).rotateZ(Math.PI / 2).translate(x, 0, 0), '#464c60'),
      paint(new CylinderGeometry(0.0055, 0.0075, 0.02, 6).rotateZ(Math.PI / 2).translate(side * 0.032, 0, 0), '#505670'),
    )
    // Raios: 3 barras atravessando o centro dão os 6 raios até as pontas do hexágono.
    for (let k = 0; k < 3; k++) {
      parts.push(
        paint(
          new BoxGeometry(WING_THICKNESS + 0.0044, FIGHTER_RADIUS * 1.68, 0.0026).rotateX((k * Math.PI) / 3).translate(x, 0, 0),
          '#7a8299',
        ),
      )
    }
  }
  return merge(parts)
}

/** Janela facetada da cabine: pirâmide de 8 faces apontando para a frente (+Z). */
export function buildFighterWindow(): BufferGeometry {
  return new ConeGeometry(0.0132, 0.006, 8).rotateX(Math.PI / 2).translate(0, 0, 0.0195)
}

/** Disco do motor, de frente para trás (-Z). */
export function buildEngineDisc(): BufferGeometry {
  return new CircleGeometry(0.0085, 10).rotateY(Math.PI).translate(0, 0, -0.0285)
}

/** Onde o rastro começa (o bocal), no referencial do caça. O próprio rastro tem a origem na base. */
export const EXHAUST_BASE_Z = -0.0285

/** Rastro do motor: cone aberto com a base na origem e a ponta para trás (-Z). */
export function buildExhaust(): BufferGeometry {
  return new ConeGeometry(0.0085, 0.05, 10, 1, true).rotateX(-Math.PI / 2).translate(0, 0, -0.025)
}

/** Raio laser: cilindro fino ao longo de Z (o miolo e o halo usam raios diferentes). */
export function buildBolt(radius: number, length: number): BufferGeometry {
  return new CylinderGeometry(radius, radius, length, 6, 1, false).rotateX(Math.PI / 2)
}

/** Boca dos canhões, no referencial do caça (onde os raios nascem). */
export const GUN_MUZZLES: readonly (readonly [number, number, number])[] = [
  [-0.0075, -0.0135, 0.036],
  [0.0075, -0.0135, 0.036],
]

// ----------------------------------------------------------------------------------- meeples

export interface MeepleLook {
  /** Túnica/saia e mangas. */
  cloth: string
  /** Madeira da cabeça. */
  skin: string
  hat: 'straw' | 'hood'
  /** Cor do chapéu de palha ou do capuz. */
  hatColor: string
}

const SKIN = '#d6a26a'

/** Escala final do meeple: o modelo é desenhado com ~4.2 cm e fica com ~3.9 cm de altura. */
const MEEPLE_SCALE = 0.93

/** Cinco camponeses: palha ou capuz, tons de roupa de aldeia. O último é o vigia da lanterna. */
export const MEEPLE_LOOKS: readonly MeepleLook[] = [
  { cloth: '#6f8f4e', skin: SKIN, hat: 'straw', hatColor: '#e3c26a' },
  { cloth: '#c47a2c', skin: SKIN, hat: 'hood', hatColor: '#9c5a1c' },
  { cloth: '#4f6f9a', skin: SKIN, hat: 'straw', hatColor: '#dcb85f' },
  { cloth: '#a8503c', skin: SKIN, hat: 'hood', hatColor: '#7d3a2c' },
  { cloth: '#5a4636', skin: '#cf9a62', hat: 'hood', hatColor: '#3d2f26' },
]

/**
 * Meeple clássico (~4 cm), com o pivô nos pés: saia que alarga embaixo, tronco, braços abertos e
 * levantados, cabeça de madeira e chapéu de palha ou capuz. Frente em +Z.
 */
export function buildMeeple(look: MeepleLook): BufferGeometry {
  const arm = (side: 1 | -1) =>
    paint(
      new BoxGeometry(0.0165, 0.0058, 0.0075)
        .translate(side * 0.0082, 0, 0)
        .rotateZ(side * (Math.PI / 4))
        .translate(side * 0.0075, 0.0225, 0),
      look.cloth,
    )
  const parts: BufferGeometry[] = [
    paint(new CylinderGeometry(0.0095, 0.0138, 0.016, 8).translate(0, 0.008, 0), look.cloth),
    paint(new CylinderGeometry(0.0065, 0.0098, 0.0095, 8).translate(0, 0.02075, 0), look.cloth),
    arm(1),
    arm(-1),
    paint(new SphereGeometry(0.0078, 8, 6).translate(0, 0.0305, 0), look.skin),
  ]
  if (look.hat === 'straw') {
    parts.push(
      paint(new CylinderGeometry(0.0125, 0.0125, 0.0018, 10).translate(0, 0.0348, 0), look.hatColor),
      paint(new CylinderGeometry(0.0062, 0.0072, 0.0065, 8).translate(0, 0.039, 0), look.hatColor),
      paint(new CylinderGeometry(0.0074, 0.0074, 0.0018, 8).translate(0, 0.0368, 0), '#8a5a2b'),
    )
  } else {
    parts.push(paint(new ConeGeometry(0.0097, 0.0125, 8).translate(0, 0.03575, 0), look.hatColor))
  }
  const geometry = merge(parts).scale(MEEPLE_SCALE, MEEPLE_SCALE, MEEPLE_SCALE)
  // Garante que o modelo respeita a altura combinada com a coreografia.
  geometry.computeBoundingBox()
  const top = geometry.boundingBox?.max.y ?? MEEPLE_HEIGHT
  if (top > MEEPLE_HEIGHT + 0.002) throw new Error(`Meeple alto demais (${top.toFixed(4)} m)`)
  return geometry
}

/** Lanterna do vigia: moldura escura (matcap) e vidro aceso (emissivo), penduradas na mão direita. */
export const LANTERN_POSITION: readonly [number, number, number] = [0.0198 * MEEPLE_SCALE, 0.0243 * MEEPLE_SCALE, 0]

export function buildLanternFrame(): BufferGeometry {
  return merge([
    paint(new BoxGeometry(0.0076, 0.0016, 0.0076).translate(0, 0.0046, 0), '#2b2118'),
    paint(new BoxGeometry(0.0076, 0.0016, 0.0076).translate(0, -0.0046, 0), '#2b2118'),
    paint(new BoxGeometry(0.0016, 0.007, 0.0016).translate(0, 0.0083, 0), '#2b2118'),
  ])
}

export function buildLanternGlass(): BufferGeometry {
  return new BoxGeometry(0.0062, 0.0078, 0.0062)
}

/** Plano deitado (sombra de contato). */
export function buildShadowPlane(): BufferGeometry {
  return new PlaneGeometry(1, 1).rotateX(-Math.PI / 2)
}
