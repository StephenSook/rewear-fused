# Plan C — Engine C Execution (Vinh)

> **Owner:** Vinh. **Lane:** `engine-c/` + `data/datasets/`.
> **Goal (locked this session):** *Ship + deploy reliably.* Get the live Render endpoint + keepalive working, frozen-model parity verified, artifacts frozen by **G3 (June 15 EOD)**. The reference classifier is good-enough; depth is stretch, added only if the critical path is green.
> **Building/deploying from:** this repo (`rewear-fused`).
> **Authoritative spec:** [docs/vinh_handoff.md](../vinh_handoff.md). **Output shapes:** [data/contract.md](../../data/contract.md). **Deploy steps:** [docs/deploy.md](../deploy.md) (lives in the build repo; mirror as needed).
> **Honesty rule (non-negotiable):** real public data only, report the REAL achieved PR-AUC, no synthetic garments in the judged path. The honesty IS the moat.

---

## 0. Current state — verified this session (not assumed)

What is actually in this repo right now, confirmed by reading the code:

| Piece | State | Evidence |
|---|---|---|
| `ingest/cpsc.py` | ✅ present; regenerates the corpus live from the public CPSC API | writes `data/datasets/cpsc_recalls.parquet` |
| `data/datasets/cpsc_recalls.parquet` | ⛔ **MISSING in this repo** (gitignored build artifact; not in `rewear-fused-build` either) | `find data/` shows no datasets dir |
| `classifier/model.py` | ✅ per-label CatBoost, honest CV PR-AUC, label-terms stripped | reads the missing parquet → **build crashes until §1 runs** |
| `classifier/rules.py` | ✅ STARTER rules only (~5: ESPR/elastane, PFAS-DWR, REACH amines) | spec wants 85+ thresholds |
| `classifier/build.py` | ✅ emits classifications + Ed25519-signed passports + manifest (SHA per file) | `MODEL_VERSION="catboost-text-v1.0"` |
| `api/main.py` | ✅ serves static bundle; `/healthz`, `/classify/{id}`, `/passport/{id}` | ⛔ **no frozen-model SHA verification on startup** (spec §6.4) |
| `render.yaml` | ✅ Render blueprint ready (free plan, healthcheck `/healthz`) | not yet deployed |
| `.github/workflows/keepalive.yml` | ✅ present | needs `KEEPALIVE_TARGET_URL` secret + real Render URL |
| `data/artifacts/v1.0.0/` | ✅ 3 garments, 3 passports, classifications, manifest, regulations | these are Stephen's reference outputs |
| pitch pack (§7) | ⬜ **entirely unbuilt** — yours, untouched | residency-judge half |

**The single first blocker:** `python -m classifier.build` fails today because the parquet is gone. Fix = run the ingest (§1). No copying; regenerating from the live public API *is* the honest path.

> **✅ C0 COMPLETE — Jun 15.** The blocker is cleared. Done on Python 3.12.10 (matches `render.yaml`):
> - Live CPSC ingest pulled **631 real recalls** → `data/datasets/cpsc_recalls.parquet` (631 rows; 353 with a mapped regulatory category). The pitch's "631" is now an audited, verifiable number.
> - Build green, **zero placeholders**, all passports Ed25519-signed. Real PR-AUC (honest, matches §6): flammability **0.990** (206 pos), drawstring **0.960** (142 pos), lead **0.246** (12 pos).
> - **9 tests pass**; local endpoint smoke-tested (`/healthz`, `/classify`, `/passport` all 200 serving real output).
> - **Found + fixed a latent landmine:** `core.autocrlf=true` made `build.py` sign the manifest over CRLF bytes while git stores LF → manifest SHA mismatch that turned CI's *Artifact contract conformance* job red. Added `.gitattributes` forcing LF on all signed artifacts (`*.json`, `data/artifacts/**`, `*.py`) + re-signed over LF. **CI is now all-green.** This directly de-risks **C1** (frozen-model SHA verify) and **C5** (freeze gate) — both relied on byte-stable hashes that the CRLF bug would have broken.

