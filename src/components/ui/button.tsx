import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89453] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.99]",
  {
    variants: {
      variant: {
        default:
          "bg-[#173D2C] text-[#FAF7F0] border border-[#B89453]/40 hover:bg-[#102C21] hover:border-[#B89453] shadow-xs",
        gold:
          "bg-[#B89453] text-[#173D2C] border border-[#987B3E] hover:bg-[#A68341] shadow-xs font-bold",
        secondary:
          "bg-[#FAF7F0] text-[#173D2C] border border-[#E5DEC9] hover:bg-white hover:border-[#B89453]",
        outline:
          "border border-[#E5DEC9] bg-transparent text-[#242824] hover:bg-[#FAF7F0] hover:border-[#B89453]",
        ghost:
          "text-[#173D2C] hover:bg-[#FAF7F0] hover:text-[#987B3E]",
        destructive:
          "bg-[#7F202B] text-white hover:bg-[#681922] shadow-xs",
        link:
          "text-[#173D2C] underline-offset-4 hover:underline hover:text-[#987B3E] p-0 h-auto",
      },
      size: {
        default: "h-11 px-5 py-2.5 text-xs uppercase tracking-wider",
        sm: "h-9 px-3.5 text-[11px] uppercase tracking-wide",
        lg: "h-12 px-7 text-sm uppercase tracking-widest",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
