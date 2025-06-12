// GradientScene.tsx  ─ React 18 + Three.js r160 (TS or plain JS with minor tweaks)
import {
  Scene,
  WebGLRenderer,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
  Clock,
  Mesh,
  OrthographicCamera,
  MathUtils,
} from "three";
import { useEffect, useRef } from "react";
import { linearGradient } from "@/shaders/shaders";

type Props = {
  colorA?: [number, number, number]; // linear-space RGB 0-1
  colorB?: [number, number, number];
  width?: number; // UV width of one band
  speed?: number; // bands/second
  /** Rotation of the gradient axis in DEGREES (0° = left→right). */
  rotationDeg?: number;
};

export default function ThreejsCanvas({
  colorA = [1.0, 0.38, 0.0],
  colorB = [0.16, 0.64, 1.0],
  width = 0.5,
  speed = 0.2,
  rotationDeg = 90,
}: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // ───────────────── three.js boilerplate ─────────────────
    const scene = new Scene();

    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    const el = mountRef.current!;
    el.appendChild(renderer.domElement);

    // ───────────────── shader material ─────────────────
    const uniforms = {
      uColorA: { value: new Vector3(...colorA) },
      uColorB: { value: new Vector3(...colorB) },
      uWidth: { value: width },
      uSpeed: { value: speed },
      uTime: { value: 0 },
      uAngle: { value: MathUtils.degToRad(rotationDeg) }, // convert degrees → radians
      uNoiseAmp: { value: 0.015 }, // ⟵ NEW  strength of the noise (0–~0.05)
      uNoiseFreq: { value: 900.0 }, // ⟵ NEW  higher = finer grain
    };

    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1); // covers NDC directly
    const geometry = new PlaneGeometry(2, 2); // fills the clip-space square
    const mesh = new Mesh(geometry, linearGradient(uniforms));
    scene.add(mesh);

    // ───────────────── resize handling ─────────────────
    function handleResize() {
      const { clientWidth: w, clientHeight: h } = el;
      renderer.setSize(w, h, false);
      // camera.aspect = w / h;
      // camera.updateProjectionMatrix();
    }
    handleResize();
    window.addEventListener("resize", handleResize);

    // ───────────────── animation loop ─────────────────
    const clock = new Clock();
    let id: number;
    const animate = () => {
      id = requestAnimationFrame(animate);
      uniforms.uTime.value = clock.getElapsedTime();
      // Propagate any external prop changes every frame
      uniforms.uAngle.value = MathUtils.degToRad(rotationDeg);
      uniforms.uSpeed.value = speed;
      uniforms.uWidth.value = width;
      renderer.render(scene, camera);
    };
    animate();

    // ───────────────── cleanup on unmount ─────────────────
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", handleResize);
      el.removeChild(renderer.domElement);
      renderer.dispose();
      geometry.dispose();
      (mesh.material as ShaderMaterial).dispose();
    };
  }, [colorA, colorB, width, speed, rotationDeg]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}
