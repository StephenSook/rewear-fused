"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { buildLoopBuffers } from "./loop-geometry";
import { loopProgress } from "./loop-progress";

const N = 90000;

const VERT = /* glsl */ `
  uniform float uProgress;
  uniform float uTime;
  uniform float uPixelRatio;
  attribute vec3 aMonomer;
  attribute vec3 aEnd;
  attribute float aSeed;
  varying vec3 vColor;

  void main() {
    float p = uProgress;
    vec3 pos;
    if (p < 0.5) {
      pos = mix(position, aMonomer, smoothstep(0.0, 0.5, p));
    } else {
      pos = mix(aMonomer, aEnd, smoothstep(0.5, 1.0, p));
    }
    // storm turbulence, peaks at the cleavage moment (p ~ 0.5)
    float storm = exp(-pow((p - 0.5) / 0.22, 2.0));
    float ph = aSeed * 6.2831 + uTime * 0.8;
    pos += vec3(sin(ph), cos(ph * 1.3), sin(ph * 0.7)) * storm * 0.6;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (5.5 * uPixelRatio) * (3.0 / -mv.z);

    vec3 amber = vec3(0.90, 0.60, 0.33);
    vec3 bio   = vec3(0.22, 0.88, 0.78);
    vec3 white = vec3(1.0);
    vec3 base = mix(amber, bio, smoothstep(0.15, 0.45, p));
    base = mix(base, mix(bio, amber, 0.5), smoothstep(0.55, 0.95, p));
    float flash = exp(-pow((p - 0.46) / 0.07, 2.0)); // accents fuse to white at cleavage
    vColor = mix(base, white * 1.5, flash); // brighter HDR-ish fuse: additive blooms the cleavage
  }
`;

const FRAG = /* glsl */ `
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    // soft round point; the EffectComposer bloom owns the glow now, so no
    // in-shader core boost (that double-bright washed the centered headline)
    float a = smoothstep(0.5, 0.0, d) * 0.85;
    gl_FragColor = vec4(vColor, a);
  }
`;

function Storm({ reduced }: { reduced: boolean }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { start, mono, end, seed } = useMemo(() => buildLoopBuffers(N), []);
  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uPixelRatio: {
        value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1,
      },
    }),
    [],
  );

  useFrame((state, dt) => {
    const m = matRef.current;
    if (!m) return;
    // scroll-driven morph always tracks; idle shimmer + camera sway freeze under
    // prefers-reduced-motion (the loop still reads, just without ambient motion).
    if (!reduced) m.uniforms.uTime!.value += dt;
    const cur = m.uniforms.uProgress!.value;
    m.uniforms.uProgress!.value = cur + (loopProgress.value - cur) * Math.min(1, dt * 4);
    state.camera.position.x = reduced ? 0 : Math.sin(state.clock.elapsedTime * 0.1) * 0.35;
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[start, 3]} />
        <bufferAttribute attach="attributes-aMonomer" args={[mono, 3]} />
        <bufferAttribute attach="attributes-aEnd" args={[end, 3]} />
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

export default function ParticleStorm() {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  return (
    <Canvas
      camera={{ position: [0, 0, 6.5], fov: 50 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: false }}
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    >
      <Storm reduced={!!reduced} />
      {!reduced && (
        <EffectComposer>
          {/* gentle + high threshold so the cleavage flash and brightest cores
              halo softly without washing the centered headline */}
          <Bloom mipmapBlur intensity={0.45} luminanceThreshold={1.0} luminanceSmoothing={0.25} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
