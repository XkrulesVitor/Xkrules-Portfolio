import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Box3, PerspectiveCamera, Vector3 } from 'three'
import {
  boxFromCorners,
  directionFromPose,
  freeArea,
  panelFractionOf,
  resolveFraming,
  type FramingInput,
  type PanelSideKind,
  type Vec3Tuple,
} from '../framing.ts'

// Rodar: node --test src/experience/camera/__tests__/framing.test.ts
// (type stripping nativo; `framing.ts` só depende de `three`, então roda sem o bundler.)

const FOV = 35
const PANEL_PX = 440 // PANEL_WIDTH_PX (lib/constants.ts)
const EPS = 1e-6

// Fixtures: caixas e direções copiadas de scene/layout.ts + camera/presets.ts (pose de referência).
// Estante (prateleiras 2 e 3), vista pela frente-direita. Origem em (0.7, 0, -3.13).
const SHELF_BOX = boxFromCorners([-0.23, 0.66, -3.38], [1.63, 2.0, -2.88])
const SHELF_DIR = directionFromPose([0.98, 1.42, 0.0], [0.28, 1.25, -2.88])
// Rack + TV, vistos em diagonal pela direita.
const DIGITAL_BOX = boxFromCorners([-2.55, 0, -3.38], [-0.65, 1.77, -2.9])
const DIGITAL_DIR = directionFromPose([0.8, 1.3, 0.295], [-1.05, 0.8, -3.19])
// Impressora e bancada, vistas de +X/+Z.
const PRINTER_BOX = boxFromCorners([1.95, 0.5, -3.38], [4.05, 2.25, -2.25])
const PRINTER_DIR = directionFromPose([5.4, 2.2, 0.8], [3.5, 1.15, -2.8])
// Tela do monitor horizontal (plano 1.3 x 0.73, normal +X), centro (-3.619, 1.62, -1.45).
const SCREEN_BOX = boxFromCorners([-3.619, 1.255, -2.1], [-3.619, 1.985, -0.8])
// Ilha como três caixas (piso, parede esquerda, parede do fundo), vista da diagonal +X/+Z.
const HOME_BOXES: Box3[] = [
  boxFromCorners([-4.3, -0.1, -3.5], [4.3, 0, 3.5]),
  boxFromCorners([-4.3, 0, -3.5], [-4.18, 3.2, 3.5]),
  boxFromCorners([-4.3, 0, -3.5], [4.3, 3.2, -3.38]),
]
const HOME_DIR = directionFromPose([8.5, 7.13, 8.2], [0.3, 0.75, 0])

const ASPECTS: ReadonlyArray<readonly [string, number, number]> = [
  ['16:9 (1920x1080)', 1920, 1080],
  ['4:3 (1024x768)', 1024, 768],
  ['16:10 (1440x900)', 1440, 900],
  ['21:9 (2560x1080)', 2560, 1080],
]
const SIDES: readonly PanelSideKind[] = ['left', 'right', 'none']

type Boxes = Box3 | readonly Box3[]

function cornersOf(box: Boxes): Vector3[] {
  const boxes = Array.isArray(box) ? (box as readonly Box3[]) : [box as Box3]
  const out: Vector3[] = []
  for (const { min, max } of boxes) {
    for (let i = 0; i < 8; i++) {
      out.push(new Vector3(i & 1 ? max.x : min.x, i & 2 ? max.y : min.y, i & 4 ? max.z : min.z))
    }
  }
  return out
}

/** Projeta os cantos com uma PerspectiveCamera de verdade (mesma `lookAt` do camera-controls). */
function project(position: Vec3Tuple, target: Vec3Tuple, aspect: number, box: Boxes): Vector3[] {
  const camera = new PerspectiveCamera(FOV, aspect, 0.1, 200)
  camera.position.set(...position)
  camera.up.set(0, 1, 0)
  camera.lookAt(new Vector3(...target))
  camera.updateMatrixWorld()
  camera.updateProjectionMatrix()
  return cornersOf(box).map((c) => c.project(camera))
}

function frame(
  direction: Vec3Tuple,
  box: Boxes,
  width: number,
  height: number,
  panelSide: PanelSideKind,
  extra: Partial<FramingInput> = {},
) {
  const input: FramingInput = {
    direction,
    box,
    aspect: width / height,
    fovDeg: FOV,
    panelFraction: panelFractionOf(width, PANEL_PX),
    panelSide,
    ...extra,
  }
  const result = resolveFraming(input)
  const area = freeArea(input.panelFraction, input.panelSide, input.margin)
  const ndc = project(result.position, result.target, input.aspect, box)
  return { result, area, ndc, input }
}

type Area = ReturnType<typeof freeArea>

function assertInsideFreeArea(ndc: readonly Vector3[], area: Area, label: string) {
  for (const p of ndc) {
    assert.ok(p.z > -1 && p.z < 1, `${label}: canto atrás ou além do far plane (z=${p.z})`)
    assert.ok(p.x >= area.xMin - EPS, `${label}: x ${p.x} < ${area.xMin}`)
    assert.ok(p.x <= area.xMax + EPS, `${label}: x ${p.x} > ${area.xMax}`)
    assert.ok(p.y >= area.yMin - EPS, `${label}: y ${p.y} < ${area.yMin}`)
    assert.ok(p.y <= area.yMax + EPS, `${label}: y ${p.y} > ${area.yMax}`)
  }
}

