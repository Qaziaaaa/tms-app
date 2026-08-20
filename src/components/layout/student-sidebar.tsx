"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  user?: { name: string; email: string };
}

export function StudentSidebar({ isOpen, onClose, user }: StudentSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        data-open={isOpen ? "true" : "false"}
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 bg-card border-r border-border transition-transform duration-200 ease-in-out flex flex-col",
          "max-lg:-translate-x-full",
          "max-lg:data-[open=true]:translate-x-0",
          "lg:!translate-x-0"
        )}
        style={{ boxShadow: "4px 0 24px rgba(0,0,0,0.04)" }}
      >
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link href="/student/dashboard" className="flex items-center gap-2.5">
            <div className="rounded-lg bg-primary p-1.5">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className="border-t border-border p-3">
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
