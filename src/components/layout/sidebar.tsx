"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  FileText,
  BarChart3,
  GraduationCap,
  Brain,
  Settings,
  User,
  LogOut,
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
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  user?: { name: string; email: string };
}

export function Sidebar({ isOpen, onClose, collapsed = false, onToggleCollapse, user }: SidebarProps) {
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
          "fixed left-0 top-0 z-50 h-full bg-card border-r border-border transition-all duration-300 ease-in-out flex flex-col",
          collapsed ? "w-[68px]" : "w-[220px]",
          "max-lg:-translate-x-full",
          "max-lg:data-[open=true]:translate-x-0",
          "lg:!translate-x-0"
        )}
        style={{ boxShadow: "4px 0 24px rgba(0,0,0,0.04)" }}
      >
        {/* Toggle Collapse Button on border edge */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="absolute -right-3 top-4 z-20 hidden lg:flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        )}

        <div className={cn("flex h-14 items-center border-b border-border", collapsed ? "justify-center px-2" : "px-4")}>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="rounded-lg bg-primary p-1.5 shrink-0">
              <GraduationCap className="h-4 w-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="text-base font-bold tracking-tight truncate">{APP_NAME}</span>
            )}
          </Link>
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
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg bg-muted/50 p-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  collapsed && "justify-center p-1.5"
                )}
              >
                <Avatar className="h-7 w-7 shrink-0">
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
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 p-1.5" align="end" side="right" sideOffset={12}>
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="px-2 py-1.5">
                    <div className="flex flex-col space-y-0.5">
                      <span className="truncate text-sm font-semibold text-card-foreground">{user.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer px-2 py-1.5 text-sm"
                  onClick={() => (window.location.href = "/profile")}
                >
                  <User className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer px-2 py-1.5 text-sm"
                  onClick={() => (window.location.href = "/settings")}
                >
                  <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <ThemeToggle />
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-2 cursor-pointer px-2 py-1.5 text-sm"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </aside>
    </>
  );
}
