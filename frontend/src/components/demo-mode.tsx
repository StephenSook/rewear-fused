"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { lenisRef } from "@/lib/lenis";

/**
 * Deterministic demo mode (CLAUDE.md §7.14, a cannot-be-dropped demo-safety item).
 * Auto-walks the five views in pitch order, driving each scroll-narrative scene
 * with a controlled-duration Lenis scroll so the 3D animates at a known pace. No
 * real-time dependency: pure timers + the static/fallback data. It loops, so if
 * the presenter freezes it keeps running; it is also the source for the 4K OBS
 * fallback capture.
 *
 * Shift+D toggles · Esc exits · ?demo=1 auto-starts (deep-link for the recording).
 */
type Step = { path: string; label: string; scrollSeconds: number; holdMs: number };

const STEPS: Step[] = [
  { path: "/", label: "The two walls", scrollSeconds: 13, holdMs: 14500 },
  { path: "/passport", label: "Digital Recyclability Passport", scrollSeconds: 7, holdMs: 9500 },
  { path: "/fiber", label: "Cleavable elastane", scrollSeconds: 8, holdMs: 10500 },
  { path: "/enzyme", label: "De novo enzyme", scrollSeconds: 6, holdMs: 8500 },
  { path: "/loop", label: "The closed loop", scrollSeconds: 13, holdMs: 14500 },
];

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function DemoMode() {
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);

  // activation: Shift+D toggles, Esc exits, ?demo=1 auto-starts (deferred a frame
  // so it doesn't setState synchronously in the effect / mismatch hydration)
  useEffect(() => {
    let raf = 0;
    if (new URLSearchParams(window.location.search).get("demo") === "1") {
      raf = requestAnimationFrame(() => setActive(true));
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        setActive((a) => !a);
      } else if (e.key === "Escape") {
        setActive(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // the walk: a single cancellable async loop
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    (async () => {
      let i = 0;
      while (!cancelled) {
        setStep(i);
        const s = STEPS[i]!; // i is always 0..STEPS.length-1
        router.push(s.path);
        await sleep(850); // route mount + page-transition veil
        if (cancelled) break;
        const lenis = lenisRef.current;
        lenis?.scrollTo(0, { immediate: true });
        // wait for page height to stabilize (heavy 3D mounts/suspense settle) so
        // the scripted scroll reaches the true bottom, not a short under-computed one
        let prevH = -1;
        let stable = 0;
        for (let tries = 0; tries < 11 && !cancelled; tries++) {
          await sleep(120);
          const h = document.documentElement.scrollHeight;
          if (h === prevH) {
            if (++stable >= 2) break;
          } else {
            stable = 0;
            prevH = h;
          }
        }
        if (cancelled) break;
        const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        if (lenis) lenis.scrollTo(max, { duration: s.scrollSeconds });
        else window.scrollTo({ top: max, behavior: "smooth" });
        await sleep(s.holdMs);
        i = (i + 1) % STEPS.length;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, router]);

  // on exit, return to the top
  useEffect(() => {
    if (active) return;
    lenisRef.current?.scrollTo(0, { duration: 0.6 });
  }, [active]);

  const exit = useCallback(() => setActive(false), []);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-1/2 z-50 w-[min(92vw,30rem)] -translate-x-1/2"
        >
          <div className="relative border border-accent-bio/40 bg-bg-elevated/85 px-4 py-3 backdrop-blur-md">
            <span className="absolute -top-px -left-px h-1.5 w-1.5 bg-accent-bio" />
            <span className="absolute -bottom-px -right-px h-1.5 w-1.5 bg-accent-bio" />
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-accent-bio" />
                <span className="mono-label text-fg">
                  Demo mode · {step + 1}/{STEPS.length}
                </span>
              </div>
              <button
                onClick={exit}
                className="mono-label text-fg-muted transition-colors hover:text-fg"
              >
                Esc to exit
              </button>
            </div>
            <div className="mt-2 font-display text-lg leading-tight">{STEPS[step]!.label}</div>
            <div className="mt-2 h-0.5 w-full bg-fg/10">
              <motion.div
                key={step}
                className="h-full origin-left bg-accent-bio"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                // ~1.4s of route-mount + height-settle precedes the hold; track the
                // true step dwell so the bar doesn't finish early
                transition={{ duration: (1400 + STEPS[step]!.holdMs) / 1000, ease: "linear" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
