"use client";

import { SmoothScroll } from "./smooth-scroll";
import { Loader } from "./loader";
import { NavRail } from "./nav-rail";
import { SoundToggle } from "./sound-toggle";
import { ScrollProgress } from "./scroll-progress";
import { PageTransition } from "./page-transition";
import { SkipLink } from "./skip-link";
import { DemoMode } from "./demo-mode";

/** Global scroll shell: skip link, smooth scroll, loader, nav rail, sound, progress, route veil, demo mode. */
export function Shell() {
  return (
    <>
      <SkipLink />
      <SmoothScroll />
      <Loader />
      <NavRail />
      <SoundToggle />
      <ScrollProgress />
      <PageTransition />
      <DemoMode />
    </>
  );
}
