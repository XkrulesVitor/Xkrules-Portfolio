import { shaderMaterial } from '@react-three/drei'
import { Color, DoubleSide, type Texture } from 'three'

/**
 * Material do quarto baked (ARCHITECTURE §12.3), portado do `Baked.js` + `fragment.glsl` de Bruno
 * Simon e do `TextureMaterial` de Julien Quenneville (docs/REFERENCES.md).
 *
 * Contrato de cor (ASSET_PIPELINE §4): os bakes `night` e `day` já saem do Blender com AgX, então
 * aqui NÃO há tone mapping (`toneMapped: false`, nenhum `tonemapping_fragment`): só a conversão
 * linear -> saída em `colorspace_fragment`. As duas texturas de cor são sRGB (o sampler decodifica
 * para linear); o lightmap é dado linear (`NoColorSpace`): R = luz da TV, G = luz da mesa, B = luz do PC.
 *
 * As três luzes de zona entram por cima, em blend `lighten`: `mix(base, max(base, cor), canal * força)`.
 * O `clamp` é obrigatório: sem ele o fator passa de 1, a mistura extrapola e os brancos das paredes
 * estouram no Bloom. A ordem (TV, mesa, PC) é a do preview.py do Blender, para as capturas baterem.
 */

/** Cores das luzes de zona (Bruno Simon). Convertidas de sRGB para linear pelo `Color`. */
export const ZONE_COLORS = {
  tv: '#ff115e',
  desk: '#ff6700',
  pc: '#0082ff',
} as const

export type ZoneLight = keyof typeof ZONE_COLORS

/**
 * Força das luzes de zona: `base` com o quarto em repouso e `active` com hover ou foco na zona
 * (o `BakedRoom` faz damp entre os dois; de dia as zonas apagam, como na preview do dia).
 *
 * Calibração contra `art/previews`: com TV 1.47, mesa 1.9 e PC 1.4 o shader reproduz as previews
 * (diferença média de 1 a 3 níveis fora das telas, que aqui são escuras). O `chair.jpg` mostra a luz
 * rosa da TV tingindo demais a cadeira e o tapete (ficam magenta), então a TV base caiu para 0.95;
 * mesa e PC ficam como nas previews. No hover/foco as três sobem ~30% a 100% (a TV mais, porque
 * o rosa à distância é o que mais precisa de reforço), com o `clamp` do shader limitando o excesso.
 */
export const ZONE_STRENGTH: Readonly<Record<ZoneLight, { base: number; active: number }>> = {
  tv: { base: 0.95, active: 2.0 },
  desk: { base: 1.9, active: 2.6 },
  pc: { base: 1.4, active: 2.1 },
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D uBakedNight;
  uniform sampler2D uBakedDay;
  uniform sampler2D uLightMap;

  // 0 = dia, 1 = noite
  uniform float uNightMix;

  uniform vec3 uLightTvColor;
  uniform float uLightTvStrength;
  uniform vec3 uLightDeskColor;
  uniform float uLightDeskStrength;
  uniform vec3 uLightPcColor;
  uniform float uLightPcStrength;

  varying vec2 vUv;

  // glsl-blend/lighten com opacidade; o clamp impede a mistura de extrapolar (e acender o Bloom).
  vec3 blendLighten(vec3 base, vec3 blend, float opacity) {
    return mix(base, max(base, blend), clamp(opacity, 0.0, 1.0));
  }

  void main() {
    vec3 bakedNight = texture2D(uBakedNight, vUv).rgb;
    vec3 bakedDay = texture2D(uBakedDay, vUv).rgb;
    vec3 color = mix(bakedDay, bakedNight, uNightMix);

    vec3 lightMap = texture2D(uLightMap, vUv).rgb;
    color = blendLighten(color, uLightTvColor, lightMap.r * uLightTvStrength);
    color = blendLighten(color, uLightDeskColor, lightMap.g * uLightDeskStrength);
    color = blendLighten(color, uLightPcColor, lightMap.b * uLightPcStrength);

    gl_FragColor = vec4(color, 1.0);

    // Sem tone mapping: o AgX já está na textura.
    #include <colorspace_fragment>
  }
`

/** Uniforms do material, tipados (o `shaderMaterial` do drei os expõe como propriedades). */
export type BakedUniforms = {
  uBakedNight: Texture | null
  uBakedDay: Texture | null
  uLightMap: Texture | null
  uNightMix: number
  uLightTvColor: Color
  uLightTvStrength: number
  uLightDeskColor: Color
  uLightDeskStrength: number
  uLightPcColor: Color
  uLightPcStrength: number
}

const DEFAULT_UNIFORMS: BakedUniforms = {
  uBakedNight: null,
  uBakedDay: null,
  uLightMap: null,
  uNightMix: 1,
  uLightTvColor: new Color(ZONE_COLORS.tv),
  uLightTvStrength: ZONE_STRENGTH.tv.base,
  uLightDeskColor: new Color(ZONE_COLORS.desk),
  uLightDeskStrength: ZONE_STRENGTH.desk.base,
  uLightPcColor: new Color(ZONE_COLORS.pc),
  uLightPcStrength: ZONE_STRENGTH.pc.base,
}

const BakedMaterialImpl = shaderMaterial(DEFAULT_UNIFORMS, vertexShader, fragmentShader)

/**
 * `new BakedMaterial()`: um único material compartilhado por todos os nós "baked" do glb. O
 * `BakedRoom` o cria, entrega as texturas e anima `uNightMix` e as forças por frame (damp).
 */
export class BakedMaterial extends BakedMaterialImpl {
  constructor() {
    super()
    // O AgX já está na textura: nada de tone mapping, nem aqui nem no renderer.
    this.toneMapped = false
    // O glb marca todos os materiais como doubleSided (o bake e o preview no Blender não têm culling).
    this.side = DoubleSide
  }
}
