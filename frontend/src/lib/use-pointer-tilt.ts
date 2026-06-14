"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";

/**
 * Cursor-reactive 3D tilt + magnetic drift + optional press, eased with GSAP
 * quickTo (snappy, allocation-free). The node rotates toward the pointer in
 * perspective, drifts magnetically after it, and on leave springs back with an
 * elastic ease. Also publishes the pointer position as `--mx` / `--my` (0-100%)
 * so a CSS spotlight layer can follow the cursor without a second listener.
 *
 * Imperative on purpose: GSAP owns the node's `transform`, so the caller must
 * never drive `transform` via React state on the same node (it would clobber
 * GSAP's inline writes). Pass `enabled: false` for reduced-motion or for boxes
 * that own a WebGL canvas / interactive chart, where a parent transform would
 * fight the child's own pointer math.
 */
export function usePointerTilt(
  ref: RefObject<HTMLElement | null>,
  {
    enabled = true,
    maxTilt = 6,
    magnetic = 0.05,
    perspective = 900,
    press = 0,
  }: {
    enabled?: boolean;
    maxTilt?: number;
    magnetic?: number;
    perspective?: number;
    /** scale-down on pointerdown (e.g. 0.015 = press to 0.985); 0 disables. */
    press?: number;
  } = {},
) {
  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return;

    gsap.set(node, { transformPerspective: perspective, transformStyle: "preserve-3d" });
    const rX = gsap.quickTo(node, "rotationX", { duration: 0.4, ease: "power3.out" });
    const rY = gsap.quickTo(node, "rotationY", { duration: 0.4, ease: "power3.out" });
    const tX = gsap.quickTo(node, "x", { duration: 0.45, ease: "power3.out" });
    const tY = gsap.quickTo(node, "y", { duration: 0.45, ease: "power3.out" });

    const onMove = (e: PointerEvent) => {
      const r = node.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width; // 0..1
      const py = (e.clientY - r.top) / r.height; // 0..1
      rY((px - 0.5) * maxTilt * 2);
      rX((py - 0.5) * -maxTilt * 2);
      tX((px - 0.5) * r.width * magnetic);
      tY((py - 0.5) * r.height * magnetic);
      node.style.setProperty("--mx", `${px * 100}%`);
      node.style.setProperty("--my", `${py * 100}%`);
    };
    const onLeave = () => {
      gsap.to(node, {
        rotationX: 0,
        rotationY: 0,
        x: 0,
        y: 0,
        // only reset scale if this hook owns it (press > 0)
        ...(press ? { scale: 1 } : null),
        duration: 0.7,
        ease: "elastic.out(1, 0.3)",
      });
    };
    const onDown = press
      ? () => gsap.to(node, { scale: 1 - press, duration: 0.18, ease: "power2.out" })
      : null;
    const onUp = press
      ? () => gsap.to(node, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.4)" })
      : null;

    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerleave", onLeave);
    if (onDown) node.addEventListener("pointerdown", onDown);
    if (onUp) {
      node.addEventListener("pointerup", onUp);
      node.addEventListener("pointercancel", onUp);
    }
    return () => {
      // stop any in-flight spring so GSAP's ticker drops the unmounted node
      gsap.killTweensOf(node);
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
      if (onDown) node.removeEventListener("pointerdown", onDown);
      if (onUp) {
        node.removeEventListener("pointerup", onUp);
        node.removeEventListener("pointercancel", onUp);
      }
    };
  }, [ref, enabled, maxTilt, magnetic, perspective, press]);
}
