import { useMemo } from 'react';
import { useScrollY } from '../../lib/useReveal';

type Orb = {
  size: number;
  left: number;
  top: number;
  color: string;
  duration: number;
  delay: number;
  depth: number;
};

const ORBS: Orb[] = [
  { size: 520, left: -8, top: 2, color: 'rgba(55, 95, 245, 0.38)', duration: 22, delay: 0, depth: 0.25 },
  { size: 380, left: 68, top: 8, color: 'rgba(168, 85, 247, 0.30)', duration: 27, delay: -6, depth: 0.16 },
  { size: 300, left: 38, top: 46, color: 'rgba(34, 211, 238, 0.22)', duration: 19, delay: -11, depth: 0.34 },
  { size: 420, left: 78, top: 66, color: 'rgba(55, 95, 245, 0.26)', duration: 31, delay: -3, depth: 0.12 },
  { size: 260, left: 4, top: 78, color: 'rgba(236, 72, 153, 0.20)', duration: 24, delay: -15, depth: 0.22 },
];

const PARTICLE_COUNT = 26;

/** Drifting gradient orbs, a parallax grid and floating particles behind the page. */
export function FloatingBackground() {
  const scrollY = useScrollY();

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        left: (i * 37) % 100,
        top: (i * 61) % 100,
        size: 2 + (i % 3),
        duration: 12 + (i % 7) * 3,
        delay: -(i * 1.7),
        opacity: 0.15 + (i % 5) * 0.08,
      })),
    [],
  );

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {/* base wash */}
      <div className="absolute inset-0 bg-[#05070f]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(55,95,245,0.18),transparent_60%)]" />

      {/* parallax grid */}
      <div
        className="absolute inset-x-0 -top-1/4 h-[150%] opacity-[0.16] [background-image:linear-gradient(rgba(148,163,184,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.35)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]"
        style={{ transform: `translate3d(0, ${scrollY * -0.12}px, 0)` }}
      />

      {/* drifting orbs */}
      {ORBS.map((orb, i) => (
        <div
          key={i}
          className="absolute animate-drift rounded-full blur-3xl"
          style={{
            width: orb.size,
            height: orb.size,
            left: `${orb.left}%`,
            top: `${orb.top}%`,
            background: `radial-gradient(circle at 30% 30%, ${orb.color}, transparent 70%)`,
            animationDuration: `${orb.duration}s`,
            animationDelay: `${orb.delay}s`,
            marginTop: scrollY * -orb.depth,
          }}
        />
      ))}

      {/* floating particles */}
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute animate-float rounded-full bg-white"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            top: `${p.top}%`,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(2,4,10,0.85))]" />
    </div>
  );
}
