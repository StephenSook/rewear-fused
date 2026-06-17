# DESIGN_SYSTEM.md, REWEAR-FUSED visual identity (locked)

Aesthetic: **molecular laboratory instrument meets editorial science journal.** Dark, deep, atmospheric. Molecules glow against depth. The precision of a cryo-EM viewer crossed with the typographic confidence of a high-end science publication. Restyle every primitive; never ship a stock component. Reskin by changing tokens, never component code.

## The 4-rule clean-but-shocking discipline

1. **One 3D moment per viewport, max.** The molecule or the chart, never both side-by-side.
2. **Negative space is the primary layout primitive.** 8pt spacing scale; hero sections 200px+ vertical padding; never less than 64px between sections.
3. **Two-accent rule.** bio-green/cyan ONLY for enzyme/biology; amber/coral ONLY for fiber/material. They meet and fuse ONLY at the loop-closing moment. The third "color" is white-at-low-opacity on near-black. No other hues except inside data-viz scales.
4. **Token architecture (Tailwind v4 CSS-first `@theme`).** Every component reads only from these tokens.

## Tokens (`@theme`, OKLCH)

```css
@theme {
  --color-bg: oklch(0.13 0.01 240);
  --color-bg-elevated: oklch(0.17 0.01 240);
  --color-fg: oklch(0.96 0.005 240);
  --color-fg-muted: oklch(0.65 0.01 240);
  --color-accent-bio: oklch(0.83 0.18 175);   /* enzyme / biology */
  --color-accent-fiber: oklch(0.74 0.17 45);  /* fiber / material */
  --color-rule: oklch(0.25 0.005 240 / 0.6);
  --color-pass: oklch(0.80 0.16 150);          /* clear */
  --color-warn: oklch(0.82 0.15 75);           /* lab-test */
  --color-fail: oklch(0.65 0.20 25);           /* divert */
  --font-display: "Editorial New", serif;
  --font-body: "General Sans", system-ui, sans-serif;  /* Söhne if licensed */
  --font-mono: "JetBrains Mono", monospace;
  --shadow-bloom: 0 0 80px -8px oklch(0.83 0.18 175 / 0.45);
}
```

## Typography

- **Display / brand**: Editorial New (high-contrast didone, editorial-science-journal voice). 48-96px. Variable weight may animate on scroll-reveal headlines.
- **Body / UI**: General Sans (free) or Söhne (if licensed). 16-18px.
- **Mono / data**: JetBrains Mono with `tabular-nums` for kinetics, DOIs, SMILES, residue labels (Ser-195, His-57, Asp-102), KPI numbers, regulatory citations. 12-14px, uppercase + wide tracking for micro-labels.
- Self-host via `next/font/local`. No Inter / Roboto / Arial / system / Space Grotesk.

## Instrument UI (the hubtown-derived chrome)

- **Beveled boxes**: panels with a thin SVG border + corner tick marks + small animated corner dots. This is the primary container. The "data-icon-animate" corner-dot pattern signals a live instrument.
- **Mono micro-labels**: uppercase, `letter-spacing` wide, small, muted. Used as section eyebrows, residue tags, citation chips.
- **Left section-nav rail**: vertical chapter labels (Problem / Fiber / Enzyme / Loop / Passport), the active one ticked.
- **SVG letter-draw loader**: "REWEAR-FUSED" wordmark drawn via `stroke-dashoffset` with a live progress %.
- **Page-transition overlay**: fixed `inset-0` near-black panel that fades on Engine A->B->C switches (pair with React 19 ViewTransition).
- **Sound toggle**: a "Sound" control wired to an AudioContext; the carbamate cleavage gets an audio cue.

## The glow recipe (premium look)

Lift emissive material colors above 1.0 (`emissive.multiplyScalar(2.5)`) so selective Bloom only blooms HDR-range pixels. Stack `<Environment preset="studio" />` for soft PBR reflections. `<MeshTransmissionMaterial>` for the "frozen-glass elastane filament." TSL/post stack order: `SSAO -> Bloom(mipmapBlur) -> DepthOfField -> ChromaticAberration -> Vignette -> ToneMapping(ACES)`. Atmosphere via low-density `<Sparkles>` + a 6-10% gradient-mesh fog, not true volumetrics. Molecular renders idle with a slow living rotation, never static. One orchestrated, staggered page-load beats scattered micro-interactions.

## Motion

- GSAP ScrollTrigger + Lenis for the orchestrated scroll narrative (synced via `gsap.ticker.add(t => lenis.raf(t*1000))` + `lagSmoothing(0)`).
- Motion 12.40 for React-idiomatic micro-interactions, animated counters (`useMotionValue` + `useSpring` + `useTransform`), `layout`, `AnimatePresence`.
- React 19 ViewTransition for the Engine A->B->C tab switch only.
- Respect `prefers-reduced-motion`: drop scrubbed scenes to static stills.

## Color semantics for the passport

- `--color-pass` (clear), `--color-warn` (lab-test), `--color-fail` (divert).
- "aromatic amine release: NONE" renders as a `--color-pass` check (Constraint 1).
- The persistent in-silico badge sits top-right of any predicted-property panel, muted, always visible.

## Component anatomy (restyle all)

Base UI 1.5 + shadcn 4 primitives, every one reskinned from tokens. Phosphor icons (duotone weight for variety). Charts: visx for the bespoke trade-off curve (glowing Pareto stroke, shaded design window); ECharts for compliance gauges; deck.gl for the supply-chain heatmap.
