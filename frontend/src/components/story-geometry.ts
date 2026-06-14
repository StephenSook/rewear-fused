/**
 * Buffers for the Story scene. The home shape is two intertwined strands, an
 * amber fiber and a bio-green enzyme braid, the co-design motif. Every later
 * beat (shred, walls, field, fused core) is derived procedurally in the vertex
 * shader from these home positions, so only one small buffer set ships.
 */
export function buildStoryBuffers(n: number) {
  const home = new Float32Array(n * 3);
  const group = new Float32Array(n); // 0 = amber strand, 1 = bio strand
  const seed = new Float32Array(n);

  const TWO_PI = Math.PI * 2;
  const turns = 7;
  const radius = 1.15;
  const height = 4.2;

  for (let i = 0; i < n; i++) {
    const f = i / n;
    const g = i % 2; // interleave the two strands
    const t = f * TWO_PI * turns + g * Math.PI; // opposite phase per strand
    const jr = (Math.random() - 0.5) * 0.12; // radial jitter so it reads as fibers
    const r = radius + jr;
    home[i * 3] = Math.cos(t) * r;
    home[i * 3 + 1] = (f - 0.5) * height + (Math.random() - 0.5) * 0.1;
    home[i * 3 + 2] = Math.sin(t) * r;
    group[i] = g;
    seed[i] = Math.random();
  }

  return { home, group, seed };
}
