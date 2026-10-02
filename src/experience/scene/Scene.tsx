import { Suspense } from 'react'
import { Bvh } from '@react-three/drei'
import { useExperienceStore } from '@/store/useExperienceStore'
import { Chair } from '../hotspots/chair/Chair'
import { Desk } from '../hotspots/desk/Desk'
import { Printer } from '../hotspots/printer/Printer'
import { Shelf } from '../hotspots/shelf/Shelf'
import { BakedBoundary } from './baked/BakedBoundary'
import { BakedRoom } from './baked/BakedRoom'
import { useSceneMode } from './baked/useSceneMode'
import { acesCompensatedBackground } from './greyboxBackground'
import { Lights } from './Lights'
import { Room } from './Room'
import { WallTv } from './WallTv'

const BACKGROUND = '#0b1020'
/** Fundo do grey-box quando o composer aplica ACES no quadro todo (ver greyboxBackground.ts). */
const GREYBOX_COMPOSER_BACKGROUND = acesCompensatedBackground(BACKGROUND)

// Orçamento (§7: < 120 draw calls, < 350k triângulos, glb < 12 MB, texturas < 80 MB). Medido em dev com
// r3f-perf, 1280x720, RX 580, `quality` high (2026-10-01, draft do bake V.1):
// - Quarto baked: 44 meshes no glb (43 desenhados: `fx_mug_steam` fica invisível), 56.7k triângulos,
//   1 BakedMaterial compartilhado em 21 nós + 17 emissivos, 3 telas e 2 vidros (1 material por nó).
//   HOME em idle: 58 draw calls no total (43 da cena + 15 do pós: Bloom 5 níveis, SMAA, passada final)
//   e 56.7k triângulos. Hover num hotspot: o Outline re-renderiza a cena e a seleção (102 calls,
//   113k triângulos), só enquanto dura o hover. Foco: 24 (mesa) a 44 (cadeira, com DoF) calls, porque
//   o frustum corta a maior parte do quarto.
// - Custo por frame (CPU+GPU sincronizados, 60 quadros): 1.26 ms em high, 0.81 em medium, 0.78 em low
//   (sem composer). O `fps` do r3f-perf no painel do browser do dev não vale: o rAF dele é limitado.
// - Grey-box (`?greybox` ou falha no glb): 27 draw calls, ~1.7k triângulos (sem pós); o pós soma as passadas.
// - Texturas do bake (draft): 3 WebP de 1024^2 (~410 KB em disco), glb meshopt 743 KB.

/** Grey-box procedural: o fallback, idêntico ao de antes do quarto baked. */
function GreyBoxScene() {
  return (
    <>
      <Lights />
      <Bvh>
        <Room />
        <Desk />
        <WallTv />
        <Chair />
        <Printer />
        <Shelf />
      </Bvh>
    </>
  )
}

/**
 * Quarto baked: o glb desenha tudo; os hotspots só trazem as hitboxes (e o `MonitorHtml`, as
 * partículas). Sem luzes dinâmicas: o `Lights` existe só para o grey-box.
 */
function BakedScene() {
  return (
    <>
      <BakedRoom />
      <Bvh>
        <Desk />
        <Chair />
        <Printer />
        <Shelf />
      </Bvh>
    </>
  )
}

export function Scene() {
  const mode = useSceneMode()
  const composerOn = useExperienceStore((s) => s.quality !== 'low')

  return (
    <>
      {mode === 'greybox' && composerOn ? (
        <color attach="background" args={[GREYBOX_COMPOSER_BACKGROUND]} />
      ) : (
        <color attach="background" args={[BACKGROUND]} />
      )}
      {mode === 'greybox' ? (
        <GreyBoxScene />
      ) : (
        // Erro ao carregar o glb/texturas: o boundary avisa o useSceneMode e o Scene cai no grey-box.
        <BakedBoundary>
          <Suspense fallback={null}>
            <BakedScene />
          </Suspense>
        </BakedBoundary>
      )}
    </>
  )
}
