import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  BOARD_HALF,
  BOARD_HALF_DEPTH,
  CROUCH,
  FIGHTER_DELAY,
  FIGHTER_PATH,
  FIGHTER_PATH_TIME,
  FIGHTER_RADIUS,
  FIGHTER_SHOTS,
  FIGHTER_TOTAL,
  HIDE_AFTER,
  MEEPLE_HEIGHT,
  MEEPLE_PLANS,
  MEEPLE_RADIUS,
  MOON,
  SLEEP_FROM,
  TOP_Y,
  UNDER_SHELF_Y,
  VILLAGE_TOTAL,
  ZZZ,
  ballistic,
  ballisticY,
  createMeeplePose,
  fighterPose,
  meeplePose,
  splinePoint,
  splineTangent,
  wrapAngle,
  type FighterPose,
} from '../fxTimeline.ts'

// Rodar: npm test  (node --test com type stripping nativo).
// Confere a coreografia dos efeitos das caixas: spline, balística e, principalmente, as folgas com a
// estante (o caça e os meeples nunca atravessam a caixa nem a prateleira de cima) e as durações.

const STEP = 1 / 120

describe('spline', () => {
  it('passa pelos pontos de controle e a tangente é unitária', () => {
    const out = { x: 0, y: 0, z: 0 }
    splinePoint(FIGHTER_PATH, 0, out)
    assert.deepEqual([out.x, out.y, out.z], [...FIGHTER_PATH[0]])
    splinePoint(FIGHTER_PATH, 1, out)
    assert.deepEqual([out.x, out.y, out.z].map((v) => +v.toFixed(6)), [...FIGHTER_PATH[FIGHTER_PATH.length - 1]])
    for (let i = 1; i < FIGHTER_PATH.length - 1; i++) {
      splinePoint(FIGHTER_PATH, i / (FIGHTER_PATH.length - 1), out)
      const [px, py, pz] = FIGHTER_PATH[i]
      assert.ok(Math.hypot(out.x - px, out.y - py, out.z - pz) < 1e-9)
    }
    for (let u = 0; u <= 1; u += 0.05) {
      splineTangent(FIGHTER_PATH, u, out)
      assert.ok(Math.abs(Math.hypot(out.x, out.y, out.z) - 1) < 1e-9)
    }
  })
})

describe('balística', () => {
  it('pousa na altura pedida e passa pelo ápice', () => {
    const b = ballistic(-0.18, 0.18, 0.28, 6)
    assert.ok(Math.abs(ballisticY(b, b.flight) - 0.18) < 1e-3)
    let max = -Infinity
    for (let t = 0; t <= b.flight; t += 0.001) max = Math.max(max, ballisticY(b, t))
    assert.ok(Math.abs(max - 0.28) < 2e-3)
  })

  it('wrapAngle', () => {
    assert.ok(Math.abs(wrapAngle(3 * Math.PI) - Math.PI) < 1e-9)
    assert.ok(Math.abs(wrapAngle(-3 * Math.PI) - Math.PI) < 1e-9)
    assert.ok(Math.abs(wrapAngle(0.5)) - 0.5 < 1e-9)
  })
})

