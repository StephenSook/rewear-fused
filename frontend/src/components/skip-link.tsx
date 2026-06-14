"use client";

/**
 * Keyboard skip-to-content link. Visually hidden until focused, then it sits in
 * the top-left as the first tab stop. On activation it focuses the page's main
 * region directly (each route owns its own <main>), so it works without a
 * matching id anchor.
 */
export function SkipLink() {
  return (
    <a
      href="#main"
      onClick={(e) => {
        const main = document.querySelector("main");
        if (!main) return;
        e.preventDefault();
        main.setAttribute("tabindex", "-1");
        (main as HTMLElement).focus();
        main.scrollIntoView();
      }}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-accent-bio focus:bg-bg-elevated focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest focus:text-fg"
    >
      Skip to content
    </a>
  );
}
