"use client";

import { usePathname } from "next/navigation";

/**
 * Route transition veil. A full-screen panel keyed by pathname, so it remounts
 * on every navigation and replays a fade-from-background: the new chapter
 * emerges from the dark, which also masks the brief moment a heavy 3D scene
 * mounts. It lives in the Shell and never wraps page content, so it cannot
 * create a containing block that would break the fixed 3D canvases. Pure CSS,
 * pointer-events-none, and neutralized under prefers-reduced-motion.
 */
export function PageTransition() {
  const path = usePathname();
  return (
    <div
      key={path}
      aria-hidden
      className="page-wipe pointer-events-none fixed inset-0 z-[60] bg-bg"
    />
  );
}
