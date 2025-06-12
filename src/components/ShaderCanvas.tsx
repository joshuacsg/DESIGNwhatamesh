import React, { useEffect, useState, useRef, useCallback } from "react";

export interface ShaderPlugin {
  /**
   * Receive the canvas element and currently active colors.
   * Optionally return a cleanup function that will be invoked when the component unmounts.
   */
  (canvas: HTMLCanvasElement, colors: { color1: string; color2: string; color3: string }): void | (() => void);
}

interface ShaderCanvasProps {
  /**
   * Shader implementation that will be applied to the underlying canvas.
   */
  plugin: ShaderPlugin;
  /**
   * Optional initial colors for the three color stops.
   */
  initialColors?: { color1: string; color2: string; color3: string };
  /**
   * Show edit/record controls regardless of `?controls=true` query param.
   */
  forceShowControls?: boolean;
}

const ShaderCanvas: React.FC<ShaderCanvasProps> = ({ plugin, initialColors, forceShowControls }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [color1, setColor1] = useState<string>(initialColors?.color1 ?? "#aaa7db");
  const [color2, setColor2] = useState<string>(initialColors?.color2 ?? "#ffffff");
  const [color3, setColor3] = useState<string>(initialColors?.color3 ?? "#ffffff");
  const [shaderLoaded, setShaderLoaded] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordDuration, setRecordDuration] = useState<number>(5);
  const [width, setWidth] = useState<number>(1920);
  const [height, setHeight] = useState<number>(1080);
  const [showControls, setShowControls] = useState<boolean>(false);

  // Initialise URL params and controls visibility
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlColor1 = params.get("color1");
    const urlColor2 = params.get("color2");
    const urlColor3 = params.get("color3");
    const controlsParam = params.get("controls");

    const isValidHex = (color: string | null): boolean => {
      if (!color) return false;
      return /^[0-9a-f]{6}$/i.test(color);
    };

    if (urlColor1 && isValidHex(urlColor1)) setColor1(`#${urlColor1}`);
    if (urlColor2 && isValidHex(urlColor2)) setColor2(`#${urlColor2}`);
    if (urlColor3 && isValidHex(urlColor3)) setColor3(`#${urlColor3}`);

    if (controlsParam === "true" || forceShowControls) setShowControls(true);
  }, [forceShowControls]);

  // Apply shader plugin on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cleanup = plugin(canvas, { color1, color2, color3 });
    setShaderLoaded(true);
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
    // We intentionally exclude plugin from deps so it only runs once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync colors with URL so they can be shared
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("color1", color1.substring(1));
    params.set("color2", color2.substring(1));
    params.set("color3", color3.substring(1));
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  }, [color1, color2, color3]);

  const handleRecord = useCallback(() => {
    const sourceCanvas = canvasRef.current;
    if (!sourceCanvas) return;

    setIsRecording(true);

    const offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    const ctx = offscreenCanvas.getContext("2d");
    if (!ctx) {
      console.error("Failed to get 2D context from offscreen canvas.");
      setIsRecording(false);
      return;
    }

    const stream = offscreenCanvas.captureStream();
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    const recordedChunks: Blob[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunks.push(event.data);
    };

    let animationFrameId: number;
    const drawFrame = () => {
      const sourceAspect = sourceCanvas.width / sourceCanvas.height;
      const targetAspect = width / height;

      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = sourceCanvas.width;
      let sourceHeight = sourceCanvas.height;

      if (sourceAspect > targetAspect) {
        sourceWidth = sourceCanvas.height * targetAspect;
        sourceX = (sourceCanvas.width - sourceWidth) / 2;
      } else if (sourceAspect < targetAspect) {
        sourceHeight = sourceCanvas.width / targetAspect;
        sourceY = (sourceCanvas.height - sourceHeight) / 2;
      }

      ctx.drawImage(
        sourceCanvas,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        width,
        height
      );
      animationFrameId = requestAnimationFrame(drawFrame);
    };

    recorder.onstop = () => {
      cancelAnimationFrame(animationFrameId);
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shader-recording-${new Date().toISOString()}.webm`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setIsRecording(false);
    };

    recorder.start();
    animationFrameId = requestAnimationFrame(drawFrame);

    setTimeout(() => {
      recorder.stop();
    }, recordDuration * 1000);
  }, [width, height, recordDuration, isRecording]);

  return (
    <div style={{ position: "relative", height: "100vh", backgroundColor: "transparent" }}>
      {/* Shader canvas */}
      <canvas
        ref={canvasRef}
        id="gradient-canvas"
        className={shaderLoaded ? "fade-in" : ""}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          "--gradient-color-1": color1,
          "--gradient-color-2": color2,
          "--gradient-color-3": color3,
          opacity: shaderLoaded ? 1 : 0,
        } as React.CSSProperties}
      />

      {/* Fade-in & color animation styles */}
      <style>{`
        @keyframes colorCycle {
          0% { color: black; }
          25% { color: black; }
          50% { color: white; }
          75% { color: white; }
          100% { color: black; }
        }
        .color-animate { animation: colorCycle 6s linear infinite; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .fade-in { animation: fadeIn 1s ease-in-out forwards; }
      `}</style>

      {/* External content placeholder */}
      <div className="container h-screen mx-auto flex justify-center items-center relative">
        {/* Children could go here if needed */}
      </div>

      {/* Recording UI could go here; colour editing now handled by parent. */}
    </div>
  );
};

export default ShaderCanvas; 