/** A caixa encosta numa borda da área livre: nenhuma distância sobrando. */
function assertTight(ndc: readonly Vector3[], area: Area, label: string) {
  const xs = ndc.map((p) => p.x)
  const ys = ndc.map((p) => p.y)
  const gap = Math.min(
    Math.min(...xs) - area.xMin,
    area.xMax - Math.max(...xs),
    Math.min(...ys) - area.yMin,
    area.yMax - Math.max(...ys),
  )
  assert.ok(gap < 1e-4, `${label}: folga de ${gap} em todas as bordas (distância maior que o necessário)`)
}

const centerX = (ndc: readonly Vector3[]) => {
  const xs = ndc.map((p) => p.x)
  return (Math.min(...xs) + Math.max(...xs)) / 2
}

describe('framing: panelFractionOf e freeArea', () => {
  it('painel de 440 px em 1920 px', () => {
    assert.ok(Math.abs(panelFractionOf(1920, 440) - 440 / 1920) < EPS)
  })

  it('em telas estreitas o painel é limitado a 92% da largura (min(440px, 92cqw))', () => {
    assert.ok(Math.abs(panelFractionOf(400, 440) - 0.92) < EPS)
    assert.equal(panelFractionOf(0, 440), 0)
  })

  it('o painel come a faixa do lado certo e a margem vale por lado', () => {
    const f = panelFractionOf(1920, 440)
    const left = freeArea(f, 'left', 0.05)
    const right = freeArea(f, 'right', 0.05)
    const none = freeArea(f, 'none', 0.05)
    assert.ok(Math.abs(left.xMin - (-1 + 0.1 + 2 * f)) < EPS)
    assert.ok(Math.abs(left.xMax - 0.9) < EPS)
    assert.ok(Math.abs(right.xMax - (0.9 - 2 * f)) < EPS)
    assert.ok(Math.abs(right.xMin - -0.9) < EPS)
    assert.deepEqual([none.xMin, none.xMax, none.yMin, none.yMax], [-0.9, 0.9, -0.9, 0.9])
  })
})

describe('framing: os cantos ficam dentro da área livre', () => {
  const cases: ReadonlyArray<readonly [string, Boxes, Vec3Tuple]> = [
    ['estante', SHELF_BOX, SHELF_DIR],
    ['rack + TV', DIGITAL_BOX, DIGITAL_DIR],
    ['impressora', PRINTER_BOX, PRINTER_DIR],
    ['ilha (3 caixas)', HOME_BOXES, HOME_DIR],
  ]

  for (const [name, box, direction] of cases) {
    for (const [aspectName, w, h] of ASPECTS) {
      for (const side of SIDES) {
        it(`${name}, ${aspectName}, painel ${side}`, () => {
          const { result, area, ndc } = frame(direction, box, w, h, side)
          const label = `${name} ${aspectName} ${side}`
          assert.equal(ndc.length, 8 * (Array.isArray(box) ? box.length : 1))
          assertInsideFreeArea(ndc, area, label)
          assertTight(ndc, area, label)
          assert.ok(Number.isFinite(result.distance) && result.distance > 0)
        })
      }
    }
  }

  it('painel à esquerda x à direita: a mesma caixa muda de lado', () => {
    const left = frame(SHELF_DIR, SHELF_BOX, 1920, 1080, 'left')
    const right = frame(SHELF_DIR, SHELF_BOX, 1920, 1080, 'right')
    assert.ok(centerX(left.ndc) > 0, 'com o painel à esquerda a caixa fica na metade direita')
    assert.ok(centerX(right.ndc) < 0, 'com o painel à direita a caixa fica na metade esquerda')
  })

  it('em 4:3 o painel de 440 px continua deixando a caixa fora dele', () => {
    const left = frame(SHELF_DIR, SHELF_BOX, 1024, 768, 'left')
    const f = panelFractionOf(1024, PANEL_PX)
    const panelEdge = -1 + 2 * f // borda interna do painel esquerdo, em NDC
    assert.ok(Math.min(...left.ndc.map((p) => p.x)) >= panelEdge - EPS)
    const right = frame(DIGITAL_DIR, DIGITAL_BOX, 1024, 768, 'right')
    assert.ok(Math.max(...right.ndc.map((p) => p.x)) <= 1 - 2 * f + EPS)
  })
})

