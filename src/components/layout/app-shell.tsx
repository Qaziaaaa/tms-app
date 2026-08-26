"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

interface AppShellProps {
  children: React.ReactNode;
  user: { name: string; email: string };
}

export function AppShell({ children, user }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
      <div className="lg:pl-[220px] transition-all duration-300">
        <Header user={user} onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-3 sm:p-4 md:p-5">{children}</main>
      </div>
    </div>
  );
}
