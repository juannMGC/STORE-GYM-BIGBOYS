"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Float,
  Html,
  OrbitControls,
  Preload,
  useGLTF,
  useProgress,
} from "@react-three/drei";
import * as THREE from "three";
import { ASSETS } from "@/lib/assets";

const MODEL_URL = ASSETS.models.logo3D;

function Loader() {
  const { progress, active, errors } = useProgress();
  return (
    <Html center>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          minWidth: "200px",
        }}
      >
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            border: "3px solid rgba(204,0,0,0.2)",
            borderTopColor: "#CC0000",
            animation: "spin 1s linear infinite",
          }}
        />
        <div
          style={{
            width: "180px",
            height: "3px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, #8B0000, #FF0000)",
              boxShadow: "0 0 8px #FF0000",
              transition: "width 0.3s ease",
              borderRadius: "2px",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span
            style={{
              color: "#CC0000",
              fontSize: "20px",
              fontFamily: "monospace",
              fontWeight: "bold",
              letterSpacing: "2px",
            }}
          >
            {Math.round(progress)}%
          </span>
          <span
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: "10px",
              letterSpacing: "4px",
              textTransform: "uppercase",
            }}
          >
            {active ? "Cargando modelo 3D..." : errors.length > 0 ? "⚠️ Error al cargar" : "Listo"}
          </span>
        </div>
      </div>
    </Html>
  );
}

function LogoModel({
  mouseX,
  mouseY,
  scrollProgress,
}: {
  mouseX: number;
  mouseY: number;
  scrollProgress: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODEL_URL);

  const cloned = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const oldMat = child.material;
        let base = new THREE.Color(0xffffff);
        if (oldMat) {
          if (Array.isArray(oldMat)) {
            const m0 = oldMat[0];
            if (m0 && "color" in m0 && m0.color instanceof THREE.Color) base = m0.color.clone();
          } else if ("color" in oldMat && oldMat.color instanceof THREE.Color) {
            base = oldMat.color.clone();
          }
        }
        child.material = new THREE.MeshStandardMaterial({
          color: base,
          metalness: 0.88,
          roughness: 0.12,
          envMapIntensity: 1.35,
        });
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return c;
  }, [scene]);

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const sp = scrollProgress;

    const floatY = Math.sin(t * 0.85) * 0.12;
    g.position.y = floatY - sp * 1.4;
    g.position.z = -sp * 2.8;

    const baseSpin = t * 0.18;
    const targetY = baseSpin + mouseX * 0.55;
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, targetY, 0.12);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, mouseY * 0.32, 0.1);

    const baseScale = 1 - sp * 0.28;
    const pulse = 1 + Math.sin(t * 0.6) * 0.015;
    const s = Math.max(0.55, baseScale * pulse) * 2;
    g.scale.setScalar(s);
  });

  return (
    <group ref={groupRef}>
      <primitive object={cloned} position={[0, 0, 0]} />
    </group>
  );
}

function NeonLights() {
  const redLight1Ref = useRef<THREE.PointLight>(null);
  const redLight2Ref = useRef<THREE.PointLight>(null);
  const goldLightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (redLight1Ref.current) {
      redLight1Ref.current.intensity = 3 + Math.sin(time * 2) * 1;
    }
    if (redLight2Ref.current) {
      redLight2Ref.current.position.x = Math.sin(time * 0.5) * 4;
      redLight2Ref.current.position.z = Math.cos(time * 0.5) * 4;
      redLight2Ref.current.intensity = 2 + Math.sin(time * 1.5) * 0.5;
    }
    if (goldLightRef.current) {
      goldLightRef.current.intensity = 1.5 + Math.sin(time * 1.2) * 0.5;
    }
  });

  return (
    <>
      <ambientLight intensity={0.22} color="#111111" />
      <pointLight
        ref={redLight1Ref}
        position={[0, 2, 4]}
        color="#FF0000"
        intensity={4}
        distance={12}
        decay={2}
      />
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
  }, [count]);

  useFrame(() => {
    const pts = particlesRef.current;
    if (!pts) return;
    pts.rotation.y += 0.0006;
    pts.rotation.x += 0.00035;
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
  const grid = useMemo(
    () => new THREE.GridHelper(28, 28, 0xcc0000, 0x1a0000),
    [],
  );
  return <primitive object={grid} position={[0, -2.8, 0]} />;
}

function OrbitalRings() {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ring1Ref.current) ring1Ref.current.rotation.z += delta * 0.28;
    if (ring2Ref.current) ring2Ref.current.rotation.x += delta * 0.18;
    if (ring3Ref.current) ring3Ref.current.rotation.y += delta * 0.36;
  });

  return (
    <group>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[3.4, 0.02, 16, 64]} />
        <meshBasicMaterial color="#CC0000" transparent opacity={0.38} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[Math.PI / 3, 0, Math.PI / 4]}>
        <torusGeometry args={[2.75, 0.014, 16, 64]} />
        <meshBasicMaterial color="#FF0000" transparent opacity={0.28} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring3Ref} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[2.15, 0.01, 16, 64]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.22} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Scene({
  mouseX,
  mouseY,
  scrollProgress,
}: {
  mouseX: number;
  mouseY: number;
  scrollProgress: number;
}) {
  return (
    <>
      <color attach="background" args={["#000000"]} />
      <NeonLights />
      <FloatingParticles />
      <FloorGrid />
      <OrbitalRings />
      <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.25}>
        <LogoModel mouseX={mouseX} mouseY={mouseY} scrollProgress={scrollProgress} />
      </Float>
      <ContactShadows position={[0, -2.85, 0]} opacity={0.55} scale={14} blur={2.2} far={4.5} color="#CC0000" />
      <Environment preset="night" />
    </>
  );
}

export function Logo3DScene({
  height = "100vh",
  interactive = true,
  showScrollHint = true,
  children,
}: {
  height?: string;
  interactive?: boolean;
  showScrollHint?: boolean;
  children?: ReactNode;
}) {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!interactive || isMobile) return;
    const handleMouse = (e: MouseEvent) => {
      setMouseX((e.clientX / window.innerWidth) * 2 - 1);
      setMouseY(-(e.clientY / window.innerHeight) * 2 + 1);
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, [interactive, isMobile]);

  useEffect(() => {
    const handleScroll = () => {
      const progress = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1);
      setScrollProgress(progress);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
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
        camera={{ position: [0, 0.2, 6], fov: 45, near: 0.1, far: 100 }}
        shadows
        dpr={[1, isMobile ? 1.5 : 2]}
        style={{ background: "transparent" }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <Suspense fallback={<Loader />}>
          <Scene mouseX={mouseX} mouseY={mouseY} scrollProgress={scrollProgress} />
          <Preload all />
        </Suspense>
        {isMobile ? (
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI * 0.78}
            autoRotate
            autoRotateSpeed={0.85}
          />
        ) : null}
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
    </div>
  );
}

useGLTF.preload(MODEL_URL);
