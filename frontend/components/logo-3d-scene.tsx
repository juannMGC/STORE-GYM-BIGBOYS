"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Html, Preload, useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { ASSETS } from "@/lib/assets";

// Suprimir warnings deprecados de Three.js que vienen de @react-three/fiber internamente
if (typeof window !== "undefined") {
  const w = window as Window & { __bbgSuppressThreeWarns?: boolean };
  if (!w.__bbgSuppressThreeWarns) {
    w.__bbgSuppressThreeWarns = true;
    const originalWarn = console.warn.bind(console);
    console.warn = (...args: unknown[]) => {
      const msg = String(args[0] ?? "");
      if (
        msg.includes("THREE.Clock") ||
        msg.includes("PCFSoftShadowMap") ||
        msg.includes("has been deprecated")
      ) {
        return;
      }
      originalWarn(...args);
    };
  }
}

const MODEL_URL = ASSETS.models.logo3D;

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
  const { progress, errors } = useProgress();
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
        <span
          style={{
            color: "#CC0000",
            fontSize: "18px",
            fontFamily: "monospace",
            letterSpacing: "2px",
          }}
        >
          {Math.round(progress)}%
        </span>
        <span
          style={{
            color: "rgba(255,255,255,0.3)",
            fontSize: "10px",
            letterSpacing: "3px",
            textTransform: "uppercase",
          }}
        >
          {errors.length > 0 ? "⚠️ Error al cargar" : "Cargando modelo 3D..."}
        </span>
      </div>
    </Html>
  );
}

function CameraController({
  scrollProgress,
  mouseX,
  mouseY,
}: {
  scrollProgress: number;
  mouseX: number;
  mouseY: number;
}) {
  const { camera } = useThree();

  const CAMERA_START_Z = 4.5;
  const CAMERA_END_Z = 1.2;
  const CAMERA_MIN_Z = 1.0;

  useFrame(() => {
    const targetZ = THREE.MathUtils.lerp(CAMERA_START_Z, CAMERA_END_Z, scrollProgress);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, Math.max(targetZ, CAMERA_MIN_Z), 0.06);

    const targetX = mouseX * 0.8;
    const targetY = mouseY * 0.5;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.04);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.04);

    camera.lookAt(0, 0, 0);
  });

  return null;
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

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const time = state.clock.elapsedTime;

    const floatY = Math.sin(time * 0.8) * 0.08;
    g.position.y = THREE.MathUtils.lerp(g.position.y, floatY, 0.05);

    const targetRotY = time * 0.15 + mouseX * 0.5;
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, targetRotY, 0.06);
    const targetRotX = mouseY * 0.25;
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, targetRotX, 0.04);

    const scaleBoost = 1 + scrollProgress * 0.2;
    const next = THREE.MathUtils.lerp(g.scale.x, scaleBoost, 0.05);
    g.scale.setScalar(next);
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} scale={2.2} position={[0, 0, 0]} />
    </group>
  );
}

function NeonLights({ scrollProgress }: { scrollProgress: number }) {
  const red1Ref = useRef<THREE.PointLight>(null);
  const red2Ref = useRef<THREE.PointLight>(null);
  const goldRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const boost = 1 + scrollProgress * 1.5;

    if (red1Ref.current) {
      red1Ref.current.intensity = (3 + Math.sin(t * 2) * 1) * boost;
    }
    if (red2Ref.current) {
      red2Ref.current.position.x = Math.sin(t * 0.5) * 4;
      red2Ref.current.position.z = Math.cos(t * 0.5) * 4;
      red2Ref.current.intensity = (2 + Math.sin(t * 1.5) * 0.5) * boost;
    }
    if (goldRef.current) {
      goldRef.current.intensity = (1.5 + Math.sin(t * 1.2) * 0.5) * boost;
    }
  });

  return (
    <>
      <ambientLight intensity={0.3 + scrollProgress * 0.3} color="#111111" />
      <pointLight ref={red1Ref} position={[0, 2, 3]} color="#FF0000" intensity={4} distance={14} decay={2} />
      <pointLight ref={red2Ref} position={[4, 0, 0]} color="#CC0000" intensity={2} distance={10} decay={2} />
      <pointLight ref={goldRef} position={[0, 5, 0]} color="#FFD700" intensity={2} distance={8} decay={2} />
      <pointLight position={[-3, -2, 2]} color="#FF3333" intensity={1.5} distance={8} decay={2} />
      <spotLight
        position={[0, 8, 2]}
        angle={0.35}
        penumbra={0.8}
        intensity={3}
        color="#FF2222"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
    </>
  );
}

