"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  isGold: boolean;
};

export function ParticlesBg({ count = 50 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const n =
      typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches
        ? Math.min(24, count)
        : count;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    const particles: Particle[] = Array.from({ length: n }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.1,
      isGold: Math.random() > 0.7,
    }));

    let mouseX = 0;
    let mouseY = 0;
    let animId = 0;

    const handleMouse = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener("mousemove", handleMouse, { passive: true });

    const fillFor = (p: Particle) =>
      p.isGold ? `rgba(255,215,0,${p.opacity})` : `rgba(204,0,0,${p.opacity})`;

    const animate = () => {
      if (document.hidden) {
        animId = 0;
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.speedX;
        p.y += p.speedY;

        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150 && dist > 0) {
          p.x += dx * 0.001;
          p.y += dy * 0.001;
        }

        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = fillFor(p);
        ctx.fill();

        particles.slice(i + 1).forEach((p2) => {
          const ddx = p.x - p2.x;
          const ddy = p.y - p2.y;
          const d = Math.sqrt(ddx * ddx + ddy * ddy);
          if (d < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(204,0,0,${(1 - d / 100) * 0.15})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animId = requestAnimationFrame(animate);
    };

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animId);
        animId = 0;
      } else if (animId === 0) {
        animId = requestAnimationFrame(animate);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    animId = requestAnimationFrame(animate);

    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("resize", resize);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.55,
      }}
      aria-hidden
    />
  );
}
