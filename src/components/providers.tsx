"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Toaster as HotToaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <SonnerToaster />
      <HotToaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "hsl(var(--card))",
            color: "hsl(var(--card-foreground))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          },
          success: {
            iconTheme: {
              primary: "hsl(142, 76%, 36%)",
              secondary: "hsl(0, 0%, 100%)",
            },
          },
          error: {
            iconTheme: {
              primary: "hsl(0, 84%, 60%)",
              secondary: "hsl(0, 0%, 100%)",
            },
          },
        }}
      />
    </SessionProvider>
  );
}
