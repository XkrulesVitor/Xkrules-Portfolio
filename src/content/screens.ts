// Textos das telas vivas do quarto (BACKLOG V.3): papel de parede do monitor, editor de código do
// monitor vertical e a TV da zona de jogos. Dados puros: sem React e sem three (ARCHITECTURE §2).
// O desenho (canvas, cores, tokenização do código) fica em src/experience/scene/life/screens/.
// Os nomes e as cores dos jogos NÃO moram aqui: a TV lê título e `accent` de projects.games.ts.
// `SCREEN_TEXT` e `EDITOR_CODE` valem o português; `SCREEN_TEXT_BY_LOCALE` e `EDITOR_CODE_BY_LOCALE` trazem
// os dois idiomas (o inglês está em `en/screens.ts`). O locale do relógio vem de `LOCALE_INFO` (i18n.ts).
import { SCREEN_TEXT_EN } from './en/screens.ts'
import type { ByLocale, Widened } from './i18n.ts'

export const SCREEN_TEXT = {
  /** Monitor horizontal fora de foco: papel de parede no estilo do XKrules OS (ui/os). */
  wallpaper: {
    brand: 'XKrules OS',
    tagline: 'Portfólio 3D',
    /** Atalhos decorativos na coluna da esquerda (o SO de verdade abre ao clicar na mesa). */
    icons: ['Projetos', 'Este Computador', 'Terminal', 'Memória 4×4', 'Créditos'],
    /** Rótulo do botão do menu iniciar na barra de tarefas desenhada. */
    start: 'Iniciar',
  },

  /** Monitor vertical: editor de código "digitando" e rolando. */
  editor: {
    fileName: 'Experience.tsx',
    language: 'TypeScript React',
    /** Aba extra, só decorativa. */
    siblingTab: 'store.ts',
    /** Barra de status; `{line}` e `{col}` acompanham o cursor. */
    status: 'Ln {line}, Col {col}',
    /** Os dois comentários do código exibido (`buildEditorCode`): o resto do código é igual nos idiomas. */
    comments: {
      room: 'O quarto inteiro roda no navegador.',
      shelf: 'Um jogo novo na estante: 1 linha.',
    },
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
export function buildEditorCode(comments: ScreenText['editor']['comments']): readonly string[] {
  return [
    "import { Canvas } from '@react-three/fiber'",
    "import { Sparkles } from '@react-three/drei'",
    "import { damp } from 'maath/easing'",
    '',
    `// ${comments.room}`,
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
    `// ${comments.shelf}`,
    "const shelf = ['aldeia_dorme', 'conquista']",
    "shelf.push('porriland')",
    'const total = shelf.length + 4',
  ]
}

/** Forma do texto das telas, sem os literais do `as const`: o inglês é escrito contra ela. */
export type ScreenText = Widened<typeof SCREEN_TEXT>

export const SCREEN_TEXT_BY_LOCALE: ByLocale<ScreenText> = { pt: SCREEN_TEXT, en: SCREEN_TEXT_EN }

/** Código do editor do monitor vertical, em português (comentários em pt). */
export const EDITOR_CODE: readonly string[] = buildEditorCode(SCREEN_TEXT.editor.comments)

export const EDITOR_CODE_BY_LOCALE: ByLocale<readonly string[]> = {
  pt: EDITOR_CODE,
  en: buildEditorCode(SCREEN_TEXT_EN.editor.comments),
}
