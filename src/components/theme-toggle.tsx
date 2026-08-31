"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  return (
    <DropdownMenuItem
      className={`cursor-pointer px-2 py-1.5 text-sm ${className || ""}`}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? (
        <Sun className="mr-2 h-4 w-4 text-muted-foreground" />
      ) : (
        <Moon className="mr-2 h-4 w-4 text-muted-foreground" />
      )}
      <span>{dark ? "Light Mode" : "Dark Mode"}</span>
    </DropdownMenuItem>
  );
}
