"use client";

import { useEffect, useRef } from "react";
import { animate, useInView } from "motion/react";
import { EASE } from "@/lib/motion";


export const fmtInt = (v: number) => Math.round(v).toLocaleString();
export const fmtPct = (v: number) => `${Math.round(v)}%`;

/**
 * A number that tweens up to its value when it scrolls into view. The tween
 * writes textContent directly through the ref, so it never triggers a React
 * re-render per frame. Collapses to the final value instantly under
 * prefers-reduced-motion. Formatters are module-level (stable identity) so the
 * effect deps stay honest. Pass `replayKey` to re-run the count on demand (e.g.
 * when a selection changes while already in view).
 */
export function CountUp({
  to,
  delay = 0,
  duration = 0.9,
  format = fmtInt,
  className,
  replayKey,
  immediate = false,
}: {
  to: number;
  delay?: number;
  duration?: number;
  format?: (v: number) => string;
  className?: string;
  replayKey?: string | number;
  /** Animate on mount instead of waiting to scroll into view. Use for values
   *  that react to a click (already on screen), not scroll reveals. */
  immediate?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, margin: "-40px" });
  const active = immediate || seen;

  useEffect(() => {
    const node = ref.current;
    if (!active || !node) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      node.textContent = format(to);
      return;
    }
    const controls = animate(0, to, {
      duration,
      delay,
      ease: EASE,
      onUpdate: (v) => {
        node.textContent = format(v);
      },
    });
    return () => controls.stop();
  }, [active, to, delay, duration, format, replayKey]);

  return (
    <span ref={ref} className={className}>
      {format(0)}
    </span>
  );
}
