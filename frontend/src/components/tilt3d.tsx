"use client";

import { useRef, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";
import { usePointerTilt } from "@/lib/use-pointer-tilt";

/**
 * Per-element 3D tilt + magnetic pull + glare on hover: the premium instrument
 * feel. The element rotates toward the cursor in perspective, drifts magnetically
 * after it, and a soft accent glare tracks the pointer; on leave it springs back
 * with an elastic ease. Shares the tilt math with the instrument boxes via
 * usePointerTilt. The hubtown reference drives its 3D in WebGL; for our DOM
 * instrument chrome this is the right, lightweight equivalent. Collapses to
 * nothing under reduced-motion.
 */
export function Tilt3D({
  children,
  className,
  maxTilt = 8,
  magnetic = 0.12,
  perspective = 900,
  glare = true,
  accent = "bio",
}: {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  magnetic?: number;
  perspective?: number;
  glare?: boolean;
  accent?: "bio" | "fiber";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  usePointerTilt(ref, { enabled: !reduce, maxTilt, magnetic, perspective });

  const glareColor =
    accent === "fiber" ? "oklch(0.74 0.17 45 / 0.22)" : "oklch(0.83 0.18 175 / 0.22)";

  return (
    <div ref={ref} className={cn("group/tilt relative [will-change:transform]", className)}>
      {children}
      {glare && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/tilt:opacity-100"
          style={{
            background: `radial-gradient(circle at var(--mx, 50%) var(--my, 50%), ${glareColor}, transparent 65%)`,
          }}
        />
      )}
    </div>
  );
}
