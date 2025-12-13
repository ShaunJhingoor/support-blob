"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import BlobCharacter from "./BlobCharacter";

export default function CharacterScene({
  mood,
  talking,
  thinking,
  intensity,
}: {
  mood: "calm" | "supportive" | "sad" | "encouraging";
  talking: boolean;
  thinking: boolean;
  intensity: number;
}) {
  return (
    <div className="h-[360px] w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
      <Canvas camera={{ position: [0, 0.8, 3], fov: 45 }} shadows>
        <ambientLight intensity={0.65} />
        <directionalLight position={[4, 6, 4]} intensity={1.1} castShadow />

        {/* ground */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -1.2, 0]}
          receiveShadow
        >
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#0b1220" />
        </mesh>

        <BlobCharacter
          mood={mood}
          talking={talking}
          thinking={thinking}
          intensity={intensity}
        />
        <OrbitControls enableZoom={false} />
      </Canvas>
    </div>
  );
}
