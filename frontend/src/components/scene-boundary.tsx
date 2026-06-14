"use client";

import { Component, type ReactNode } from "react";

/**
 * Per-scene error boundary for the heavy 3D mounts (Mol*, R3F, the particle
 * storm). If a WebGL scene throws (a lost context, a driver quirk on the demo
 * laptop), only that scene degrades to a quiet label; the surrounding claims,
 * metrics, and data stay on screen. Demo-safety: a 3D crash never blanks a view.
 */
export class SceneBoundary extends Component<
  { children: ReactNode; label?: string; fallback?: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err: unknown) {
    // visible in dev/rehearsal; production keeps the quiet fallback UX
    if (process.env.NODE_ENV !== "production") {
      console.error("[SceneBoundary]", this.props.label ?? "scene", err);
    }
  }

  render() {
    if (this.state.hasError) {
      // `fallback` may be null for a fixed-background scene: it just goes dark and
      // the foreground content survives. Otherwise show a quiet label in the box.
      if (this.props.fallback !== undefined) return this.props.fallback;
      return (
        <div className="grid h-full min-h-[120px] place-items-center px-4 text-center">
          <span className="mono-label text-fg-muted">
            {this.props.label ?? "3D scene unavailable on this device"}
          </span>
        </div>
      );
    }
    return this.props.children;
  }
}
