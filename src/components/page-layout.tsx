"use client";

import { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  detail?: string;
  loading?: boolean;
}

export function StatCard({ title, value, icon, detail, loading }: StatCardProps) {
  if (loading) {
    return <Skeleton className="h-28" />;
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="rounded-lg bg-primary/10 p-3">
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium">{title}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        {action && <div className="mt-4">{action}</div>}
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
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

interface ContentCardProps {
  title: string;
  children: ReactNode;
  headerAction?: ReactNode;
}

export function ContentCard({ title, children, headerAction }: ContentCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{title}</CardTitle>
        {headerAction}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
