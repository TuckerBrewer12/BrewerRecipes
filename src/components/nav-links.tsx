"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Feed", match: (p: string) => p === "/" },
  { href: "/recipes", label: "Recipes", match: (p: string) => p.startsWith("/recipes") },
  { href: "/cook-log", label: "Cook log", match: (p: string) => p.startsWith("/cook-log") || p.startsWith("/members") },
];

export function NavLinks({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className={cn("flex gap-6", className)}>
      {LINKS.map((l) => {
        const active = l.match(pathname);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "py-2 text-sm font-medium transition-colors hover:text-foreground",
              active ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
