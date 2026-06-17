"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { audioEngine } from "@/lib/audio-engine";
import { Tilt3D } from "./tilt3d";

const CHAPTERS = [
  { href: "/", label: "Story" },
  { href: "/fiber", label: "Fiber", accent: "fiber" as const },
  { href: "/enzyme", label: "Enzyme", accent: "bio" as const },
  { href: "/loop", label: "Loop" },
  { href: "/passport", label: "Passport" },
  { href: "/judges", label: "Judges" },
];

export function NavRail() {
  const path = usePathname();
  return (
    <nav
      aria-label="Section navigation"
      className="fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-2 sm:flex"
    >
      {CHAPTERS.map((c) => {
        const active = c.href === "/" ? path === "/" : path.startsWith(c.href);
        const accent = c.accent ?? "bio";
        return (
          <Link
            key={c.href}
            href={c.href}
            onClick={() => audioEngine.tick()}
            aria-current={active ? "page" : undefined}
            className="block"
          >
            <Tilt3D accent={accent} maxTilt={11} magnetic={0.16} className="cursor-pointer">
              <div
                className={cn(
                  "relative flex items-center gap-3 border px-3 py-2 transition-colors duration-300",
                  active
                    ? "border-rule/70 bg-bg-elevated/50"
                    : "border-transparent group-hover/tilt:border-rule group-hover/tilt:bg-bg-elevated/50",
                )}
              >
                {/* corner ticks, instrument-chip motif, on hover or active */}
                <span
                  className={cn(
                    "pointer-events-none absolute -top-px -left-px h-1.5 w-1.5 transition-opacity duration-300",
                    accent === "fiber" ? "bg-accent-fiber" : "bg-accent-bio",
                    active ? "opacity-100" : "opacity-0 group-hover/tilt:opacity-100",
                  )}
                />
                <span
                  className={cn(
                    "pointer-events-none absolute -bottom-px -right-px h-1.5 w-1.5 transition-opacity duration-300",
                    accent === "fiber" ? "bg-accent-fiber" : "bg-accent-bio",
                    active ? "opacity-100" : "opacity-0 group-hover/tilt:opacity-100",
                  )}
                />
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 transition-colors duration-300",
                    active
                      ? accent === "fiber"
                        ? "bg-accent-fiber"
                        : "bg-accent-bio"
                      : "bg-fg-muted/40 group-hover/tilt:bg-fg",
                  )}
                />
                <span
                  className={cn(
                    "mono-label transition-colors duration-300",
                    active ? "text-fg" : "text-fg-muted/50 group-hover/tilt:text-fg",
                  )}
                >
                  {c.label}
                </span>
              </div>
            </Tilt3D>
          </Link>
        );
      })}
    </nav>
  );
}
