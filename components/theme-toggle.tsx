"use client";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-9 w-9"
      onClick={() => setTheme(nextTheme)}
      aria-label={`Switch to ${nextTheme} mode`}
    >
      <span
        className={cn(
          "transition-opacity duration-200",
          resolvedTheme === "dark" ? "opacity-0" : "opacity-100"
        )}
        aria-hidden={resolvedTheme === "dark"}
      >
        ☀️
      </span>
      <span
        className={cn(
          "absolute inset-0 grid place-items-center transition-opacity duration-200",
          resolvedTheme === "dark" ? "opacity-100" : "opacity-0"
        )}
        aria-hidden={resolvedTheme !== "dark"}
      >
        🌙
      </span>
      <span className="sr-only">
        Toggle to {nextTheme === "dark" ? "dark" : "light"} mode
      </span>
    </Button>
  );
}
