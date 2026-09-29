import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import type { CameraControlsImpl } from '@react-three/drei'
import { button, useControls } from 'leva'
import { Vector3 } from 'three'
import { isHotspotId } from '@/content/hotspots'
import { useExperienceStore } from '@/store/useExperienceStore'
import { PRESETS, type PresetKey } from './presets'

// Ferramenta de DEV (montada só com NODE_ENV === 'development', ver DevTools.tsx).
// Exceção controlada à regra "só o CameraRig move a câmera": os sliders empurram a câmera
// diretamente (sem transição) apenas para afinar presets; nunca em intro/transitioning.

type Vec3 = [number, number, number]

const FOCUS_OPTIONS: PresetKey[] = ['home', 'chair', 'desk', 'printer', 'shelf']
const tmpPosition = new Vector3()
const tmpTarget = new Vector3()

const round = (n: number) => Math.round(n * 1000) / 1000

interface ChangeContext {
  initial: boolean
  fromPanel: boolean
  get: (path: string) => unknown
}

export default function CameraDebug() {
  const controls = useThree((s) => s.controls) as CameraControlsImpl | null
  const controlsRef = useRef<CameraControlsImpl | null>(null)

  useEffect(() => {
    controlsRef.current = controls
  }, [controls])

  useControls(
    'Camera',
    () => {
      const home = PRESETS.home
      const apply = (ctx: ChangeContext) => {
        const c = controlsRef.current
        const { mode } = useExperienceStore.getState()
        if (!c || mode === 'intro' || mode === 'transitioning' || mode === 'loading') return
        const p = ctx.get('Camera.position') as Vec3
        const t = ctx.get('Camera.target') as Vec3
        void c.setLookAt(p[0], p[1], p[2], t[0], t[1], t[2], false)
      }
      return {
        focus: {
          value: 'home' as string,
          options: FOCUS_OPTIONS,
          onChange: (value: string, _path: string, ctx: ChangeContext) => {
            if (ctx.initial || !ctx.fromPanel) return
            const s = useExperienceStore.getState()
            if (value === 'home') s.requestHome()
            else if (isHotspotId(value)) s.requestFocus(value)
          },
        },
        position: {
          value: [...home.position] as Vec3,
          step: 0.05,
          onChange: (_v: Vec3, _path: string, ctx: ChangeContext) => {
            if (!ctx.initial && ctx.fromPanel) apply(ctx)
          },
        },
        target: {
          value: [...home.target] as Vec3,
          step: 0.05,
          onChange: (_v: Vec3, _path: string, ctx: ChangeContext) => {
            if (!ctx.initial && ctx.fromPanel) apply(ctx)
          },
        },
        'Log preset': button(() => {
          const c = controlsRef.current
          if (!c) return
          c.getPosition(tmpPosition)
          c.getTarget(tmpTarget)
          const preset = {
            position: [tmpPosition.x, tmpPosition.y, tmpPosition.z].map(round),
            target: [tmpTarget.x, tmpTarget.y, tmpTarget.z].map(round),
          }
          // Saída pensada para colar em camera/presets.ts.
          console.log(JSON.stringify(preset))
        }),
      }
    },
    [],
  )

  return null
}
