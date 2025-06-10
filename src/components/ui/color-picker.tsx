'use client';

import { forwardRef, useMemo, useState } from 'react';
import { RgbColorPicker } from 'react-colorful';
import { cn } from '@/lib/utils';
import { useForwardedRef } from '@/lib/use-forwarded-ref';
import type { ButtonProps } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

// Helper functions to convert between hex and rgb
const hexToRgb = (hex: string) => {
  // Remove # if present
  hex = hex.replace('#', '');

  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  // Handle 6-digit hex (with or without alpha)
  if (hex.length >= 6) {
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return { r, g, b };
    }
  }

  // Default fallback
  return { r: 255, g: 255, b: 255 };
};

const rgbToHex = (rgb: { r: number; g: number; b: number }) => {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
};

const ColorPicker = forwardRef<
  HTMLInputElement,
  Omit<ButtonProps, 'value' | 'onChange' | 'onBlur'> & ColorPickerProps
>(
  (
    { disabled, value, onChange, onBlur, name, className, ...props },
    forwardedRef
  ) => {
    const ref = useForwardedRef(forwardedRef);
    const [open, setOpen] = useState(false);

    const parsedValue = useMemo(() => {
      return value || '#FFFFFF';
    }, [value]);

    const rgbValue = useMemo(() => {
      return hexToRgb(parsedValue);
    }, [parsedValue]);

    const handleColorChange = (newRgb: { r: number; g: number; b: number }) => {
      const hexValue = rgbToHex(newRgb);
      onChange(hexValue);
    };

    const handleInputChange = (inputValue: string) => {
      // Allow user to input hex values
      if (inputValue.match(/^#[0-9A-Fa-f]{0,6}$/)) {
        onChange(inputValue);
      }
    };

    return (
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild disabled={disabled} onBlur={onBlur}>
          <Button
            {...props}
            className={cn('block', className)}
            name={name}
            onClick={() => {
              setOpen(true);
            }}
            size='icon'
            style={{
              background: `rgb(${rgbValue.r}, ${rgbValue.g}, ${rgbValue.b})`,
            }}
            variant='outline'
          >
            <div />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-full bg-white'>
          {/* @ts-ignore */}
          <RgbColorPicker color={rgbValue} onChange={handleColorChange} />
          <Input
            maxLength={7}
            onChange={(e) => {
              handleInputChange(e?.currentTarget?.value);
            }}
            ref={ref}
            value={parsedValue}
            placeholder='#RRGGBB'
          />
        </PopoverContent>
      </Popover>
    );
  }
);
ColorPicker.displayName = 'ColorPicker';

export { ColorPicker };