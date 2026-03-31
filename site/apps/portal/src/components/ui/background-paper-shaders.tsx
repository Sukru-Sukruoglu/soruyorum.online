"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { cn } from "@/lib/utils";

const vertexShader = `
  uniform float time;
  uniform float intensity;
  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vPosition = position;

    vec3 pos = position;
    pos.y += sin(pos.x * 10.0 + time) * 0.1 * intensity;
    pos.x += cos(pos.y * 8.0 + time * 1.5) * 0.05 * intensity;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform float time;
  uniform float intensity;
  uniform vec3 color1;
  uniform vec3 color2;
  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    vec2 uv = vUv;

    float noise = sin(uv.x * 20.0 + time) * cos(uv.y * 15.0 + time * 0.8);
    noise += sin(uv.x * 35.0 - time * 2.0) * cos(uv.y * 25.0 + time * 1.2) * 0.5;

    vec3 color = mix(color1, color2, noise * 0.5 + 0.5);
    color = mix(color, vec3(1.0), pow(abs(noise), 2.0) * intensity);

    float glow = 1.0 - length(uv - 0.5) * 2.0;
    glow = pow(glow, 2.0);

    gl_FragColor = vec4(color * glow, glow * 0.8);
  }
`;

export function ShaderPlane({
  position,
  color1 = "#ff5722",
  color2 = "#ffffff",
  intensity = 1,
  speed = 1,
}: {
  position: [number, number, number];
  color1?: string;
  color2?: string;
  intensity?: number;
  speed?: number;
}) {
  const mesh = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>>(null);

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      intensity: { value: intensity },
      color1: { value: new THREE.Color(color1) },
      color2: { value: new THREE.Color(color2) },
    }),
    [color1, color2, intensity]
  );

  useFrame((state) => {
    uniforms.time.value = state.clock.elapsedTime * speed;
    uniforms.intensity.value = intensity + Math.sin(state.clock.elapsedTime * speed * 2) * 0.3 * intensity;
  });

  return (
    <mesh ref={mesh} position={position}>
      <planeGeometry args={[2.6, 2.6, 32, 32]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

export function EnergyRing({
  radius = 1,
  position = [0, 0, 0],
  color = "#ff5722",
  speed = 1,
}: {
  radius?: number;
  position?: [number, number, number];
  color?: string;
  speed?: number;
}) {
  const mesh = useRef<THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>>(null);

  useFrame((state) => {
    if (!mesh.current) return;

    mesh.current.rotation.z = state.clock.elapsedTime * speed;
    mesh.current.material.opacity = 0.5 + Math.sin(state.clock.elapsedTime * speed * 3) * 0.2;
  });

  return (
    <mesh ref={mesh} position={position}>
      <ringGeometry args={[radius * 0.8, radius, 64]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.6}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

export function BackgroundPaperShaders({
  className,
  primaryColor = "#ff5722",
  secondaryColor = "#ffffff",
  accentColor = "#f97316",
  intensity = 1,
  speed = 1,
}: {
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  intensity?: number;
  speed?: number;
}) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-black", className)}>
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 2.8], fov: 52 }} gl={{ antialias: true, alpha: true }}>
        <color attach="background" args={["#000000"]} />
        <ambientLight intensity={0.25} />
        <group scale={1.25}>
          <ShaderPlane position={[0, 0, 0]} color1={primaryColor} color2={secondaryColor} intensity={intensity} speed={speed} />
          <ShaderPlane
            position={[0.1, -0.15, -0.35]}
            color1={accentColor}
            color2={primaryColor}
            intensity={Math.max(0.5, intensity * 0.75)}
            speed={speed * 0.7}
          />
          <EnergyRing radius={1.15} position={[0, 0, 0.2]} color={accentColor} speed={speed * 0.8} />
          <EnergyRing radius={0.72} position={[0, 0, -0.1]} color={secondaryColor} speed={speed * -1.1} />
        </group>
      </Canvas>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_42%),radial-gradient(circle_at_top,rgba(249,115,22,0.18),transparent_46%)]" />
    </div>
  );
}