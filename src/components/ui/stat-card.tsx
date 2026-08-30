"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  subtitleColor?: string;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
}

export function StatCard({
  label,
  value,
  subtitle,
  subtitleColor,
  icon: Icon,
  iconBg,
  iconColor,
}: StatCardProps) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-2xl font-medium tabular-nums text-card-foreground">
          {value}
        </p>
        {subtitle && (
          <p
            className="mt-0.5 text-xs font-medium"
            style={{ color: subtitleColor }}
          >
            {subtitle}
          </p>
        )}
      </div>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-muted p-2.5",
          iconBg
        )}
      >
        <Icon
          size={20}
          strokeWidth={1.75}
          className={iconColor || "text-primary"}
        />
      </div>
    </div>
  );
}
