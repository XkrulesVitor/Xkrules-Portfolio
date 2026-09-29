import { Preview } from './Preview'

// Rota só de desenvolvimento (dev/layout.tsx devolve 404 em produção): primitivas e painéis da Fase 1,
// sem depender do Canvas. Parâmetros: ?zoom=0.5|0.75|1, ?bg=scene|navy e ?panel=all|about|printer|games. Para testar com o painel do
// browser oculto (rAF parado): ?still (painéis já no estado final), ?raf (rAF movido por setTimeout)
// e ?skip (animações do motion pulam para o fim). ?reduced simula prefers-reduced-motion.
export default function DevUiPage() {
  return <Preview />
}
