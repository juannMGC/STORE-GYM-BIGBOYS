"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Html, Preload, useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";

if (typeof window !== "undefined") {
  const w = window as Window & { __bbgSuppressThreeWarns?: boolean };
  if (!w.__bbgSuppressThreeWarns) {
    w.__bbgSuppressThreeWarns = true;
    const originalWarn = console.warn.bind(console);
    console.warn = (...args: unknown[]) => {
      const msg = String(args[0] ?? "");
      if (msg.includes("THREE.Clock") || msg.includes("PCFSoftShadowMap") || msg.includes("has been deprecated")) {
        return;
      }
      originalWarn(...args);
    };
  }
}

const MODEL_URL = "/models/logo-BigBoysGYM-v01.glb";

/**
 * Rotación Y del mesh para que mire a la cámara (GLB a veces viene de costado).
 * A: Math.PI / 2  ·  B: -Math.PI / 2 (por defecto)  ·  C: Math.PI  ·  D: 0
 */
const LOGO_MESH_Y_ROTATION = -Math.PI / 2;

function tweakMeshMaterials(mesh: THREE.Mesh) {
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  for (const mat of mats) {
    if (!mat) continue;
    if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
      mat.metalness = Math.min((mat.metalness ?? 0) + 0.1, 0.3);
      mat.roughness = Math.max((mat.roughness ?? 1) - 0.1, 0.3);
      mat.envMapIntensity = 1.2;
      mat.needsUpdate = true;
    }
  }
}

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            border: "3px solid rgba(204,0,0,0.3)",
            borderTopColor: "#CC0000",
            animation: "spin 1s linear infinite",
          }}
        />
        <span style={{ fontFamily: "monospace", color: "#CC0000", fontSize: "12px", letterSpacing: "4px" }}>
          {Math.round(progress)}%
        </span>
      </div>
    </Html>
  );
}

function CameraController({ scrollProgress }: { scrollProgress: number }) {
  const { camera } = useThree();
  const CAMERA_START_Z = 2.5;
  const CAMERA_END_Z = 0.8;
  const CAMERA_MIN_Z = 0.6;

  useFrame(() => {
    const targetZ = THREE.MathUtils.lerp(CAMERA_START_Z, CAMERA_END_Z, scrollProgress);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, Math.max(targetZ, CAMERA_MIN_Z), 0.05);
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0, 0.05);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

function LogoModel({ scrollProgress }: { scrollProgress: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODEL_URL);

  const clonedScene = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        tweakMeshMaterials(child);
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return c;
  }, [scene]);

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    const time = state.clock.elapsedTime;

    const floatY = Math.sin(time * 0.6) * 0.06;
    g.position.y = THREE.MathUtils.lerp(g.position.y, floatY, 0.03);

    // Sin rotación automática del grupo (solo flotación + escala con scroll)
    g.rotation.set(0, 0, 0);

    const scaleBoost = 1 + scrollProgress * 0.15;
    const next = THREE.MathUtils.lerp(g.scale.x, scaleBoost, 0.04);
    g.scale.setScalar(next);
  });

  return (
    <group ref={groupRef}>
      <primitive
        object={clonedScene}
        scale={3.5}
        position={[0, 0, 0]}
        rotation={[0, LOGO_MESH_Y_ROTATION, 0]}
      />
    </group>
  );
}

function NeonLights() {
  const redLight1Ref = useRef<THREE.PointLight>(null);
  const redLight2Ref = useRef<THREE.PointLight>(null);
  const goldLightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (redLight1Ref.current) redLight1Ref.current.intensity = 3 + Math.sin(time * 2) * 1;
    if (redLight2Ref.current) {
      redLight2Ref.current.position.x = Math.sin(time * 0.5) * 4;
      redLight2Ref.current.position.z = Math.cos(time * 0.5) * 4;
      redLight2Ref.current.intensity = 2 + Math.sin(time * 1.5) * 0.5;
    }
    if (goldLightRef.current) goldLightRef.current.intensity = 1.5 + Math.sin(time * 1.2) * 0.5;
  });

  return (
    <>
      <ambientLight intensity={0.22} color="#111111" />
      <pointLight ref={redLight1Ref} position={[0, 2, 4]} color="#FF0000" intensity={4} distance={12} decay={2} />
      <pointLight ref={redLight2Ref} position={[4, 0, 0]} color="#CC0000" intensity={2} distance={10} decay={2} />
      <pointLight ref={goldLightRef} position={[0, 5, 0]} color="#FFD700" intensity={2} distance={8} decay={2} />
      <pointLight position={[0, 0, -5]} color="#ffffff" intensity={1} distance={8} decay={2} />
      <spotLight
        position={[0, 8, 2]}
        angle={0.4}
        penumbra={0.8}
        intensity={3}
        color="#FF3333"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
    </>
  );
}

function FloatingParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 160;
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 18;
      if (Math.random() > 0.55) {
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 0.05;
        colors[i * 3 + 2] = 0.05;
      } else {
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 0.75;
        colors[i * 3 + 2] = 0.1;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  useFrame(() => {
    const pts = particlesRef.current;
    if (!pts) return;
    pts.rotation.y += 0.0005;
    pts.rotation.x += 0.0003;
  });

  return (
    <points ref={particlesRef} geometry={geometry}>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function FloorGrid() {
  const grid = useMemo(() => new THREE.GridHelper(28, 28, 0xcc0000, 0x1a0000), []);
  return <primitive object={grid} position={[0, -2.8, 0]} />;
}

function OrbitalRings() {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ring1Ref.current) ring1Ref.current.rotation.z += delta * 0.12;
    if (ring2Ref.current) ring2Ref.current.rotation.x += delta * 0.08;
    if (ring3Ref.current) ring3Ref.current.rotation.y += delta * 0.15;
  });

  return (
    <group>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[3.4, 0.02, 16, 64]} />
        <meshBasicMaterial color="#CC0000" transparent opacity={0.32} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[Math.PI / 3, 0, Math.PI / 4]}>
        <torusGeometry args={[2.75, 0.014, 16, 64]} />
        <meshBasicMaterial color="#FF0000" transparent opacity={0.22} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring3Ref} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[2.15, 0.01, 16, 64]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Scene({ scrollProgress }: { scrollProgress: number }) {
  return (
    <>
      <color attach="background" args={["#000000"]} />
      <CameraController scrollProgress={scrollProgress} />
      <NeonLights />
      <FloatingParticles />
      <FloorGrid />
      <OrbitalRings />
      <LogoModel scrollProgress={scrollProgress} />
      <ContactShadows position={[0, -2.85, 0]} opacity={0.5} scale={14} blur={2.2} far={4.5} color="#CC0000" />
      <Environment preset="night" />
      <Preload all />
    </>
  );
}

export function Logo3DScene({
  height = "100vh",
  showScrollHint = true,
  children,
}: {
  height?: string;
  showScrollHint?: boolean;
  children?: ReactNode;
}) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const handle = () => {
      setScrollProgress(Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1));
    };
    handle();
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height,
        position: "relative",
        background: "#000000",
      }}
    >
      <Canvas
        camera={{
          position: [0, 0, 2.5],
          fov: isMobile ? 70 : 50,
          near: 0.1,
          far: 100,
        }}
        shadows
        dpr={[1, isMobile ? 1.5 : 2]}
        style={{ background: "transparent" }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        frameloop="always"
        onCreated={({ gl }) => {
          gl.shadowMap.type = THREE.PCFShadowMap;
        }}
      >
        <Suspense fallback={<Loader />}>
          <Scene scrollProgress={scrollProgress} />
        </Suspense>
      </Canvas>

      {children ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 12,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            alignItems: "center",
            padding: "clamp(16px, 4vw, 48px)",
            paddingBottom: "clamp(72px, 12vh, 120px)",
            pointerEvents: "none",
          }}
        >
          <div style={{ pointerEvents: "auto", width: "100%", maxWidth: "720px" }}>{children}</div>
        </div>
      ) : null}

      {showScrollHint ? (
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 11,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              color: "rgba(255,255,255,0.35)",
              fontSize: "10px",
              fontFamily: "var(--font-display), Impact, sans-serif",
              letterSpacing: "4px",
              textTransform: "uppercase",
            }}
          >
            Scroll
          </span>
          <div
            style={{
              width: "1px",
              height: "36px",
              background: "linear-gradient(#CC0000, transparent)",
              boxShadow: "0 0 8px rgba(204,0,0,0.5)",
              animation: "pulse-height 1.5s ease-in-out infinite",
            }}
          />
        </div>
      ) : null}

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "min(200px, 28vh)",
          background: "linear-gradient(transparent, #000000)",
          pointerEvents: "none",
          zIndex: 8,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `repeating-linear-gradient(
            0deg,
            rgba(0,0,0,0) 0px,
            rgba(0,0,0,0) 2px,
            rgba(0,0,0,0.035) 2px,
            rgba(0,0,0,0.035) 4px
          )`,
          pointerEvents: "none",
          zIndex: 9,
        }}
      />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

useGLTF.preload(MODEL_URL);
