import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Vector3 } from 'three'
import {
  DRIFT_AZIMUTH_RAD,
  DRIFT_PERIOD_AZIMUTH_S,
  DRIFT_PERIOD_POLAR_S,
  DRIFT_POLAR_RAD,
  IDLE_DELAY_S,
  IdleDrift,
  type DriftControls,
} from '../idleDrift.ts'
import { hasParallax, MouseParallax, PARALLAX_MAX_OFFSET, type ParallaxControls } from '../parallax.ts'

// Rodar: node --test src/experience/camera/__tests__/life.test.ts
// Testa a "câmera viva" (deriva ociosa e parallax) com um CameraControls falso.

const DT = 1 / 60
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

class FakeOrbit implements DriftControls {
  azimuthAngle = Math.PI / 4
  polarAngle = 1.07
  rotateCalls = 0
  maxAzimuth = Infinity
  minAzimuth = -Infinity
  rotate(azimuth: number, polar: number): Promise<void> {
    this.rotateCalls++
    this.azimuthAngle = clamp(this.azimuthAngle + azimuth, this.minAzimuth, this.maxAzimuth)
    this.polarAngle += polar
    return Promise.resolve()
  }
}

function run(drift: IdleDrift, orbit: FakeOrbit, seconds: number, eligible = true) {
  const steps = Math.round(seconds / DT)
  for (let i = 0; i < steps; i++) drift.update(orbit, DT, eligible)
}

describe('IdleDrift: deriva ociosa em HOME', () => {
  it('não mexe antes de 3 s sem input', () => {
    const orbit = new FakeOrbit()
    run(new IdleDrift(), orbit, IDLE_DELAY_S - 0.1)
    assert.equal(orbit.rotateCalls, 0)
  })

  it('depois de 3 s começa a derivar, devagar', () => {
    const drift = new IdleDrift()
    const orbit = new FakeOrbit()
    run(drift, orbit, IDLE_DELAY_S + 0.5)
    assert.ok(orbit.rotateCalls > 0)
    assert.ok(drift.running)
    // Rampa de entrada: nos primeiros 0.5 s a amplitude ainda é pequena.
    assert.ok(Math.abs(orbit.azimuthAngle - Math.PI / 4) < DRIFT_AZIMUTH_RAD * 0.1)
  })

  it('amplitude pequena: fica em ±1.5° de azimute e ±0.8° de polar em torno da pose', () => {
    const drift = new IdleDrift()
    const orbit = new FakeOrbit()
    const az0 = orbit.azimuthAngle
    const polar0 = orbit.polarAngle
    let maxAz = 0
    let maxPolar = 0
    const steps = Math.round(120 / DT)
    for (let i = 0; i < steps; i++) {
      drift.update(orbit, DT, true)
      maxAz = Math.max(maxAz, Math.abs(orbit.azimuthAngle - az0))
      maxPolar = Math.max(maxPolar, Math.abs(orbit.polarAngle - polar0))
    }
    assert.ok(maxAz <= DRIFT_AZIMUTH_RAD + 1e-9, `azimute ${maxAz}`)
    assert.ok(maxPolar <= DRIFT_POLAR_RAD + 1e-9, `polar ${maxPolar}`)
    assert.ok(maxAz > DRIFT_AZIMUTH_RAD * 0.9, 'a deriva deveria chegar perto da amplitude')
    assert.ok(maxPolar > DRIFT_POLAR_RAD * 0.9)
  })

  it('períodos entre 12 e 20 s', () => {
    for (const p of [DRIFT_PERIOD_AZIMUTH_S, DRIFT_PERIOD_POLAR_S]) assert.ok(p >= 12 && p <= 20)
  })

  it('deltas não acumulam erro: ao fim de períodos inteiros volta à pose de partida', () => {
    const drift = new IdleDrift()
    const orbit = new FakeOrbit()
    const az0 = orbit.azimuthAngle
    const polar0 = orbit.polarAngle
    // 234 s = 13 x 18 s = 18 x 13 s: múltiplo dos dois períodos (depois dos 3 s ociosos).
    run(drift, orbit, IDLE_DELAY_S + 234)
    assert.ok(Math.abs(orbit.azimuthAngle - az0) < 1e-6, `azimute ${orbit.azimuthAngle - az0}`)
    assert.ok(Math.abs(orbit.polarAngle - polar0) < 1e-6, `polar ${orbit.polarAngle - polar0}`)
  })

  it('input do usuário pausa e volta a contar 3 s; a pose atual vira a nova base', () => {
    const drift = new IdleDrift()
    const orbit = new FakeOrbit()
    run(drift, orbit, IDLE_DELAY_S + 6)
    const calls = orbit.rotateCalls
    const azAtInput = orbit.azimuthAngle

    drift.noteInput()
    assert.ok(!drift.running)
    run(drift, orbit, IDLE_DELAY_S - 0.1)
    assert.equal(orbit.rotateCalls, calls, 'não pode mexer durante os 3 s seguintes ao input')
    assert.equal(orbit.azimuthAngle, azAtInput, 'não volta ao ponto antigo')

    run(drift, orbit, 0.5)
    assert.ok(orbit.rotateCalls > calls, 'volta a derivar depois dos 3 s')
  })

  it('sair do idle (não elegível) zera a contagem e não mexe na câmera', () => {
    const drift = new IdleDrift()
    const orbit = new FakeOrbit()
    run(drift, orbit, IDLE_DELAY_S + 2)
    const calls = orbit.rotateCalls
    run(drift, orbit, 10, false)
    assert.equal(orbit.rotateCalls, calls)
    run(drift, orbit, IDLE_DELAY_S - 0.1)
    assert.equal(orbit.rotateCalls, calls, 'ao voltar ao idle espera os 3 s de novo')
  })

  it('respeita os limites de órbita (o delta cortado não é contabilizado)', () => {
    const drift = new IdleDrift()
    const orbit = new FakeOrbit()
    orbit.maxAzimuth = orbit.azimuthAngle + DRIFT_AZIMUTH_RAD * 0.3
    run(drift, orbit, 120)
    assert.ok(orbit.azimuthAngle <= orbit.maxAzimuth + 1e-12)
    assert.ok(orbit.azimuthAngle >= Math.PI / 4 - DRIFT_AZIMUTH_RAD - 1e-9)
  })
})

