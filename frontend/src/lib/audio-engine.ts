/**
 * Shared Web Audio engine. Two layers, both demo-safe and offline:
 *
 *  1. A fully-synthesized fallback that ALWAYS works with no assets: a rich,
 *     reverb-fed Am(add9) pad (the "molecular lab instrument" bed), a carbamate
 *     cleavage cue, and a UI tick.
 *  2. If `/audio/ambient.mp3` (the kie.ai Suno bed) is present it is decoded and
 *     swapped in for the pad the moment it finishes loading. Same-origin, so
 *     still offline-safe. The cleavage cue and tick stay synthesized.
 *
 * The AudioContext is created lazily on the first user gesture (the sound toggle)
 * to satisfy autoplay policy. Cues no-op while sound is off.
 */

type WindowWithWebkit = Window & { webkitAudioContext?: typeof AudioContext };

const AMBIENT_URL = "/audio/ambient.mp3";

function buildReverbIR(ctx: BaseAudioContext, seconds = 2.6, decay = 2.4): AudioBuffer {
  const rate = ctx.sampleRate;
  const len = Math.floor(rate * seconds);
  const ir = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return ir;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private wet: ConvolverNode | null = null;
  private ambientNodes: AudioNode[] = [];
  private ambientGain: GainNode | null = null;
  private buffers: { ambient?: AudioBuffer } = {};
  private prep: Promise<void> | null = null;
  private usingSampleBed = false;
  private _on = false;

  get on() {
    return this._on;
  }

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as WindowWithWebkit).webkitAudioContext;
      if (!Ctor) return null;
      const ctx = new Ctor();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(ctx.destination);
      // shared reverb send: a little space behind everything
      this.wet = ctx.createConvolver();
      this.wet.buffer = buildReverbIR(ctx);
      const wetGain = ctx.createGain();
      wetGain.gain.value = 0.5;
      this.wet.connect(wetGain);
      wetGain.connect(this.master);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  /** Fetch + decode the optional sample bed/snap once. Failures are fine: we
   *  keep the synth fallback. */
  private prepareSamples(ctx: AudioContext): Promise<void> {
    if (this.prep) return this.prep;
    const load = async (url: string): Promise<AudioBuffer | undefined> => {
      try {
        const res = await fetch(url);
        if (!res.ok) return undefined;
        return await ctx.decodeAudioData(await res.arrayBuffer());
      } catch {
        return undefined;
      }
    };
    // Only fetch assets we actually ship. The Suno bed exists; the cleavage snap
    // stays synthesized (its SFX gen is unavailable), so we don't 404-fetch it.
    this.prep = (async () => {
      this.buffers.ambient = await load(AMBIENT_URL);
    })();
    return this.prep;
  }

  /** Toggle sound. Returns the new on/off state. Call only from a user gesture. */
  toggle(): boolean {
    return this._on ? (this.disable(), false) : (this.enable(), true);
  }

  enable() {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    this._on = true;
    this.master.gain.cancelScheduledValues(ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.8);
    this.startSynthBed(ctx); // instant sound
    this.tick();
    // upgrade to the produced bed once decoded, if it exists and we're still on
    void this.prepareSamples(ctx).then(() => {
      if (this._on && !this.usingSampleBed && this.buffers.ambient) {
        this.stopBed();
        this.startSampleBed(ctx);
      }
    });
  }

  disable() {
    this._on = false;
    const ctx = this.ctx;
    if (ctx && this.master) {
      this.master.gain.cancelScheduledValues(ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    }
  }

  private stopBed() {
    for (const n of this.ambientNodes) {
      try {
        if (n instanceof OscillatorNode || n instanceof AudioBufferSourceNode) n.stop();
        n.disconnect();
      } catch {
        /* already stopped */
      }
    }
    this.ambientNodes = [];
    this.ambientGain = null;
    this.usingSampleBed = false;
  }

  /** The produced Suno bed, looped under the UI. */
  private startSampleBed(ctx: AudioContext) {
    if (!this.master || !this.buffers.ambient) return;
    const src = ctx.createBufferSource();
    src.buffer = this.buffers.ambient;
    src.loop = true;
    const g = ctx.createGain();
    g.gain.value = 0.5;
    src.connect(g);
    g.connect(this.master);
    if (this.wet) g.connect(this.wet);
    src.start();
    this.ambientNodes = [src, g];
    this.ambientGain = g;
    this.usingSampleBed = true;
  }

  /** Synthesized fallback bed: a reverb-fed Am(add9) pad that breathes. Cold,
   *  spacious, sits low under the interface. */
  private startSynthBed(ctx: AudioContext) {
    if (!this.master || this.ambientNodes.length) return;
    const bed = ctx.createGain();
    bed.gain.value = 0.085;
    bed.connect(this.master);
    if (this.wet) bed.connect(this.wet);
    this.ambientGain = bed;
    const created: AudioNode[] = [bed];

    // slow amplitude breathing
    const trem = ctx.createOscillator();
    trem.type = "sine";
    trem.frequency.value = 0.05;
    const tremDepth = ctx.createGain();
    tremDepth.gain.value = 0.02;
    trem.connect(tremDepth);
    tremDepth.connect(bed.gain);
    trem.start();
    created.push(trem, tremDepth);

    // shared slow filter LFO
    const flto = ctx.createOscillator();
    flto.type = "sine";
    flto.frequency.value = 0.08;
    const fltoDepth = ctx.createGain();
    fltoDepth.gain.value = 260;
    flto.connect(fltoDepth);
    flto.start();
    created.push(flto, fltoDepth);

    // sub
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.value = 55; // A1
    const subG = ctx.createGain();
    subG.gain.value = 0.6;
    sub.connect(subG);
    subG.connect(bed);
    sub.start();
    created.push(sub, subG);

    // pad voices: Am(add9) spread (A2, E3, C4), each a detuned unison pair
    // panned for width, through an LFO-swept lowpass.
    const voices: [number, number][] = [
      [110.0, -0.35], // A2
      [164.81, 0.35], // E3
      [261.63, -0.2], // C4
    ];
    for (const [freq, pan] of voices) {
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 720;
      lp.Q.value = 0.4;
      fltoDepth.connect(lp.frequency);
      const panner = ctx.createStereoPanner();
      panner.pan.value = pan;
      const vG = ctx.createGain();
      vG.gain.value = 0.22;
      lp.connect(panner);
      panner.connect(vG);
      vG.connect(bed);
      for (const detune of [-6, 6]) {
        const o = ctx.createOscillator();
        o.type = "triangle";
        o.frequency.value = freq;
        o.detune.value = detune;
        o.connect(lp);
        o.start();
        created.push(o);
      }
      created.push(lp, panner, vG);
    }

    // glassy shimmer: a high voice on the 9th (B), barely there, slow swell
    const shimmer = ctx.createOscillator();
    shimmer.type = "sine";
    shimmer.frequency.value = 987.77; // B5
    const shG = ctx.createGain();
    shG.gain.value = 0.0;
    const shLfo = ctx.createOscillator();
    shLfo.type = "sine";
    shLfo.frequency.value = 0.06;
    const shLfoDepth = ctx.createGain();
    shLfoDepth.gain.value = 0.015;
    const shBias = ctx.createConstantSource();
    shBias.offset.value = 0.018;
    shLfo.connect(shLfoDepth);
    shLfoDepth.connect(shG.gain);
    shBias.connect(shG.gain);
    shimmer.connect(shG);
    shG.connect(bed);
    if (this.wet) shG.connect(this.wet);
    shimmer.start();
    shLfo.start();
    shBias.start();
    created.push(shimmer, shG, shLfo, shLfoDepth, shBias);

    this.ambientNodes = created;
    this.usingSampleBed = false;
  }

  /** Carbamate-cleavage cue: the produced snap if present, else a synthesized
   *  band-passed swell + falling tone. */
  cleavage(intensity = 1) {
    if (!this._on) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const now = ctx.currentTime;

    const dur = 1.2;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(640, now);
    bp.frequency.linearRampToValueAtTime(180, now + dur);
    bp.Q.value = 0.7;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0, now);
    ng.gain.linearRampToValueAtTime(0.18 * intensity, now + 0.05);
    ng.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    noise.connect(bp);
    bp.connect(ng);
    ng.connect(this.master);
    if (this.wet) ng.connect(this.wet);
    noise.start(now);
    noise.stop(now + dur);

    // a resonant bloom that rings after the snap
    for (const [f, g0, len] of [
      [330, 0.12, 1.0],
      [495, 0.06, 1.4],
    ] as const) {
      const tone = ctx.createOscillator();
      tone.type = "triangle";
      tone.frequency.setValueAtTime(f, now);
      tone.frequency.exponentialRampToValueAtTime(f * 0.66, now + len * 0.8);
      const tg = ctx.createGain();
      tg.gain.setValueAtTime(0, now);
      tg.gain.linearRampToValueAtTime(g0 * intensity, now + 0.08);
      tg.gain.exponentialRampToValueAtTime(0.0001, now + len);
      tone.connect(tg);
      tg.connect(this.master);
      if (this.wet) tg.connect(this.wet);
      tone.start(now);
      tone.stop(now + len);
    }
  }

  /** A soft, short UI tick for navigation and confirmations. */
  tick() {
    if (!this._on) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = 880;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.045, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    o.connect(g);
    g.connect(this.master);
    o.start(now);
    o.stop(now + 0.12);
  }
}

export const audioEngine = new AudioEngine();
