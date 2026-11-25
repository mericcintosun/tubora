import * as React from "react";
import { cn } from "@/lib/utils";

// Range control in the candy treatment: ink track, tomato sticker thumb.
function Slider({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  return (
    <input
      type="range"
      className={cn(
        "h-4 w-full cursor-pointer appearance-none rounded-full border-2 border-border bg-muted accent-primary",
        "[&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-border [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sticker",
        "[&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-border [&::-moz-range-thumb]:bg-primary",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
        className
      )}
      {...props}
    />
  );
}

export { Slider };
