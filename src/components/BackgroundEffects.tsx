"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: "orange" | "cyan";
  life: number;
  maxLife: number;
}

interface Trail {
  x: number;
  y: number;
  alpha: number;
}

function isLowEndDevice(): boolean {
  if (typeof window === "undefined") return false;
  const mem = (navigator as any).deviceMemory;
  if (mem && mem < 4) return true;
  const cores = navigator.hardwareConcurrency;
  if (cores && cores < 4) return true;
  return false;
}

function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768 || "ontouchstart" in window;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function BackgroundEffects() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, prevX: 0, prevY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (prefersReducedMotion()) return;

    const isLowEnd = isLowEndDevice() || isMobileDevice();
    const isMobile = isMobileDevice();

    let animationId: number;
    let particles: Particle[] = [];
    const trails: Trail[] = [];
    let trailTimer = 0;
    let lastFrameTime = performance.now();
    const targetFPS = isLowEnd ? 24 : isMobile ? 30 : 60;
    const frameInterval = 1000 / targetFPS;

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.prevX = mouseRef.current.x;
      mouseRef.current.prevY = mouseRef.current.y;
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    const initParticles = () => {
      const density = isLowEnd ? 18000 : isMobile ? 15000 : 6000;
      const maxCount = isLowEnd ? 35 : isMobile ? 50 : 200;
      const count = Math.min(
        Math.floor((window.innerWidth * window.innerHeight) / density),
        maxCount
      );
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2.5 + 0.3,
          alpha: Math.random() * 0.4 + 0.05,
          color: Math.random() > 0.5 ? "orange" : "cyan",
          life: 0,
          maxLife: 300 + Math.random() * 200,
        });
      }
    };

    const hasTrails = !isLowEnd && !isMobile;
    const hasConnections = !isLowEnd && !isMobile;
    const hasMouseInteraction = !isLowEnd && !isMobile;
    const hasShootingStars = !isLowEnd && !isMobile;

    const draw = (now: number) => {
      const elapsed = now - lastFrameTime;

      if (elapsed < frameInterval) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      lastFrameTime = now - (elapsed % frameInterval);

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const mouse = mouseRef.current;
      trailTimer++;

      if (hasTrails && trailTimer % 2 === 0) {
        const dx = mouse.x - mouse.prevX;
        const dy = mouse.y - mouse.prevY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 5) {
          trails.push({ x: mouse.x, y: mouse.y, alpha: 0.3 });
          if (trails.length > 40) trails.shift();
        }
      }

      if (hasTrails) {
        for (let i = 0; i < trails.length; i++) {
          const t = trails[i];
          t.alpha *= 0.97;
          if (t.alpha < 0.01) continue;
          const rgb = i % 2 === 0 ? "255, 107, 0" : "0, 229, 255";
          const size = t.alpha * 3;
          ctx.beginPath();
          ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb}, ${t.alpha * 0.5})`;
          ctx.fill();
        }
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.life++;
        if (p.life > p.maxLife) {
          particles[i] = {
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            size: Math.random() * 2.5 + 0.3,
            alpha: Math.random() * 0.4 + 0.05,
            color: Math.random() > 0.5 ? "orange" : "cyan",
            life: 0,
            maxLife: 300 + Math.random() * 200,
          };
          continue;
        }

        if (hasMouseInteraction) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const distToMouse = Math.sqrt(dx * dx + dy * dy);
          if (distToMouse < 250 && distToMouse > 0) {
            const force = 0.04 * (1 - distToMouse / 250);
            p.vx += (dx / distToMouse) * force;
            p.vy += (dy / distToMouse) * force;
          }
        }

        p.vx *= 0.98;
        p.vy *= 0.98;

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -10) p.x = window.innerWidth + 10;
        if (p.x > window.innerWidth + 10) p.x = -10;
        if (p.y < -10) p.y = window.innerHeight + 10;
        if (p.y > window.innerHeight + 10) p.y = -10;

        const rgb = p.color === "orange" ? "255, 107, 0" : "0, 229, 255";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, ${p.alpha})`;
        ctx.fill();

        if (hasConnections) {
          for (let j = i + 1; j < particles.length; j++) {
            const q = particles[j];
            const dx2 = q.x - p.x;
            const dy2 = q.y - p.y;
            const dist = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            if (dist < 180) {
              const opacity = 0.06 * (1 - dist / 180);
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(q.x, q.y);
              ctx.strokeStyle = `rgba(0, 229, 255, ${opacity})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }

          if (p.size > 1.5) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${rgb}, ${p.alpha * 0.1})`;
            ctx.fill();
          }
        }
      }

      if (hasShootingStars && Math.random() < 0.005) {
        const sx = Math.random() * window.innerWidth;
        const sy = Math.random() * window.innerHeight * 0.3;
        const len = 50 + Math.random() * 100;
        const angle = Math.PI / 4 + Math.random() * Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len);
        ctx.strokeStyle = "rgba(0, 229, 255, 0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 229, 255, 0.6)";
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    };

    resize();
    initParticles();
    animationId = requestAnimationFrame(draw);

    const handleResize = () => {
      resize();
      initParticles();
    };

    window.addEventListener("resize", handleResize);
    if (hasMouseInteraction) window.addEventListener("mousemove", handleMouseMove);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <>
      <div className="fixed inset-0 hero-gradient-mesh pointer-events-none z-0" />
      <div className="fixed inset-0 grid-pattern pointer-events-none z-0 opacity-40" />
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
      />
      <div className="fixed inset-0 noise-overlay pointer-events-none z-[1]" />

      {/* Ambient glow orbs */}
      <div className="fixed top-[-15%] left-[-10%] w-[50%] h-[50%] max-w-[80vw] max-h-[80vw] rounded-full bg-gradient-to-br from-orange/8 to-transparent blur-[80px] md:blur-[150px] pointer-events-none z-0 animate-aurora" />
      <div className="fixed top-[20%] right-[-15%] w-[45%] h-[45%] max-w-[70vw] max-h-[70vw] rounded-full bg-gradient-to-bl from-cyan/8 to-transparent blur-[80px] md:blur-[150px] pointer-events-none z-0 animate-aurora" style={{ animationDelay: "-5s" }} />
      <div className="fixed bottom-[-20%] left-[10%] w-[55%] h-[55%] max-w-[80vw] max-h-[80vw] rounded-full bg-gradient-to-tr from-cyan/5 to-transparent blur-[80px] md:blur-[150px] pointer-events-none z-0 animate-aurora" style={{ animationDelay: "-10s" }} />
      <div className="fixed top-[50%] left-[30%] w-[40%] h-[40%] max-w-[60vw] max-h-[60vw] rounded-full bg-gradient-to-r from-orange/4 to-cyan/4 blur-[80px] md:blur-[120px] pointer-events-none z-0 animate-breathe" />

      {/* Decorative gradient lines */}
      <div className="fixed top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange/10 to-transparent pointer-events-none z-0" />
      <div className="fixed top-3/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan/10 to-transparent pointer-events-none z-0" />
    </>
  );
}
