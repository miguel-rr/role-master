'use client';

import { useEffect, useRef } from 'react';

type AtmosphereKind = 'embers' | 'dust' | 'snow' | 'fireflies' | 'fog' | 'ash';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
  phase: number;
  life: number;
};

const SETTINGS: Record<
  AtmosphereKind,
  {
    count: number;
    color: string;
    radius: [number, number];
    speed: [number, number];
    drift: number;
    blur: number;
    rise: boolean;
    twinkle: number;
  }
> = {
  embers: {
    count: 90,
    color: '255, 140, 40',
    radius: [1, 3],
    speed: [12, 40],
    drift: 14,
    blur: 6,
    rise: true,
    twinkle: 0.9,
  },
  dust: {
    count: 110,
    color: '240, 210, 150',
    radius: [0.6, 2],
    speed: [3, 10],
    drift: 10,
    blur: 3,
    rise: true,
    twinkle: 0.5,
  },
  snow: {
    count: 160,
    color: '235, 242, 255',
    radius: [1, 3.2],
    speed: [18, 55],
    drift: 22,
    blur: 2,
    rise: false,
    twinkle: 0.2,
  },
  fireflies: {
    count: 60,
    color: '190, 255, 140',
    radius: [1.2, 2.6],
    speed: [4, 12],
    drift: 26,
    blur: 10,
    rise: true,
    twinkle: 1,
  },
  fog: {
    count: 14,
    color: '200, 215, 230',
    radius: [140, 320],
    speed: [4, 9],
    drift: 6,
    blur: 60,
    rise: false,
    twinkle: 0.15,
  },
  ash: {
    count: 80,
    color: '200, 200, 200',
    radius: [0.8, 2.2],
    speed: [8, 24],
    drift: 18,
    blur: 3,
    rise: false,
    twinkle: 0.3,
  },
};

/**
 * A quiet particle layer over the scene: embers in a tavern, snow on the
 * pass, fireflies in the wood. Canvas, capped particle count, pauses when
 * the tab is hidden, honours reduced-motion.
 */
const Atmosphere = ({ kind }: { kind: AtmosphereKind }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const s = SETTINGS[kind];
    let w = 0;
    let h = 0;
    let raf = 0;
    let last = performance.now();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const spawn = (fresh = false): Particle => ({
      x: rnd(-40, w + 40),
      y: fresh ? rnd(0, h) : s.rise ? h + 20 : -20,
      vx: rnd(-s.drift, s.drift),
      vy: rnd(s.speed[0], s.speed[1]) * (s.rise ? -1 : 1),
      r: rnd(s.radius[0], s.radius[1]),
      a: rnd(0.25, 0.9),
      phase: rnd(0, Math.PI * 2),
      life: rnd(0, 1),
    });
    const count = Math.round(s.count * Math.min(1.4, (w * h) / (1600 * 900)));
    const ps: Particle[] = Array.from({ length: count }, () => spawn(true));

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = kind === 'fog' ? 'screen' : 'lighter';
      for (const p of ps) {
        p.phase += dt * (0.8 + p.r * 0.3);
        p.x += (p.vx + Math.sin(p.phase) * s.drift * 0.6) * dt;
        p.y += p.vy * dt;
        const flick = 1 - s.twinkle * 0.5 * (1 + Math.sin(p.phase * 2.3));
        const alpha = p.a * flick * (kind === 'fog' ? 0.1 : 1);
        if (s.blur > 0) {
          const g = ctx.createRadialGradient(
            p.x,
            p.y,
            0,
            p.x,
            p.y,
            p.r + s.blur,
          );
          g.addColorStop(0, `rgba(${s.color}, ${alpha})`);
          g.addColorStop(1, `rgba(${s.color}, 0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r + s.blur, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = `rgba(${s.color}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        const out = s.rise ? p.y < -40 : p.y > h + 40;
        if (out || p.x < -80 || p.x > w + 80) Object.assign(p, spawn());
      }
      if (!reduced) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduced) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [kind]);

  return (
    <canvas
      className="pointer-events-none absolute inset-0 h-full w-full"
      ref={ref}
    />
  );
};

export { Atmosphere };
export type { AtmosphereKind };
