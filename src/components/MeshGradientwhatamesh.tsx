import React, { useState, useEffect, useMemo } from "react";
import {
  softGradient,
  linearGradient,
  parallaxStars,
  blobGradient,
  auroraWave,
} from "@/shaders/shaders";
import ShaderControls from "./ShaderControls";
import ThreejsCanvas from "./ThreejsCanvas";

const defaultColorSets = [
  {
    color1: "#aaa7db",
    color2: "#ffffff",
    color3: "#ffffff",
    color4: "#ffffff",
    color5: "#ffffff",
  },
  {
    color1: "#a7dbce",
    color2: "#d0ebff",
    color3: "#d7f5fc",
    color4: "#ffffff",
    color5: "#ffffff",
  },
  {
    color1: "#a7dbce",
    color2: "#d0ebff",
    color3: "#fcd6d6",
    color4: "#ffffff",
    color5: "#ffffff",
  },
  {
    color1: "#dbbea7",
    color2: "#fffed1",
    color3: "#f3ffd3",
    color4: "#ffffff",
    color5: "#ffffff",
  },
];

const getRandomColorSet = () =>
  defaultColorSets[Math.floor(Math.random() * defaultColorSets.length)];

// Helper function to convert hex to RGB (0-1 range)
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255,
  ];
};

// Map each shader to how many colour uniforms the fragment actually uses.
const shaderConfigs = [
  { shader: softGradient, colorCount: 2 },
  { shader: linearGradient, colorCount: 2 },
  { shader: parallaxStars, colorCount: 0 },
  { shader: blobGradient, colorCount: 4 },
  { shader: auroraWave, colorCount: 2 },
] as const;

const MeshGradientwhatamesh: React.FC<{
  speed?: number;
  motionOffset?: number;
  bandCount?: number;
  cycleLength?: number;
  blendWindow?: number;
  timeScale?: [number, number, number, number];
  sineFreq?: [number, number, number, number];
  phaseShift?: [number, number, number, number];
  spread?: number;
  rotation?: number;
}> = ({
  speed,
  motionOffset,
  bandCount,
  cycleLength,
  blendWindow,
  timeScale,
  sineFreq,
  phaseShift,
  spread,
  rotation,
}) => {
  // Generate a single random color set once on mount
  const initialColorSet = useMemo(() => getRandomColorSet(), []);

  // Maintain a 5-element colour array.
  const [colorsHex, setColorsHex] = useState<string[]>([
    initialColorSet.color1,
    initialColorSet.color2,
    initialColorSet.color3,
    initialColorSet.color4,
    initialColorSet.color5,
  ]);

  // Uniform speed (defaults to prop or shader default 1.3)
  const [speedValue, setSpeedValue] = useState<number>(speed ?? 0.2);

  // Spread and rotation uniform values
  const [spreadValue, setSpreadValue] = useState<number>(spread ?? 3.0);
  const [rotationValue, setRotationValue] = useState<number>(
    rotation ?? 90
  );

  const setColorHexAt = (index: number, value: string) => {
    setColorsHex((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  // Control visibility through URL param (?controls=true)
  const [showControls, setShowControls] = useState<boolean>(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setShowControls(params.get("controls") === "true");

    // Allow colours to be pre-configured via URL e.g. ?color1=ff0000
    const urlColor1 = params.get("color1");
    const urlColor2 = params.get("color2");
    const urlColor3 = params.get("color3");

    // Load numeric params if provided
    const urlSpeed = parseFloat(params.get("speed") ?? "");
    const urlSpread = parseFloat(params.get("spread") ?? "");
    const urlRotation = parseFloat(params.get("rotation") ?? "");

    const isValidHex = (val: string | null) =>
      !!val && /^[0-9a-f]{6}$/i.test(val);
    const incoming = [...colorsHex];
    if (isValidHex(urlColor1)) incoming[0] = `#${urlColor1}`;
    if (isValidHex(urlColor2)) incoming[1] = `#${urlColor2}`;
    if (isValidHex(urlColor3)) incoming[2] = `#${urlColor3}`;
    setColorsHex(incoming);

    if (!Number.isNaN(urlSpeed)) setSpeedValue(urlSpeed);
    if (!Number.isNaN(urlSpread)) setSpreadValue(urlSpread);
    if (!Number.isNaN(urlRotation)) setRotationValue(urlRotation);
  }, []);

  // Update URL whenever editable params change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("color1", colorsHex[0].substring(1));
    params.set("color2", colorsHex[1].substring(1));
    params.set("color3", colorsHex[2].substring(1));
    params.set("speed", speedValue.toString());
    params.set("spread", spreadValue.toString());
    params.set("rotation", rotationValue.toString());
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${params.toString()}`
    );
  }, [colorsHex, speedValue, spreadValue, rotationValue]);

  const rgbColors = colorsHex.map(hexToRgb) as [number, number, number][];
  const [colorOne, colorTwo, colorThree, colorFour, colorFive] = rgbColors;

  return (
    <div>
      {/* <img
        src="/public/demo-evening.png"
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "black",
          opacity: 0.5,
        }}
      ></div>
      {/* Determine shader based on URL path: /0 => softGradient, /1 => linearGradient, etc. */}

      <div
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <ThreejsCanvas
          colorA={colorOne}
          colorB={colorTwo}
          width={spreadValue}
          speed={speedValue}
          rotationDeg={(rotationValue * 180) / Math.PI}
        />
      </div>

      {/* Shader editing controls */}
      {(() => {
        const pathnameSegment =
          typeof window !== "undefined"
            ? window.location.pathname.split("/").filter(Boolean)[0] ?? "0"
            : "0";
        const index = Number(pathnameSegment);
        const selectedConfig =
          !Number.isNaN(index) && shaderConfigs[index]
            ? shaderConfigs[index]
            : shaderConfigs[0];
        return (
          <ShaderControls
            colors={colorsHex}
            visibleCount={selectedConfig.colorCount}
            onChange={setColorHexAt}
            speed={speedValue}
            onSpeedChange={setSpeedValue}
            spread={spreadValue}
            onSpreadChange={setSpreadValue}
            rotation={rotationValue}
            onRotationChange={setRotationValue}
            show={showControls}
          />
        );
      })()}

      {/* Navigation arrows */}
      {showControls && (
        <div className="fixed bottom-5 left-5 flex items-center gap-2 z-20">
          <button
            onClick={() => {
              const pathnameSegment =
                window.location.pathname.split("/").filter(Boolean)[0] ?? "0";
              const index = Number(pathnameSegment);
              const prev =
                (index - 1 + shaderConfigs.length) % shaderConfigs.length;
              window.location.href = `/${prev}${window.location.search}`;
            }}
            className="bg-white/70 hover:bg-white text-black rounded-full w-8 h-8 flex items-center justify-center shadow"
          >
            ◀
          </button>
          <button
            onClick={() => {
              const pathnameSegment =
                window.location.pathname.split("/").filter(Boolean)[0] ?? "0";
              const index = Number(pathnameSegment);
              const next = (index + 1) % shaderConfigs.length;
              window.location.href = `/${next}${window.location.search}`;
            }}
            className="bg-white/70 hover:bg-white text-black rounded-full w-8 h-8 flex items-center justify-center shadow"
          >
            ▶
          </button>
        </div>
      )}
    </div>
  );
};

export default MeshGradientwhatamesh;
