import { useEffect, useRef } from "react";
import { useCurrentMood } from "@/hooks/useMood";
import { getMoodColors } from "@/lib/moods";

export default function MoodBackground() {
  const mood = useCurrentMood();
  const mc = getMoodColors(mood);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    document.documentElement.style.setProperty("--mood-color", mc.color);
    document.documentElement.style.setProperty("--mood-glow", mc.glow);
    document.documentElement.style.setProperty("--mood-color2", mc.color2);
  }, [mc]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Array<{
      x: number; y: number; size: number;
      speedX: number; speedY: number;
      opacity: number; life: number;
    }> = [];

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function createParticle() {
      return {
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        size: Math.random() * 2.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.4 + 0.1,
        life: Math.random() * 250 + 100,
      };
    }

    for (let i = 0; i < 50; i++) particles.push(createParticle());

    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.speedX + mouseRef.current.x * 0.3;
        p.y += p.speedY + mouseRef.current.y * 0.3;
        p.life--;
        if (p.life <= 0 || p.x < -50 || p.x > canvas!.width + 50 || p.y < -50 || p.y > canvas!.height + 50) {
          particles[i] = createParticle();
        }
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255,255,255,${p.opacity})`;
        ctx!.fill();
      }
      requestAnimationFrame(animate);
    }

    const animId = requestAnimationFrame(animate);
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 animate-bg-breathe transition-all duration-1000"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 20% 40%, var(--mood-glow) 0%, transparent 60%),
              radial-gradient(ellipse 60% 80% at 85% 20%, color-mix(in srgb, var(--mood-color2) 15%, transparent) 0%, transparent 55%),
              radial-gradient(ellipse 50% 50% at 50% 90%, color-mix(in srgb, var(--mood-color) 6%, transparent) 0%, transparent 50%)
            `,
          }}
        />
      </div>
      <div
        className="fixed -top-[8%] -left-[5%] w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none z-[1] opacity-35 transition-colors duration-1000"
        style={{ background: "var(--mood-color)" }}
      />
      <div
        className="fixed bottom-[5%] -right-[3%] w-[350px] h-[350px] rounded-full blur-[100px] pointer-events-none z-[1] opacity-30 transition-colors duration-1000"
        style={{ background: "var(--mood-color2)" }}
      />
      <div
        className="fixed top-1/2 left-[55%] w-[280px] h-[280px] rounded-full blur-[100px] pointer-events-none z-[1] opacity-25 transition-colors duration-1000"
        style={{ background: "color-mix(in srgb, var(--mood-color) 60%, #5865F2)" }}
      />
      <div
        className="fixed inset-0 z-[2] opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-[3] pointer-events-none opacity-[0.12]"
      />
    </>
  );
}
