"use client";

import { useRef, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";
import { usePointerTilt } from "@/lib/use-pointer-tilt";

/**
 * Premium instrument CTA. On hover it pulls magnetically toward the cursor, an
 * accent spotlight tracks the pointer, a charge stripe sweeps across, the frame
 * brightens and blooms, and a trailing arrow slides. `primary` keeps the accent
 * lit at rest (the highlighted action). `download` renders a real `<a download>`
 * and `stream` adds a downloading data cascade for the .pdb button. The
 * cursor-reactive CSS lives in globals.css under `.instrument-btn`. Collapses to
 * a static accent frame under reduced-motion.
 */
export function InstrumentButton({
  href,
  children,
  accent = "bio",
  primary = false,
  download = false,
  arrow = false,
  stream = false,
  className,
}: {
  href: string;
  children: ReactNode;
  accent?: "bio" | "fiber" | "none";
  primary?: boolean;
  download?: boolean;
  arrow?: boolean;
  stream?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduce = useReducedMotion();
  usePointerTilt(ref, { enabled: !reduce, maxTilt: 3, magnetic: 0.18, press: 0.03 });

  const accentClass =
    accent === "bio" ? "btn-bio" : accent === "fiber" ? "btn-fiber" : "btn-none";

  const cls = cn(
    "instrument-btn relative inline-flex items-center gap-3 border px-5 py-2.5 font-mono text-xs uppercase tracking-widest [will-change:transform]",
    accentClass,
    primary && "btn-primary",
    className,
  );

  const inner = (
    <>
      <span aria-hidden className="ibtn-spot" />
      <span aria-hidden className="ibtn-sweep" />
      {stream && <span aria-hidden className="ibtn-stream" />}
      <span className="relative z-[1] inline-flex items-center gap-3">
        {children}
        {arrow && <ArrowRight className="ibtn-arrow h-4 w-4" />}
      </span>
    </>
  );

  if (download) {
    return (
      <a ref={ref} href={href} download className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <Link ref={ref} href={href} className={cls}>
      {inner}
    </Link>
  );
}
