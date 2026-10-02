import { createContext, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import type { Object3D } from 'three'

/**
 * Registro dos nós do `room.glb` por nome (ASSET_PIPELINE §4). O `BakedRoom` publica o mapa quando a
 * cena baked monta; hotspots, o `Effects` (contorno) e as animações da V.3 leem por `useRoomNode`.
 * É um store externo mínimo (e não `useState` num effect): os consumidores reagem ao mapa chegar
 * sem setState em efeito, e leem por frame com `registry.get(name)` sem re-render.
 */
export type RoomNodes = ReadonlyMap<string, Object3D>

export interface RoomRegistry {
  subscribe(listener: () => void): () => void
  /** Mapa atual (`null` até a cena baked montar e no grey-box). Estável entre publicações. */
  getNodes(): RoomNodes | null
  /** Publicado pelo `BakedRoom`; `null` ao desmontar. */
  publish(nodes: RoomNodes | null): void
  /**
   * Mistura noite/dia ATUAL (já com damp): 1 = noite, 0 = dia. Escrita só pelo `BakedRoom` a cada
   * frame; a V.3 lê em `useFrame` para escurecer o que dependa do tema (telas, brilhos).
   */
  readonly nightMix: { current: number }
}

function createRegistry(): RoomRegistry {
  let nodes: RoomNodes | null = null
  const listeners = new Set<() => void>()
  return {
    subscribe(listener) {
      listeners.add(listener)
      return () => void listeners.delete(listener)
    },
    getNodes: () => nodes,
    publish(next) {
      if (nodes === next) return
      nodes = next
      listeners.forEach((l) => l())
    },
    nightMix: { current: 1 },
  }
}

const RoomContext = createContext<RoomRegistry | null>(null)

/** Envolve a experiência (Cena + Efeitos): os dois precisam enxergar os nós do glb. */
export function RoomProvider({ children }: { children: ReactNode }) {
  const [registry] = useState(createRegistry)
  return <RoomContext value={registry}>{children}</RoomContext>
}

/** Registro do quarto (para quem publica ou lê por frame). Lança fora do `RoomProvider`. */
export function useRoomRegistry(): RoomRegistry {
  const registry = useContext(RoomContext)
  if (!registry) throw new Error('useRoomRegistry fora de <RoomProvider>')
  return registry
}

const NO_NODES = () => null
const NO_SUBSCRIBE = () => () => {}

/**
 * Nó do glb por nome (`chair_root`, `printer_head`, `box_terra`, `clock_hour`, `emit_*`, `screen_*`...).
 * `null` no grey-box ou enquanto o glb não carregou: trate o `null` (o componente re-renderiza
 * quando o nó chega). O objeto é estável durante a vida da cena.
 */
export function useRoomNode(name: string): Object3D | null {
  const registry = useContext(RoomContext)
  return useSyncExternalStore(
    registry ? registry.subscribe : NO_SUBSCRIBE,
    registry ? () => registry.getNodes()?.get(name) ?? null : NO_NODES,
    NO_NODES,
  )
}

/** Vários nós de uma vez (ignora os que não existem). A lista só muda quando o glb ou `names` mudam. */
export function useRoomNodes(names: readonly string[]): Object3D[] {
  const registry = useContext(RoomContext)
  const nodes = useSyncExternalStore(
    registry ? registry.subscribe : NO_SUBSCRIBE,
    registry ? registry.getNodes : NO_NODES,
    NO_NODES,
  )
  return useMemo(() => {
    if (!nodes) return []
    return names.flatMap((n) => {
      const node = nodes.get(n)
      return node ? [node] : []
    })
  }, [nodes, names])
}
