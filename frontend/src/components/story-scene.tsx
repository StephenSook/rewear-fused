"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { buildStoryBuffers } from "./story-geometry";
import { storyProgress, storyPointer } from "./story-signals";

// WebGL2 GPU point cloud. ~46k on desktop, halved on small screens. The whole
// narrative morph runs in the vertex shader off one buffer set, so it stays
// cheap enough to sit live behind the scrolling text the entire page.
const N = typeof window !== "undefined" && window.innerWidth < 768 ? 24000 : 46000;

const VERT = /* glsl */ `
  uniform float uProgress;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uPointerX;
  attribute float aGroup;
  attribute float aSeed;
  varying vec3 vColor;
  varying float vAlpha;

  // rotate a point about the Y axis
  vec3 rotY(vec3 p, float a) {
    float c = cos(a), s = sin(a);
    return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
  }

  void main() {
    float p = uProgress;
    float s = aSeed;
    vec3 home = position;

    // --- beat target shapes, all derived from the home braid ---
    // breathing hero braid
    vec3 hero = home * (1.0 + 0.04 * sin(uTime * 0.6 + s * 6.2831));

    // shred: strands fan outward and rain downward (the downcycle, falling debris)
    vec3 shred = vec3(
      home.x * 1.9 + sign(home.x) * s * 1.3,
      home.y * 1.2 - (0.6 + s) * 2.6,
      home.z * 1.9
    );

    // walls: two columns, amber left, bio right, a dark gap between them
    float side = aGroup > 0.5 ? 1.0 : -1.0;
    vec3 walls = vec3(
      side * (1.7 + s * 0.35),
      home.y * 1.55 + (s - 0.5) * 0.6,
      (s - 0.5) * 0.9
    );

    // field: a wide low horizon band, reads as the scale of the problem, not noise
    vec3 field = vec3(
      (s - 0.5) * 12.0,
      (fract(s * 57.0) - 0.5) * 2.0,
      (fract(s * 131.0) - 0.5) * 2.4 - 1.0
    );

    // core: collapse to a tight glowing seed (the fused new molecule)
    vec3 core = normalize(home + 0.0001) * (0.22 + s * 0.18);

    // chain the beats with smoothstep windows (same technique as the loop storm)
    vec3 pos = hero;
    pos = mix(pos, shred, smoothstep(0.22, 0.40, p));
    pos = mix(pos, walls, smoothstep(0.40, 0.58, p));
    pos = mix(pos, field, smoothstep(0.58, 0.74, p));
    pos = mix(pos, core,  smoothstep(0.80, 0.96, p));

    // slow living rotation + cursor-driven swirl
    pos = rotY(pos, uTime * 0.06 + uPointerX * 0.35);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    // points swell as the cloud collapses, so the fused seed reads as a point of light
    float coreAmt = smoothstep(0.80, 0.96, p);
    gl_PointSize = (4.2 * uPixelRatio) * (3.0 / -mv.z) * (1.0 + coreAmt * 1.6);

    // --- color: amber fiber vs bio enzyme, fusing to white at the close ---
    vec3 amber = vec3(0.90, 0.60, 0.33);
    vec3 bio   = vec3(0.22, 0.88, 0.78);
    vec3 white = vec3(1.0);
    vec3 base = mix(amber, bio, aGroup);
    // a held fuse-to-light through the closing beat, not a single-frame blink
    float flash = exp(-pow((p - 0.94) / 0.085, 2.0));
    vColor = mix(base, white, flash) * (0.82 + 0.18 * sin(uTime + s * 6.2831));

    // ease the wide field down slightly so the headline reads cleaner
    float thin = smoothstep(0.58, 0.74, p) * 0.28;
    vAlpha = clamp(0.82 - thin + flash * 0.5, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    // soft round point; the composer bloom owns the glow now, so no in-shader
    // core boost (that risked washing the headline this cloud sits behind)
    float a = smoothstep(0.5, 0.0, d) * vAlpha;
    gl_FragColor = vec4(vColor, a);
  }
`;

function Cloud({ reduced }: { reduced: boolean }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { home, group, seed } = useMemo(() => buildStoryBuffers(N), []);
  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uPointerX: { value: 0 },
      uPixelRatio: {
        value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1,
      },
    }),
    [],
  );

  useFrame((state, dt) => {
    const m = matRef.current;
    if (!m) return;
    if (!reduced) m.uniforms.uTime!.value += dt;
    // ease progress toward the scroll signal so the morph never snaps
    const cur = m.uniforms.uProgress!.value;
    m.uniforms.uProgress!.value = cur + (storyProgress.value - cur) * Math.min(1, dt * 3.5);
    if (!reduced) {
      m.uniforms.uPointerX!.value +=
        (storyPointer.x - m.uniforms.uPointerX!.value) * Math.min(1, dt * 3);
    }

    // cursor-reactive camera parallax, damped for the smooth hubtown feel
    const cam = state.camera;
    const tx = reduced ? 0 : storyPointer.x * 0.9;
    const ty = reduced ? 0 : storyPointer.y * 0.55;
    cam.position.x += (tx - cam.position.x) * Math.min(1, dt * 2.5);
    cam.position.y += (ty - cam.position.y) * Math.min(1, dt * 2.5);
    cam.lookAt(0, 0, 0);
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[home, 3]} />
        <bufferAttribute attach="attributes-aGroup" args={[group, 1]} />
        <bufferAttribute attach="attributes-aSeed" args={[seed, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={VERT}
        fragmentShader={FRAG}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function StoryScene() {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 52 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: false }}
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    >
      <Cloud reduced={!!reduced} />
      {!reduced && (
        <EffectComposer>
          {/* gentlest of the three: this cloud sits directly behind the headline,
              so only the brightest fuse pixels halo, never the body copy */}
          <Bloom mipmapBlur intensity={0.4} luminanceThreshold={1.0} luminanceSmoothing={0.25} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
