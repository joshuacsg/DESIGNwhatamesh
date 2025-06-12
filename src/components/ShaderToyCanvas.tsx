import React, { useEffect, useState, useMemo } from "react";
import { ShadertoyCanvas as R3FShadertoyCanvas } from "@kortexa-ai/react-shadertoy";

interface ShaderCanvasProps {
  shader: string;
  colorOne?: [number, number, number]; // RGB values from 0-1
  colorTwo?: [number, number, number]; // RGB values from 0-1
  colorThree?: [number, number, number]; // RGB values from 0-1
  colorFour?: [number, number, number]; // RGB values from 0-1
  colorFive?: [number, number, number]; // RGB values from 0-1
  // NEW uniform controls
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
  noiseAmp?: number;
}

// Hook to keep track of the viewport size so we can inform the shader canvas
const useWindowDimensions = () => {
  const getDimensions = () => ({
    width: typeof window === "undefined" ? 0 : window.innerWidth,
    height: typeof window === "undefined" ? 0 : window.innerHeight,
  });

  const [dimensions, setDimensions] = useState(getDimensions);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const handleResize = () => {
      // Clear any scheduled update and schedule a new one
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setDimensions(getDimensions());
      }, 150); // update after 150 ms of no further resize events
    };

    window.addEventListener("resize", handleResize);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return dimensions;
};

const ShaderCanvas: React.FC<ShaderCanvasProps> = ({ 
  shader, 
  colorOne = [0.0 / 255.0, 209.0 / 255.0, 193.0 / 255.0], // Default teal
  colorTwo = [123.0 / 255.0, 222.0 / 255.0, 90.0 / 255.0],  // Default green
  colorThree = [255.0 / 255.0, 255.0 / 255.0, 255.0 / 255.0], // Default white
  colorFour = [255.0 / 255.0, 255.0 / 255.0, 255.0 / 255.0], // Default white
  colorFive = [255.0 / 255.0, 255.0 / 255.0, 255.0 / 255.0], // Default white
  // NEW props with defaults matching shader constants
  speed = 1.3,
  motionOffset = 0.5,
  bandCount = 4.0,
  cycleLength = 10.0,
  blendWindow = 2.0,
  timeScale = [0.99, 0.98, 0.97, 0.96],
  sineFreq = [0.06, 0.10, 0.12, 0.09],
  phaseShift = [1.0, 2.0, 5.0, 6.0],
  spread = 1.0,
  rotation = 0.78539816339,
  noiseAmp = 0.0078
}) => {
  const [shaderLoaded, setShaderLoaded] = useState(false);

  // Dynamically capture the viewport size
  const { width, height } = useWindowDimensions();

  // Force a remount of the underlying Canvas whenever viewport size OR colours change.
  const uniformKey = `${colorOne.join(',')}-${colorTwo.join(',')}-${colorThree.join(',')}-${colorFour.join(',')}-${colorFive.join(',')}-${speed}-${spread}-${rotation}-${noiseAmp}`;
  const [canvasKey, setCanvasKey] = useState(`${width}x${height}-${uniformKey}`);
  useEffect(() => {
    setCanvasKey(`${width}x${height}-${uniformKey}`);
  }, [width, height, uniformKey]);

  // Create uniforms object with color values and new controls
  const uniforms = useMemo(() => ({
    uColorOne: { type: '3f', value: colorOne },
    uColorTwo: { type: '3f', value: colorTwo },
    uColorThree: { type: '3f', value: colorThree },
    uColorFour: { type: '3f', value: colorFour },
    uColorFive: { type: '3f', value: colorFive },
    uSpeed: { type: '1f', value: speed },
    uMotionOffset: { type: '1f', value: motionOffset },
    uBandCount: { type: '1f', value: bandCount },
    uCycleLength: { type: '1f', value: cycleLength },
    uBlendWindow: { type: '1f', value: blendWindow },
    uTimeScale: { type: '4f', value: timeScale },
    uSineFreq: { type: '4f', value: sineFreq },
    uPhaseShift: { type: '4f', value: phaseShift },
    uSpread: { type: '1f', value: spread },
    uRotation: { type: '1f', value: rotation },
    uNoiseAmp: { type: '1f', value: noiseAmp },
  }), [
    colorOne,
    colorTwo,
    colorThree,
    colorFour,
    colorFive,
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
    noiseAmp,
  ]);

  useEffect(() => {
    // signal that the component has mounted so we can trigger the fade-in
    setShaderLoaded(true);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        height: "100vh",
        backgroundColor: "transparent",
      }}
    >
      <div
        className={shaderLoaded ? "fade-in" : ""}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: shaderLoaded ? 1 : 0,
        }}
      >
        {/* Library component handles its own <Canvas> internally */}
        <R3FShadertoyCanvas 
          key={canvasKey}
          fs={shader} 
        //   style={{ width: "100%", height: "100%" }}
          uniforms={uniforms}
          width={width}
          height={height}
        />
      </div>

      {/* Fade-in style */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .fade-in { animation: fadeIn 1s ease-in-out forwards; }
      `}</style>
    </div>
  );
};

export default ShaderCanvas;
