import * as React from "react";
import { cn } from "@/lib/utils";
import { Breadcrumbs, BreadcrumbItem } from "./breadcrumb";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  eyebrow?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  description,
  breadcrumbs,
  eyebrow,
  action,
  className,
}: PageHeaderProps) {
  const displaySubtitle = description || subtitle;

  return (
    <div
      className={cn(
        "border-b border-[#E5DEC9] bg-[#FAF7F0] py-8 sm:py-12",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-4">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            {eyebrow && (
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#B89453] block">
                {eyebrow}
              </span>
            )}
            <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#173D2C]">
              {title}
            </h1>
            {displaySubtitle && (
              <p className="text-xs sm:text-sm text-[#5F6D65] leading-relaxed pt-1">
                {displaySubtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </div>
    </div>
  );
}
