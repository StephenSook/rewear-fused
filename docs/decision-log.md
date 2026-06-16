# Decision Log — Engine C (Vinh's lane)

Per the execution plan §4: every scope cut is a dated entry here. No silent removal.

---

## 2026-06-15 — CUT stretch C7–C10 (rule-corpus expansion, EU Safety Gate, real SHAP, isotonic calibration)

**Decision:** Do not pursue any of the stretch items C7–C10. Stop at Core (C0–C6), which is complete and verified a full day ahead of the G4 submit deadline.

**Why:**
- **All stretch items reopen the C5 freeze.** `classifier/build.py` consumes `rules.py` + `regulations.json` + the trained model and regenerates `classifications.json` + passports + `manifest.json` SHAs. Any change to rules (C7), data (C8), or the model (C9/C10) changes those SHAs → the C5 freeze is invalidated and the live Render endpoint's frozen-parity gate would fail until a re-build + re-validate + re-verify + re-deploy + re-smoke cycle is completed green.
- **The plan's own cut-trigger fires:** §4 — *"any stretch item that would force a re-deploy → cut it."* C7–C10 all force a re-deploy.
- **Low demo payoff for the risk:** the demo has 3 garments. Expanding `regulations.json` toward 85+ thresholds only changes a passport if a new rule actually *fires* on one of those 3 garments; most added thresholds would be an invisible catalog change. The judge-visible gain is marginal versus the downside of a broken live endpoint the day before submit.
- **User directive (2026-06-15):** "whatever ables us, don't take any risks." Honoring "no risk" literally means not touching the frozen judged path.

**State at decision time (verified, not assumed):**
- Core C0–C6 all ✅ done. Live endpoint `https://rewear-engine-c.onrender.com` green (frozen-parity SHA `bb95f4e8…`). C5 freeze clean (zero placeholders, SHA-stable, matches the live bundle). Pitch pack `docs/pitch_engine_c.md` drafted.

**Reversibility:** C7 (rule corpus) is the recommended item IF revisited — but only on Jun 15 (never Jun 16/submit day), and only via a controlled re-freeze + re-deploy + re-smoke. C9/C10 (model retrains) must never run on submit day. As of this entry, all four are cut.
