import { Suspense, type ComponentType } from 'react'
import dynamic from 'next/dynamic'
import { Canvas } from '@react-three/fiber'
import { Overlay } from '@/ui/overlay/Overlay'
import { useExperienceStore } from '@/store/useExperienceStore'
import { AudioDirector } from './audio/AudioDirector'
import { CameraRig } from './camera/CameraRig'
import { INTRO_START } from './camera/presets'
import { useKeyboard } from './interaction/useKeyboard'
import { useUrlSync } from './interaction/useUrlSync'
import { LoadingBridge } from './LoadingBridge'
import './preload'
import { RoomProvider } from './scene/baked/RoomContext'
import { Effects } from './scene/Effects'
import { Scene } from './scene/Scene'

// leva + r3f-perf só existem no bundle de desenvolvimento: em produção `NODE_ENV` é
// substituído em build-time, o ramo morre e o import() nunca é emitido.
const DevTools: ComponentType | null =
  process.env.NODE_ENV === 'development' ? dynamic(() => import('./DevTools')) : null

export default function Experience() {
  useKeyboard()
  useUrlSync()

  return (
    <>
      <div className="fixed inset-0">
        <Canvas
          dpr={[1, 2]}
          gl={{ antialias: false, powerPreference: 'high-performance' }}
          camera={{ fov: 35, near: 0.1, far: 100, position: [...INTRO_START.position] }}
          onPointerMissed={() => {
            // "Click fora" volta para HOME (só com um hotspot já em foco).
            const s = useExperienceStore.getState()
            if (s.mode === 'focused') s.requestHome()
          }}
        >
          <Suspense fallback={null}>
            {/* O RoomProvider publica os nós do glb (useRoomNode): o Scene os carrega e o Effects (contorno) os lê. */}
            <RoomProvider>
              <Scene />
              <Effects />
            </RoomProvider>
          </Suspense>
          <CameraRig />
          <AudioDirector />
          {DevTools ? <DevTools /> : null}
        </Canvas>
      </div>
      <Overlay />
      <LoadingBridge />
    </>
  )
}
