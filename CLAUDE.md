@AGENTS.md

# Portfólio 3D — regras do projeto

- Fonte de verdade da arquitetura: `docs/ARCHITECTURE.md`. Leia inteiro antes de codar. Pipeline de modelos: `docs/ASSET_PIPELINE.md`. Tarefas e prompts: `docs/BACKLOG.md`.
- Fronteiras: `src/ui/**` nunca importa three/R3F; `src/experience/**` nunca renderiza DOM fixo (exceto `MonitorHtml`); `src/content/**` é só dados + tipos.
- `'use client'` apenas em `src/experience/ExperienceLoader.tsx` e nos `Preview.tsx` das rotas `src/app/dev/**` (só dev); o Canvas entra via `next/dynamic` com `ssr:false` dentro do ExperienceLoader.
- Ícones: `@phosphor-icons/react` com nomes de sufixo `Icon` (ex.: `GithubLogoIcon`), peso `duotone` por padrão.
- Nunca `setState` nem `new Vector3()` dentro de `useFrame`; use refs, `maath/easing.damp` ou `@react-spring/three`.
- Câmera só se move via `CameraControls.setLookAt(..., true)` no `CameraRig`; nenhum outro componente toca a câmera.
- Textos, links e imagens só em `src/content/*`.
- Aceite de qualquer tarefa: `npx tsc --noEmit && npm run lint && npm run build` limpos.