> **✅ C1 COMPLETE — Jun 15.** Frozen-model parity (spec §6.4) shipped via **output-parity**, the pre-decided §4 fallback, chosen deliberately over model-binary parity:
> - **Decision (output > binary):** CatBoost `.cbm` bytes are not guaranteed reproducible across the build host (py 3.12.10) and Render (py 3.12.5), so a binary hash would brick the boot on a benign serialization diff. What the demo + a regulator actually need is that the **served decisions/probabilities are provably the frozen ones** — that's `classifications.json`. Logged honestly as `frozenParity.kind = "output"` in the manifest, not dressed up as binary parity.
> - **`build.py`:** manifest now carries a `frozenParity` anchor (`{kind:"output", path:"compliance/classifications.json", sha256, note}`). Rebuild reproduced byte-identical output — SHA `bb95f4e8…` matches the prior `files[]` entry, confirming the model is reproducible (which is what the freeze gate relies on). Real PR-AUC unchanged: flammability **0.990**, drawstring **0.960**, lead **0.246**.
> - **`api/main.py`:** new `_verify_frozen_parity()` runs **at import time** → hashes the served `classifications.json`, compares to the manifest anchor, and **raises `FrozenModelMismatch` (refuses to boot) on any mismatch or missing manifest**. uvicorn never binds the port → Render's health check never goes green on a tampered/unverifiable bundle. `/healthz` now reports `model_sha_ok: true` + `frozen_parity_sha` so the keepalive cron surfaces the proof on every ping.
> - **Tests:** `tests/test_parity.py` pins the pass path **and** the refuse-to-boot path (tampered classifications → raises; absent manifest → raises). **13 tests pass** (was 9). Boot smoke-tested: `/healthz` → `model_sha_ok: true`, `/classify` serves the frozen output.
> - **Validator:** `--strict` clean for Engine C; the 5 remaining failures are Pravin's A/B artifacts (fibers/enzymes/pairs), not this lane. The `frozenParity` block did not break manifest reverse-coverage.
> - **Critical path is now clear through C1.** Next: **C2** (Render deploy + smoke the 3 endpoints) — the gate will now actively prove parity on the live host.
>
> **C1 review pass (2 parallel adversarial reviewers — correctness + honesty/contract) — fixes applied Jun 15:**
> - **Gate now verifies the WHOLE bundle, not just the anchor.** `_verify_frozen_parity()` loops every manifest `files[]` entry (garments, regulations, classifications, all 3 passports) — a drifted/unsigned-mismatch passport can no longer be served alongside a clean classifications.json. Anchor kept as the must-exist canary.
> - **Honesty fix (the moat):** renamed `/healthz` `model_sha_ok` → `output_sha_ok` + added `parity_kind: "output"`. The old name implied model-*binary* parity, which we deliberately do NOT do — that was the one label that overstated the verification. Field is now a LIVE re-hash on each ping (was hardcoded `True`), so the keepalive cron surfaces a real check.
> - **Threat-model honesty:** docstring + manifest note now scope the gate accurately — tamper-EVIDENT vs drift/corruption/wrong-deploy, NOT cryptographic authenticity (the manifest lives in the same bundle; a coordinated rebuild would pass). The real authenticity anchor is the per-passport Ed25519 signature. Have this one-liner ready for judges. (Manifest-signing with the existing issuer key is a possible stretch hardening — not critical path.)
> - **End-to-end boot test added:** subprocess test asserts `import api.main` against a tampered bundle exits NON-ZERO with `FrozenModelMismatch` — the exact behavior Render depends on (uvicorn never binds → deploy marked failed). Plus a drifted-passport test. **15 tests pass** (was 13).
> - **Fixed pre-existing drift:** `frontend/src/lib/artifacts/manifest.json` was stale (mismatched SHAs, no `frozenParity`). Re-ran `scripts/sync_artifacts_to_frontend.py` → frontend bundle now matches canonical.
> - **Contract:** added optional `frozenParity` to the `Manifest` interface in `data/contract.md` AND `frontend/src/lib/types.ts`. Additive, manifest-level only — does NOT touch passport/classification shapes, so per §7 not a `⚠️ CONTRACT` event. **Heads-up to Stephen:** `types.ts` Manifest gained an optional `frozenParity?` field (no action needed; nothing he reads breaks).
> - Validator `--strict` still clean for Engine C (only Pravin's A/B failures remain). Line endings renormalized to LF on all rebuilt artifacts (the C0 CRLF landmine — re-checked, anchor is LF on both index + worktree).

> **✅ C2 COMPLETE — Jun 15.** Render endpoint live + smoke-verified, the convergence point reached.
> - **Live URL:** `https://rewear-engine-c.onrender.com` (Blueprint off `StephenSook/rewear-fused` `main`, free plan, `autoDeploy: true`). Smoke-verified from off-box: `/healthz` 200 (`output_sha_ok: true`, `frozen_parity_sha: bb95f4e8…`), `/classify/carters-legging-blend` 200, `/passport/carters-legging-blend` 200, bad id → 404.
> - **The real deploy risk was found + killed.** `render.yaml`'s buildCommand installed the full ML/chem stack (rdkit, catboost, pandas, pyarrow, scikit-learn) — but the API runtime imports *none* of them (pure FastAPI + stdlib; it serves the pre-built signed bundle, never trains/scores). On the free plan those heavy wheels are the most likely build-timeout/OOM. Split runtime deps into `engine-c/requirements-api.txt` (fastapi+uvicorn only) and pointed `render.yaml` at it. Proven in a clean venv: install → uvicorn boots → all endpoints 200, gate green. Build went green in ~1 min. (Committed `41cea11`; added `*.txt eol=lf` to `.gitattributes` so the Linux build reads the same bytes we test.)
> - **The CRLF/parity landmine is now proven dead cross-OS.** The C0/C1 fear was artifacts getting CRLF on a Linux checkout → SHA mismatch → `FrozenModelMismatch` → refuse-to-boot. The live Linux host hashed every artifact and matched byte-for-byte (`bb95f4e8…`, identical to local + the C1 record). The frozen-parity gate passing *on Render* is the strongest evidence the freeze is reproducible.
> - **Process note:** a fork (`vinhbin/rewear-fused-C2test`) was used first as a zero-stakes dry run, verified green, then torn down (fork + its Render service deleted). The real deploy is off the team repo.

> **✅ C3 COMPLETE — Jun 15 (with one honest caveat).** Keepalive wired + green.
> - Repo secret `KEEPALIVE_TARGET_URL = https://rewear-engine-c.onrender.com/healthz` set; `keepalive.yml` (already committed) pings it. **Confirmed a post-secret run is GREEN** (`health: 200`); independently replicated the exact workflow curl off-box → 200, so the pass is real, not assumed.
> - **⚠️ Caveat (logged honestly, not papered over):** GitHub throttles the `*/10` schedule hard on a low-activity free repo — observed runs are *hours* apart, not 10 min. That is too infrequent to keep a free Render instance warm (~15 min spin-down). **Decision: accept it + manually warm `/healthz` ~2 min before any demo.** Rationale: the endpoint is a credibility proof, NOT a demo runtime dependency (frontend reads static artifacts per §6.4; `engine-c-client.ts` falls back to the signed bundle within a 2.5s timeout). A cold start costs the "live" badge, not the demo. *(Stretch hardening if time: a 2nd external pinger e.g. UptimeRobot/cron-job.org at 5-min — not critical path.)*

> **🟡 C4 — Vinh's half DONE Jun 15; awaiting Stephen.** Live URL handed off; the Vercel set + redeploy is Stephen's (Vinh has no Vercel access — it's Stephen's env / his 4.1).
> - **Vinh's part (done):** gave Stephen the exact value, verified against `frontend/src/lib/engine-c-client.ts:15`: `NEXT_PUBLIC_ENGINE_C_API_URL = https://rewear-engine-c.onrender.com` — **bare host, no path/trailing slash** (the client appends `/classify/{id}` + `/passport/{id}` itself; a path here would 404 → silent cached fallback). No contract/shape change, so not a `⚠️ CONTRACT` event.
> - **Stephen's part (open, NOT verified here):** add that env var in Vercel + redeploy, then confirm the deployed site shows a `live` source (not `cached`). Until then the frontend is NOT yet reaching the endpoint — it renders correctly off the static bundle, just never `live`.
> - Demo-safety confirmed in his client: unset/slow/down/wrong-shape → falls back to the signed static bundle (`source: "cached"`) within 2.5s. So C3's warm-frequency caveat (and an un-set env) does not endanger his page; it only governs whether the "live" badge fires.
> - **Critical path is green through C3; C4 is handed off and pending Stephen. Remaining Core: C5 (G3 freeze gate, EOD Jun 15) + C6 (pitch pack, no code dep).**

> **✅ C5 — Engine C FROZEN + conformant Jun 15 (G3 gate, this lane).** Verified, not assumed:
> - **Non-strict validation: `conformant`, exit 0.** Every Engine C artifact passes — garments, regulations, classifications, all 3 passports, manifest — including locked scientific constraints (aliphatic/`aromaticAmineRelease: NONE`, `TRL 2-3`, GS1 link, signed `credential.proof`), enum checks, **manifest SHA-256 parity**, and **reverse-coverage** (no unsigned artifact present).
> - **Zero `placeholder:true` anywhere** in `data/artifacts/v1.0.0/` (grep-confirmed) — the G3 hard requirement.
> - **Freeze is real:** no uncommitted Engine C artifact/code changes (disk == HEAD), `frozenParity` anchor = `bb95f4e8…` (identical to C1 record + the live Render endpoint), `modelVersions.engineC = catboost-text-v1.0`. The local bundle, the committed bundle, and the deployed bundle are one consistent frozen state. **No model retrains after this point.**
> - **⚠️ Cross-lane caveat (honest):** `validate_artifacts.py --strict` is NON-CONFORMANT project-wide — **5 errors, ALL Pravin's Engine A/B** (fibers/candidates, fibers/screening, fibers/tradeoffCurve, enzymes/designs, pairs/topPairs — "not yet produced"). **Zero Engine C errors.** A full project `--strict` green is therefore blocked on Pravin, NOT on this lane. This does not gate Vinh's remaining work (C6 pitch pack has no code/data dep). Worth a heads-up to Pravin that A/B artifacts are the only thing left for a clean team-wide G3 `--strict`.

---                                                                                 

## 1. Phase table (PLAN.md status: 3.4 is the live one)

Legend: ✅ done · 🟡 in progress · ⬜ not started · ⛔ blocked · ✂️ cut

| # | Phase | Tier | Files | Status | Deps | Role |
|---|-------|------|-------|--------|------|------|
| C0 | Re-ingest CPSC corpus + green local build | **Core** | `ingest/`, `data/datasets/` | ✅ | — | **the unblocker — DONE Jun 15** |
| C1 | Frozen-model parity: SHA verify on startup | **Core** | `api/main.py`, `classifier/build.py` | ✅ | C0 | **critical path — DONE Jun 15** |
| C2 | Deploy to Render + smoke the 3 endpoints | **Core** | `render.yaml`, Render dashboard | ✅ | C1 | **convergence point — DONE Jun 15** |
| C3 | Keepalive cron live (secret + URL) | **Core** | `.github/workflows/keepalive.yml` | ✅ | C2 | **critical path — DONE Jun 15 (manual-warm caveat)** |
| C4 | Wire frontend env → live endpoint (hand to Stephen) | **Core** | (Stephen's 4.1) | 🟡 | C2 | **Vinh's half DONE Jun 15 (URL handed off); awaiting Stephen's Vercel set + redeploy** |
| C5 | G3 artifact-freeze: validate + freeze + zero placeholders | **Core** | `scripts/validate_artifacts.py` | ✅ | C1 | **gate — Engine C FROZEN Jun 15; full `--strict` blocked on Pravin's A/B (not this lane)** |
| C6 | Pitch pack: techno-econ + SB707/EPR + IP/FTO one-pager | **Core** (residency) | `docs/pitch_engine_c.md` | ⬜ | — | parallel, no code dep |
| C7 | Rule corpus → expand toward 85+ thresholds | Stretch | `rules.py`, `regulations.json` | ⬜ | C0 | depth |
| C8 | EU Safety Gate ingest (2nd real positive source) | Stretch | `ingest/safetygate.py` | ⬜ | C0 | depth |
| C9 | Real SHAP `TreeExplainer` (replace `compositionDrivers` stub) | Stretch | `model.py`, `build.py` | ⬜ | C0 | depth |
| C10 | Isotonic calibration on held-out fold | Stretch | `model.py` | ⬜ | C0 | depth |

**Core = ship-blockers (C0–C6). Stretch = C7–C10, cut without ceremony if any Core phase is behind.**

---

## 2. Build-order notes (why this sequence)

- **C0 is the unblocker.** Nothing else runs until the corpus is back and `python -m classifier.build` is green. Do it first, get out. Budget: ~30–60 min (the API pull is the variable).
- **C1 is the critical path and the riskiest single thing.** Frozen-model parity (spec §6.4) is the one piece of genuinely new code in the Core set: serialize the trained model, record its SHA in the manifest, ship the same file to Render, verify-on-startup, refuse to boot on mismatch. A slip here slips the deploy. Protect it; do it while fresh, not at 2am.
- **C2 is the convergence point** — the first time your lane meets the public internet and Stephen's frontend. If C2 slips, the demo still runs (frontend reads static artifacts; the endpoint is a credibility proof, not a runtime dependency). That is your built-in fallback — lean on it, don't panic-deploy.
- **C5 (freeze) gates G3.** Run `scripts/validate_artifacts.py --strict` — it already enforces every contract shape + locked scientific constraints + manifest SHA parity. Green = freeze. After freeze, **no model retrains** (CLAUDE.md §6 hard rule).
- **C6 (pitch pack) has no code dependency** — run it in parallel / in dead time while the Render build spins or the CPSC API pulls. It's the residency-judge half and it's 100% yours; don't let it slide to the end.
- **Buffer goes right after C1 and C2**, the two phases where new/unproven things land.

---

## 3. Sequenced critical path (do-or-fail, in order)

**SUN June 14 (today, from now):**
1. **C0** — `cd engine-c && python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt` → `python -m ingest.cpsc` (rebuilds the parquet from the live CPSC API; **note: output lands at repo-root `data/datasets/cpsc_recalls.parquet`, not under `engine-c/`**) → `python -m classifier.build` (must print real classifications, zero placeholders) → `pytest -q` (10 tests green; `pyproject.toml` already sets `pythonpath=["."]`, so run it from inside `engine-c/`).
2. **C1** — implement frozen-model parity:
   - In `build.py`: serialize the trained CatBoost model to `data/artifacts/v1.0.0/model/engine-c.cbm`, add its SHA-256 to `manifest.json["files"]` and keep `modelVersions.engineC`. **Decide the serialization shape FIRST** — `model.py` trains 3 per-label CatBoost classifiers, not one: either bundle all 3 into a single `engine-c.cbm`/joblib artifact and SHA that, or write 3 `.cbm` files each SHA'd separately in the manifest. Pick one before writing code; this is where the 2-hour budget gets eaten.
   - In `api/main.py`: on startup, hash the shipped model file, compare to the manifest entry, **raise and refuse to start on mismatch**. Add the check to `/healthz` output (`"model_sha_ok": true`).
   - Re-run the validator → green. **Note: `validate_artifacts.py` lives at repo-root `scripts/`, so from inside `engine-c/` invoke it as `python ../scripts/validate_artifacts.py --strict` (or `cd ..` first).** (If C1 fights you past 2h, the §4 fallback — verify the `classifications.json` SHA instead of the model binary — sidesteps the serialization-shape question entirely.)
3. **C6 (parallel, while pulls/builds run)** — draft `docs/pitch_engine_c.md` from vinh_handoff §7 (numbers already sourced; just assemble with best/expected/worst bands + TRL labels).

**MON June 15 (G3 is EOD — hard):**
4. **C2** — Render dashboard → New → Blueprint → pick repo → it reads `render.yaml` → deploy. Smoke: `curl <url>/healthz`, `/classify/carters-legging-blend`, `/passport/carters-legging-blend`. Note the URL.
5. **C3** — repo Settings → Secrets → Actions → `KEEPALIVE_TARGET_URL = <render-url>/healthz`. Confirm the cron fires and goes green.
6. **C4** — hand Stephen the Render URL so he sets `NEXT_PUBLIC_ENGINE_C_API_URL` on Vercel (his 4.1 is already wired + waiting; goes live automatically).
7. **C5** — final `python ../scripts/validate_artifacts.py --strict` green (repo-root `scripts/`; run from repo root or with the `../` prefix from `engine-c/`) → **freeze**. No retrains after this. Confirm zero `"placeholder": true` anywhere in `data/artifacts/`.
8. **G3 CHECK (EOD):** real Engine C outputs replace mocks ✅, manifest SHA verified ✅, Render deployed + keepalive warm ✅. If all green, June 16 is integration + video + submit only.

**TUE June 16 (G4 submit, 11:59pm — HARD):**
9. Endpoint warm (keepalive), golden-path green in incognito, your passport QR scans on the deployed site. No new features — packaging only.
10. **Stretch (C7–C10) only if you reach here with Core green and time left.** Pick ONE high-leverage item (recommend **C7 rule corpus** — most visible to judges, lowest deploy risk). Re-freeze if you touch the model (C9/C10 force a re-freeze + re-deploy; only do them MON, never TUE).

---

## 4. Scope tiers + pre-decided cut triggers

**Core (ship or we fail):** C0, C1, C2, C3, C4, C5, C6.

**Stretch (cut silently-but-logged if Core slips):** C7, C8, C9, C10.

**Cut triggers — decided NOW so it's not a day-13 panic:**
- If C2 (Render deploy) is not green by **MON June 15 noon** → freeze the static artifacts as the demo source, deploy the endpoint as best-effort, and **cut all of C7–C10**. The demo runs off static artifacts regardless (§6.4 demo-safety corollary).
- If C1 (frozen-model parity) fights you past **2 hours** → ship the simpler version: verify the *manifest* SHA of `classifications.json` on startup instead of the model binary, log the limitation honestly in the manifest, move on. Parity of *outputs* is what the demo needs; binary-model parity is the gold-plated version.
- Any stretch item that would force a **re-deploy on TUE June 16** → cut it. Nothing re-freezes the model on submission day.
- Every cut is a dated entry in `docs/decision-log.md`. No silent removal.

---

## 5. G3 / G4 gate checklist (start now, grow it)

**G3 — artifact-freeze (June 15 EOD, hard):**
- [x] `python -m ingest.cpsc` rebuilt the real corpus (real public data) — **631 real CPSC recalls, live API, Jun 15**
- [x] `python -m classifier.build` emits real classifications, **zero `"placeholder": true`** — verified clean
- [x] `validate_artifacts.py --strict` green for Engine C (shapes + locked constraints + manifest SHA parity + reverse-coverage) — **C5 verified Jun 15: non-strict `conformant`/exit 0, zero placeholders.** *The 5 `--strict` errors are ALL Pravin's A/B (fibers/enzymes/pairs, not produced) — zero Engine C errors; full team-wide `--strict` green is blocked on Pravin.*
- [x] Frozen-model parity: output SHA in manifest (`frozenParity` anchor); endpoint verifies served `classifications.json` on startup + refuses to boot on mismatch (`model_sha_ok` on `/healthz`) — **C1 DONE Jun 15** (output-parity per §4; 13 tests green)
- [x] Render endpoint deployed; `/healthz`, `/classify/{id}`, `/passport/{id}` all 200 — **C2 DONE Jun 15** (`https://rewear-engine-c.onrender.com`, off-box smoke green)
- [x] Keepalive cron live + green (endpoint stays warm) — **C3 DONE Jun 15**; green run confirmed. *Caveat: GH throttles the cron to hours, not `*/10` → manually warm `/healthz` ~2 min pre-demo (endpoint is credibility, not a demo dependency)*
- [x] Stephen has the Render URL for Vercel env (4.1) — **handed off Jun 15** (`NEXT_PUBLIC_ENGINE_C_API_URL = https://rewear-engine-c.onrender.com`, bare host). 🟡 *Stephen still needs to SET it in Vercel + redeploy — Vinh has no Vercel access; not verified here.*
- [x] **Model frozen — no retrains after this point** — **C5 Jun 15:** Engine C bundle SHA-stable (`bb95f4e8…`), committed, == live endpoint. Freeze holds.

**G4 — submit (June 16 11:59pm, HARD):**
- [ ] Deployed golden-path green in **incognito**
- [ ] Passport QR physically scans on the deployed site → resolves
- [ ] Endpoint warm at demo time (keepalive)
- [ ] Pitch pack (§7) one-pager ready for residency Q&A
- [ ] PR-AUC numbers on the passport are the REAL achieved values
- [ ] Nothing committed to the public repo after 11:59pm (June 17 is present-only)

---

## 6. Known honesty soft-spots to have an answer for (judge defense)

These are in the code/notes already; have a one-liner ready, don't get caught flat:
- **Flammability PR-AUC ~0.99** is product-type signal, not magic. The label-defining keywords are stripped from features (`model.py:_strip_label_terms`) so it can't cheat off the word "flammable"; it predicts from product type + co-occurring language. Say that plainly.
- **Lead PR-AUC ~0.25** is honest and low because real positives are rare (<5%). That's the point: ROC-AUC ~0.89 "lies" on rare positives, so we report PR-AUC. We don't fabricate a number. The deterministic rule layer — not the ML — owns the lead decision (cited 100 ppm threshold), which is exactly why a regulator trusts it.
- **`compositionDrivers`, not SHAP** (until C9). The field is honestly named — they're real composition ratios, not SHAP attributions. Don't call them SHAP unless C9 ships.
- **TRL 2-3 / inSilico: true** are mandatory honesty fields in every passport. Never emit UI/data that contradicts them or the `aromaticAmineRelease: "NONE"` aliphatic-design constraint.

---

## 7. Coordination protocol (per PLAN.md)

- Claim each task in `PLAN.md`: set 🟡 + your name + timestamp, commit **PLAN.md only**, push. That's your lock.
- Your lane owns `engine-c/` + `data/datasets/`. No overlap with Stephen (`frontend/`) or Pravin (`backend/`).
- **Any change to the passport/classification shape** = `⚠️ CONTRACT` commit prefix + ping Stephen + frontend BEFORE committing. Those shapes are the frontend's anti-drift surface.
- Per wave: atomic commits → quick adversarial review (a `code-review` pass or 2–3 parallel reviewer agents) → fix-wave → note it in the live build log. Don't self-merge the deploy without a smoke test.
```