class FakeFocal implements ParallaxControls {
  focal = new Vector3()
  calls: Array<readonly [number, number, number, boolean]> = []
  setFocalOffset(x: number, y: number, z: number, enableTransition = false): Promise<void> {
    this.calls.push([x, y, z, enableTransition])
    if (!enableTransition) this.focal.set(x, y, z)
    return Promise.resolve()
  }
  getFocalOffset(out: Vector3): Vector3 {
    return out.copy(this.focal)
  }
}

function settle(parallax: MouseParallax, controls: FakeFocal, seconds: number, active = true) {
  const steps = Math.round(seconds / DT)
  for (let i = 0; i < steps; i++) parallax.update(controls, DT, active)
}

describe('MouseParallax: parallax do mouse nos hotspots', () => {
  it('só chair, printer, shelf e shelfDigital (nunca o desk)', () => {
    for (const k of ['chair', 'printer', 'shelf', 'shelfDigital']) assert.ok(hasParallax(k), k)
    for (const k of ['desk', 'home']) assert.ok(!hasParallax(k), k)
    assert.ok(!hasParallax(null))
  })

  it('inativo: não toca na câmera', () => {
    const controls = new FakeFocal()
    const parallax = new MouseParallax()
    parallax.setPointer(1, 1)
    settle(parallax, controls, 2, false)
    assert.equal(controls.calls.length, 0)
  })

  it('segue o ponteiro, suavizado, e nunca passa de ~4 cm', () => {
    const controls = new FakeFocal()
    const parallax = new MouseParallax()
    parallax.setPointer(0.5, 0)
    parallax.update(controls, DT, true)
    const first = controls.focal.x
    assert.ok(first > 0 && first < 0.5 * PARALLAX_MAX_OFFSET * 0.2, `primeiro frame ${first}: deve ser suave`)

    for (const [nx, ny] of [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [0, -1]] as const) {
      parallax.setPointer(nx, ny)
      settle(parallax, controls, 3)
      const len = Math.hypot(controls.focal.x, controls.focal.y)
      assert.ok(len <= PARALLAX_MAX_OFFSET + 1e-9, `(${nx}, ${ny}): ${len} m`)
      assert.ok(len > PARALLAX_MAX_OFFSET * 0.95, `(${nx}, ${ny}) deveria chegar perto do máximo: ${len}`)
    }
  })

  it('direção: ponteiro à direita desloca +x; ponteiro para cima desloca y negativo (convenção do camera-controls)', () => {
    const controls = new FakeFocal()
    const parallax = new MouseParallax()
    parallax.setPointer(1, 0)
    settle(parallax, controls, 3)
    assert.ok(controls.focal.x > 0.039)
    parallax.setPointer(0, 1)
    settle(parallax, controls, 3)
    assert.ok(controls.focal.y < -0.039)
  })

  it('release zera com transição, e desativar também', () => {
    const controls = new FakeFocal()
    const parallax = new MouseParallax()
    parallax.setPointer(1, 1)
    settle(parallax, controls, 1)
    parallax.release(controls)
    assert.deepEqual(controls.calls.at(-1), [0, 0, 0, true])

    parallax.setPointer(1, 1)
    settle(parallax, controls, 1)
    const before = controls.calls.length
    parallax.update(controls, DT, false) // saiu do foco
    assert.deepEqual(controls.calls.at(-1), [0, 0, 0, true])
    assert.equal(controls.calls.length, before + 1)
    parallax.update(controls, DT, false) // e não repete
    assert.equal(controls.calls.length, before + 1)
  })

  it('ao reativar parte do offset real (sem salto)', () => {
    const controls = new FakeFocal()
    controls.focal.set(0.01, -0.01, 0) // release ainda voltando a zero
    const parallax = new MouseParallax()
    parallax.update(controls, DT, true)
    assert.ok(Math.abs(controls.focal.x - 0.01) < 0.002, `salto: ${controls.focal.x}`)
  })

  it('ponteiro fora da janela volta ao centro', () => {
    const controls = new FakeFocal()
    const parallax = new MouseParallax()
    parallax.setPointer(1, 1)
    settle(parallax, controls, 2)
    parallax.clearPointer()
    settle(parallax, controls, 4)
    assert.ok(Math.hypot(controls.focal.x, controls.focal.y) < 1e-3)
  })
})
