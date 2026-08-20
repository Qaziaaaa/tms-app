"use client";

import { useState } from "react";
import { StudentSidebar } from "@/components/layout/student-sidebar";
import { Header } from "@/components/layout/header";

interface StudentShellProps {
  children: React.ReactNode;
  user: { name: string; email: string };
}

export function StudentShell({ children, user }: StudentShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <StudentSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <Header user={user} onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
