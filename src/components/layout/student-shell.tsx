"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn, getInitials } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { STUDENT_NAV_ITEMS } from "@/components/layout/student-sidebar";
import { LogOut, Lock, ChevronRight, ChevronLeft, UserIcon } from "lucide-react";

interface StudentShellProps {
  children: React.ReactNode;
  user: { name: string; email: string };
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function StudentShell({ children, user }: StudentShellProps) {
  const pathname = usePathname();
  const current = STUDENT_NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const title = current?.label ?? "Dashboard";
  const name = user.name || "Student";
  const email = user.email || "";
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = () => {
    void signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="flex h-screen max-w-full flex-col overflow-hidden bg-background md:flex-row">
      <aside
        className={cn(
          "hidden shrink-0 md:block transition-all duration-300 ease-in-out relative border-r border-border bg-card",
          collapsed ? "w-[68px]" : "w-[200px]"
        )}
      >
        {/* Toggle Collapse Button on border edge */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-4 z-20 hidden md:flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>

        {/* Desktop sidebar */}
        <div className="h-screen flex flex-col">
          <SidebarDesktop name={name} email={email} collapsed={collapsed} onSignOut={handleSignOut} />
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-muted/30">
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 md:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <span className="whitespace-nowrap text-sm font-medium text-muted-foreground">Home</span>
            <ChevronRight size={14} className="text-muted-foreground" />
            <span className="truncate text-sm font-semibold text-card-foreground">{title}</span>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden text-xs font-medium text-muted-foreground sm:block">{todayLabel()}</span>
            <div className="md:hidden">
              <MobileMenu name={name} email={email} onSignOut={handleSignOut} />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 pb-24 sm:p-4 sm:pb-24 md:p-6 md:pb-6">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </div>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-border bg-card/95 backdrop-blur-sm shadow-[0_-2px_10px_rgba(0,0,0,0.06)] md:hidden">
          {STUDENT_NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 px-1 text-[10px] transition-colors min-h-[52px]",
                  active ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon size={17} strokeWidth={active ? 2.3 : 1.8} className="shrink-0" />
                <span className="truncate max-w-full text-[9.5px] sm:text-[10px] leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}

function SidebarDesktop({
  name,
  email,
  collapsed,
  onSignOut,
}: {
  name: string;
  email: string;
  collapsed: boolean;
  onSignOut: () => void;
}) {
  return (
    <div className="flex h-full w-full flex-col bg-card">
      <div className={cn("flex h-16 shrink-0 items-center border-b border-border", collapsed ? "justify-center px-2" : "px-5")}>
        <Logo collapsed={collapsed} />
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {!collapsed && (
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Portal</p>
        )}
        <DesktopNav collapsed={collapsed} />
      </nav>
      <div className="shrink-0 border-t border-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex w-full items-center gap-2 rounded-lg border border-border bg-card p-2 text-left transition-colors hover:border-primary/30",
              collapsed && "justify-center p-1.5"
            )}
          >
            <Avatar className="h-8 w-8 text-xs shrink-0">
              <AvatarFallback className="bg-muted text-primary font-semibold">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-card-foreground">{name}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{email}</span>
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 p-1.5" align="end" side="right" sideOffset={12}>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2 py-1.5">
                <div className="flex flex-col space-y-0.5">
                  <span className="truncate text-sm font-semibold text-card-foreground">{name}</span>
                  <span className="truncate text-xs text-muted-foreground">{email}</span>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              className="flex items-center gap-2 cursor-pointer px-2 py-1.5 text-sm"
              onClick={() => (window.location.href = "/student/profile")}
            >
              <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2 cursor-pointer px-2 py-1.5 text-sm"
              onClick={() => (window.location.href = "/student/password")}
            >
              <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Change Password</span>
            </DropdownMenuItem>
            <ThemeToggle />
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              variant="destructive"
              onClick={onSignOut}
              className="flex items-center gap-2 cursor-pointer px-2 py-1.5 text-sm"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function DesktopNav({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  return (
    <>
      {STUDENT_NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex min-h-10 items-center gap-2 rounded-lg px-2.5 text-sm transition-colors",
              collapsed && "justify-center px-0",
              active
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon size={18} strokeWidth={active ? 2.2 : 1.8} className="shrink-0" />
            {!collapsed && <span className="min-w-0 truncate">{item.label}</span>}
          </Link>
        );
      })}
    </>
  );
}

function MobileMenu({ name, email, onSignOut }: { name: string; email: string; onSignOut: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center justify-center rounded-full">
        <Avatar className="h-8 w-8 text-xs font-bold ring-2 ring-border/50">
          <AvatarFallback className="bg-muted text-primary font-bold">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 p-1.5" align="end" sideOffset={8}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1.5">
            <div className="flex flex-col space-y-0.5">
              <span className="truncate text-sm font-semibold text-card-foreground">{name}</span>
              {email && <span className="truncate text-xs text-muted-foreground">{email}</span>}
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem
          className="flex items-center gap-2 cursor-pointer px-2 py-1.5 text-sm"
          onClick={() => (window.location.href = "/student/profile")}
        >
          <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center gap-2 cursor-pointer px-2 py-1.5 text-sm"
          onClick={() => (window.location.href = "/student/password")}
        >
          <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>Change Password</span>
        </DropdownMenuItem>
        <ThemeToggle />
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem
          variant="destructive"
          onClick={onSignOut}
          className="flex items-center gap-2 cursor-pointer px-2 py-1.5 text-sm"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
