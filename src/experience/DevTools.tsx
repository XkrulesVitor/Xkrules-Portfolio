import { useEffect } from 'react'
import { Perf } from 'r3f-perf'
import { useExperienceStore } from '@/store/useExperienceStore'
import CameraDebug from './camera/CameraDebug'

declare global {
  interface Window {
    /** Só em dev: inspecionar/assinar o store pelo console. */
    __experienceStore?: typeof useExperienceStore
  }
}

/** Ferramentas de dev (leva + r3f-perf). Só é importado quando NODE_ENV === 'development'. */
export default function DevTools() {
  useEffect(() => {
    window.__experienceStore = useExperienceStore
    return () => {
      delete window.__experienceStore
    }
  }, [])

  return (
    <>
      <Perf position="bottom-left" minimal={false} />
      <CameraDebug />
    </>
  )
}
