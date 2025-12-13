"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Mood } from "./EmotionalSupportBlob";

const MOOD_COLORS: Record<Mood, string> = {
  calm: "#B9A7FF",
  supportive: "#7EF0C7",
  sad: "#6FB7FF",
  encouraging: "#FFD56B",
};

export default function BlobCharacter({
  mood = "calm",
  talking = false,
  thinking = false,
  intensity = 0.4,
  audioLevel = 0,
}: {
  mood?: Mood;
  talking?: boolean;
  thinking?: boolean;
  intensity?: number;
  audioLevel?: number; // 0..1
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const smileRef = useRef<THREE.Mesh>(null);
  const talkMouthRef = useRef<THREE.Mesh>(null);

  // Color that subtly “softens” (mixes toward white) when intensity is low
  const { bodyColor, emissiveColor } = useMemo(() => {
    const base = new THREE.Color(MOOD_COLORS[mood]);
    const softened = base
      .clone()
      .lerp(new THREE.Color("#ffffff"), 0.22 - intensity * 0.12);
    return {
      bodyColor: softened.getStyle(),
      emissiveColor: base.getStyle(),
    };
  }, [mood, intensity]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const m = meshRef.current;
    if (!m) return;

    // baseline breathing
    const breathe = 1 + Math.sin(t * 2) * 0.03;
    m.scale.y = breathe;

    // thinking / talking body motion
    const thinkWobble = thinking ? 0.02 + intensity * 0.03 : 0;
    const talkPulse = talking ? 0.035 + intensity * 0.05 : 0;

    if (talking) {
      m.scale.x = 1 + Math.sin(t * 10) * talkPulse;
      m.scale.z = 1 + Math.sin(t * 10) * talkPulse;
    } else if (thinking) {
      m.scale.x = 1 + Math.sin(t * 4) * thinkWobble;
      m.scale.z = 1 + Math.cos(t * 4) * thinkWobble;
    } else {
      m.scale.x = 1;
      m.scale.z = 1;
    }

    // gentle float
    m.position.y = Math.sin(t * 2) * 0.05;

    // audio-synced mouth open
    const talkMouth = talkMouthRef.current;
    if (talkMouth) {
      const level = Math.max(0, Math.min(1, audioLevel));

      if (talking) {
        // Stronger mapping: makes mouth open clearly on louder parts
        const targetY = 0.1 + level * (1.25 + intensity * 0.55);
        const targetX = 1.0;

        talkMouth.scale.y = THREE.MathUtils.lerp(
          talkMouth.scale.y,
          targetY,
          0.38
        );
        talkMouth.scale.x = THREE.MathUtils.lerp(
          talkMouth.scale.x,
          targetX,
          0.25
        );
      } else {
        talkMouth.scale.y = THREE.MathUtils.lerp(talkMouth.scale.y, 0.01, 0.25);
        talkMouth.scale.x = THREE.MathUtils.lerp(talkMouth.scale.x, 0.01, 0.25);
      }
    }

    // show/hide idle smile
    if (smileRef.current) {
      const s = talking ? 0.01 : 1;
      smileRef.current.scale.setScalar(
        THREE.MathUtils.lerp(smileRef.current.scale.x, s, 0.25)
      );
    }
  });

  return (
    <group>
      {/* BODY */}
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          color={bodyColor}
          roughness={0.24}
          metalness={0.05}
          emissive={new THREE.Color(emissiveColor)}
          emissiveIntensity={0.12}
        />
      </mesh>

      {/* FACE */}
      <group position={[0, 0.22, 1.06]}>
        {/* eyes */}
        <mesh position={[-0.25, 0.1, 0]}>
          <circleGeometry args={[0.08, 32]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0.25, 0.1, 0]}>
          <circleGeometry args={[0.08, 32]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>

        {/* highlights */}
        <mesh position={[-0.28, 0.13, 0.01]}>
          <circleGeometry args={[0.02, 20]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
        </mesh>
        <mesh position={[0.22, 0.13, 0.01]}>
          <circleGeometry args={[0.02, 20]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
        </mesh>

        {/* idle smile */}
        <mesh
          ref={smileRef}
          position={[0, -0.12, 0]}
          rotation={[0, 0, Math.PI]}
        >
          <torusGeometry args={[0.12, 0.02, 12, 32, Math.PI]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>

        {/* talking mouth */}
        <mesh ref={talkMouthRef} position={[0, -0.14, 0.01]} scale={0.01}>
          <circleGeometry args={[0.085, 32]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
      </group>
    </group>
  );
}
