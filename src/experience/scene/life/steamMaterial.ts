import { Color, DoubleSide, ShaderMaterial } from 'three'

/**
 * Fumaça da caneca (`fx_mug_steam`), no espírito do `CoffeeSteam` de Bruno Simon (REFERENCES.md): um
 * plano com ruído procedural no próprio shader, `transparent` e `depthWrite: false`, que sobe e se
 * dissipa. Sem textura externa. Diferenças: o plano do glb tem só 4 vértices (o deslocamento por
 * vértice do original não teria efeito), então a oscilação lateral vai no fragment; a UV do glTF tem
 * v = 0 no TOPO, daí `h = 1 - uv.y` (0 na boca da caneca, 1 no topo da coluna).
 */

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uNight;
  uniform vec3 uColorNight;
  uniform vec3 uColorDay;
  uniform float uOpacityNight;
  uniform float uOpacityDay;

  varying vec2 vUv;

  // Ruído de gradiente 2D (suave, faixa aproximada -0.7..0.7).
  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float gradientNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    return mix(
      mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)), dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
      mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    float h = 1.0 - vUv.y;
    float x = vUv.x;

    // A coluna ondula mais conforme sobe.
    float sway = gradientNoise(vec2(h * 2.4 - uTime * 0.22, uTime * 0.1));
    x += sway * 0.34 * smoothstep(0.0, 0.85, h);

    // Dois níveis de ruído subindo.
    vec2 p = vec2(x * 3.2, h * 4.2 - uTime * 0.62);
    float n = gradientNoise(p) * 0.7 + gradientNoise(p * 2.3 + vec2(7.0, 3.0)) * 0.3;
    // Mais denso perto da boca da caneca, mais esgarçado no alto.
    float density = smoothstep(-0.12, 0.42, n + (1.0 - h) * 0.24);

    // Estreita na boca da caneca e abre ao subir; aparece e some suave nas pontas.
    float width = mix(0.16, 0.5, smoothstep(0.0, 1.0, h));
    float edge = 1.0 - smoothstep(width * 0.3, width, abs(x - 0.5));
    float vertical = smoothstep(0.02, 0.12, h) * (1.0 - smoothstep(0.42, 1.0, h));

    float alpha = density * edge * vertical * mix(uOpacityDay, uOpacityNight, uNight);
    vec3 color = mix(uColorDay, uColorNight, uNight);

    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`

/** Cor da fumaça à noite (rosada, tingida pela luz da mesa) e de dia (cinza-azulado claro). */
const COLOR_NIGHT = '#e9b3a6'
const COLOR_DAY = '#dfe5f2'

export function createSteamMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    name: 'fx_mug_steam',
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    fog: false,
    side: DoubleSide,
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uNight: { value: 1 },
      uColorNight: { value: new Color(COLOR_NIGHT) },
      uColorDay: { value: new Color(COLOR_DAY) },
      uOpacityNight: { value: 0.62 },
      uOpacityDay: { value: 0.5 },
    },
  })
}

/** Atualiza tempo e tema (chamado por frame; sem alocar). */
export function updateSteamMaterial(material: ShaderMaterial, time: number, night: number): void {
  material.uniforms.uTime.value = time
  material.uniforms.uNight.value = night
}
