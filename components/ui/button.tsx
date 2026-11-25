import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// D16 candy: chunky 2px ink outline, sticker shadow that collapses on press, pill shape.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-border font-bold shadow-sticker transition-[transform,box-shadow,background-color] active:translate-y-[3px] active:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:-translate-y-0.5",
        secondary: "bg-secondary text-secondary-foreground hover:-translate-y-0.5",
        outline: "bg-background text-foreground hover:bg-muted",
        ghost: "border-transparent shadow-none hover:bg-muted active:translate-y-0",
        destructive: "bg-destructive text-destructive-foreground",
        link: "border-transparent shadow-none text-primary underline decoration-2 underline-offset-4 active:translate-y-0",
      },
      size: {
        default: "h-11 px-5 text-sm",
        sm: "h-9 px-4 text-xs",
        lg: "h-14 px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