describe('caça imperial (Conquista Galáctica)', () => {
  const pose: FighterPose = { x: 0, y: 0, z: 0, fx: 0, fy: 0, fz: 1, bank: 0 }
  // Caixa de Conquista Galáctica com o destaque: x 0.28..0.64, topo em 1.065, fundo em z -2.95.
  // O recuo máximo (repouso) é -3.10; usa-se o pior caso para cada coisa.
  const BOX = { x0: 0.28, x1: 0.64, top: 1.065, backHighlighted: -2.95 }
  const SHELF3_UNDERSIDE = 1.305
  const SHELF_FRONT_Z = -2.88

  it('dura entre 2.5 e 3.5 s e começa/termina fora de vista', () => {
    assert.ok(FIGHTER_TOTAL >= 2.5 && FIGHTER_TOTAL <= 3.5)
    assert.equal(FIGHTER_TOTAL, FIGHTER_DELAY + FIGHTER_PATH_TIME)
    fighterPose(0, pose)
    assert.ok(pose.z < -3.2, 'começa atrás da caixa')
    fighterPose(FIGHTER_PATH_TIME, pose)
    assert.ok(pose.x > 3, 'termina longe, à direita')
  })

  // Meia profundidade (Z) do hexágono da asa: 0.866 do raio.
  const WING_DEPTH = FIGHTER_RADIUS * 0.866
  const BOX_FRONT_HIGHLIGHTED = -2.825 // com o repique da mola

  it('nunca atravessa a caixa nem a prateleira de cima', () => {
    for (let t = 0; t <= FIGHTER_PATH_TIME; t += STEP) {
      fighterPose(t, pose)
      const overBox = pose.x + FIGHTER_RADIUS > BOX.x0 && pose.x - FIGHTER_RADIUS < BOX.x1
      const lowestPoint = pose.y - FIGHTER_RADIUS
      const highestPoint = pose.y + FIGHTER_RADIUS
      const behind = pose.z + WING_DEPTH <= BOX.backHighlighted - 0.005
      const above = lowestPoint >= BOX.top - 0.005
      const inFront = pose.z - WING_DEPTH >= BOX_FRONT_HIGHLIGHTED
      assert.ok(!overBox || behind || above || inFront, `t=${t.toFixed(2)} dentro da caixa (z ${pose.z.toFixed(3)}, y baixo ${lowestPoint.toFixed(3)})`)
      // Na altura da prateleira, enquanto a estante ainda está ao lado, mantém o espaço livre acima.
      if (pose.z < SHELF_FRONT_Z + FIGHTER_RADIUS) {
        assert.ok(highestPoint <= SHELF3_UNDERSIDE - 0.02, `t=${t.toFixed(2)} encosta na prateleira 3 (${highestPoint.toFixed(3)})`)
      }
    }
  })

  it('só fica abaixo do topo da caixa enquanto está escondido atrás dela', () => {
    for (let t = 0; t <= FIGHTER_PATH_TIME; t += STEP) {
      fighterPose(t, pose)
      if (pose.z < SHELF_FRONT_Z + 0.2 && pose.y - FIGHTER_RADIUS < BOX.top) {
        assert.ok(pose.z + WING_DEPTH <= BOX.backHighlighted - 0.005, `t=${t.toFixed(2)} aparece abaixo do topo (z ${pose.z.toFixed(3)})`)
        assert.ok(pose.x > BOX.x0 + 0.05 && pose.x < BOX.x1, 'e dentro da largura da caixa (senão apareceria ao lado dela)')
      }
    }
  })

  it('inclina para os dois lados na curva e dá uma volta de rolamento no fim', () => {
    let min = Infinity
    let max = -Infinity
    for (let t = 0; t <= FIGHTER_PATH_TIME; t += STEP) {
      fighterPose(t, pose)
      min = Math.min(min, pose.bank)
      max = Math.max(max, pose.bank)
    }
    assert.ok(min < -0.6, `inclinação máxima na curva (${min.toFixed(2)})`)
    assert.ok(max > 2 * Math.PI, 'rolamento completo')
    fighterPose(FIGHTER_PATH_TIME, pose)
    assert.ok(Math.abs(pose.bank - 2 * Math.PI) < 0.3, 'termina o rolamento perto de 2π')
  })

  it('a inclinação não dá saltos entre quadros', () => {
    let prev = 0
    fighterPose(0, pose)
    prev = pose.bank
    for (let t = STEP; t <= FIGHTER_PATH_TIME; t += STEP) {
      fighterPose(t, pose)
      assert.ok(Math.abs(pose.bank - prev) < 0.12, `salto de ${(pose.bank - prev).toFixed(3)} rad em t=${t.toFixed(2)}`)
      prev = pose.bank
    }
  })

  it('dispara 3 raios, com a ave visível no meio da estante', () => {
    assert.equal(FIGHTER_SHOTS.length, 3)
    for (const shot of FIGHTER_SHOTS) {
      fighterPose(shot, pose)
      assert.ok(pose.x > 0.3 && pose.x < 1.4, `disparo em x=${pose.x.toFixed(2)}`)
    }
  })
})

