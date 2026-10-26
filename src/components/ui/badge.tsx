import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-[#B89453] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border border-[#B89453]/40 bg-[#173D2C] text-[#FAF7F0]",
        secondary:
          "border border-[#E5DEC9] bg-[#FAF7F0] text-[#173D2C]",
        gold:
          "border border-[#987B3E]/60 bg-[#B89453] text-[#173D2C]",
        sage:
          "border border-[#173D2C]/20 bg-[#DCE5D8] text-[#173D2C]",
        outline:
          "border border-[#B89453]/50 text-[#987B3E] bg-transparent",
        destructive:
          "border border-transparent bg-[#7F202B] text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
