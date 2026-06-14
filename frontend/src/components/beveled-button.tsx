"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Corner-dot glyph that reconfigures on hover. A direct port of hubtown's
 * `data-icon-animate` mark: a 2x3 grid of small squares where the resting state
 * shows one diagonal and the hover state lights the rest and nudges them out.
 */
function IconAnimate({ accent }: { accent: "bio" | "fiber" }) {
  const dot = accent === "bio" ? "bg-accent-bio" : "bg-accent-fiber";
  return (
    <span className="relative block h-3 w-2.5">
      {/* resting diagonal */}
      <span className={cn("absolute left-0 top-0 h-1 w-1 transition-all duration-300", dot)} />
      <span
        className={cn(
          "absolute right-0 top-1/2 h-1 w-1 -translate-y-1/2 transition-all duration-300",
          dot,
        )}
      />
      <span className={cn("absolute bottom-0 left-0 h-1 w-1 transition-all duration-300", dot)} />
      {/* revealed on hover */}
      <span
        className={cn(
          "absolute right-0 top-0 h-1 w-1 opacity-0 transition-all duration-300 group-hover:-translate-x-0.5 group-hover:opacity-100",
          dot,
        )}
      />
      <span
        className={cn(
          "absolute left-0 top-1/2 h-1 w-1 -translate-y-1/2 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100",
          dot,
        )}
      />
      <span
        className={cn(
          "absolute bottom-0 right-0 h-1 w-1 opacity-0 transition-all duration-300 group-hover:opacity-100",
          dot,
        )}
      />
    </span>
  );
}

/**
 * Beveled instrument CTA with corner ticks and the animated corner-dot glyph.
 * On hover the panel fills faintly and the glyph reconfigures, the hubtown
 * button feel, re-themed to the two-accent system.
 */
export function BeveledButton({
  href,
  children,
  accent = "bio",
  className,
}: {
  href: string;
  children: ReactNode;
  accent?: "bio" | "fiber";
  className?: string;
}) {
  const ring = accent === "bio" ? "bio" : "fiber";
  const tick = accent === "bio" ? "bg-accent-bio" : "bg-accent-fiber";
  const text = accent === "bio" ? "text-accent-bio" : "text-accent-fiber";
  const fill = accent === "bio" ? "group-hover:bg-accent-bio/10" : "group-hover:bg-accent-fiber/10";
  return (
    <Link
      href={href}
      className={cn(
        "group relative inline-flex items-center gap-3 border px-6 py-3 font-mono text-xs uppercase tracking-widest transition-colors",
        ring === "bio" ? "border-accent-bio/40" : "border-accent-fiber/40",
        text,
        fill,
        className,
      )}
    >
      <span className={cn("absolute -top-px -left-px h-1.5 w-1.5", tick)} />
      <span className={cn("absolute -bottom-px -right-px h-1.5 w-1.5", tick)} />
      <IconAnimate accent={accent} />
      {children}
    </Link>
  );
}
