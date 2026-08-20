"use client";

import { useSession } from "next-auth/react";

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user,
    role: (session?.user as { role?: string })?.role,
    isTeacher: (session?.user as { role?: string })?.role === "teacher",
    isStudent: (session?.user as { role?: string })?.role === "student",
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
  };
}
