import type Lenis from "lenis";

/**
 * Module-level handle to the live Lenis instance (set by SmoothScroll). Lets demo
 * mode drive a controlled-duration scroll (lenis.scrollTo(target, { duration }))
 * so the scroll-narrative views animate at a known, deterministic pace.
 */
export const lenisRef: { current: Lenis | null } = { current: null };
