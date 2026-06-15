# Demo Video Handoff: Vinh

You own the DevPost demo video. The goal is one clean, high-quality, ~2.5 to 3-minute cut that makes the loop visceral and reads as REAL working software. This doc gives you the script, the tool stack, what to capture, the hard constraints, and the export + upload settings. The shot-by-shot voiceover script is already written: **`docs/demo_script.md`** (use it verbatim, it leads with the number and is honesty-checked).

## The goal in one line
Judges score what you BUILT, shown running on real data. Real screen capture is the majority of the video; everything else is connective tissue. (Devpost: "you'll only hurt yourself by not showing a demo.")

## Length
Official Cox rule is 1 to 5 minutes. Best practice for a judge on their Nth video is **2:00 to 2:30** (3:00 hard ceiling). The script in `demo_script.md` runs ~3:25; trim to ~2:30-3:00 if you want it punchier (cut some of the Fiber/Engine-A narration first, keep the Passport, the Enzyme, and the Loop). Your call as the editor.

## Recommended tool stack (for a hand-edited, high-quality result)
| Stage | Pick | Why / cost |
|---|---|---|
| Screen capture | **Screen Studio** (Mac) or **OBS Studio** (free, cross-platform) | Screen Studio auto-zooms on click and smooths the cursor, which makes a dense molecular/dashboard UI readable. OBS is the free fallback and is also the 4K/60 demo-safety recording. Capture at the highest source res (Retina/2x), 4K so YouTube gives more bitrate. |
| Editor | **DaVinci Resolve (free)** | Highest quality ceiling at $0: full color grade (match the dark instrument look), Fusion, Fairlight audio, no watermark, no export cap. Studio ($295 one-time) is not needed for an 8-bit H.264 demo. |
| Transcript cleanup + captions | **Descript** (free tier covers one 3-min video) | Edit by transcript, one-click filler/silence removal, auto-captions. Rough-cut in Descript, finish in Resolve. Or use Resolve's built-in "Subtitles from Audio." |
| Voiceover | a clean **team voice** on the best mic, or **ElevenLabs** (Starter $5/mo for commercial use) | A clean human voice is most credible. ElevenLabs if you want consistent retakes. Record VO separately from capture and sync. |
| Music | **Pixabay Music** (free, commercial, no attribution) or YouTube Audio Library | Instrumental, ambient, builds quiet to hopeful. **Suno trap: music made on a FREE Suno account is non-commercial and cannot be used even if you subscribe later** (generate under an active Pro sub or don't use it). |
| B-roll (garnish only) | **kie.ai** (default), Higgsfield (one hero shot max) | Abstract transitions only (e.g. molecules-in-space). NEVER fake the app's UI or results with AI. Keep AI footage minimal so it reads as real product, not an AI sizzle reel. |

## Audio mix (the part most demo videos fail)
VO clearly on top, music low and ducked underneath. Target loudness **-14 LUFS, true peak -1 dBTP** (YouTube spec; louder gains nothing). The one carbamate-cleavage audio cue can step forward at that single beat; otherwise music stays subordinate. If the viewer remembers the soundtrack more than the product flow, the mix is wrong.

## What to capture (real screen, in pitch order)
From `demo_script.md`, off the DEPLOYED app (use the deterministic demo mode, Shift+D / ?demo=1, so each view is pre-positioned and clean):
1. **Story** cold open (the number on screen).
2. **Passport** (Engine C): a real Carter's-archetype garment classified clear/lab-test/divert with a real regulation citation, the green "aromatic amine release: NONE" check, and a **real phone scanning the GS1 QR** (do not fake the scan; give it 3-4 seconds of silence).
3. **Fiber** (Engine A): the screening funnel + the 25-35 wt% trade-off curve.
4. **Enzyme** (Engine B): the live Mol* rotation of the active site. See the honesty note below.
5. **Loop**: the scroll-scrubbed particle storm to the bond-cleavage climax with the color fusion.
Punch-in (zoom) on: the classifier verdict, the QR scan, the Ser-His-Asp pocket, the cleavage moment.

## Hard constraints (do not break these)
- **Honesty on the enzyme view.** The Mol* viewer currently renders a REFERENCE scaffold (CALB, PDB 1TCA), labeled "illustrative," because the designed enzyme PDB lands at the artifact-freeze gate. Narrate it as the script now says: "reference scaffold we designed against; FoldSeek TM under 0.5 is the design threshold; the designed structure drops in at the freeze gate." Do NOT say or caption "this is the de novo enzyme" or "no PDB match" over the 1TCA scaffold. If Pravin's real `enzyme-001.bcif` lands before you render, swap the one clause to "this is the designed fold."
- **Novelty framing.** Say "no prior art / first publicly disclosed," never a build-duration. The closing line is "Neither had any prior art" (NOT the old "72 hours" line).
- **Keep the in-silico / TRL 2-3 badge visible** in every Fiber and Enzyme frame.
- **Real data only.** No fictional persona, no synthetic data on screen. Every number on screen must match the verified-citation list; flag the ~2 t CO2e number as an estimate ("by our estimate").
- **AI-tone clean** on every on-screen word: no em-dashes, straight quotes.

## Captions
Burn them in (assume sound-off; judges scrub muted). Put the numbers, the regulation citations, the residue labels (Ser-His-Asp), and the TRL badges as standalone on-screen text. Auto-transcription mangles jargon (carbamate, urethanase, elastane, SMILES, DOIs), so hand-correct every technical term. High contrast on the near-black UI. Also upload a .srt to YouTube for accessibility.

## Structure (number-led hook -> live demo -> business close)
- 0:00-0:10 hook: the number + the two walls, over the first real frame. No logo, no title card, no team intro.
- 0:10-0:30 thesis in one plain analogy: every enzyme fails on today's elastane, so we redesigned the fiber to have a built-in cut-line and built the molecular scissor that fits only it.
- 0:30-1:30 the live demo (the majority of the video, real capture).
- 1:30-2:10 the business close (~30-40s, do not skip it): "the Nexus Circular of textiles," Engine C as the Year-1 SB 707 / EU-DPP fee-reducing compliance asset, the residency ask.
- 2:10-2:25 bookend closing line + end card with the live URL.

## Export + upload
- Export H.264 MP4, 1080p (or 4K if the source is clean), -14 LUFS audio, ~12 Mbps video / 320k audio.
- Upload to **YouTube, set Public, mark "Not for Kids"** (so judge access is not restricted), wait for full processing, paste the link into the DevPost submission, and **verify it plays in an incognito window** before you call it done.

## Demo-safety overlap (from our Demo Day research)
Also record a clean 4K/60 OBS pass of the full flow as the canonical asset AND the live-demo fallback for June 17 (the same file serves both). The backup MP4 spec for the in-person fallback: 1080p H.264, captions burned in, on the demo laptop desktop + a USB stick + the second laptop.

## Optional: the fully-automated render pipeline (if you'd rather Claude render it)
Our VARSITY project used a programmatic pipeline (Remotion 4.x + FFmpeg 7 + whisper.cpp word-level captions + auto-editor silence-cut, audio normalized to -14 LUFS, TikTok-style spring captions, rendered with VideoToolbox h264 at 12M). If you want that route instead of hand-editing, say so and we scaffold it; you'd supply a voiceover.wav, a face-cam clip, and a licensed music.mp3. For a strong hand-editor chasing the best look, DaVinci Resolve is the better path.

## Timeline
Record + edit in time to upload before the **June 16 11:59pm ET** DevPost deadline. Record early so it is not a deadline scramble; the in-person pitch on June 17 is what is primarily judged, so the video is the required artifact, not the main event.
