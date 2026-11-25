import * as React from "react";
import { cn } from "@/lib/utils";

// Range control in the candy treatment: ink-outlined 16px track, 28px tomato sticker thumb.
// The input itself is 44px tall (h-11) and transparent so the whole band is a touch target;
// the visible track and thumb are drawn with the vendor pseudo-elements.
function Slider({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  return (
    <input
      type="range"
      className={cn(
        "h-11 w-full cursor-pointer appearance-none bg-transparent accent-primary",
        "[&::-webkit-slider-runnable-track]:h-4 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:border-2 [&::-webkit-slider-runnable-track]:border-border [&::-webkit-slider-runnable-track]:bg-muted",
        "[&::-webkit-slider-thumb]:-mt-1.5[&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-border [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sticker",
        "[&::-moz-range-track]:h-4 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:border-2 [&::-moz-range-track]:border-border [&::-moz-range-track]:bg-muted",
        "[&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-border [&::-moz-range-thumb]:bg-primary",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
        className
      )}
      {...props}
    />
  );
}

export { Slider };
