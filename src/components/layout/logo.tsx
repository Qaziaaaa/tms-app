import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

export function Logo({ className, collapsed = false }: { className?: string; collapsed?: boolean }) {
  return (
    <Link
      href="/dashboard"
      className={cn("flex items-center gap-2", className)}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
        <GraduationCap className="h-4 w-4" />
      </div>
      {!collapsed && (
        <span className="truncate text-base font-bold tracking-tight text-foreground">{APP_NAME}</span>
      )}
    </Link>
  );
}
