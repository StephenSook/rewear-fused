"use client";

import { useEffect, useState } from "react";

/**
 * First-load wordmark loader: REWEAR-FUSED reveals left-to-right by a clip wipe
 * tied to a progress counter, then the whole panel fades out. Mounts once with
 * the layout, so it does not replay on client-side route changes.
 */
export function Loader() {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const DUR = 1300;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / DUR);
      setProgress(Math.round(p * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setTimeout(() => setDone(true), 350);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      aria-hidden={done}
      className={`fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-bg transition-opacity duration-500 ${
        done ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="relative">
        <span className="font-display text-4xl text-fg-muted/15 sm:text-6xl">
          REWEAR-FUSED
        </span>
        <span
          className="absolute inset-0 font-display text-4xl text-fg sm:text-6xl"
          style={{ clipPath: `inset(0 ${100 - progress}% 0 0)` }}
        >
          REWEAR-FUSED
        </span>
      </div>
      <div className="mono-label mt-6">{progress}% · initializing instrument</div>
    </div>
  );
}
