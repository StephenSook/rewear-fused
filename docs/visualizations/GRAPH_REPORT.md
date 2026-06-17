# Graph Report - /Users/stephensookra/dev/rewear-fused-event  (2026-06-16)

## Corpus Check
- 80 files · ~493,432 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 287 nodes · 401 edges · 60 communities detected
- Extraction: 83% EXTRACTED · 17% INFERRED · 0% AMBIGUOUS · INFERRED: 67 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]

## God Nodes (most connected - your core abstractions)
1. `GET()` - 32 edges
2. `err()` - 15 edges
3. `AudioEngine` - 12 edges
4. `load()` - 12 edges
5. `need()` - 12 edges
6. `v_classification()` - 11 edges
7. `main()` - 11 edges
8. `v_fibers()` - 10 edges
9. `_decide()` - 9 edges
10. `_verify_frozen_parity()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `test_manifest_has_frozen_parity_anchor()` --calls--> `GET()`  [INFERRED]
  /Users/stephensookra/dev/rewear-fused-event/engine-c/tests/test_parity.py → /Users/stephensookra/dev/rewear-fused-event/frontend/src/app/01/[gtin]/21/[serial]/route.ts
- `_fetch_term()` --calls--> `GET()`  [INFERRED]
  /Users/stephensookra/dev/rewear-fused-event/engine-c/ingest/cpsc.py → /Users/stephensookra/dev/rewear-fused-event/frontend/src/app/01/[gtin]/21/[serial]/route.ts
- `_flatten()` --calls--> `GET()`  [INFERRED]
  /Users/stephensookra/dev/rewear-fused-event/engine-c/ingest/cpsc.py → /Users/stephensookra/dev/rewear-fused-event/frontend/src/app/01/[gtin]/21/[serial]/route.ts
- `fetch()` --calls--> `GET()`  [INFERRED]
  /Users/stephensookra/dev/rewear-fused-event/engine-c/ingest/cpsc.py → /Users/stephensookra/dev/rewear-fused-event/frontend/src/app/01/[gtin]/21/[serial]/route.ts
- `summarize()` --calls--> `GET()`  [INFERRED]
  /Users/stephensookra/dev/rewear-fused-event/engine-c/ingest/cpsc.py → /Users/stephensookra/dev/rewear-fused-event/frontend/src/app/01/[gtin]/21/[serial]/route.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (24): _decide(), ComplianceModel, _corpus_path(), _cv_score(), LabelModel, load_corpus(), _make_model(), Real multi-label compliance-risk model, trained on the CPSC recalls corpus.  For (+16 more)

### Community 1 - "Community 1"
Cohesion: 0.21
Nodes (29): GET(), main(), Real endpoint tests against the artifact bundle. CI proves the served shapes., test_classify_conforms_to_contract(), test_garments_shape(), test_healthz(), test_passport_conforms_to_contract(), test_unknown_garment_404() (+21 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (25): classify(), FrozenModelMismatch, garments(), _hash(), healthz(), judges(), _load(), passport() (+17 more)

### Community 3 - "Community 3"
Cohesion: 0.17
Nodes (14): getClassification(), getGarments(), getPassport(), fetchClassification(), fetchPassport(), getJSON(), isClassification(), isPassport() (+6 more)

### Community 4 - "Community 4"
Cohesion: 0.18
Nodes (3): AudioEngine, buildReverbIR(), select()

### Community 5 - "Community 5"
Cohesion: 0.14
Nodes (7): build(), _produced_by(), main(), onScroll(), onScroll(), smoothstep(), Stat()

### Community 6 - "Community 6"
Cohesion: 0.15
Nodes (5): cn(), BeveledBox(), InstrumentButton(), Tilt3D(), usePointerTilt()

### Community 7 - "Community 7"
Cohesion: 0.26
Nodes (9): _categorize(), fetch(), _fetch_term(), _flatten(), main(), _out_path(), CPSC Recalls ETL — real public data, no synthetic rows.  Pulls children's-appare, summarize() (+1 more)

### Community 8 - "Community 8"
Cohesion: 0.27
Nodes (9): _canonical(), _gtin14(), main(), _passport(), Build the real Engine C artifacts: train the model on real CPSC recalls, score t, Hash an input artifact (garments, regulations) so the manifest covers the     FU, Deterministic GTIN-14 with a valid GS1 mod-10 check digit (the prior code used, _sign_existing() (+1 more)

### Community 9 - "Community 9"
Cohesion: 0.43
Nodes (7): b64ToBytes(), base58decode(), didKeyToPublicKey(), pyCanonical(), signedMessage(), toArrayBuffer(), verifyMessage()

### Community 10 - "Community 10"
Cohesion: 0.29
Nodes (2): Error(), SceneBoundary

### Community 11 - "Community 11"
Cohesion: 0.83
Nodes (3): buildLoopBuffers(), sampleOnesie(), sampleSphere()

### Community 12 - "Community 12"
Cohesion: 0.5
Nodes (0): 

### Community 13 - "Community 13"
Cohesion: 0.5
Nodes (0): 

### Community 14 - "Community 14"
Cohesion: 0.67
Nodes (0): 

### Community 15 - "Community 15"
Cohesion: 0.67
Nodes (0): 

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (2): parseGs1Path(), qrTargetFor()

### Community 17 - "Community 17"
Cohesion: 0.67
Nodes (1): Smoke test so CI has a real green signal from day one. See docs/pravin_handoff.m

### Community 18 - "Community 18"
Cohesion: 0.67
Nodes (1): Engine C compliance classifier: a deterministic regulatory rule layer plus a rea

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (0): 

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (0): 

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (0): 

### Community 58 - "Community 58"
Cohesion: 1.0
Nodes (0): 

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **22 isolated node(s):** `Smoke test so CI has a real green signal from day one. See docs/pravin_handoff.m`, `CPSC Recalls ETL — real public data, no synthetic rows.  Pulls children's-appare`, `Frozen-model parity gate (spec §6.4): the endpoint must serve ONLY the byte-exac`, `Copy the real frozen bundle into a temp dir we can tamper with safely.`, `The behavior Render actually depends on: importing api.main against a tampered` (+17 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 19`** (2 nodes): `RootLayout()`, `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (2 nodes): `Home()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (2 nodes): `JudgesPage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (2 nodes): `EnzymePage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (2 nodes): `PassportPage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (2 nodes): `LoopPage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (2 nodes): `buildStoryBuffers()`, `story-geometry.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (2 nodes): `Shell()`, `shell.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (2 nodes): `MolstarViewer()`, `molstar-viewer.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (2 nodes): `Loader()`, `loader.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (2 nodes): `ScrollProgress()`, `scroll-progress.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (2 nodes): `SmoothScroll()`, `smooth-scroll.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (2 nodes): `SkipLink()`, `skip-link.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (2 nodes): `ScreeningFunnel()`, `screening-funnel.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (2 nodes): `IconAnimate()`, `beveled-button.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (2 nodes): `TierBadge()`, `judges-ledger.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (2 nodes): `PageTransition()`, `page-transition.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (2 nodes): `Cloud()`, `story-scene.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (2 nodes): `Storm()`, `particle-storm.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (2 nodes): `cn()`, `nav-rail.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (2 nodes): `EnzymeStage()`, `enzyme-stage.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (2 nodes): `main()`, `swap_denovo_enzyme.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (1 nodes): `postcss.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (1 nodes): `playwright.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (1 nodes): `eslint.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (1 nodes): `golden-path.spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `opengraph-image.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (1 nodes): `global-error.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `fiber-stage.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `loop-progress.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (1 nodes): `tradeoff-curve.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `enzyme-detail.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (1 nodes): `sound-toggle.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `story-signals.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `passport-card.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (1 nodes): `motion.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (1 nodes): `lenis.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (1 nodes): `types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GET()` connect `Community 1` to `Community 0`, `Community 2`, `Community 5`, `Community 7`?**
  _High betweenness centrality (0.261) - this node is a cross-community bridge._
- **Why does `_decide()` connect `Community 0` to `Community 8`, `Community 1`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Why does `build()` connect `Community 5` to `Community 1`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Are the 31 inferred relationships involving `GET()` (e.g. with `_fetch_term()` and `_flatten()`) actually correct?**
  _`GET()` has 31 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Smoke test so CI has a real green signal from day one. See docs/pravin_handoff.m`, `CPSC Recalls ETL — real public data, no synthetic rows.  Pulls children's-appare`, `Frozen-model parity gate (spec §6.4): the endpoint must serve ONLY the byte-exac` to the rest of the system?**
  _22 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._