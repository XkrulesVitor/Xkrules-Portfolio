import { Component, type ReactNode } from 'react'
import { reportBakedFailure } from './useSceneMode'

interface BakedBoundaryProps {
  children: ReactNode
}

/**
 * ErrorBoundary em volta do Suspense da cena baked. Erro ao carregar o glb ou as texturas
 * (`useGLTF`/`useTexture` lançam no render) cai aqui: avisa o `useSceneMode` e não renderiza nada;
 * o `Scene` então troca para o grey-box. Sem `react-error-boundary`: é uma classe mínima.
 */
export class BakedBoundary extends Component<BakedBoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    reportBakedFailure(error)
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
