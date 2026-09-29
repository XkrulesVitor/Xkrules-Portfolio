import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'

// Rotas /dev/* existem só em desenvolvimento: previews isolados de UI (/dev/ui, /dev/os).
// Em produção viram 404. O body global tem overflow hidden (canvas), então aqui a rolagem é local.
export default function DevLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV !== 'development') notFound()
  return <div className="h-dvh overflow-y-auto bg-bg-canvas text-ink">{children}</div>
}
