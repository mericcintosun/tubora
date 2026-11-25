import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-full border-2 border-input bg-background px-4 py-1 text-sm font-semibold shadow-[inset_0_2px_0_var(--deep)] transition-colors placeholder:font-normal placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 file:mr-3 file:rounded-full file:border-2 file:border-border file:bg-secondary file:px-3 file:font-bold",
        className
      )}
      {...props}
    />
  );
}

export { Input };
