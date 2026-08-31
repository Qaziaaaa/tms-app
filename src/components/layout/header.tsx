"use client";

import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
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
import { Menu, LogOut, ChevronRight, Settings, User } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/classes": "Classes",
  "/students": "Students",
  "/attendance": "Attendance",
  "/assignments": "Assignments",
  "/insights": "AI Insights",
  "/reports": "Reports",
  "/settings": "Settings",
  "/profile": "Profile",
};

interface HeaderProps {
  user: { name: string; email: string };
  onMenuClick?: () => void;
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const matchedKey = Object.keys(ROUTE_TITLES).find(
    (key) => pathname === key || pathname.startsWith(`${key}/`)
  );
  const title = matchedKey ? ROUTE_TITLES[matchedKey] : "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between gap-3 border-b border-border bg-card/80 backdrop-blur-sm px-4 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="whitespace-nowrap text-xs sm:text-sm font-medium text-muted-foreground">Home</span>
          <ChevronRight size={14} className="text-muted-foreground shrink-0" />
          <span className="truncate text-xs sm:text-sm font-semibold text-card-foreground">{title}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <span className="hidden text-xs font-medium text-muted-foreground sm:inline-block">{todayLabel()}</span>
        <div className="lg:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center rounded-full transition-transform active:scale-95">
              <Avatar className="h-8 w-8 text-xs ring-2 ring-border/50">
                <AvatarFallback className="bg-muted text-primary font-bold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-56 p-1.5">
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
      </div>
    </header>
  );
}
