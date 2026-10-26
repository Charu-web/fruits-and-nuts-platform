import * as React from "react";
import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[#FAF7F0] border border-[#E5DEC9]/40",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
