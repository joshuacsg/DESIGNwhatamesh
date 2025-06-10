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
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

const MeshGradientwhatamesh: React.FC = () => {
  const [color1, setColor1] = useState<string>("#dca8d8");
  const [color2, setColor2] = useState<string>("#a3d3f9");
  const [color3, setColor3] = useState<string>("#fcd6d6");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordDuration, setRecordDuration] = useState<number>(5);
  const [width, setWidth] = useState<number>(1920);
  const [height, setHeight] = useState<number>(1080);
  const [enableLooping, setEnableLooping] = useState<boolean>(true);
  const [outputFormat, setOutputFormat] = useState<"webm" | "webp">("webm");
  const [recordPopoverOpen, setRecordPopoverOpen] = useState<boolean>(false);
  const [editPopoverOpen, setEditPopoverOpen] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const gradientRef = useRef<any>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize the gradient after the component mounts
    gradientRef.current = new Gradient();
    gradientRef.current.initGradient("#gradient-canvas");
    gradientRef.current.amp = 2;
  }, [color1, color2, color3]);

  const loadFFmpeg = async () => {
    if (!ffmpegRef.current) {
      const ffmpeg = new FFmpeg();
      ffmpeg.on("log", ({ message }) => {
        console.log(message);
      });
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });
      ffmpegRef.current = ffmpeg;
    }
  };

  const convertWebMtoWebP = async (webmBlob: Blob) => {
    setIsConverting(true);
    await loadFFmpeg();
    const ffmpeg = ffmpegRef.current;
    if (!ffmpeg) {
      console.error("FFmpeg not loaded.");
      setIsConverting(false);
      return null;
    }

    const inputName = "input.webm";
    const outputName = "output.webp";

    await ffmpeg.writeFile(inputName, new Uint8Array(await webmBlob.arrayBuffer()));
    await ffmpeg.exec(["-i", inputName, outputName]);

    const data = await ffmpeg.readFile(outputName);
    const webpBlob = new Blob([data], { type: "image/webp" });
    setIsConverting(false);
    return webpBlob;
  };

  const handleRecord = () => {
    // Close the popover when starting recording
    setRecordPopoverOpen(false);
    
    const canvas = document.getElementById(
      "gradient-canvas"
    ) as HTMLCanvasElement;
    if (!canvas || !gradientRef.current) return;

    setIsRecording(true);
    setCountdown(recordDuration);

    // Start countdown
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          // Set processing immediately in the same state update
          setIsProcessing(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    const ctx = offscreenCanvas.getContext("2d");

    if (!ctx) {
      console.error("Failed to get 2D context from offscreen canvas.");
      setIsRecording(false);
      setCountdown(0);
      setIsProcessing(false);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      return;
    }
    
    const mimeType = "video/webm"; // Always record in webm
    const stream = offscreenCanvas.captureStream();
    const recorder = new MediaRecorder(stream, { mimeType });

    const recordedChunks: Blob[] = [];
    const loopFrames: ImageData[] = [];
    const loopDuration = 4; // seconds
    const fps = 60; // approximate fps
    const maxLoopFrames = loopDuration * fps;
    let frameCount = 0;

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

      // Capture first 4 seconds of frames for looping only if looping is enabled
      if (enableLooping && frameCount < maxLoopFrames) {
        const imageData = ctx.getImageData(0, 0, width, height);
        loopFrames.push(imageData);
      }
      
      frameCount++;
      animationFrameId = requestAnimationFrame(drawFrame);
    };

    const createLoopedVideo = async () => {
      // Create a new canvas for the looped version
      const loopCanvas = document.createElement("canvas");
      loopCanvas.width = width;
      loopCanvas.height = height;
      const loopCtx = loopCanvas.getContext("2d");

      if (!loopCtx) {
        console.error("Failed to get 2D context for loop canvas.");
        return;
      }

      const loopStream = loopCanvas.captureStream();
      const loopRecorder = new MediaRecorder(loopStream, { mimeType });
      const loopChunks: Blob[] = [];

      loopRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          loopChunks.push(event.data);
        }
      };

      loopRecorder.onstop = async () => {
        const loopBlob = new Blob(loopChunks, { type: mimeType });
        if (outputFormat === "webp") {
          const webpBlob = await convertWebMtoWebP(loopBlob);
          if (webpBlob) {
            downloadBlob(webpBlob, "webp", true);
          }
        } else {
          downloadBlob(loopBlob, "webm", true);
        }
        setIsRecording(false);
        setCountdown(0);
        setIsProcessing(false);
      };

      // First, play the original video
      const video = document.createElement("video");
      video.src = URL.createObjectURL(new Blob(recordedChunks, { type: mimeType }));
      video.muted = true;
      
      loopRecorder.start();

      video.onloadeddata = () => {
        video.play();
        
        const drawOriginalVideo = () => {
          if (!video.ended) {
            loopCtx.drawImage(video, 0, 0, width, height);
            requestAnimationFrame(drawOriginalVideo);
          } else {
            // Original video ended, now add the loop frames with fade
            addLoopFrames();
          }
        };
        
        drawOriginalVideo();
      };

      const addLoopFrames = () => {
        let loopIndex = 0;
        const fadeFrames = 60; // Number of frames for fade effect
        
        const drawLoopFrame = () => {
          if (loopIndex < loopFrames.length) {
            const fadeProgress = Math.min(loopIndex / fadeFrames, 1);
            
            // Create temporary canvas for fade effect
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext("2d");
            
            if (tempCtx) {
              tempCtx.putImageData(loopFrames[loopIndex], 0, 0);
              
              // Apply fade effect
              loopCtx.globalAlpha = fadeProgress;
              loopCtx.drawImage(tempCanvas, 0, 0);
              loopCtx.globalAlpha = 1;
            }
            
            loopIndex++;
            setTimeout(drawLoopFrame, 1000 / fps);
          } else {
            // Loop frames completed, stop recording
            setTimeout(() => {
              loopRecorder.stop();
            }, 500);
          }
        };
        
        drawLoopFrame();
      };
    };

    recorder.onstop = async () => {
      cancelAnimationFrame(animationFrameId);
      
      // Clean up countdown
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      setCountdown(0);
      
      if (enableLooping && loopFrames.length > 0) {
        // Create the looped version
        createLoopedVideo();
      } else {
        const blob = new Blob(recordedChunks, { type: "video/webm" });
        if (outputFormat === "webp") {
          const webpBlob = await convertWebMtoWebP(blob);
          if (webpBlob) {
            downloadBlob(webpBlob, "webp", false);
          }
        } else {
          downloadBlob(blob, "webm", false);
        }
        setIsRecording(false);
        setIsProcessing(false);
      }
    };

    recorder.start();
    animationFrameId = requestAnimationFrame(drawFrame);

    recordingTimeoutRef.current = setTimeout(() => {
      recorder.stop();
          }, recordDuration * 1000);
  };

  const downloadBlob = (blob: Blob, format: "webm" | "webp", isLooped: boolean) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const loopString = isLooped ? "-looped" : "";
    a.download = `whatamesh-gradient${loopString}-${new Date().toISOString()}.${format}`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleCancelRecording = () => {
    // Clean up timers
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    
    // Reset states
    setIsRecording(false);
    setCountdown(0);
    setIsProcessing(false);
    
    // Note: We don't try to stop the MediaRecorder here as it might cause issues
    // Instead we just reset the UI state and let the recording complete naturally
  };

  return (
    <div style={{ position: "relative", height: "100vh" }}>
      {/* Canvas for the gradient background */}
      <canvas
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
            `}
          </style>
        </div>
      </div>
      <Popover open={recordPopoverOpen} onOpenChange={setRecordPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            className={`fixed bottom-5 left-5 z-20 ${
              isRecording && isHovering && !isProcessing ? "border-red-500 text-red-600" : ""
            }`}
            variant={"outline"}
            disabled={isProcessing}
            onClick={isRecording && !isProcessing ? handleCancelRecording : undefined}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {isRecording 
              ? isConverting 
                ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
                      <span>Converting...</span>
                    </div>
                  )
                : (isProcessing || countdown === 0)
                  ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
                        <span>Processing</span>
                      </div>
                    )
                  : (isHovering && !isProcessing ? "Cancel" : `Recording... ${countdown}s`)
              : "Record"
            }
          </Button>
        </PopoverTrigger>
        <PopoverContent className="bg-white">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Recording Settings</h4>
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
                  onChange={(e) => setRecordDuration(Number(e.target.value))}
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
              <div className="grid grid-cols-3 items-center gap-4">
                <label htmlFor="looping">Enable Looping</label>
                <input
                  id="looping"
                  type="checkbox"
                  checked={enableLooping}
                  onChange={(e) => setEnableLooping(e.target.checked)}
                  className="col-span-2 h-4 w-4"
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <label htmlFor="format">Format</label>
                <select
                  id="format"
                  value={outputFormat}
                  onChange={(e) =>
                    setOutputFormat(e.target.value as "webm" | "webp")
                  }
                  className="col-span-2 h-8 border rounded-md px-2 bg-transparent"
                >
                  <option value="webm">WebM</option>
                  <option value="webp">WebP</option>
                </select>
              </div>
            </div>
            <Button onClick={handleRecord} disabled={isRecording}>
              Start Recording
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Popover open={editPopoverOpen} onOpenChange={setEditPopoverOpen}>
        <PopoverTrigger asChild>
          <Button className="fixed bottom-5 right-5 z-20" variant={"outline"}>
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
    </div>
  );
}

export default MeshGradientwhatamesh;
