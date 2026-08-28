import { useRef, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';

/** Card that tilts toward the cursor and lights up a spotlight where you hover. */
export function SpotlightCard({
  children,
  className = '',
  tilt = 6,
}: {
  children: ReactNode;
  className?: string;
  tilt?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pointer, setPointer] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPointer({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const rotateX = hovered ? ((50 - pointer.y) / 50) * tilt : 0;
  const rotateY = hovered ? ((pointer.x - 50) / 50) * tilt : 0;

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition-[border-color,box-shadow] duration-300 hover:border-brand-400/50 hover:shadow-[0_24px_70px_-24px_rgba(55,95,245,0.65)] ${className}`}
      style={{
        transform: `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0) scale(${hovered ? 1.02 : 1})`,
        transition: 'transform 400ms cubic-bezier(0.22, 1, 0.36, 1), border-color 300ms, box-shadow 300ms',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(340px circle at ${pointer.x}% ${pointer.y}%, rgba(92,133,252,0.20), transparent 65%)`,
        }}
      />
      <div className="pointer-events-none absolute inset-x-6 -top-px h-px bg-gradient-to-r from-transparent via-brand-300/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">{children}</div>
    </div>
  );
}

/** Button that drifts a few pixels toward the cursor and sweeps a shine across itself. */
export function MagneticButton({
  children,
  onClick,
  variant = 'primary',
  className = '',
  strength = 0.28,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost';
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const onMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setOffset({
      x: (e.clientX - (rect.left + rect.width / 2)) * strength,
      y: (e.clientY - (rect.top + rect.height / 2)) * strength,
    });
  };

  const base =
    variant === 'primary'
      ? 'bg-brand-500 text-white shadow-[0_18px_45px_-18px_rgba(55,95,245,0.9)] hover:bg-brand-400'
      : 'border border-white/15 text-slate-200 hover:border-white/35 hover:text-white';

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      className={`group relative isolate overflow-hidden rounded-full px-7 py-3 text-sm font-semibold tracking-wide transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070f] ${base} ${className}`}
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        transition: 'transform 350ms cubic-bezier(0.22, 1, 0.36, 1), background-color 300ms, border-color 300ms, color 300ms',
      }}
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative flex items-center gap-2">{children}</span>
    </button>
  );
}
