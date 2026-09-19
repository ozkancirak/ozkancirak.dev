"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Container } from "@/components/container";
import { siteDomain } from "@/lib/content";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/projects", label: "Projects" },
  { href: "/writing", label: "Writing" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-transparent bg-background/70 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between">
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/"
            className={cn(
              "font-semibold tracking-tight transition-colors hover:text-foreground",
              pathname === "/" ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {siteDomain}
          </Link>
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-foreground",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <ThemeToggle />
      </Container>
    </header>
  );
}
