"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <SonnerToaster />
    </SessionProvider>
  );
}
