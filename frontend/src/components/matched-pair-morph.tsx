"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

// The two-accent system: amber fiber meets bio-green enzyme, fusing at the cleavage.
const FIBER = "#e0934f";
const ENZYME = "#34e0c4";
const WHITE = "#ffffff";

const prefersReduced = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const FIBER_AT = new THREE.Vector3(-3.3, 0.2, 0);
const POCKET_AT = new THREE.Vector3(3.0, -0.1, 0);

/** smoothstep ramp on [a,b] */
function ramp(a: number, b: number, t: number) {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
}

/** The amber fiber stub on the left, the carbamate the substrate detaches from. */
function FiberStub() {
  return (
    <group position={FIBER_AT.toArray()}>
      {[-0.9, 0, 0.9].map((x) => (
        <mesh key={x} position={[x, 0, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color={FIBER} emissive={FIBER} emissiveIntensity={0.9} roughness={0.4} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

/** The enzyme's Ser-His-Asp pocket on the right (three bio orbs forming a cradle). */
function Pocket({ flareRef }: { flareRef: React.RefObject<THREE.MeshStandardMaterial | null> }) {
  const triad: [number, number, number][] = [
    [-0.55, 0.5, 0.3],
    [0.55, 0.42, -0.2],
    [0, -0.55, 0.25],
  ];
  return (
    <group position={POCKET_AT.toArray()}>
      {triad.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.32, 24, 24]} />
          <meshStandardMaterial
            ref={i === 0 ? flareRef : undefined}
            color={ENZYME}
            emissive={ENZYME}
            emissiveIntensity={1.6}
            toneMapped={false}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

function Morph({ reduced }: { reduced: boolean }) {
  const subRef = useRef<THREE.Group>(null);
  const bondMat = useRef<THREE.MeshStandardMaterial>(null);
  const fragA = useRef<THREE.Mesh>(null);
  const fragB = useRef<THREE.Mesh>(null);
  const flare = useRef<THREE.MeshStandardMaterial>(null);
  const dock = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    // reduced-motion freezes at the dock moment; otherwise a 6.5s loop.
    const t = reduced ? 0.55 : (state.clock.elapsedTime % 6.5) / 6.5;
    const sub = subRef.current;
    if (!sub) return;

    // travel 0 -> 0.5: the substrate arcs from the fiber to the pocket
    const travel = ramp(0, 0.5, t);
    const pos = FIBER_AT.clone().lerp(POCKET_AT, travel);
    pos.y += Math.sin(travel * Math.PI) * 1.7;
    sub.position.copy(pos);
    sub.rotation.y = travel * Math.PI * 2;
    sub.visible = t < 0.72;

    // cleavage 0.5 -> 0.62: the bond flashes amber -> white -> green, pocket flares
    const cleave = ramp(0.5, 0.62, t);
    const settle = 1 - ramp(0.62, 0.8, t);
    if (bondMat.current) {
      bondMat.current.color.copy(new THREE.Color(FIBER)).lerp(new THREE.Color(WHITE), cleave);
      bondMat.current.emissive.copy(new THREE.Color(FIBER)).lerp(new THREE.Color(ENZYME), cleave);
      bondMat.current.emissiveIntensity = 1.0 + cleave * settle * 3.2;
    }
    if (flare.current) flare.current.emissiveIntensity = 1.6 + cleave * settle * 3.2;
    if (dock.current) dock.current.intensity = cleave * settle * 130;

    // fragments 0.66 -> 1: two recovered monomers drift apart and fade
    const split = ramp(0.66, 1, t);
    const drift = split * 2.4;
    const fade = 1 - split;
    if (fragA.current) {
      fragA.current.visible = split > 0.02;
      fragA.current.position.set(POCKET_AT.x - drift, POCKET_AT.y + drift * 0.45, 0);
      (fragA.current.material as THREE.MeshStandardMaterial).opacity = fade;
    }
    if (fragB.current) {
      fragB.current.visible = split > 0.02;
      fragB.current.position.set(POCKET_AT.x + drift, POCKET_AT.y - drift * 0.45, 0);
      (fragB.current.material as THREE.MeshStandardMaterial).opacity = fade;
    }
  });

  return (
    <group>
      <FiberStub />
      <Pocket flareRef={flare} />
      <pointLight ref={dock} position={POCKET_AT.toArray()} color={ENZYME} intensity={0} distance={9} />

      {/* the carbamate substrate: a short chain whose central bond cleaves */}
      <group ref={subRef} position={FIBER_AT.toArray()}>
        {[-0.5, -0.17, 0.17, 0.5].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]}>
            <sphereGeometry args={[0.16, 18, 18]} />
            <meshStandardMaterial
              ref={i === 1 ? bondMat : undefined}
              color={FIBER}
              emissive={FIBER}
              emissiveIntensity={1.0}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      {/* the two recovered monomer fragments */}
      <mesh ref={fragA} position={POCKET_AT.toArray()} visible={false}>
        <sphereGeometry args={[0.18, 18, 18]} />
        <meshStandardMaterial color={ENZYME} emissive={ENZYME} emissiveIntensity={1.4} transparent toneMapped={false} />
      </mesh>
      <mesh ref={fragB} position={POCKET_AT.toArray()} visible={false}>
        <sphereGeometry args={[0.18, 18, 18]} />
        <meshStandardMaterial color={FIBER} emissive={FIBER} emissiveIntensity={1.4} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}

/** The matched-pair handoff: one inverse-design problem, two coupled molecules,
 *  made visceral. The amber fiber's carbamate is the exact bond the green enzyme
 *  is built to cut. Proof it is one loop, not two projects (judge-defense Q7). */
export default function MatchedPairMorph() {
  const reduced = prefersReduced();
  return (
    <Canvas camera={{ position: [0, 0.5, 9], fov: 42 }} dpr={[1, 2]} gl={{ antialias: true }}>
      <fog attach="fog" args={["#0a0d12", 11, 26]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[-6, 4, 6]} intensity={70} color={FIBER} />
      <pointLight position={[6, -3, 4]} intensity={50} color={ENZYME} />
      <Morph reduced={reduced} />
      <Sparkles count={36} scale={[15, 7, 7]} size={1.8} speed={reduced ? 0 : 0.28} color={ENZYME} opacity={0.4} />
      <EffectComposer>
        <Bloom mipmapBlur intensity={0.95} luminanceThreshold={0.6} luminanceSmoothing={0.3} />
        <Vignette offset={0.3} darkness={0.85} />
      </EffectComposer>
    </Canvas>
  );
}
