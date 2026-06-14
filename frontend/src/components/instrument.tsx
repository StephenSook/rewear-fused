"use client";

import { useRef, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";
import { usePointerTilt } from "@/lib/use-pointer-tilt";
import type { Decision } from "@/lib/types";

/**
 * Beveled instrument panel. The hubtown-derived chrome, now alive: on hover the
 * corner ticks extend into locking brackets, an accent spotlight tracks the
 * cursor, a reticle line sweeps the panel, the frame blooms, and (unless tilt is
 * off) the whole box leans in 3D toward the pointer with a magnetic drift. One
 * component, so every instrument box in the app inherits the behaviour; the
 * cursor-reactive CSS lives in globals.css under `.instrument-box`.
 *
 * `tilt={false}` keeps the chrome but drops the transform for boxes that own a
 * WebGL canvas or an interactive chart (a parent transform would wobble their
 * own pointer math). `press` adds a tactile scale-down for clickable boxes.
 * Collapses to a static accent frame under reduced-motion.
 */
export function BeveledBox({
  children,
  className,
  accent = "none",
  tilt = true,
  press = false,
  beam = false,
}: {
  children: ReactNode;
  className?: string;
  accent?: "bio" | "fiber" | "none";
  tilt?: boolean;
  press?: boolean;
  /** Hero-only: a perpetual accent beam runs the frame. Reserve for one box. */
  beam?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  usePointerTilt(ref, {
    enabled: !reduce && tilt,
    maxTilt: 6,
    magnetic: 0.05,
    press: press ? 0.015 : 0,
  });

  const accentClass =
    accent === "bio" ? "box-bio" : accent === "fiber" ? "box-fiber" : "box-none";

  return (
    <div
      ref={ref}
      className={cn(
        "instrument-box group/ib relative border border-rule bg-bg-elevated/60 backdrop-blur-sm [will-change:transform]",
        accentClass,
        className,
      )}
    >
      {beam && <span aria-hidden className="ib-beam" />}
      <span aria-hidden className="instrument-box-spot" />
      <span aria-hidden className="ib-scan" />
      <span aria-hidden className="ib-corner ib-tl" />
      <span aria-hidden className="ib-corner ib-tr" />
      <span aria-hidden className="ib-corner ib-bl" />
      <span aria-hidden className="ib-corner ib-br" />
      {children}
    </div>
  );
}

/** Monospace micro-label / section eyebrow. */
export function MonoLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn("mono-label", className)}>{children}</span>;
}

/** Persistent honesty badge for any predicted-property surface. */
export function InSilicoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "mono-label inline-flex items-center gap-1.5 border border-rule px-2 py-1 text-fg-muted",
        className,
      )}
      title="Every value is an in-silico design with benchmark-referenced metrics. Wet-lab validation required."
    >
      <span className="h-1.5 w-1.5 rounded-full bg-warn" />
      in-silico · TRL 2-3
    </span>
  );
}

const DECISION_META: Record<
  Decision,
  { label: string; text: string; border: string; dot: string }
> = {
  clear: { label: "CLEAR", text: "text-pass", border: "border-pass/40", dot: "bg-pass" },
  "lab-test": { label: "LAB-TEST", text: "text-warn", border: "border-warn/40", dot: "bg-warn" },
  divert: { label: "DIVERT", text: "text-fail", border: "border-fail/40", dot: "bg-fail" },
};

export function DecisionBadge({ decision }: { decision: Decision }) {
  const m = DECISION_META[decision];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 border px-3 py-1.5 font-mono text-xs tracking-widest uppercase",
        m.text,
        m.border,
      )}
    >
      <span className={cn("h-2 w-2", m.dot)} />
      {m.label}
    </span>
  );
}