describe('framing: direção, distância e alvo', () => {
  it('mantém a direção de olhar do preset', () => {
    for (const side of SIDES) {
      const { result } = frame(PRINTER_DIR, PRINTER_BOX, 1024, 768, side)
      const got = directionFromPose(result.position, result.target)
      for (let i = 0; i < 3; i++) assert.ok(Math.abs(got[i] - PRINTER_DIR[i]) < 1e-9, `eixo ${i}`)
    }
  })

  it('o painel e o aspect estreito afastam a câmera, nunca aproximam', () => {
    const none16 = frame(SHELF_DIR, SHELF_BOX, 1920, 1080, 'none').result.distance
    const panel16 = frame(SHELF_DIR, SHELF_BOX, 1920, 1080, 'left').result.distance
    const panel43 = frame(SHELF_DIR, SHELF_BOX, 1024, 768, 'left').result.distance
    assert.ok(panel16 >= none16 - EPS, `com painel ${panel16} < sem painel ${none16}`)
    assert.ok(panel43 > panel16, `4:3 com painel (${panel43}) deveria ficar mais longe que 16:9 (${panel16})`)
  })

  it('margem maior afasta a câmera', () => {
    const small = frame(SHELF_DIR, SHELF_BOX, 1920, 1080, 'left', { margin: 0.02 }).result.distance
    const big = frame(SHELF_DIR, SHELF_BOX, 1920, 1080, 'left', { margin: 0.15 }).result.distance
    assert.ok(big > small)
  })

  it('em 16:9 (1920x1080) o resultado fica perto dos presets de referência', () => {
    // Referência (camera/presets.ts): distância câmera-alvo e lado do painel.
    const refs: ReadonlyArray<readonly [string, Box3, Vec3Tuple, PanelSideKind, number]> = [
      ['shelf', SHELF_BOX, SHELF_DIR, 'left', 2.97],
      ['shelfDigital', DIGITAL_BOX, DIGITAL_DIR, 'right', 3.98],
      ['printer', PRINTER_BOX, PRINTER_DIR, 'right', 4.2],
    ]
    for (const [name, box, dir, side, refDistance] of refs) {
      const { result } = frame(dir, box, 1920, 1080, side)
      const ratio = result.distance / refDistance
      assert.ok(ratio > 0.85 && ratio < 1.15, `${name}: distância ${result.distance} vs ${refDistance}`)
    }
    const home = frame(HOME_DIR, HOME_BOXES, 1920, 1080, 'none', { margin: 0.03 })
    assert.ok(home.result.distance > 12 && home.result.distance < 15, `home: ${home.result.distance}`)
  })
})

describe('framing: desk (tela perpendicular, sem painel)', () => {
  const NORMAL: Vec3Tuple = [1, 0, 0]
  const CENTER = [-3.619, 1.62, -1.45] as const

  it('o alvo é o centro da tela e a câmera fica exatamente na normal', () => {
    for (const [name, w, h] of ASPECTS) {
      const { result } = frame(NORMAL, SCREEN_BOX, w, h, 'none', { margin: 0.12 })
      for (let i = 0; i < 3; i++) {
        assert.ok(Math.abs(result.target[i] - CENTER[i]) < 1e-6, `${name}: alvo eixo ${i}`)
      }
      assert.ok(Math.abs(result.position[1] - CENTER[1]) < 1e-6, `${name}: câmera fora da altura da tela`)
      assert.ok(Math.abs(result.position[2] - CENTER[2]) < 1e-6, `${name}: câmera deslocada em Z`)
      assert.ok(Math.abs(result.position[0] - CENTER[0] - result.distance) < 1e-6, `${name}: fora da normal`)
    }
  })

  it('a tela inteira fica visível com margem, em 16:9 e em 4:3', () => {
    for (const [name, w, h] of ASPECTS) {
      const { area, ndc } = frame(NORMAL, SCREEN_BOX, w, h, 'none', { margin: 0.12 })
      assertInsideFreeArea(ndc, area, name)
      assertTight(ndc, area, name)
    }
  })

  it('em 16:9 fica perto dos 1.55 m do preset de referência', () => {
    const { result } = frame(NORMAL, SCREEN_BOX, 1920, 1080, 'none', { margin: 0.12 })
    assert.ok(Math.abs(result.distance - 1.55) < 0.1, `distância ${result.distance}`)
  })
})

describe('framing: casos de borda', () => {
  it('olhando de cima (direção paralela ao up) não gera NaN', () => {
    const { result, area, ndc } = frame([0, 1, 0], SHELF_BOX, 1920, 1080, 'left')
    assert.ok(result.position.every(Number.isFinite) && result.target.every(Number.isFinite))
    assertInsideFreeArea(ndc, area, 'de cima')
  })

  it('aspect e painel absurdos mantêm a pose finita', () => {
    const r = resolveFraming({
      direction: SHELF_DIR,
      box: SHELF_BOX,
      aspect: 0,
      fovDeg: FOV,
      panelFraction: 2,
      panelSide: 'left',
    })
    assert.ok(r.position.every(Number.isFinite) && r.target.every(Number.isFinite))
    assert.ok(r.distance > 0)
  })

  it('uma caixa e uma lista com a mesma caixa dão o mesmo resultado', () => {
    const base = {
      direction: SHELF_DIR,
      aspect: 16 / 9,
      fovDeg: FOV,
      panelFraction: 0.23,
      panelSide: 'left',
    } as const
    const a = resolveFraming({ ...base, box: SHELF_BOX })
    const b = resolveFraming({ ...base, box: [SHELF_BOX] })
    assert.deepEqual(a, b)
  })
})
