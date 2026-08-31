"use client";

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
import { LogOut, Lock, ChevronRight, UserIcon } from "lucide-react";

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

  const handleSignOut = () => {
    void signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="flex h-screen max-w-full flex-col overflow-hidden bg-background md:flex-row">
      <aside className="hidden shrink-0 md:block">
        {/* Desktop sidebar */}
        <div className="h-screen">
          <SidebarDesktop name={name} email={email} onSignOut={handleSignOut} />
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-muted/30">
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 md:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <span className="whitespace-nowrap text-sm font-medium text-muted-foreground">Home</span>
            <ChevronRight size={14} className="text-muted-foreground" />
            <span className="truncate text-sm font-semibold text-card-foreground">{title}</span>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-xs font-medium text-muted-foreground md:block">{todayLabel()}</span>
            <div className="md:hidden">
              <MobileMenu name={name} email={email} onSignOut={handleSignOut} />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 pb-20 sm:p-4 sm:pb-20 md:p-6 md:pb-6">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </div>

        {/* Mobile bottom nav */}
        <nav className="grid shrink-0 grid-cols-5 border-t border-border bg-card shadow-[0_-2px_10px_rgba(0,0,0,0.08)] md:hidden">
          {STUDENT_NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors",
                  active ? "font-semibold text-primary" : "text-muted-foreground"
                )}
              >
                <Icon size={18} />
                {item.label}
              </a>
            );
          })}
        </nav>
      </main>
    </div>
  );
}

function SidebarDesktop({ name, email, onSignOut }: { name: string; email: string; onSignOut: () => void }) {
  return (
    <div className="flex h-full w-[200px] flex-col border-r border-border bg-card">
      <div className="flex h-16 shrink-0 items-center border-b border-border px-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Portal</p>
        <DesktopNav />
      </nav>
      <div className="shrink-0 border-t border-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-lg border border-border bg-card p-2.5 text-left transition-colors hover:border-primary/30">
            <Avatar className="h-9 w-9 text-sm">
              <AvatarFallback className="bg-muted text-primary font-semibold">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-card-foreground">{name}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{email}</span>
            </span>
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

function DesktopNav() {
  const pathname = usePathname();
  return (
    <>
      {STUDENT_NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm transition-colors",
              active
                ? "bg-primary/10 font-semibold text-primary"
                : "font-medium text-muted-foreground hover:bg-muted hover:text-card-foreground"
            )}
          >
            <Icon size={20} strokeWidth={1.8} className="shrink-0" />
            <span className="min-w-0 truncate">{item.label}</span>
          </a>
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
