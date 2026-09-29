# Backlog por fases — com prompts prontos para subagentes (Sonnet)

Cada tarefa é autocontida: um subagente lê `docs/ARCHITECTURE.md` (e `docs/ASSET_PIPELINE.md` quando indicado), executa, e valida com os comandos de aceite. Rode as tarefas **na ordem** dentro de cada fase; fases podem se sobrepor apenas onde indicado.

Prompt-padrão (prefixo de toda tarefa):

```
Você é um dev frontend sênior em React Three Fiber. Antes de codar, leia docs/ARCHITECTURE.md
inteiro e siga as decisões, a estrutura de pastas e as convenções de código (§2, §3, §11).
Leia também node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md (regra do ssr:false).
Não altere docs/*.md. Não instale dependências além das listadas na tarefa.
Ao terminar rode: npx tsc --noEmit && npm run lint && npm run build. Corrija até passar.
(Em execução paralela vale o "Protocolo de execução paralela" abaixo: sem build, checagens filtradas.)
Reporte em 10 linhas: arquivos criados, decisões tomadas, o que ficou pendente.
```

Legenda de aceite: **A** = `tsc`/`lint`/`build` limpos · **M** = verificação manual no browser (`npm run dev`).

---

## Fase 0 — Fundação (grey-box navegável)

### 0.1 Dependências, tokens e shell client-only
- Instalar: `npm i zustand @react-spring/three motion @react-three/postprocessing postprocessing` e `npm i -D leva r3f-perf`.
- Criar a árvore de pastas de ARCHITECTURE §2 (com `.gitkeep` onde vazio).
- `globals.css`: tokens de §8 no `@theme`, `html, body { height: 100%; overflow: hidden; background: var(--color-bg-canvas) }`.
- `app/layout.tsx`: `lang="pt-BR"`, metadata real (title/description do portfólio), fontes Geist mantidas.
- `app/page.tsx` (server): `<h1 class="sr-only">`, `<noscript>` com links, e `<ExperienceLoader/>`.
- `experience/ExperienceLoader.tsx` (`'use client'`): `next/dynamic(() => import('./Experience'), { ssr:false, loading: () => <LoadingScreen/> })`.
- `experience/Experience.tsx`: `<Canvas dpr={[1,2]} gl={{antialias:false, powerPreference:'high-performance'}} camera={{fov:35}}>` + `<Suspense>` + `<Scene/>` + `<CameraRig/>`; `r3f-perf` só em `NODE_ENV=development`.
- Aceite: **A**; **M** canvas ocupa a viewport com fundo azul-marinho.

### 0.2 Store + máquina de estados
- `store/useExperienceStore.ts` exatamente com a interface de §3, `subscribeWithSelector`, guardas 1–5 implementadas e testadas por unidade leve (arquivo `store/__tests__/store.test.ts` com `node:test` + `tsx`, ou pular testes se preferir manter zero deps; documentar a escolha).
- `store/selectors.ts` com `selectIsFocused`, `selectCanInteract` (`mode==='idle'`).
- Campo extra `highlightBox: string | null` (§6.4).
- Aceite: **A**.

### 0.3 CameraRig + presets + leva
- `camera/presets.ts` com `HOME` e `chair|desk|printer|shelf` usando valores provisórios coerentes com o grey-box (posições em §0.5).
- `camera/CameraRig.tsx` conforme §4: `CameraControls makeDefault`, assinatura do store, `setLookAt(..., true)` + `await`, aplica `limits`, chama `onCameraRest()`. Respeitar `prefersReducedMotion` (`lib/device.ts`).
- Intro: após `mode:'intro'`, voar de uma posição afastada até `HOME` e então `idle`.
- Painel `leva` (dev only) com sliders de position/target e botão "Log preset" que imprime JSON pronto para colar em `presets.ts`.
- Aceite: **A**; **M** trocar `focus` via leva anima a câmera sem cortes; órbita em HOME respeita limites.

### 0.4 Sistema de hotspots + overlay básico
- `interaction/useHotspot.ts` conforme §5 (hover só em idle, click só em idle, cursor, touch).
- `interaction/useKeyboard.ts` (Esc → `requestHome`).
- `content/hotspots.ts` registry e `content/types.ts`.
- `ui/overlay/Overlay.tsx` (fixed, `pointer-events:none`), `BackButton.tsx` (aparece em focused/transitioning-to-hotspot), `Hud.tsx` (título + dica), `LoadingScreen.tsx` com `useProgress` e botão "Entrar" que dispara `setMode('intro')`.
- Painéis placeholder (`AboutPanel`, `PrinterPanel`, `GamesPanel` com só o título) montados por `AnimatePresence` segundo o registry.
- Deep-link `?focus=<id>` (§3).
- Aceite: **A**; **M** click no hotspot → câmera → painel aparece; Esc/Voltar → home.

