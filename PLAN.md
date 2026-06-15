# REWEAR-FUSED · Team Coordination

Live coordination doc for the three lanes: Stephen (frontend + architecture), Pravin (Engines A+B molecular pipelines), Vinh (Engine C compliance + data/infra). Update this file on every status change. Manual discipline, no git hooks. Read the README for build and run.

Legend: ✅ done · 🟡 in progress · ⬜ not started · ⛔ blocked

## Commit-gated protocol (manual)

1. Before starting a task: set it 🟡, add your name + a wall-clock note in Notes, commit **PLAN.md only**, push. That is your lock.
2. On finish: set ✅, commit PLAN.md only, push.
3. If blocked: set ⛔ with a one-line reason.
4. Before starting ANY task: `git pull` and read this file. If someone holds 🟡 on overlapping files, coordinate first.
5. PLAN.md commits are atomic and never bundled with code. Message format: `status: [task#] [emoji] [desc]`.
6. Handoffs: add `→ [Name]` in Notes.
7. Stale-lock TTL = 4 hours. No commit on a 🟡 task in 4h means the lock is stale; ping the owner, then claim it.
8. Contract changes (anything in Shared Contracts) require a `⚠️ CONTRACT` commit prefix and a ping to every consumer before committing.
9. Lanes own non-overlapping directories: Stephen `frontend/` + `data/contract.md`, Pravin `backend/`, Vinh `engine-c/` + `data/datasets/`. Per-lane branches -> PR -> rebase-merge to `main`.

## Status

| # | Component | File(s) | Owner | Status | Deps | Notes |
|---|-----------|---------|-------|--------|------|-------|
| 0.4 | Data contract (anti-drift) | data/contract.md | Stephen | ✅ | - | authored; Pravin + Vinh to sign off |
| 0.5 | Design system | DESIGN_SYSTEM.md | Stephen | ✅ | - | tokens + instrument UI |
| 1.1 | Frontend scaffold | frontend/ | Stephen | ✅ | 0.4 | Next 16.2 + Tailwind v4 + tokens; 3D stack (Mol*/R3F/GSAP) |
| 1.2 | Typed data layer + mock fixtures | frontend/src/lib, data/ | Stephen | ✅ | 0.4 | conforms to contract; real archetypes + regs |
| 1.3 | VIEW 2 Passport (demo floor) | frontend/src/app | Stephen | ✅ | 1.2 | builds + runtime smoke green |
| 1.4 | VIEW 4 Enzyme (Mol*) | frontend/src/components, app/enzyme | Stephen | ✅ | 1.2 | live Mol* render verified; reference scaffold until Engine B |
| 1.5 | VIEW 3 Fiber + trade-off curve | frontend/src/components, app/fiber | Stephen | ✅ | 1.2 | funnel + candidate + R3F architecture + trade-off curve + handoff |
| 1.6 | VIEW 5 Closed loop (GPU particles) | frontend/src/components, app/loop | Stephen | ✅ | 1.4,1.5 | scroll-scrubbed particle storm; onesie->cleavage->monomers->new onesie |
| 1.7 | VIEW 1 Story cold-open | frontend/src/app/page.tsx | Stephen | ✅ | 1.6 | scroll story + stat count-up |
| 1.8 | Scroll shell (Lenis, loader, nav rail, sound) | frontend/src/components | Stephen | ✅ | - | global; loop regression-checked under Lenis |
| 1.9 | Garment archetype thumbnails | frontend/public/archetypes | Stephen | ✅ | 1.3 | stills wired into the passport |
| 2.1 | Engine B pipeline | backend/engine_b | Pravin | ⬜ | 0.4 | RFdiffusion -> ... -> FoldSeek |
| 2.2 | Engine A screening | engine-a/ (RDKit) | Stephen→Pravin | 🟡 | 0.4 | RDKit reference impl (CPU-feasible); → Pravin to own/extend |
| 2.3 | GPU pre-flight smoke | backend/scripts | Pravin | ⬜ | - | before molecular runs |
| 2.4 | Artifact server + manifest | backend/api | Pravin | ⬜ | 2.1,2.2 | SHA-256 signed |
| 3.1 | Engine C data ETL | engine-c/ingest | Stephen→Vinh | ✅ | 0.4 | 631 real CPSC recalls ingested + labeled; → Vinh to extend (Safety Gate, PFAS) |
| 3.2 | Compliance classifier | engine-c/classifier | Stephen→Vinh | ✅ | 3.1 | deterministic rules + per-label CatBoost, honest CV PR-AUC; tests pass; → Vinh |
| 3.3 | Passport (VC + GS1 + QR) | engine-c/passport | Stephen→Vinh | ✅ | 3.2 | W3C VC 2.0 + Ed25519 (did:key) + GS1 Digital Link; clear/lab-test/divert; → Vinh |
| 3.4 | Live endpoint + keepalive | engine-c/api | Stephen→Vinh | 🟡 | 3.2 | C0 DONE (Vinh, Jun 15): 631 real CPSC recalls re-ingested live, build green on py3.12, 9 tests pass, --strict clean for Engine C (fixed manifest path portability). NEXT: C1 frozen-model parity → Render deploy + keepalive; → Vinh |
| 4.1 | Wire frontend to real artifacts + live endpoint | frontend, data | Stephen | 🟡 | 3.3 | wired to the signed bundle AND a live `/classify` client with a demo-safe fallback + live/signed-bundle badge; Engine A/B still in-silico |
| 4.2 | Deploy | infra | all | 🟡 | 1.3 | `vercel.json` ready (framework nextjs, `next build --webpack`, cache headers); public deploy + Render endpoint + secrets |
| 4.3 | Playwright golden-path (deployed) | frontend/e2e | Stephen | ⬜ | 4.2 | incognito smoke |
| 4.4 | Demo video | docs | all | ⬜ | 4.3 | captioned, under 5 min |

