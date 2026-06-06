"use client";
import { useRef, useMemo, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Text } from "@react-three/drei";
import * as THREE from "three";

function generateParticles(count: number) {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const radius = 1.8 + Math.random() * 2.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = radius * Math.cos(phi);
    const c = new THREE.Color().setHSL(
      0.05 + Math.random() * 0.08,
      1,
      0.4 + Math.random() * 0.4
    );
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  return [pos, col] as const;
}

function OrbitingSphere({
  distance,
  speed,
  size,
  color,
  offset,
}: {
  distance: number;
  speed: number;
  size: number;
  color: string;
  offset: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const angleRef = useRef(offset);

  useFrame((_, delta) => {
    angleRef.current += delta * speed;
    if (meshRef.current) {
      meshRef.current.position.x = Math.cos(angleRef.current) * distance;
      meshRef.current.position.z = Math.sin(angleRef.current) * distance;
      meshRef.current.position.y = Math.sin(angleRef.current * 0.7) * 0.3;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.6}
        roughness={0.2}
        metalness={0.8}
      />
    </mesh>
  );
}

function Scene3D() {
  const sphereRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<React.ComponentRef<typeof MeshDistortMaterial>>(null);
  const timeRef = useRef(0);

  const particleCount = 1000;
  const [positions, colors] = useMemo(() => generateParticles(particleCount), []);

  const orbiters = useMemo(
    () => [
      { distance: 1.6, speed: 0.7, size: 0.1, color: "#FF6B00", offset: 0 },
      { distance: 2.2, speed: 0.4, size: 0.14, color: "#00E5FF", offset: Math.PI / 2 },
      { distance: 2.8, speed: 0.25, size: 0.07, color: "#FF8C1A", offset: Math.PI },
      { distance: 1.3, speed: 1.0, size: 0.06, color: "#38F5FF", offset: Math.PI * 1.5 },
    ],
    []
  );

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;

    if (sphereRef.current) {
      sphereRef.current.rotation.x = t * 0.15;
      sphereRef.current.rotation.y = t * 0.25;
    }

    if (materialRef.current) {
      const c1 = new THREE.Color().setHSL(0.07 + Math.sin(t * 0.4) * 0.04, 1, 0.5);
      const c2 = new THREE.Color().setHSL(0.53 + Math.sin(t * 0.3 + 1) * 0.05, 1, 0.5);
      materialRef.current.color.lerp(c1, 0.02);
      materialRef.current.emissive.lerp(c2, 0.02);
    }

    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * 0.4;
      ring1Ref.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.15) * 0.15;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z -= delta * 0.3;
      ring2Ref.current.rotation.x = Math.PI / 3 + Math.cos(t * 0.12) * 0.12;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.z += delta * 0.2;
      ring3Ref.current.rotation.x = Math.PI / 4 + Math.sin(t * 0.2) * 0.1;
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * 0.04;
      particlesRef.current.rotation.x = Math.sin(t * 0.015) * 0.08;
    }

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.25}>
        <mesh ref={sphereRef}>
          <sphereGeometry args={[0.7, 64, 64]} />
          <MeshDistortMaterial
            ref={materialRef}
            color="#FF6B00"
            emissive="#00E5FF"
            emissiveIntensity={0.5}
            roughness={0.15}
            metalness={0.85}
            distort={0.35}
            speed={2}
          />
        </mesh>
      </Float>

      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.15}>
        <Text
          fontSize={0.25}
          color="#00E5FF"
          position={[0, 0, 0.2]}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#FF6B00"
        >
          {'</>'}
        </Text>
      </Float>

      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.3, 0.012, 16, 80]} />
        <meshBasicMaterial color="#FF6B00" transparent opacity={0.35} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[1.9, 0.008, 16, 80]} />
        <meshBasicMaterial color="#00E5FF" transparent opacity={0.25} />
      </mesh>
      <mesh ref={ring3Ref}>
        <torusGeometry args={[2.5, 0.006, 16, 100]} />
        <meshBasicMaterial color="#FF8C1A" transparent opacity={0.15} />
      </mesh>

      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.015}
          vertexColors
          transparent
          opacity={0.7}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {orbiters.map((orb, i) => (
        <OrbitingSphere key={i} {...orb} />
      ))}
    </group>
  );
}

function isWebGLAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl") || canvas.getContext("webgl2"));
  } catch {
    return false;
  }
}

export default function Hero3DScene() {
  const [webglOk, setWebglOk] = useState(true);

  useEffect(() => {
    setWebglOk(isWebGLAvailable());
  }, []);

  if (!webglOk) {
    return (
      <div className="w-full h-full min-h-[550px] relative flex items-center justify-center">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange/10 to-cyan/10 border border-soft-border" />
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[550px] relative">
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={0.8} color="#FF6B00" />
          <pointLight position={[-10, -10, -10]} intensity={0.8} color="#00E5FF" />
          <Scene3D />
        </Suspense>
      </Canvas>
    </div>
  );
}
