"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  FileText,
  BarChart3,
  GraduationCap,
  Brain,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Classes", href: "/classes", icon: Users },
  { label: "Students", href: "/students", icon: GraduationCap },
  { label: "Attendance", href: "/attendance", icon: ClipboardCheck },
  { label: "Assignments", href: "/assignments", icon: FileText },
  { label: "AI Insights", href: "/insights", icon: Brain },
  { label: "Reports", href: "/reports", icon: BarChart3 },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user?: { name: string; email: string };
}

export function Sidebar({ isOpen, onClose, user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

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
          "fixed left-0 top-0 z-50 h-full bg-card border-r border-border transition-all duration-300 ease-in-out flex flex-col",
          collapsed ? "w-[68px]" : "w-[220px]",
          "max-lg:-translate-x-full",
          "max-lg:data-[open=true]:translate-x-0",
          "lg:!translate-x-0"
        )}
        style={{ boxShadow: "4px 0 24px rgba(0,0,0,0.04)" }}
      >
        <div className={cn("flex h-14 items-center border-b border-border", collapsed ? "justify-center px-2" : "px-4")}>
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="rounded-lg bg-primary p-1.5">
                <GraduationCap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-base font-bold tracking-tight">{APP_NAME}</span>
            </Link>
          )}
          {collapsed && (
            <Link href="/dashboard" className="rounded-lg bg-primary p-1.5">
              <GraduationCap className="h-4 w-4 text-primary-foreground" />
            </Link>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              "rounded-full p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              collapsed ? "ml-auto absolute top-4 right-2" : "ml-auto"
            )}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 p-2">
          {!collapsed && (
            <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Menu
            </p>
          )}
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150",
                  collapsed && "justify-center",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className="border-t border-border p-2">
            <div className={cn("flex items-center gap-2 rounded-lg bg-muted/50 px-2.5 py-2", collapsed && "justify-center")}>
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