## Action items / heads-ups (2026-06-14, Stephen)
- **Vinh (Engine C), low effort, strengthens the demo moat:** the pitch says "trained on 631 real CPSC recalls" and 631 is real (printed by `ingest/cpsc.py` `summarize()`, noted in `engine-c/README.md`), but it is NOT in the frozen `data/artifacts/v1.0.0/manifest.json`, so a judge auditing the artifact cannot point to it. Add a `recallCount` field to the manifest and surface it on the /judges page so the number is checkable. Safe: the manifest is not self-hashed, so adding a field keeps SHA parity.
- **Everyone (CI), time-critical before June 16:** GitHub forces Node 24 on **June 16**, our submission day. The workflow's `actions/checkout@v4` + `actions/setup-python@v5` "may not work as expected" after that. Bump them (checkout@v5, setup-python@v6) or set `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` in the workflow BEFORE June 16 so CI does not go red on submission day. CI is green today.
- **FYI (pitch):** the `docs/` pitch scripts were rubric-aligned and honesty-tightened. The enzyme view is narrated as the reference 1TCA scaffold (never "the de novo fold"), since Engine B has not produced a designed structure yet. Drill that narration before June 17; if Engine B lands a real design at the freeze gate, flip one clause.

## Gates

- **G1 (demo floor)**: VIEW 2 passport renders end-to-end on localhost. A working demo exists.
- **G2 (mid-build, non-negotiable)**: VIEW 2 + one molecular view (VIEW 4) + a deployed URL are green. No frontier layer proceeds until G2 is green.
- **G3 (artifact-freeze, June 15 EOD, hard)**: real Engine A/B/C outputs replace mocks; manifest SHA verified; if the enzyme pipeline is not on track, the LigandMPNN-redesign fallback triggers. Deploy (Vercel + Render + keepalive) done by June 15 EOD, so June 16 is integration + video + submit only.
- **G4 (submit, June 16 11:59pm, HARD)**: deployed golden-path green in incognito; demo video recorded (under 5 min, captioned); abstract + video + final project submitted to DevPost. June 17 is present-only.

## Shared Contracts

| Contract | Owner | Consumers | Definition |
|----------|-------|-----------|------------|
| Artifact JSON shapes | Stephen | Pravin, Vinh, frontend | `data/contract.md`: enzymes/fibers/pairs/passports field names |
| Artifact folder + manifest | Stephen | all | `data/artifacts/v1.0.0/{enzymes,fibers,pairs,passports,pdb}/` + `manifest.json` (SHA-256 per file) |
| Fiber↔enzyme match | Pravin | frontend | `pairs/topPairs.json` cross-references `fiberId` + `enzymeId` + `enzyme_match` |
| Engine C endpoint shape | Vinh | frontend | `GET /classify/{id}` returns a `Classification`; `GET /passport/{id}` returns the `DigitalProductPassport` JSON in `data/contract.md`; `/healthz` liveness |
| Frozen model parity | Vinh | frontend | the deployed endpoint serves the exact model that produced `v1.0.0` (manifest SHA) |

## Decisions

### D2: Repo location
Develop off iCloud; never from Desktop/Documents.

### D3: Demo realness
Real public datasets + real Carter's product archetypes + builders demo live. No fiction, no synthetic data in the judged path.

### D5: Webpack bundler (not Turbopack)
Mol*'s module graph crashes the Turbopack production build at runtime ("module factory not available"). dev and build run `--webpack`; Mol* bundles cleanly there. Revisit Turbopack when the molstar chunking bug is fixed.

### D6: RunPod ownership
Pravin owns the RunPod GPU account and the weekend budget cap.

### D7: Artifact hosting
For the demo, artifacts live in `data/artifacts/` (repo-tracked) and ship as Vercel static; Cloudflare R2 is the scale path when bundles grow.

## Timeline

- **Kickoff Sun June 14, 2pm-6pm** at TSQATL Clubhouse, 848 Spring St NW. Team Formation submission on DevPost by June 14 11:59pm.
- **Build Mon June 15 - Tue June 16** at the Biltmore Innovation Center, 817 W Peachtree St NW (7am-7pm, in-person optional).
- **FINAL SUBMISSION DEADLINE: Tue June 16, 11:59pm** (final project to DevPost).
- **Demo Day Wed June 17** at the Biltmore: judging 10:30-3, present in person (at least one member required). Winners reception 4:30-7.
- Net build window is ~58 hours (June 14 2pm to June 16 11:59pm). Front-load accordingly.

## Logistics (every team member, before/at kickoff)
- [ ] Register on the Cox form (all three) with a .edu email.
- [ ] Agree to the Terms & Conditions via the DocuSign email (each member).
- [ ] DevPost: create account, join the hackathon, confirm all members on the team, select the Making & Remaking (Carter's) track and the prize categories (opt in to be eligible).
- [ ] Join the Discord (appears as Render ATL).
- [ ] Pull the shared drive files. Credits available: Cursor, Anthropic, Google.
