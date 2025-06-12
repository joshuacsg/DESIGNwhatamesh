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
export const blobGradient = (uniforms: any) => new ShaderMaterial({
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
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform vec3 uColorC;
        uniform vec3 uColorD;
        uniform float uTime;
        uniform float uSpeed;
        varying vec2 vUv;

        // sRGB ↔ linear helpers (keep colours consistent with other shaders)
        vec3 toLinear(vec3 c) { return pow(c, vec3(2.2)); }
        vec3 toSRGB  (vec3 c) { return pow(c, vec3(1.0/2.2)); }

        // Gaussian fall-off for buttery-soft blobs
        float blob(vec2 centre, float radius, vec2 p) {
            float d = length(p - centre);
            float sigma = radius * 0.4; // blur size (smaller = sharper)
            return exp(-0.5 * (d * d) / (sigma * sigma));
        }

        void main() {
            // Normalised coordinates (0-1)
            vec2 p = vUv;

            // Orbit around screen centre so blobs never leave view
            vec2 centre = vec2(0.5);
            float orbitRadius = 0.20; // must be < 0.5 ‑ maxRadius so blobs stay inside

            float t = uTime * max(uSpeed, 0.001); // t scales with external speed (avoid 0)

            // Compute four centres with phase offsets (different harmonic factors)
            vec2 c1 = centre + orbitRadius * vec2(cos(t * 1.5),  sin(t * 1.5));
            vec2 c2 = centre + orbitRadius * vec2(cos(t * 1.2 + 1.6), sin(t * 1.2 + 1.6));
            vec2 c3 = centre + orbitRadius * vec2(cos(t * 1.0 + 3.1), sin(t * 1.0 + 3.1));
            vec2 c4 = centre + orbitRadius * vec2(cos(t * 1.8 + 4.5), sin(t * 1.8 + 4.5));

            // Large radii so blobs fully cover viewport; slight breathing
            float r1 = 0.55 + sin(t * 0.6) * 0.03;
            float r2 = 0.55 + cos(t * 0.7) * 0.03;
            float r3 = 0.55 + sin(t * 0.5 + 1.8) * 0.03;
            float r4 = 0.55 + cos(t * 0.4 + 2.4) * 0.03;

            // Calculate weights for each blob
            float w1 = blob(c1, r1, p);
            float w2 = blob(c2, r2, p);
            float w3 = blob(c3, r3, p);
            float w4 = blob(c4, r4, p);

            // Blend colours proportionally to weights
            vec3 col = vec3(0.0);
            float total = 0.0;
            col += toLinear(uColorA) * w1; total += w1;
            col += toLinear(uColorB) * w2; total += w2;
            col += toLinear(uColorC) * w3; total += w3;
            col += toLinear(uColorD) * w4; total += w4;

            // Add small baseline so no pixel is pure black (optional tweak)
            vec3 baseline = (toLinear(uColorA)+toLinear(uColorB)+toLinear(uColorC)+toLinear(uColorD)) * 0.25;
            float baseWeight = 0.12;
            col += baseline * baseWeight; total += baseWeight;

            col /= max(total, 1e-5);

            gl_FragColor = vec4(toSRGB(col), 1.0);
        }
      `,
  });
export const auroraWave = linearGradient;