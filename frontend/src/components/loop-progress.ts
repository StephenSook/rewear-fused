/**
 * Shared mutable scroll progress for the closed-loop view. The DOM scroll
 * handler writes `value` (0..1); the R3F particle storm reads it in useFrame.
 * A plain ref avoids a React re-render on every scroll frame.
 */
export const loopProgress = { value: 0 };
