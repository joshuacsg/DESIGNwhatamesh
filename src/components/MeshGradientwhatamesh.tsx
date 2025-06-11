import { useEffect, useState, useRef } from "react";
// @ts-ignore
import { Gradient } from "../gradient.jsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "./ui/color-picker.js";
import { Input } from "@/components/ui/input";

const defaultColorSets = [
  {
    color1: "#aaa7db",
    color2: "#fff",
    color3: "#fff",
  },
  {
    color1: "#a7dbce",
    color2: "#d0ebff",
    color3: "#d7f5fc",
  },
  {
    color1: "#a7dbce",
    color2: "#d0ebff",
    color3: "#fcd6d6",  
  },
  {
    color1: "#dbbea7",
    color2: "#fffed1",
    color3: "#f3ffd3",
  },
]
const getRandomColorSet = () => {
  const randomIndex = Math.floor(Math.random() * defaultColorSets.length);
  return defaultColorSets[randomIndex];
}

const MeshGradientwhatamesh: React.FC = () => {
  const [colorSet, _] = useState<{color1: string, color2: string, color3: string}>(getRandomColorSet());
  const [color1, setColor1] = useState<string>(colorSet.color1);
  const [color2, setColor2] = useState<string>(colorSet.color2);
  const [color3, setColor3] = useState<string>(colorSet.color3);
  // const [bgColor, setBgColor] = useState<string>("#FFFFFF");
  const [gradientLoaded, setGradientLoaded] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordDuration, setRecordDuration] = useState<number>(5);
  const [width, setWidth] = useState<number>(1920);
  const [height, setHeight] = useState<number>(1080);
  const [showControls, setShowControls] = useState<boolean>(false);
  const gradientRef = useRef<any>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    gradientRef.current = new Gradient();
    gradientRef.current.initGradient("#gradient-canvas");
    gradientRef.current.amp = 2;
    setGradientLoaded(true);
  }, []);

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

    if (urlColor1 && isValidHex(urlColor1)) {
      setColor1(`#${urlColor1}`);
    }
    if (urlColor2 && isValidHex(urlColor2)) {
      setColor2(`#${urlColor2}`);
    }
    if (urlColor3 && isValidHex(urlColor3)) {
      setColor3(`#${urlColor3}`);
    }

    if (controlsParam === "true") {
      setShowControls(true);
    }
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const params = new URLSearchParams(window.location.search);
    params.set("color1", color1.substring(1));
    params.set("color2", color2.substring(1));
    params.set("color3", color3.substring(1));
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  }, [color1, color2, color3]);

  const handleRecord = () => {
    const canvas = document.getElementById(
      "gradient-canvas"
    ) as HTMLCanvasElement;
    if (!canvas || !gradientRef.current) return;

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
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    let animationFrameId: number;

    const drawFrame = () => {
      const sourceAspect = canvas.width / canvas.height;
      const targetAspect = width / height;

      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = canvas.width;
      let sourceHeight = canvas.height;

      if (sourceAspect > targetAspect) {
        // Source is wider than target, crop width
        sourceWidth = canvas.height * targetAspect;
        sourceX = (canvas.width - sourceWidth) / 2;
      } else if (sourceAspect < targetAspect) {
        // Source is narrower than target, crop height
        sourceHeight = canvas.width / targetAspect;
        sourceY = (canvas.height - sourceHeight) / 2;
      }

      ctx.drawImage(
        canvas,
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
      a.download = `whatamesh-gradient-${new Date().toISOString()}.webm`;
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
  };

  return (
    <div style={{ position: "relative", height: "100vh", backgroundColor: "transparent" }}>
      {/* Canvas for the gradient background */}
      <canvas
        className={gradientLoaded ? "fade-in" : ""}
        id="gradient-canvas"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          "--gradient-color-1": color1,
          "--gradient-color-2": color2,
          "--gradient-color-3": color3,
          opacity: gradientLoaded ? 1 : 0,
        } as React.CSSProperties}
      />

      <div className="container h-screen mx-auto flex justify-center items-center relative">
        <div className="flex flex-col justify-start px-48 space-y-12 z-10">
          {/* Style tag for inline keyframes */}
          <style>
            {`
              @keyframes colorCycle {
                0% {
                  color: black;
                }
                25% {
                  color: black;
                }
                50% {
                  color: white;
                }
                75% {
                  color: white;
                }
                100% {
                  color: black;
                }
              }

              .color-animate {
                animation: colorCycle 6s linear infinite;
              }

              /* Fade-in for the canvas */
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              .fade-in {
                animation: fadeIn 1s ease-in-out forwards;
              }
            `}
          </style>
        </div>
      </div>
      {showControls && (
        <>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                className="fixed bottom-5 left-5 z-20"
                variant={"outline"}
                disabled={isRecording}
              >
                {isRecording ? "Recording..." : "Record"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="bg-white">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">
                    Recording Settings
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Configure video output settings.
                  </p>
                </div>
                <div className="grid gap-2">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <label htmlFor="duration">Duration (s)</label>
                    <Input
                      id="duration"
                      type="number"
                      value={recordDuration}
                      onChange={(e) =>
                        setRecordDuration(Number(e.target.value))
                      }
                      className="col-span-2 h-8"
                      min="1"
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <label htmlFor="width">Width</label>
                    <Input
                      id="width"
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(Number(e.target.value))}
                      className="col-span-2 h-8"
                      min="1"
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <label htmlFor="height">Height</label>
                    <Input
                      id="height"
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="col-span-2 h-8"
                      min="1"
                    />
                  </div>
                </div>
                <Button onClick={handleRecord} disabled={isRecording}>
                  Start Recording
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                className="fixed bottom-5 right-5 z-20"
                variant={"outline"}
              >
                Edit
              </Button>
            </PopoverTrigger>
            <PopoverContent className="bg-white">
              <div className="space-y-4">
                <h4 className="font-medium">Edit Gradient Colors</h4>
                <div className="flex items-center justify-between">
                  <label htmlFor="color1" className="pr-4">
                    Color 1
                  </label>
                  <ColorPicker
                    value={color1}
                    onChange={setColor1}
                    className="w-16 h-8"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="color2" className="pr-4">
                    Color 2
                  </label>
                  <ColorPicker
                    value={color2}
                    onChange={setColor2}
                    className="w-16 h-8"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="color3" className="pr-4">
                    Color 3
                  </label>
                  <ColorPicker
                    value={color3}
                    onChange={setColor3}
                    className="w-16 h-8"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </>
      )}
    </div>
  );
}

export default MeshGradientwhatamesh;