### 0.5 Grey-box da cena
- `scene/placeholders/*`: ilha (box 10×0.4×8), mesa em L à centro-esquerda, cadeira (cilindro+box) à frente, bancada + impressora (box com "cabeça" separada) à direita, estante (boxes coloridos) na parede de fundo/direita, planos das telas com material preto. Tudo com `MeshStandardMaterial` cores neutras + 1 `hemisphereLight` (provisório; será baked).
- Cada hotspot é um `<group {...bind}>` com hitbox invisível (§5) envolvendo o placeholder.
- `scene/Scene.tsx` compõe tudo; `<Bvh>` ao redor.
- Aceite: **A**; **M** 4 hotspots funcionam; `r3f-perf` mostra < 40 draw calls.

**Pronto de Fase 0**: navegar entre os 4 hotspots e HOME, sem cortes, com Voltar/Esc, loading screen e intro.

---

## Protocolo de execução paralela (Fase 1 ‖ Fase 2.1)

As duas tarefas rodam ao mesmo tempo **na mesma árvore de trabalho**. O que evita conflito é posse de arquivos, não isolamento.

**Congelado antes do disparo** (commit `chore: contratos...`): tipos em `content/types.ts`, `content/projects.web.ts` com dados reais, identidade e links em `content/site.ts`, a rota `src/app/dev/layout.tsx` (404 em produção) e o pacote `@phosphor-icons/react` instalado.

| Agente | Cria ou edita | Só lê |
|---|---|---|
| Fase 1 (UI e conteúdo) | `ui/primitives/**`, `ui/panels/**`, `content/about.ts`, `content/projects.print.ts`, `content/projects.games.ts`, `UI_TEXT` em `content/site.ts`, `src/app/dev/ui/**`, `src/app/globals.css` | `content/types.ts` (pode **adicionar campos opcionais** em About, Print e Game), `store/**`, `ui/overlay/**` |
| Fase 2.1 (SO do monitor) | `ui/os/**`, `content/os.ts`, `src/app/dev/os/**` | `content/types.ts`, `content/projects.web.ts`, `content/site.ts` |

Proibido para os dois: `package.json` e lockfile (nenhum `npm install`), `next.config.ts`, `tsconfig.json`, `src/experience/**`, `src/store/**`, `docs/**`, `git commit`. O tipo `WebProject` não muda.

Verificação durante o trabalho:
- Tipos: `npx tsc --noEmit` e olhar só os erros nos próprios caminhos. Erros em arquivos do outro agente, ou em `.next/**` (tipos de rota gerados, que ficam desatualizados quando nasce uma rota nova), são ignorados e citados no relatório. Nunca corrigir arquivo alheio.
- Lint: `npx eslint <seus caminhos>`.
- Sem `npm run build`: quem integra roda o build no fim.
- Servidor: já existe um `next dev` em http://localhost:3000. Não iniciar outro e não parar esse. Um segundo `next dev` só imprime o PID do que já roda.
- Browser: abrir uma aba própria para a sua rota (`/dev/ui` ou `/dev/os`). O painel pode estar oculto; nesse caso `requestAnimationFrame` não roda, então valide pelo DOM e por capturas, sem depender de animação terminar.

Integração: o modelo arquiteto roda `tsc`, `lint`, `test` e `build`, revisa no browser e só então comita.

---

## Fase 1 — UI 2D e conteúdo

### 1.1 Primitivas glass
- `ui/primitives/GlassCard`, `Tabs`, `Carousel` (scroll-snap + setas), `IconButton`, `Kbd`, `Tag`. Estética: cartões translúcidos, blur, borda branca fina, micro-interações (hover eleva 2px, foco visível). Referências: glass.samasante.com, skiper-ui.com.
- Ícones: `@phosphor-icons/react`, nomes com sufixo `Icon` (ex.: `GithubLogoIcon`), peso `duotone` por padrão e `regular` em controles pequenos.
- Aceite: **A**; **M** página `/dev/ui` exibindo todas as primitivas. O layout `src/app/dev/layout.tsx` já existe; crie `src/app/dev/ui/page.tsx` (server) renderizando um `Preview.tsx` com `'use client'` na mesma pasta.

### 1.2 Conteúdo tipado
- Os tipos já existem em `content/types.ts` (`AboutContent`, `PrintShowcase`, `PrintProject`, `GameProject`, `GameSlug`) e `projects.web.ts` já está preenchido com dados reais do GitHub.
- Criar `content/about.ts`, `content/projects.print.ts` e `content/projects.games.ts` só com fatos confirmados (o prompt da tarefa traz os fatos). O que faltar vira `[TODO: ...]` explícito, nunca texto inventado.
- Os slugs dos jogos são os de `GameSlug`, os mesmos das peças da estante.
- Aceite: **A**.

### 1.3 Painéis reais
- `AboutPanel` (bio, skills em tags, redes), `PrinterPanel` (carrossel, specs, loja), `GamesPanel` (abas tabuleiro/digital; hover em item → `store.highlightBox`).
- Variantes motion de §8; lado (esq/dir) vindo do registry; mobile bottom-sheet.
- `role="dialog"`, foco inicial, fechamento por Esc já existente.
- Aceite: **A**; **M** desktop e 375px.

