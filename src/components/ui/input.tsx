import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border border-[#E5DEC9] bg-white px-3.5 py-2 text-xs text-[#242824] placeholder:text-[#5F6D65]/60 transition-colors focus-visible:outline-none focus-visible:border-[#173D2C] focus-visible:ring-1 focus-visible:ring-[#173D2C] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
