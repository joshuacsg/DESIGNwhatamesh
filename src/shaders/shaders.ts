import { ShaderMaterial } from "three";

export const linearGradient = (uniforms: any) => new ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
    fragmentShader: /* glsl */ `
        precision mediump float;
        uniform vec3  uColorA;
        uniform vec3  uColorB;
        uniform float uWidth;
        uniform float uSpeed;
        uniform float uTime;
        uniform float uAngle;
        uniform float uNoiseAmp;
        uniform float uNoiseFreq;
        varying vec2 vUv;

        vec3 toLinear(vec3 c) { return pow(c, vec3(2.2)); }
        vec3 toSRGB  (vec3 c) { return pow(c, vec3(1.0/2.2)); }

/* ------------------------------------------------------------- */
/*  Cheap, hash-based 2-D noise (periodic, no texture sampler)   */
/* ------------------------------------------------------------- */
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

float noise(vec2 p) {
  vec2  i = floor(p);
  vec2  f = fract(p);

  // Four corners in 2-D of our tile
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  // Smooth interpolation
  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(a, b, u.x) +
         (c - a) * u.y * (1.0 - u.x) +
         (d - b) * u.x * u.y;
}

        void main() {
           /* -------------------------------------------------------------
     1.  Rotate the UV vector around the centre (0.5,0.5)
         dir = (cos θ, sin θ) – a unit vector pointing along the
         gradient's axis.
      ------------------------------------------------------------- */
      vec2  dir      = vec2(cos(uAngle), sin(uAngle));
      float coord    = dot(vUv - 0.5, dir);   // -0.5 … +0.5 range

      /* -------------------------------------------------------------
      2.  Phase along the band  (repeat every uWidth)
      ------------------------------------------------------------- */
      float phase = (coord / max(uWidth, 1e-4)) + uTime * uSpeed;

      /* -------------------------------------------------------------
      3.  Triangle-wave 0→1→0   (A→B→A) for seamless loop
      ------------------------------------------------------------- */
      float t = abs(fract(phase) * 2.0 - 1.0);
      t       = smoothstep(0.0, 1.0, t);

  /* 4. Add a small, high-frequency noise ----------------------- */
  float n = noise(vUv * uNoiseFreq + uTime * 5.0); // animate a little
  t += (n - 0.5) * uNoiseAmp;                      // centred around 0

  t = clamp(t, 0.0, 1.0);                          // keep inside range

  /* 5. Gamma-correct blend and output -------------------------- */
  vec3 col = mix(toLinear(uColorA), toLinear(uColorB), t);
  gl_FragColor = vec4(toSRGB(col), 1.0);
          }
      `,
  });

export const softGradient = linearGradient;
export const parallaxStars = linearGradient;
export const blobGradient = linearGradient;
export const auroraWave = linearGradient;