---

## Fase 2 — Monitor OS (Html dentro do 3D)

### 2.1 `ui/os/*`
- `Desktop` (wallpaper, ícones), `Taskbar`, `Window` (arrastável dentro do desktop, minimizar/fechar, z-order), `apps/ProjectsApp` listando `projects.web` e `ProjectWindow` (vídeo/imagens, botões repo/live).
- Layout inteiro relativo ao wrapper 1280×720 (`container-type: size`, `cqw/cqh`); proibido `vw/vh`.
- `ProjectsApp` precisa funcionar sozinho, fora do `Desktop`, num container comum (no mobile a 2.2 o monta como painel DOM).
- Textos do SO em `content/os.ts`; projetos lidos de `content/projects.web.ts` sem alterá-lo.
- Crie `src/app/dev/os/page.tsx` (server) renderizando um `Preview.tsx` com `'use client'` na mesma pasta.
- Aceite: **A**; **M** em `/dev/os` renderizado num div 1280×720 e num 640×360 sem quebrar.

### 2.2 `MonitorHtml`
- Conforme §6.2: `Html transform occlude="blending"`, `distanceFactor` calibrado para o plano `screen_monitor_main` do grey-box, `pointerEvents` ligado só em `focused:desk`, crossfade com o wallpaper emissivo.
- Mobile: não montar `Html`; montar `ProjectsApp` como painel DOM.
- Aceite: **A**; **M** redimensionar a janela não altera o layout interno; cliques só funcionam após a câmera parar.

---

## Fase 3 — Micro-interações 3D e pós-processamento

### 3.1 Cadeira: `useChairSpring` (§6.1) com `@react-spring/three`, giro ~190° elástico no hover, retorno no unhover/home.
### 3.2 Telas e LED: `Screens.tsx` com damp de emissive nos monitores (§6.2), LED pulsante, `toneMapped:false`. `WallTv` com os três modos de §6.5 (apagada, `desk`, `shelf`). PC gamer: `pc_fan` e `pc_rgb` pulsam no hover da mesa.
### 3.3 Impressora: `usePrinterAnimation` (§6.3) em `useFrame` com refs; peça cresce ao focar.
### 3.4 Estante: `GameBox` spring z + `highlightBox`; `ShelfParticles` (Sparkles ≤ 80) só em focused; shader de estática (`uTime`) usado pela `WallTv` no modo `shelf`.
### 3.5 `scene/Effects.tsx`: `EffectComposer` com `SMAA` + `Bloom(threshold .9, intensity .6, mipmapBlur)`; `DepthOfField` montado só quando `focus==='chair' && mode==='focused'`. `PerformanceMonitor` + `AdaptiveDpr` → `quality` (§7).
### 3.6 Enquadramento responsivo (ARCHITECTURE §4): presets passam a `{ focusBox, direction, panelSide }` e o `CameraRig` calcula distância e deslocamento pelo aspect e pela largura do painel. Aceite: em 16:9, 4:3 e 390×844 (retrato, painel como bottom-sheet) o conteúdo do hotspot fica inteiro e fora do painel.
- Aceite (fase): **A**; **M** `r3f-perf` ≥ 55 fps desktop com composer; hover em cada hotspot mostra a animação; nada anima durante `transitioning`.

---

## Fase 4 — Assets reais (depende de modelagem externa)

### 4.1 `scripts/optimize-models.mjs` + `npm run models:optimize` + headers de cache (ASSET_PIPELINE §4, §6).
### 4.2 Para cada glb entregue: rodar `gltfjsx` (ASSET_PIPELINE §5), substituir o placeholder pelo componente gerado no wrapper do hotspot, mapear nós (`chair_root`, `printer_head`…), remover `hemisphereLight` quando o bake chegar.
### 4.3 Recalibrar presets de câmera com leva e `distanceFactor` do monitor.
- Aceite: **A**; **M** budget de ARCHITECTURE §7 medido e anotado num comentário em `Scene.tsx`.

---

## Fase 5 — Polish e deploy

### 5.1 Áudio (`useAudio`, mudo por padrão, toggle no Hud, ventoinha no hover desk, estática na estante).
### 5.2 Touch: primeiro toque = click; gestos de órbita do camera-controls configurados; testar iOS Safari.
### 5.3 `prefers-reduced-motion`: transições instantâneas, sem partículas, sem pulso de LED.
### 5.4 SEO/fallback: `<noscript>`, `h1` oculto, OpenGraph image estática (screenshot do diorama), `sitemap`.
### 5.5 Deploy Vercel + analytics leve. Lighthouse mobile perf ≥ 80.

---

## Ordem sugerida de execução com subagentes

1. Fase 0 inteira num único subagente Sonnet (tarefas 0.1→0.5 são acopladas). Revisar no browser.
2. Fase 1 e Fase 2.1 em paralelo (2 subagentes): não compartilham arquivos.
3. Fase 2.2 e Fase 3 em sequência (tocam `desk/` e `Effects`).
4. Fase 4 quando os glb existirem. Fase 5 ao final.
