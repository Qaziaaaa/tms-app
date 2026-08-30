"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {dark ? "Light Mode" : "Dark Mode"}
    </button>
  );
}
