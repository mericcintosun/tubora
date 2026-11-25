import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// D16 candy: a slightly rotated sticker label with an ink outline.
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border-2 border-border px-2.5 py-0.5 text-xs font-bold shadow-[0_2px_0_var(--border)]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground -rotate-2",
        secondary: "bg-secondary text-secondary-foreground rotate-1",
        outline: "bg-background text-foreground",
        destructive: "bg-destructive text-destructive-foreground -rotate-1",
        ok: "bg-ok text-primary-foreground rotate-1",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
