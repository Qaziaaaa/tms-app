"use client";

import { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  detail?: string;
  loading?: boolean;
  className?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  iconBg?: string;
}

export function StatCard({ title, value, icon, detail, loading, className, trend, trendValue, iconBg }: StatCardProps) {
  if (loading) {
    return <Skeleton className="h-28 w-full" />;
  }

  return (
    <Card className={cn("card-shadow card-hover group", className)}>
      <CardContent className="flex items-start gap-4 p-5">
        <div className={cn("rounded-xl p-3 transition-transform duration-200 group-hover:scale-110", iconBg || "bg-primary/10")}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-0.5">{value}</p>
          <div className="flex items-center gap-1.5 mt-1">
            {detail && <p className="text-xs text-muted-foreground truncate">{detail}</p>}
            {trend && trendValue && (
              <span className={cn(
                "text-xs font-medium",
                trend === "up" && "text-green-600",
                trend === "down" && "text-red-600",
                trend === "neutral" && "text-muted-foreground"
              )}>
                {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <Card className="card-shadow">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        {icon && <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">{icon}</div>}
        <p className="text-lg font-medium">{title}</p>
        {description && <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">{description}</p>}
        {action && <div className="mt-5">{action}</div>}
      </CardContent>
    </Card>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

interface ContentCardProps {
  title: string;
  children: ReactNode;
  headerAction?: ReactNode;
  description?: string;
}

export function ContentCard({ title, children, headerAction, description }: ContentCardProps) {
  return (
    <Card className="card-shadow">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {headerAction}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
