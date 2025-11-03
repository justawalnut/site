"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/trades", label: "Trades" },
  { href: "/pnl", label: "PnL" },
  { href: "/projects", label: "Projects" },
  { href: "/notes", label: "Notes" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center gap-4 px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight">Trading Dash</span>
        </Link>
        <div className="flex items-center gap-2 rounded-full border bg-background/60 px-2 py-1">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant={pathname === item.href ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "rounded-full px-3 text-xs font-medium",
                pathname === item.href
                  ? "text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              asChild
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
