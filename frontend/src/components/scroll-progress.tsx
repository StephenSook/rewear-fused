"use client";

import { useEffect, useRef } from "react";

/**
 * Faded bottom progress bar that fills as the page scrolls, hubtown's footer
 * indicator. Global (mounted in the Shell). Driven off the (Lenis-smoothed) native
 * scroll event, not a free-running rAF, so it does no idle main-thread work and no
 * per-frame layout read; it writes the fill via a ref transform, never re-rendering.
 */
export function ScrollProgress() {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      const el = fillRef.current;
      if (el) el.style.transform = `scaleX(${p})`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 z-40 h-0.5 w-full bg-fg/10">
      <div
        ref={fillRef}
        className="h-full w-full origin-left bg-accent-bio"
        style={{
          transform: "scaleX(0)",
          boxShadow:
            "0 0 10px color-mix(in oklch, var(--color-accent-bio) 70%, transparent)",
        }}
      />
    </div>
  );
}
