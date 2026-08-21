"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "./input";

interface SearchBarProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  delay?: number;
}

export function SearchBar({
  value = "",
  onChange,
  placeholder = "Search...",
  className = "",
  delay = 300,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) onChange(localValue);
    }, delay);
    return () => clearTimeout(timer);
  }, [localValue, delay, onChange, value]);

  return (
    <div className={`relative w-full min-w-0 sm:max-w-xs ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="h-10 rounded-lg bg-card pl-9 pr-3 text-sm"
      />
    </div>
  );
}
