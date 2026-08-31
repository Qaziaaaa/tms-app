"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardCheck,
  FileText,
  Brain,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  user: { name: string; email: string };
}

const TEACHER_MOBILE_NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Classes", href: "/classes", icon: Users },
  { label: "Students", href: "/students", icon: GraduationCap },
  { label: "Attendance", href: "/attendance", icon: ClipboardCheck },
  { label: "Assignments", href: "/assignments", icon: FileText },
  { label: "AI Insights", href: "/insights", icon: Brain },
  { label: "Reports", href: "/reports", icon: BarChart3 },
];

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollIndicators = useCallback(() => {
    if (navRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navRef.current;
      const maxScroll = scrollWidth - clientWidth;

      if (maxScroll <= 5) {
        setCanScrollLeft(false);
        setCanScrollRight(false);
        return;
      }

      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < maxScroll - 10);
    }
  }, []);

  // Update indicators on scroll and window resize
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;

    updateScrollIndicators();
    el.addEventListener("scroll", updateScrollIndicators, { passive: true });
    window.addEventListener("resize", updateScrollIndicators, { passive: true });

    return () => {
      el.removeEventListener("scroll", updateScrollIndicators);
      window.removeEventListener("resize", updateScrollIndicators);
    };
  }, [updateScrollIndicators]);

  // Smoothly position the active tab when route changes
  useEffect(() => {
    if (navRef.current) {
      if (pathname === "/dashboard") {
        navRef.current.scrollTo({ left: 0, behavior: "smooth" });
      } else if (pathname === "/reports") {
        navRef.current.scrollTo({ left: navRef.current.scrollWidth, behavior: "smooth" });
      } else {
        const activeEl = navRef.current.querySelector("[data-active='true']");
        if (activeEl) {
          activeEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
      }
      setTimeout(updateScrollIndicators, 350);
    }
  }, [pathname, updateScrollIndicators]);

  const handleScrollLeft = () => {
    if (navRef.current) {
      navRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (navRef.current) {
      navRef.current.scrollTo({ left: 9999, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        user={user}
      />
      <div className={cn("transition-all duration-300 ease-in-out", collapsed ? "lg:pl-[68px]" : "lg:pl-[220px]")}>
        <Header user={user} />
        <main className="p-3 sm:p-4 md:p-5 pb-24 lg:pb-6">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>

      {/* Mobile bottom bar container */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center border-t border-border bg-card/95 backdrop-blur-md px-1.5 py-1.5 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] lg:hidden gap-1">
        {/* Left scroll arrow button - persistent footprint to prevent layout shift */}
        <button
          onClick={handleScrollLeft}
          disabled={!canScrollLeft}
          aria-label="Scroll navigation left"
          className={cn(
            "flex h-10 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/80 text-primary hover:bg-muted active:scale-90 transition-all border border-border/50 shadow-xs",
            !canScrollLeft && "opacity-0 pointer-events-none"
          )}
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>

        {/* Horizontally scrollable mobile bottom navigation */}
        <nav
          ref={navRef}
          aria-label="Teacher Mobile Navigation"
          className="flex-1 flex items-center overflow-x-auto no-scrollbar gap-1 py-0.5"
        >
          {TEACHER_MOBILE_NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                data-active={active ? "true" : "false"}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-lg text-[10px] transition-all min-w-[70px] sm:min-w-[76px] shrink-0 active:scale-95",
                  active
                    ? "font-semibold text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon size={18} strokeWidth={active ? 2.3 : 1.8} className="shrink-0" />
                <span className="truncate max-w-full text-[10px] leading-tight font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right scroll arrow button - persistent footprint to prevent layout shift */}
        <button
          onClick={handleScrollRight}
          disabled={!canScrollRight}
          aria-label="Scroll navigation right"
          className={cn(
            "flex h-10 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/80 text-primary hover:bg-muted active:scale-90 transition-all border border-border/50 shadow-xs",
            !canScrollRight && "opacity-0 pointer-events-none"
          )}
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
