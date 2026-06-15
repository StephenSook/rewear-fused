# DevPost submission (paste-ready, mapped to the form fields)

Hard deadline: **June 16 11:59pm**. Add all three members. Track + video + T&C are required. Verify the video plays in incognito before submitting. No em-dashes anywhere (sweep before paste).

---

## General info

### Project name (60 chars max)
```
REWEAR-FUSED
```

### Elevator pitch / tagline (200 chars max)
Use this (196 chars, under the 200 cap; trim "deployable" if the counter disagrees):
```
Elastane is in 80% of clothing; 1% makes recyclers reject the whole garment. REWEAR-FUSED co-designs a cleavable elastane and the de novo enzyme that closes the loop, plus a live passport.
```

### Thumbnail (JPG/PNG/GIF, 5MB, 3:2)
A 3:2 capture of the enzyme view (Mol* with the green triad) or the loop cleavage frame. Real screen capture preferred; a branded card is acceptable garnish.

---

## Project Story → "About the project" (Markdown)

```markdown
## Inspiration
Carter's runs KIDCYCLE, collecting worn baby clothes through TerraCycle, then
downcycling them into insulation and pet bedding. A onesie never becomes a onesie
again because of two walls: nobody can prove the recovered fabric is chemically
safe for infant skin, and nobody can break down the elastane in every stretch
garment. Elastane is in about 80% of clothing, and as little as 1% of it makes a
textile recycler reject the whole garment. We wanted to knock down both walls.

## What it does
REWEAR-FUSED is a single computational co-design loop with three engines.
- **Engine A** designs a new enzymatically-cleavable elastane fiber by
  constraint-guided screening of polyurethane-urea chemistry: aliphatic
  isocyanates only (so nothing carcinogenic comes off near a baby), the cleavable
  bond in the amorphous soft segment, 25 to 35 percent hard segment.
- **Engine B** designs a de novo carbamate hydrolase, an enzyme
  shaped to cleave the exact bond in Engine A's fiber, with an engineered
  near-neutral Ser-His-Asp triad so it does not damage companion cotton.
- **Engine C** is a Digital Recyclability Passport: a live compliance classifier
  that routes each garment clear, lab-test, or divert against real US and EU
  regulation, and emits a scannable GS1 Digital Link / EU Digital Product Passport.

The web app makes the loop visible: a garment enters, the system proposes a
redesigned cleavable fiber, designs a matched enzyme against it, renders the 3D
structures, and animates the closed loop, today's shred-to-pet-bedding versus
depolymerize and re-spin into a new onesie.

## How we built it
- Frontend: Next.js 16, React 19, Tailwind v4, Mol* 5.9 for publication-grade
  enzyme rendering, React Three Fiber with a custom GPU vertex-shader particle
  storm for the closed loop, visx for the trade-off curve, GSAP and Lenis for the
  scroll narrative. Deployed on Vercel.
- Engine C: a real FastAPI service deployed on Render, serving a signed,
  pre-computed artifact bundle, with a deterministic rule layer over real
  regulatory thresholds plus a classifier trained on real public datasets (CPSC
  Recalls, EU Safety Gate, Toxic-Free Future / Peaslee PFAS, OEKO-TEX).
- Engines A and B: the open-source de novo design toolchain (RFdiffusion,
  LigandMPNN, Boltz-2, PLACER, FoldSeek) and RDKit-based polymer screening,
  anchored on the published UMG-SP2 urethanase transition-state geometry.
- The frontend reads pre-computed, SHA-256-signed artifacts so the demo never
  depends on a live GPU job; Engine C also runs live so the link works for anyone.

## Challenges we ran into
- Elastane's crystalline hard segments physically block enzymes, so we inverted
  the problem: redesign the fiber to be cleavable rather than attack today's fiber.
- Mol* crashed the Next.js Turbopack production build, so we moved to webpack.
- A fixed full-screen WebGL background canvas was hidden behind the page
  background until we fixed the z-index layering.
- We held a strict honesty line: everything is in-silico (TRL 2-3), trained on
  real public data, with no synthetic data and no fictional persona.

## Accomplishments that we're proud of
- A real, deployed product (the passport endpoint and the five-view app) with
  passing CI, not a mockup.
- Two open novelty flags: no de novo carbamate hydrolase and no AI-co-designed
  cleavable elastane have been publicly disclosed; we verified the prior art and
  fact-checked our citations.
- The honesty moat: every number traces to a real pipeline output or a verified
  DOI, surfaced on a /judges page that tiers each engine real versus in-silico.

## What we learned
- The crystallinity versus stretch trade-off has a real published design window
  (25 to 35 percent hard segment); we made it the honesty centerpiece, not a thing
  we hid.
- Calibrated honesty wins deep-tech rooms; over-claiming loses them.
- A passing build is not a working app; we verified every view in a real browser.

## What's next for REWEAR-FUSED
- Wet-lab validation: express the top enzyme designs, spin a fiber sample, prove
  activity on a carbamate surrogate, file a provisional patent, and pilot one
  Carter's SKU. The Cox Cleantech Residency ask is 10 thousand dollars and six
  weeks to do exactly this.
- We are the Nexus Circular of textiles, the shape Cox already backed. License the
  fiber and enzyme to incumbents (Hyosung, LYCRA, Asahi Kasei) on a 2030 to 2032
  horizon.
```

### Built with (comma list)
```
next.js, react, typescript, tailwind-css, mol-star, three.js, react-three-fiber, gsap, lenis, visx, fastapi, python, render, vercel, rdkit, rfdiffusion, ligandmpnn, boltz-2, placer, foldseek, catboost, gs1-digital-link, w3c-verifiable-credentials
```

### "Try it out" links
- Live app (Vercel): `<fill June 14 after deploy>`
- Engine C API (Render): `<render url>/healthz`
- Code (fresh repo): `<fill June 14>`

### Project Media
- Image gallery (3:2): screenshots of the five views (story, fiber, enzyme, loop, passport) and the /judges page. Real captures from the deployed app.
- **Video demo link (required)**: the YouTube/Vimeo URL. Record June 16 per `docs/demo_script.md`, under 5 minutes, captioned, verified in incognito.

---

## Additional info (for judges)

### What Problem Track Is Your Submission In?
```
Making & Remaking (Carter's)
```

### Terms & Conditions
Each team member checks the consent box, and each signs the DocuSign Terms email. Opt into the Making & Remaking prize category so the entry is eligible; the grand prize and the Cox Cleantech Residency flow from the track win.

---

## Pre-submit checklist (June 16, before 11:59pm)
- [ ] All three members on the submission.
- [ ] Track = Making & Remaking selected; T&C consent checked.
- [ ] Video link set, plays in incognito, captioned, under 5 min.
- [ ] Live app + Engine C + repo links filled and reachable.
- [ ] AI-tone sweep: no em-dashes, no blocklist words in the story.
- [ ] Final deployed golden-path green in incognito (the judge experience).
