import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/student/dashboard"
      className={cn("flex items-center gap-2", className)}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-clr-blue text-white">
        <GraduationCap className="h-5 w-5" />
      </span>
      <span className="truncate text-base font-bold tracking-tight text-foreground">{APP_NAME}</span>
    </Link>
  );
}
