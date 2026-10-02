// Textos das telas vivas do quarto (BACKLOG V.3): papel de parede do monitor, editor de código do
// monitor vertical e a TV da zona de jogos. Dados puros: sem React e sem three (ARCHITECTURE §2).
// O desenho (canvas, cores, tokenização do código) fica em src/experience/scene/life/screens/.
// Os nomes e as cores dos jogos NÃO moram aqui: a TV lê título e `accent` de projects.games.ts.

export const SCREEN_TEXT = {
  /** Monitor horizontal fora de foco: papel de parede no estilo do XKrules OS (ui/os). */
  wallpaper: {
    brand: 'XKrules OS',
    tagline: 'Portfólio 3D',
    /** Atalhos decorativos na coluna da esquerda (o SO de verdade abre ao clicar na mesa). */
    icons: ['Projetos', 'Este Computador', 'Terminal', 'Memória 4×4', 'Créditos'],
    /** Rótulo do botão do menu iniciar na barra de tarefas desenhada. */
    start: 'Iniciar',
    /** Locale do relógio da barra de tarefas. */
    clockLocale: 'pt-BR',
  },

  /** Monitor vertical: editor de código "digitando" e rolando. */
  editor: {
    fileName: 'Experience.tsx',
    language: 'TypeScript React',
    /** Aba extra, só decorativa. */
    siblingTab: 'store.ts',
    /** Barra de status; `{line}` e `{col}` acompanham o cursor. */
    status: 'Ln {line}, Col {col}',
  },

  /** TV da zona de jogos (ARCHITECTURE §6.5). */
  tv: {
    /** Logo que quica quando a TV está ociosa. */
    logo: 'XKRULES',
    /** Tela de título sem jogo destacado. */
    zoneTitle: 'Zona de jogos',
    zoneHint: 'Passe o mouse num jogo do painel',
    /** Piscando embaixo do título. */
    pressStart: 'PRESS START',
    /** Canto da tela de título. */
    player: '1P',
  },
} as const

/**
 * Código exibido no monitor vertical. Texto puro (a coloração sintática é feita no canvas por um
 * tokenizador simples). É um trecho ilustrativo do próprio portfólio, sem pretensão de compilar.
 * Linhas de até ~45 caracteres: é o que cabe na largura do monitor vertical.
 */
export const EDITOR_CODE: readonly string[] = [
  "import { Canvas } from '@react-three/fiber'",
  "import { Sparkles } from '@react-three/drei'",
  "import { damp } from 'maath/easing'",
  '',
  '// O quarto inteiro roda no navegador.',
  'export function Experience() {',
  '  const mode = useStore((s) => s.mode)',
  '  const night = useStore((s) => s.night)',
  '',
  '  useFrame((_, dt) => {',
  "    damp(mix, 'value', night, 0.45, dt)",
  '  })',
  '',
  '  return (',
  '    <Canvas dpr={[1, 2]}>',
  '      <Suspense fallback={null}>',
  '        <BakedRoom />',
  '        <Hotspots mode={mode} />',
  '      </Suspense>',
  '      <CameraControls makeDefault />',
  '    </Canvas>',
  '  )',
  '}',
  '',
  'function useChairSpring(active: boolean) {',
  '  return useSpring({',
  '    rotY: active ? Math.PI * 1.05 : 0,',
  '    config: { tension: 120, friction: 14 },',
  '  })',
  '}',
  '',
  '// Um jogo novo na estante: 1 linha.',
  "const shelf = ['terra', 'aldeia_dorme']",
  "shelf.push('porrilandia')",
  'const total = shelf.length + 4',
]
