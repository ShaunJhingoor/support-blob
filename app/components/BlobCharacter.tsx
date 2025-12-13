"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type Mood = "calm" | "supportive" | "sad" | "encouraging";

export default function BlobCharacter({
  mood = "calm",
  talking = false,
  thinking = false,
  intensity = 0.4,
}: {
  mood?: Mood;
  talking?: boolean;
  thinking?: boolean;
  intensity?: number; // 0..1
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const color = useMemo(() => {
    // soft “emotional safety” palette
    if (mood === "supportive") return "#a7f3d0";
    if (mood === "sad") return "#93c5fd";
    if (mood === "encouraging") return "#fde68a";
    return "#c4b5fd"; // calm
  }, [mood]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const m = meshRef.current;
    if (!m) return;

    // baseline breathing
    const breathe = 1 + Math.sin(t * 2) * 0.03;

    // thinking: gentle wobble
    const thinkWobble = thinking ? 0.03 + intensity * 0.03 : 0;

    // talking: faster pulse
    const talkPulse = talking ? 0.05 + intensity * 0.06 : 0;

    m.scale.y = breathe;

    if (talking) {
      m.scale.x = 1 + Math.sin(t * 18) * talkPulse;
      m.scale.z = 1 + Math.sin(t * 18) * talkPulse;
    } else if (thinking) {
      m.scale.x = 1 + Math.sin(t * 6) * thinkWobble;
      m.scale.z = 1 + Math.cos(t * 6) * thinkWobble;
    } else {
      m.scale.x = 1;
      m.scale.z = 1;
    }

    // float
    m.position.y = Math.sin(t * 2) * 0.05;
  });

  return (
    <mesh ref={meshRef} castShadow>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial color={color} roughness={0.35} metalness={0.08} />
    </mesh>
  );
}
