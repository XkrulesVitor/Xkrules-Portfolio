# Pipeline de Assets — Blender → glTF → React

Complementa [ARCHITECTURE.md](./ARCHITECTURE.md) §7. Define como os modelos são organizados, nomeados, otimizados e importados. Quem modela e quem coda seguem o mesmo contrato de nomes.

---

## 1. Divisão dos arquivos `.glb`

| Arquivo | Conteúdo | Bake | Motivo da separação |
|---|---|---|---|
| `room-static.glb` | chão/ilha, paredes, mesa, bancada, estante (com decoração e console), cama, gabinete do PC gamer, monitores (carcaça), TV de parede (carcaça), objetos decorativos parados | 1 atlas 2K (cor + luz + AO) | 1 draw call por atlas; nunca se move |
| `chair.glb` | cadeira + personagem sentado (nó raiz `chair_root`) | atlas 1K próprio | gira no hover |
| `printer.glb` | impressora com partes separadas (`printer_axisZ`, `printer_head`, `printer_bed`, `printer_part`, `printer_led`) | atlas 1K próprio | partes animadas |
| `shelf-boxes.glb` | caixas dos board games e capinhas dos jogos digitais, cada uma como nó separado `box_<slug>` | atlas 1K | cada caixa flutua individualmente |
| `screens.glb` | planos das telas e luzes: `screen_monitor_main`, `screen_monitor_vertical`, `screen_tv`, `led_case`, `pc_glass`, `pc_fan`, `pc_rgb` | sem bake (material emissivo em runtime) | materiais trocados por código |

Objetos que **nunca** animam vão para `room-static.glb`. Se algo precisar animar depois, ele sai do room e ganha glb próprio (o bake do room é refeito).

---

## 2. Convenção de nomes de nós (obrigatória)

Padrão: `<grupo>_<parte>` em snake_case, sem espaços, sem acento, sem sufixos `.001`.

```
chair_root                    # pivô no eixo da base da cadeira (rotação Y)
chair_character               # filho de chair_root
printer_root
printer_axisZ                 # sobe/desce (Y local)
printer_head                  # filho de printer_axisZ; move X/Z local
printer_bed
printer_part                  # peça sendo impressa (pivô na base; escala Y anima)
printer_led
box_terra · box_aldeia_dorme                     # caixas dos board games (prateleira 2)
box_porrilandia · box_peter · box_o_anel         # capinhas dos jogos digitais, ao lado do console (prateleira 3)
                                                 # slug = mesmo de content/projects.games.ts
screen_monitor_main           # plano único, normal apontando para fora, pivô no centro
screen_monitor_vertical
screen_tv                     # TV de parede, compartilhada por desk e shelf (ARCHITECTURE §6.5)
led_case                      # LED frontal do gabinete
pc_glass · pc_fan · pc_rgb    # vidro lateral (+Z), anel do fan e fita RGB do PC gamer
hit_chair · hit_desk · hit_printer · hit_shelf   # caixas invisíveis de raycast (exportadas junto)
```

Regras de pivô:
- `chair_root` com origem no centro da base (o giro é em torno dele).
- Telas com origem no centro do plano e **+Z local = normal da tela** (o preset de câmera do desk usa isso: `position = center + normal * distance`).
- `printer_part` com origem na base (escala Y cresce "de baixo para cima").

Unidades: 1 unidade = 1 m. Origem do mundo no centro do chão da ilha. +Y para cima. Frente do quarto (onde a câmera HOME olha) = +Z.

---

## 3. Bake no Blender

1. Cycles, 256–512 samples com denoise.
2. Um UV map secundário `UVLightmap` sem sobreposição (Smart UV Project, margem 0.02).
3. Bake `Combined` (Direct + Indirect + Color) para um atlas por glb; room em 2048², demais em 1024².
4. Salvar PNG 16-bit → converter (§4). Materiais no export: um `Principled` por atlas com o atlas no `Base Color`, tudo o mais neutro. **Sem** normal/roughness maps no room.
5. Emissivos: telas e LEDs **não** participam do bake com luz própria intensa (o brilho vem do Bloom em runtime). Só uma leve luz baked ao redor das telas para "sangrar" cor na mesa.
6. Iluminação-alvo: fim de tarde/início de noite. Uma luz quente vindo da janela lateral, azul frio de preenchimento, telas mint/azul.

Exportar glTF: `Format: glb`, `Apply Modifiers`, `+Y Up`, `Include: Selected Objects` (por arquivo), `Compression: OFF` (compressão vem no passo 4), `Animation` só se houver.

---

## 4. Otimização (script)

`scripts/optimize-models.mjs` usa `@gltf-transform/cli` via `npx`:

```bash
npx gltf-transform optimize raw/room-static.glb public/models/room-static.glb \
  --compress meshopt --texture-compress ktx2 --texture-size 2048
```

Para cada glb: `meshopt` (decoder do `three/examples/jsm/libs/meshopt_decoder.module.js`, configurado com `useGLTF(url, true)` ou via `useGLTF.setMeshoptDecoder`), texturas em **KTX2 (ETC1S)** para o atlas, `--texture-size 1024` para os demais. Manter `raw/` fora do repo (`.gitignore`) ou em Git LFS.

Se KTX2 causar artefatos em gradientes de luz, usar UASTC para o lightmap do room (maior, mais fiel) e ETC1S para o resto.

Meta por arquivo: `room-static.glb` ≤ 6 MB, cada um dos outros ≤ 1.5 MB.

---

## 5. Geração de componentes (`gltfjsx`)

```bash
npx gltfjsx public/models/printer.glb -o src/experience/models/Printer.tsx -t -k -K -r public
```
- `-t` TypeScript, `-k` mantém nomes, `-K` mantém grupos, `-r public` caminho relativo.
- Arquivos gerados em `src/experience/models/` **não são editados à mão**. O componente do hotspot (`experience/hotspots/printer/Printer.tsx`) importa o gerado e aplica animações via `nodes.printer_head` (ref) e troca materiais das telas.
- Regenerar sempre que o glb mudar. Diff do gerado vai no mesmo commit do glb.

---

## 6. Preload e cache

`src/lib/constants.ts` exporta `MODEL_URLS` com os 5 arquivos. `LoadingScreen` chama `useGLTF.preload` para cada. `next.config.ts` define cache imutável:

```ts
headers: async () => [{ source: '/(models|textures)/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] }]
```
Ao trocar um asset, renomear com hash (`room-static.v2.glb`) para invalidar.

---

## 7. Checklist de aceite de um asset

- [ ] Nomes de nós conforme §2, sem `.001`.
- [ ] Pivôs corretos (cadeira, telas, peça da impressora).
- [ ] Um único material por atlas; sem texturas soltas > 2K.
- [ ] `hit_*` exportado e invisível.
- [ ] Tamanho do glb dentro da meta.
- [ ] `npx gltfjsx` roda sem erro; componente tipado gerado.
- [ ] Draw calls medidos com `r3f-perf` dentro do budget de ARCHITECTURE §7.
