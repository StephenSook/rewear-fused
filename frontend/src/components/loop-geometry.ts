/**
 * Procedural particle target buffers for the closed-loop storm:
 *  - start: a onesie silhouette point cloud (the worn garment)
 *  - mono:  a scattered cloud (depolymerized monomers)
 *  - end:   an independently-sampled onesie (re-spun into a new garment)
 *  - seed:  per-particle randomness for the storm turbulence
 */

type Region = { x: [number, number]; y: [number, number]; w: number };

// Onesie regions (torso, two legs, two sleeves), weighted by area.
const REGIONS: Region[] = [
  { x: [-0.55, 0.55], y: [-0.1, 0.95], w: 1.155 },
  { x: [-0.5, -0.05], y: [-1.15, -0.1], w: 0.4725 },
  { x: [0.05, 0.5], y: [-1.15, -0.1], w: 0.4725 },
  { x: [-1.05, -0.55], y: [0.45, 0.9], w: 0.225 },
  { x: [0.55, 1.05], y: [0.45, 0.9], w: 0.225 },
];
const TOTAL_W = REGIONS.reduce((s, r) => s + r.w, 0);
const SCALE = 1.7;

function sampleOnesie(): [number, number, number] {
  let pick = Math.random() * TOTAL_W;
  let region = REGIONS[0]!;
  for (const r of REGIONS) {
    if (pick <= r.w) {
      region = r;
      break;
    }
    pick -= r.w;
  }
  const x = region.x[0] + Math.random() * (region.x[1] - region.x[0]);
  const y = region.y[0] + Math.random() * (region.y[1] - region.y[0]);
  const z = (Math.random() - 0.5) * 0.35;
  return [x * SCALE, y * SCALE, z * SCALE];
}

function sampleSphere(radius: number): [number, number, number] {
  const u = Math.random();
  const v = Math.random();
  const theta = u * Math.PI * 2;
  const phi = Math.acos(2 * v - 1);
  const r = radius * Math.cbrt(Math.random());
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi),
  ];
}

export function buildLoopBuffers(n: number) {
  const start = new Float32Array(n * 3);
  const mono = new Float32Array(n * 3);
  const end = new Float32Array(n * 3);
  const seed = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const s = sampleOnesie();
    const e = sampleOnesie();
    const m = sampleSphere(2.3);
    start[i * 3] = s[0];
    start[i * 3 + 1] = s[1];
    start[i * 3 + 2] = s[2];
    end[i * 3] = e[0];
    end[i * 3 + 1] = e[1];
    end[i * 3 + 2] = e[2];
    mono[i * 3] = m[0];
    mono[i * 3 + 1] = m[1];
    mono[i * 3 + 2] = m[2];
    seed[i] = Math.random();
  }
  return { start, mono, end, seed };
}
