"use client"

import { useEffect, useState, useRef, Suspense } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, useGLTF, Environment, ContactShadows } from "@react-three/drei"
import * as THREE from "three"

interface HourglassTimerProps {
  timeRemaining: number
  totalTime: number
  isRunning: boolean
  onTimeUpdate: (time: number) => void
}

function HourglassModel({ modelUrl }: { modelUrl: string | null }) {
  const meshRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const [brightness, setBrightness] = useState(1)
  const { gl } = useThree()

  // Load model if URL provided, otherwise use placeholder
  const { scene } = useGLTF(modelUrl || "/assets/3d/duck.glb")

  // Smooth brightness transition on hover
  useFrame(() => {
    const targetBrightness = hovered ? 1.5 : 1
    setBrightness((prev) => THREE.MathUtils.lerp(prev, targetBrightness, 0.1))
  })

  // Apply emissive material for brightness effect
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshStandardMaterial
          if (material) {
            material.emissive = new THREE.Color("#D4A855")
            material.emissiveIntensity = hovered ? 0.3 : 0
            material.needsUpdate = true
          }
        }
      })
    }
  }, [scene, hovered])

  // Change cursor on hover
  useEffect(() => {
    gl.domElement.style.cursor = hovered ? "pointer" : "grab"
  }, [hovered, gl])

  return (
    <group ref={meshRef}>
      <primitive
        object={scene.clone()}
        scale={modelUrl ? 1 : 0.8}
        position={[0, modelUrl ? 0 : -0.5, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* Brightness overlay effect */}
        <meshStandardMaterial
          attach="material"
          color="#888888"
          metalness={0.3}
          roughness={0.4}
          emissive="#D4A855"
          emissiveIntensity={brightness - 1}
        />
      </primitive>
    </group>
  )
}

function PlaceholderHourglass() {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const { gl } = useThree()

  useFrame((state) => {
    if (groupRef.current) {
      // Subtle floating animation
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05
    }
  })

  useEffect(() => {
    gl.domElement.style.cursor = hovered ? "pointer" : "grab"
  }, [hovered, gl])

  const glassColor = hovered ? "#E8C97A" : "#D4A855"
  const frameColor = hovered ? "#888888" : "#666666"
  const emissiveIntensity = hovered ? 0.4 : 0

  return (
    <group ref={groupRef} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      {/* Top bulb */}
      <mesh position={[0, 1.2, 0]} scale={[1, 1.2, 1]}>
        <sphereGeometry args={[0.6, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color={glassColor}
          transparent
          opacity={0.3}
          metalness={0.1}
          roughness={0.05}
          transmission={0.6}
          thickness={0.5}
          emissive="#D4A855"
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Top cone */}
      <mesh position={[0, 0.7, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.6, 0.8, 32]} />
        <meshPhysicalMaterial
          color={glassColor}
          transparent
          opacity={0.3}
          metalness={0.1}
          roughness={0.05}
          transmission={0.6}
          thickness={0.5}
          emissive="#D4A855"
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Narrow middle */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.4, 16]} />
        <meshPhysicalMaterial
          color={glassColor}
          transparent
          opacity={0.4}
          metalness={0.1}
          roughness={0.05}
          emissive="#D4A855"
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Bottom cone */}
      <mesh position={[0, -0.7, 0]}>
        <coneGeometry args={[0.6, 0.8, 32]} />
        <meshPhysicalMaterial
          color={glassColor}
          transparent
          opacity={0.3}
          metalness={0.1}
          roughness={0.05}
          transmission={0.6}
          thickness={0.5}
          emissive="#D4A855"
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Bottom bulb */}
      <mesh position={[0, -1.2, 0]} scale={[1, 1.2, 1]} rotation={[Math.PI, 0, 0]}>
        <sphereGeometry args={[0.6, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color={glassColor}
          transparent
          opacity={0.3}
          metalness={0.1}
          roughness={0.05}
          transmission={0.6}
          thickness={0.5}
          emissive="#D4A855"
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Top frame ring */}
      <mesh position={[0, 1.8, 0]}>
        <torusGeometry args={[0.65, 0.08, 16, 32]} />
        <meshStandardMaterial
          color={frameColor}
          metalness={0.8}
          roughness={0.2}
          emissive="#D4A855"
          emissiveIntensity={emissiveIntensity * 0.5}
        />
      </mesh>

      {/* Bottom frame ring */}
      <mesh position={[0, -1.8, 0]}>
        <torusGeometry args={[0.65, 0.08, 16, 32]} />
        <meshStandardMaterial
          color={frameColor}
          metalness={0.8}
          roughness={0.2}
          emissive="#D4A855"
          emissiveIntensity={emissiveIntensity * 0.5}
        />
      </mesh>

      {/* Support pillars */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[Math.cos((i * Math.PI) / 2) * 0.5, 0, Math.sin((i * Math.PI) / 2) * 0.5]}>
          <cylinderGeometry args={[0.04, 0.04, 3.6, 8]} />
          <meshStandardMaterial
            color={frameColor}
            metalness={0.8}
            roughness={0.2}
            emissive="#D4A855"
            emissiveIntensity={emissiveIntensity * 0.5}
          />
        </mesh>
      ))}
    </group>
  )
}

