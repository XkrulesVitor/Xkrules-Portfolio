'use client'

import dynamic from 'next/dynamic'
import { LoadingScreen } from '@/ui/overlay/LoadingScreen'

// `ssr: false` só é permitido dentro de um Client Component (lazy-loading.md).
// O chunk pesado (three + fiber + drei) só é baixado no cliente; enquanto isso, a tela de loading 2D.
const Experience = dynamic(() => import('./Experience'), {
  ssr: false,
  loading: () => <LoadingScreen visible progress={0} ready={false} />,
})

export function ExperienceLoader() {
  return <Experience />
}
