/**
 * Shared mutable signals for the Story view. DOM handlers write these every
 * frame; the R3F scene reads them in useFrame. Plain refs (not React state) so
 * scroll and pointer motion never trigger a re-render. Mirrors loop-progress.ts.
 */

/** 0..1 scroll progress through the whole story (drives the scene morph). */
export const storyProgress = { value: 0 };

/** Normalized pointer, each axis -1..1, for the cursor-reactive camera parallax. */
export const storyPointer = { x: 0, y: 0 };