function FloatingParticles({ scrollProgress }: { scrollProgress: number }) {
  const ref = useRef<THREE.Points>(null);
  const count = 120;

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
      if (Math.random() > 0.6) {
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 0;
        colors[i * 3 + 2] = 0;
      } else {
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 0.84;
        colors[i * 3 + 2] = 0;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  useFrame((_, delta) => {
    const pts = ref.current;
    if (!pts) return;
    pts.rotation.y += delta * 0.04;
    pts.rotation.x += delta * 0.02;
    const mat = pts.material as THREE.PointsMaterial;
    mat.opacity = 0.5 + scrollProgress * 0.3;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function OrbitalRings({ scrollProgress }: { scrollProgress: number }) {
  const r1 = useRef<THREE.Mesh>(null);
  const r2 = useRef<THREE.Mesh>(null);
  const r3 = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const speed = 1 + scrollProgress * 2;
    if (r1.current) r1.current.rotation.z += delta * 0.3 * speed;
    if (r2.current) r2.current.rotation.x += delta * 0.2 * speed;
    if (r3.current) r3.current.rotation.y += delta * 0.4 * speed;
  });

  const opacity = 0.3 + scrollProgress * 0.4;

  return (
    <group>
      <mesh ref={r1}>
        <torusGeometry args={[3.5, 0.02, 16, 100]} />
        <meshBasicMaterial color="#CC0000" transparent opacity={opacity} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={r2} rotation={[Math.PI / 3, 0, Math.PI / 4]}>
        <torusGeometry args={[2.8, 0.015, 16, 100]} />
        <meshBasicMaterial color="#FF0000" transparent opacity={opacity * 0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={r3} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[2.2, 0.01, 16, 100]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={opacity * 0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function FloorGrid() {
  const grid = useMemo(() => new THREE.GridHelper(30, 30, 0x440000, 0x1a0000), []);
  return <primitive object={grid} position={[0, -3, 0]} />;
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
      <CameraController scrollProgress={scrollProgress} mouseX={mouseX} mouseY={mouseY} />
      <NeonLights scrollProgress={scrollProgress} />
      <FloatingParticles scrollProgress={scrollProgress} />
      <OrbitalRings scrollProgress={scrollProgress} />
      <FloorGrid />
      <LogoModel mouseX={mouseX} mouseY={mouseY} scrollProgress={scrollProgress} />
      <ContactShadows
        position={[0, -3, 0]}
        opacity={0.4 + scrollProgress * 0.3}
        scale={15}
        blur={2}
        far={4}
        color="#CC0000"
      />
      <Environment preset="night" />
      <Preload all />
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
    if (!interactive) return;
    const handle = (e: MouseEvent) => {
      setMouseX((e.clientX / window.innerWidth) * 2 - 1);
      setMouseY(-(e.clientY / window.innerHeight) * 2 + 1);
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, [interactive]);

  useEffect(() => {
    const handle = () => {
      const progress = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1);
      setScrollProgress(progress);
    };
    handle();
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!interactive) return;
    const touch = e.touches[0];
    if (!touch) return;
    setMouseX((touch.clientX / window.innerWidth) * 2 - 1);
    setMouseY(-(touch.clientY / window.innerHeight) * 2 + 1);
  }, [interactive]);

  return (
    <div
      style={{
        width: "100%",
        height,
        position: "relative",
        background: "#000000",
      }}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => {
        setMouseX(0);
        setMouseY(0);
      }}
    >
      <Canvas
        camera={{
          position: [0, 0, 4.5],
          fov: isMobile ? 60 : 45,
          near: 0.1,
          far: 100,
        }}
        shadows
        dpr={[1, isMobile ? 1.5 : 2]}
        style={{ background: "transparent" }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.shadowMap.type = THREE.PCFShadowMap;
        }}
      >
        <Suspense fallback={<Loader />}>
          <Scene mouseX={mouseX} mouseY={mouseY} scrollProgress={scrollProgress} />
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

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "200px",
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
            rgba(0,0,0,0.03) 2px,
            rgba(0,0,0,0.03) 4px
          )`,
          pointerEvents: "none",
          zIndex: 9,
        }}
      />

      {showScrollHint && scrollProgress < 0.1 ? (
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            animation: "bbg-float-hint 2s ease-in-out infinite",
            pointerEvents: "none",
            transition: "opacity 0.5s",
            opacity: 1 - scrollProgress * 10,
            zIndex: 11,
          }}
        >
          <span
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "10px",
              fontFamily: "var(--font-display), Impact, sans-serif",
              letterSpacing: "4px",
              textTransform: "uppercase",
            }}
          >
            Scroll para acercarte
          </span>
          <div
            style={{
              width: "1px",
              height: "40px",
              background: "linear-gradient(#CC0000, transparent)",
              boxShadow: "0 0 8px rgba(204,0,0,0.6)",
            }}
          />
        </div>
      ) : null}

      {scrollProgress > 0.5 ? (
        <div
          style={{
            position: "absolute",
            bottom: "15%",
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            pointerEvents: "none",
            opacity: (scrollProgress - 0.5) * 2,
            transition: "opacity 0.3s",
            zIndex: 11,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-display), Impact, sans-serif",
              fontSize: "clamp(12px, 3vw, 18px)",
              color: "#CC0000",
              letterSpacing: "6px",
              textTransform: "uppercase",
              textShadow: "0 0 20px rgba(204,0,0,0.8)",
              margin: 0,
            }}
          >
            ⚡ Big Boys Gym
          </p>
        </div>
      ) : null}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes bbg-float-hint {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

useGLTF.preload(MODEL_URL);
