"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import {
  LayoutDashboard,
  ClipboardCheck,
  FileText,
  BarChart3,
  GraduationCap,
  Lock,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Attendance", href: "/student/attendance", icon: ClipboardCheck },
  { label: "Assignments", href: "/student/assignments", icon: FileText },
  { label: "Grades", href: "/student/grades", icon: BarChart3 },
  { label: "Change Password", href: "/student/password", icon: Lock },
];

interface StudentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StudentSidebar({ isOpen, onClose }: StudentSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        data-open={isOpen ? "true" : "false"}
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 bg-card border-r border-border transition-transform duration-200 ease-in-out",
          "max-lg:-translate-x-full",
          "max-lg:data-[open=true]:translate-x-0",
          "lg:!translate-x-0"
        )}
      >
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link href="/student/dashboard" className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">{APP_NAME}</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
