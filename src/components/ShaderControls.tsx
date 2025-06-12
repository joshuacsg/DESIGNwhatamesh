import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "./ui/color-picker";

interface ShaderControlsProps {
  /**
   * Array of current hex colours (length can be ≥ visibleCount).
   */
  colors: string[];
  /**
   * How many colours we actually expose to the user for the selected shader.
   */
  visibleCount: number;
  /**
   * Callback when a colour changes. Receives the index that changed (0-based).
   */
  onChange: (index: number, value: string) => void;
  /**
   * Current speed uniform value and change callback.
   */
  speed: number;
  onSpeedChange: (value: number) => void;
  /**
   * Current spread uniform value and change callback.
   */
  spread: number;
  onSpreadChange: (value: number) => void;
  /**
   * Current rotation uniform value and change callback.
   */
  rotation: number; // degrees
  onRotationChange: (value: number) => void;
  /** Whether the UI should render at all. */
  show?: boolean;
}

const ShaderControls: React.FC<ShaderControlsProps> = ({
  colors,
  visibleCount,
  onChange,
  speed,
  onSpeedChange,
  spread,
  onSpreadChange,
  rotation,
  onRotationChange,
  show = false,
}) => {
  if (!show || visibleCount === 0) return null;

  // Local state for the speed input so we only commit changes on blur
  const [tempSpeed, setTempSpeed] = React.useState<string>(speed.toString());
  const [tempSpread, setTempSpread] = React.useState<string>(spread.toString());
  const [tempRotation, setTempRotation] = React.useState<string>(rotation.toString());
  React.useEffect(() => {
    setTempSpeed(speed.toString());
    setTempSpread(spread.toString());
    setTempRotation(rotation.toString());
  }, [speed]);
  React.useEffect(() => {
    setTempSpread(spread.toString());
  }, [spread]);
  React.useEffect(() => {
    setTempRotation(rotation.toString());
  }, [rotation]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="fixed bottom-5 right-5 z-20" variant={"outline"}>
          Edit
        </Button>
      </PopoverTrigger>
      <PopoverContent className="bg-white">
        <div className="space-y-4">
          <h4 className="font-medium">Edit Gradient Colors</h4>
          {Array.from({ length: visibleCount }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <label htmlFor={`color${i + 1}`} className="pr-4">
                Color {i + 1}
              </label>
              <ColorPicker
                value={colors[i]}
                onChange={(v) => onChange(i, v)}
                className="w-16 h-8"
              />
            </div>
          ))}

          {/* Speed Control */}
          <div className="flex items-center justify-between pt-2 border-t">
            <label htmlFor="speed" className="pr-4">
              Speed
            </label>
            <input
              id="speed"
              type="number"
              step="0.1"
              value={tempSpeed}
              onChange={(e) => setTempSpeed(e.target.value)}
              onBlur={() => {
                const val = parseFloat(tempSpeed);
                if (!Number.isNaN(val)) {
                  onSpeedChange(val);
                }
              }}
              className="w-20 border rounded px-2 py-1"
            />
          </div>

          {/* Spread Control */}
          <div className="flex items-center justify-between pt-2">
            <label htmlFor="spread" className="pr-4">
              Spread
            </label>
            <input
              id="spread"
              type="number"
              step="0.1"
              value={tempSpread}
              onChange={(e) => setTempSpread(e.target.value)}
              onBlur={() => {
                const val = parseFloat(tempSpread);
                if (!Number.isNaN(val)) {
                  onSpreadChange(Math.max(0.01, val)); // keep positive
                }
              }}
              className="w-20 border rounded px-2 py-1"
            />
          </div>

          {/* Rotation Control */}
          <div className="flex items-center justify-between pt-2">
            <label htmlFor="rotation" className="pr-4">
              Rotation (°)
            </label>
            <input
              id="rotation"
              type="number"
              step="1"
              value={tempRotation}
              onChange={(e) => setTempRotation(e.target.value)}
              onBlur={() => {
                const val = parseFloat(tempRotation);
                if (!Number.isNaN(val)) {
                  onRotationChange(Math.round(val)); // ensure integer degrees
                }
              }}
              className="w-20 border rounded px-2 py-1"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ShaderControls; 