"use client";

/**
 * Route-level error boundary. If any view throws at runtime, the demo shows this
 * on-brand fault panel with a one-click reload instead of a white screen, the
 * whole point of demo-safety. (Per-3D-scene crashes degrade even more gracefully
 * via SceneBoundary; this catches anything that escapes.)
 */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-[70vh] flex-1 place-items-center px-6 text-center">
      <div className="max-w-md">
        <span className="mono-label text-warn">instrument fault</span>
        <h1 className="mt-3 font-display text-3xl leading-tight">A panel glitched.</h1>
        <p className="mt-3 text-sm text-fg-muted">
          The rest of the system is fine. Reload this view to continue the walkthrough.
        </p>
        <button
          onClick={reset}
          className="mono-label mt-6 inline-flex items-center gap-2 border border-rule px-5 py-2.5 transition-colors hover:text-fg"
        >
          Reload view
        </button>
      </div>
    </main>
  );
}