function LoadingSpinner() {
  return (
    <mesh>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshBasicMaterial color="#D4A855" wireframe />
    </mesh>
  )
}

export function HourglassTimer({ timeRemaining, totalTime, isRunning, onTimeUpdate }: HourglassTimerProps) {
  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60

  const [modelUrl, setModelUrl] = useState<string | null>(null)

  // Timer effect
  useEffect(() => {
    if (!isRunning || timeRemaining <= 0) return

    const interval = setInterval(() => {
      onTimeUpdate(timeRemaining - 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, timeRemaining, onTimeUpdate])

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full max-w-sm aspect-[3/4] flex flex-col">
        <div
          className="flex-1 relative rounded-3xl backdrop-blur-xl bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/10 overflow-hidden transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07]"
          style={{
            boxShadow: `
              0 25px 50px -12px rgba(0, 0, 0, 0.4),
              0 12px 24px -8px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `,
          }}
        >
          {/* Three.js Canvas */}
          <Canvas camera={{ position: [0, 0, 5], fov: 45 }} style={{ background: "transparent" }}>
            <Suspense fallback={<LoadingSpinner />}>
              {/* Lighting */}
              <ambientLight intensity={0.4} />
              <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
              <directionalLight position={[-5, 5, -5]} intensity={0.5} />
              <pointLight position={[0, 3, 0]} intensity={0.5} color="#D4A855" />

              {/* Environment for reflections */}
              <Environment preset="studio" />

              {/* Hourglass model - placeholder or custom */}
              {modelUrl ? <HourglassModel modelUrl={modelUrl} /> : <PlaceholderHourglass />}

              {/* Contact shadow for depth */}
              <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={4} blur={2} far={4} />

              {/* Orbit controls - horizontal rotation only */}
              <OrbitControls
                enableZoom={false}
                enablePan={false}
                minPolarAngle={Math.PI / 3}
                maxPolarAngle={Math.PI / 1.5}
                rotateSpeed={0.5}
              />
            </Suspense>
          </Canvas>

          {/* Corner accents for depth */}
          <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-white/10 rounded-tl-lg pointer-events-none" />
          <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-white/10 rounded-tr-lg pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-white/10 rounded-bl-lg pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-white/10 rounded-br-lg pointer-events-none" />

          {/* Interaction hint overlay */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
            <div className="flex items-center gap-2 text-muted-foreground/60 bg-background/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 4h6v6M10 20H4v-6M20 4L10 14M4 20l10-10" />
              </svg>
              <span className="text-xs font-medium">Drag to rotate • Hover to brighten</span>
            </div>
          </div>
        </div>

        {/* Label */}
        <p className="text-xs text-muted-foreground/70 text-center mt-4 font-medium tracking-wide">
          Interactive Hourglass (3D)
        </p>
      </div>

      {/* Time display */}
      <div className="mt-8 text-center">
        <p className="text-5xl font-light text-foreground tabular-nums tracking-tight">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {isRunning ? "Stay focused..." : timeRemaining === totalTime ? "Ready to start" : "Paused"}
        </p>
      </div>
    </div>
  )
}