describe('meeples da Aldeia Dorme', () => {
  const pose = createMeeplePose()
  const BACK = -BOARD_HALF_DEPTH
  const FRONT = BOARD_HALF_DEPTH

  it('toda a cena cabe em ~3 s e termina escondida', () => {
    assert.ok(VILLAGE_TOTAL >= 2.5 && VILLAGE_TOTAL <= 3.5)
    for (const plan of MEEPLE_PLANS) {
      assert.ok(plan.endAt + HIDE_AFTER <= VILLAGE_TOTAL + 1e-6, `termina em ${plan.endAt.toFixed(2)}`)
      meeplePose(plan, plan.endAt + HIDE_AFTER + 0.01, pose)
      assert.equal(pose.visible, false)
      meeplePose(plan, 0, pose)
      assert.equal(pose.visible, false)
    }
    assert.ok(MOON.fadeOutAt + MOON.fadeOutTime <= VILLAGE_TOTAL + 1e-6)
    assert.ok(ZZZ.spawn[ZZZ.spawn.length - 1] + ZZZ.life <= VILLAGE_TOTAL + 1e-6)
  })

  it('cada um tem tempo de pousar, quicar e dormir antes de sair', () => {
    for (const plan of MEEPLE_PLANS) {
      assert.ok(plan.standAt + 0.15 <= plan.track.exit - CROUCH, `standAt ${plan.standAt.toFixed(2)} vs exit ${plan.track.exit}`)
      assert.ok(plan.track.exit - CROUCH > SLEEP_FROM, 'o soninho começa antes de sair')
    }
  })

  it('só aparece acima do topo da caixa ao cruzar a borda de trás (entrada e saída)', () => {
    for (const plan of MEEPLE_PLANS) {
      for (let t = 0; t <= VILLAGE_TOTAL; t += STEP) {
        meeplePose(plan, t, pose)
        if (!pose.visible) continue
        const bodyFront = pose.z + MEEPLE_RADIUS * pose.sz
        const insideDepth = bodyFront > BACK && pose.z < FRONT
        if (insideDepth) {
          assert.ok(pose.y >= TOP_Y - 0.002, `t=${t.toFixed(2)} atravessa a caixa (y ${pose.y.toFixed(3)}, z ${pose.z.toFixed(3)})`)
        }
      }
    }
  })

  it('nunca encosta na prateleira de cima nem sai da largura da caixa', () => {
    for (const plan of MEEPLE_PLANS) {
      for (let t = 0; t <= VILLAGE_TOTAL; t += STEP) {
        meeplePose(plan, t, pose)
        if (!pose.visible) continue
        const head = pose.y + MEEPLE_HEIGHT * pose.sy
        assert.ok(head <= UNDER_SHELF_Y - 0.03, `t=${t.toFixed(2)} cabeça em ${head.toFixed(3)}`)
        assert.ok(Math.abs(pose.x) <= BOARD_HALF - MEEPLE_RADIUS * 0.5, `x ${pose.x.toFixed(3)} fora da caixa`)
      }
    }
  })

  it('squash and stretch preserva o volume e fica entre 0.65 e 1.3', () => {
    let min = Infinity
    let max = -Infinity
    for (const plan of MEEPLE_PLANS) {
      for (let t = 0; t <= VILLAGE_TOTAL; t += STEP) {
        meeplePose(plan, t, pose)
        assert.ok(Math.abs(pose.sx * pose.sz * pose.sy - 1) < 1e-9)
        min = Math.min(min, pose.sy)
        max = Math.max(max, pose.sy)
      }
    }
    assert.ok(min >= 0.65 && max <= 1.3, `escala y entre ${min.toFixed(2)} e ${max.toFixed(2)}`)
    assert.ok(min < 0.8 && max > 1.15, 'o efeito é perceptível')
  })

  it('os meeples não se sobrepõem em cima da caixa', () => {
    const lands = MEEPLE_PLANS.map((p) => p.track.land[0]).sort((a, b) => a - b)
    for (let i = 1; i < lands.length; i++) assert.ok(lands[i] - lands[i - 1] >= MEEPLE_RADIUS * 2, 'espaço entre os pousos')
  })

  it('o pouso é contínuo: sem teletransporte entre quadros', () => {
    for (const plan of MEEPLE_PLANS) {
      meeplePose(plan, 0, pose)
      let px = pose.x
      let py = pose.y
      let pz = pose.z
      for (let t = STEP; t <= VILLAGE_TOTAL; t += STEP) {
        meeplePose(plan, t, pose)
        const jump = Math.hypot(pose.x - px, pose.y - py, pose.z - pz)
        assert.ok(jump < 0.045, `salto de ${jump.toFixed(3)} m em t=${t.toFixed(2)}`)
        px = pose.x
        py = pose.y
        pz = pose.z
      }
    }
  })
})
