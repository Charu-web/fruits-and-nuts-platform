import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl bg-white border border-[#E5DEC9] shadow-xs max-w-lg mx-auto",
        className
      )}
    >
      {icon ? (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FAF7F0] border border-[#B89453]/30 text-[#173D2C]">
          {icon}
        </div>
      ) : null}
      <h3 className="font-serif text-lg sm:text-xl font-bold text-[#173D2C] mb-2">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[#5F6D65] leading-relaxed max-w-sm mb-6">
        {description}
      </p>
      {actionLabel && (actionHref || onAction) && (
        <div>
          {actionHref ? (
            <Link href={actionHref}>
              <Button variant="default">{actionLabel}</Button>
            </Link>
          ) : (
            <Button variant="default" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
