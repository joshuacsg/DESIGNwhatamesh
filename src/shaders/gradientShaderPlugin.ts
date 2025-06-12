// @ts-ignore – gradient library is plain JS
import { Gradient } from "../gradient.jsx";
import { ShaderPlugin } from "../components/ShaderCanvas.js";

export const gradientShaderPlugin: ShaderPlugin = (canvas, _colors) => {
  // Ensure the canvas has an ID for the Gradient library to target.
  if (!canvas.id) canvas.id = "gradient-canvas";
  // Instantiate and initialise the shader
  const gradientInstance: any = new Gradient();
  gradientInstance.initGradient(`#${canvas.id}`);
  // Custom configuration (tweak amplitude etc.)
  gradientInstance.amp = 2;

  // Return cleanup to disconnect observers & listeners
  return () => {
    if (typeof gradientInstance.disconnect === "function") {
      gradientInstance.disconnect();
    }
  };
}; 