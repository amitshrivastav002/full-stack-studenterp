import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

/**
 * The shared visual shell for the signed-out screens (sign in, sign up).
 * Kept in one place so both pages animate identically.
 */

/** Motion here is decorative, so all of it is skipped when the user opts out. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function AuthScene({ shaking, onShakeEnd, children }: {
  shaking?: boolean;
  onShakeEnd?: () => void;
  children: ReactNode;
}) {
  const scene = useRef<HTMLDivElement>(null);
  usePointerParallax(scene);

  return (
    <div
      ref={scene}
      className="relative min-h-screen overflow-hidden bg-[#05070f] text-slate-100"
    >
      <Backdrop />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        {/* Outer node carries the parallax, inner one the idle float, so the two
            transforms compose instead of overwriting each other. */}
        <div
          className="w-full max-w-[26.5rem]"
          style={{
            transform:
              'translate3d(calc(var(--px, 0) * 10px), calc(var(--py, 0) * 10px), 0)',
          }}
        >
          <div className="motion-safe:animate-float-card" style={{ willChange: 'transform' }}>
            <div
              onAnimationEnd={(event) => {
                if (event.animationName === 'shake') onShakeEnd?.();
              }}
              className={[
                'rounded-[1.75rem] border border-white/10 bg-white/[0.07]',
                'p-7 shadow-[0_30px_80px_-20px_rgba(0,0,0,.9)] backdrop-blur-2xl sm:p-9',
                shaking ? 'motion-safe:animate-shake' : 'animate-card-in',
              ].join(' ')}
            >
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/** Sequential entrance: one shared animation, offset per position. */
export function Stagger({ step, children }: { step: number; children: ReactNode }) {
  return (
    <div className="animate-rise" style={{ animationDelay: `${140 + step * 70}ms` }}>
      {children}
    </div>
  );
}

export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white shadow-lg shadow-brand-600/40">
        SE
      </span>
      <span className="text-sm font-medium tracking-wide text-slate-300">
        Student ERP
      </span>
    </div>
  );
}

export function FormAlert({ tone, children }: {
  tone: 'error' | 'info';
  children: ReactNode;
}) {
  const tones = {
    error: 'border-rose-400/30 bg-rose-500/10 text-rose-200',
    info: 'border-sky-400/30 bg-sky-500/10 text-sky-200',
  };
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`animate-pop-in rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}
    >
      {children}
    </div>
  );
}

/**
 * Publishes the pointer position as --px/--py on the scene, from -1 to 1.
 * Written straight to the DOM inside a rAF so moving the mouse never triggers a
 * React render, and skipped entirely for coarse pointers and reduced motion.
 */
function usePointerParallax(target: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const node = target.current;
    if (!node) return;
    if (prefersReducedMotion()) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    let frame = 0;

    function onMove(event: PointerEvent) {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const x = (event.clientX / window.innerWidth) * 2 - 1;
        const y = (event.clientY / window.innerHeight) * 2 - 1;
        node!.style.setProperty('--px', x.toFixed(3));
        node!.style.setProperty('--py', y.toFixed(3));
      });
    }

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [target]);
}

/** Ambient layers. Each moves at its own rate, which is what reads as depth. */
function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 animate-fade-in bg-[radial-gradient(120%_90%_at_50%_-10%,#1e2a6b_0%,#0a0f26_45%,#05070f_100%)]" />

      <Orb
        className="left-[-12%] top-[-10%] h-[34rem] w-[34rem] bg-brand-500/25 motion-safe:animate-drift"
        depth={34}
      />
      <Orb
        className="right-[-14%] top-[12%] hidden h-[30rem] w-[30rem] bg-fuchsia-500/20 motion-safe:animate-float sm:block"
        depth={22}
      />
      <Orb
        className="bottom-[-16%] left-[24%] hidden h-[32rem] w-[32rem] bg-cyan-400/20 motion-safe:animate-drift lg:block"
        depth={44}
      />

      {/* Fine grid, held far back, to stop the gradient reading as flat. */}
      <div
        className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.07)_1px,transparent_1px)] [background-size:64px_64px]"
        style={{
          transform:
            'translate3d(calc(var(--px, 0) * -6px), calc(var(--py, 0) * -6px), 0)',
        }}
      />

      <Particles />

      {/* Vignette keeps contrast up behind the card. */}
      <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_50%,transparent_0%,rgba(5,7,15,.75)_100%)]" />
    </div>
  );
}

function Orb({ className, depth }: { className: string; depth: number }) {
  return (
    <div
      className="absolute"
      style={{
        transform: `translate3d(calc(var(--px, 0) * ${depth}px), calc(var(--py, 0) * ${depth}px), 0)`,
      }}
    >
      <div className={`rounded-full blur-[110px] ${className}`} />
    </div>
  );
}

const PARTICLES = [
  { left: '12%', top: '22%', size: 3, delay: '0s', duration: '13s' },
  { left: '26%', top: '68%', size: 2, delay: '1.4s', duration: '16s' },
  { left: '44%', top: '16%', size: 2, delay: '2.6s', duration: '11s' },
  { left: '62%', top: '74%', size: 3, delay: '0.8s', duration: '15s' },
  { left: '78%', top: '30%', size: 2, delay: '3.2s', duration: '12s' },
  { left: '88%', top: '60%', size: 3, delay: '2s', duration: '17s' },
];

function Particles() {
  return (
    // Hidden on small screens: decorative motion is the first thing to go there.
    <div className="hidden sm:block">
      {PARTICLES.map((particle) => (
        <span
          key={particle.left + particle.top}
          className="absolute rounded-full bg-white/50 shadow-[0_0_10px_2px_rgba(255,255,255,.35)] motion-safe:animate-float"
          style={{
            left: particle.left,
            top: particle.top,
            height: particle.size,
            width: particle.size,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
          }}
        />
      ))}
    </div>
  );
}

export function FloatingInput({
  id, label, type, value, onChange, autoComplete, disabled, error, hint, trailing,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  disabled?: boolean;
  error?: string;
  hint?: string;
  trailing?: ReactNode;
}) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          disabled={disabled}
          // A non-empty placeholder is what makes :placeholder-shown track
          // emptiness, which is what drives the label.
          placeholder=" "
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={[
            'peer h-[3.75rem] w-full rounded-2xl border bg-white/[0.04] px-4 pb-2 pt-6',
            trailing ? 'pr-14' : '',
            'text-[0.95rem] text-white outline-none transition duration-200',
            'placeholder:text-transparent disabled:opacity-60',
            error
              ? 'border-rose-400/60 focus:border-rose-300 focus:shadow-[0_0_0_4px_rgba(244,63,94,.15)]'
              : 'border-white/12 hover:border-white/25 focus:border-brand-400/80 focus:bg-white/[0.07] focus:shadow-[0_0_0_4px_rgba(55,95,245,.18),0_0_28px_-6px_rgba(92,133,252,.65)]',
          ].join(' ')}
        />

        <label
          htmlFor={id}
          className={[
            'pointer-events-none absolute left-4 top-[1.15rem] origin-left text-[0.95rem] transition-all duration-200',
            'peer-focus:top-2 peer-focus:text-[0.7rem]',
            'peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[0.7rem]',
            error
              ? 'text-rose-300/90 peer-focus:text-rose-300'
              : 'text-slate-400 peer-focus:text-brand-300',
          ].join(' ')}
        >
          {label}
        </label>

        {trailing && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2">{trailing}</span>
        )}
      </div>

      {error ? (
        <p id={`${id}-error`} className="mt-1.5 pl-1 text-xs text-rose-300">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 pl-1 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function PasswordToggle({ shown, onToggle }: {
  shown: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? 'Hide password' : 'Show password'}
      aria-pressed={shown}
      className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {shown ? (
          <>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <path d="m1 1 22 22" />
          </>
        ) : (
          <>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
            <circle cx="12" cy="12" r="3" />
          </>
        )}
      </svg>
    </button>
  );
}

export function CheckIcon() {
  return (
    <svg className="animate-pop-in" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/** The premium primary action, shared by both forms. */
export function SubmitButton({ busy, done, idleLabel, busyLabel, doneLabel }: {
  busy: boolean;
  done: boolean;
  idleLabel: string;
  busyLabel: string;
  doneLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={busy || done}
      className={[
        'group relative mt-1 h-[3.25rem] w-full overflow-hidden rounded-2xl',
        'text-[0.95rem] font-semibold text-white transition-all duration-300',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0f26]',
        done
          ? 'bg-emerald-500 shadow-[0_10px_40px_-8px_rgba(16,185,129,.8)]'
          : 'bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600 shadow-[0_10px_30px_-10px_rgba(55,95,245,.9)]',
        busy || done
          ? 'cursor-default'
          : 'hover:-translate-y-0.5 hover:shadow-[0_18px_45px_-10px_rgba(92,133,252,.95)] active:translate-y-0',
      ].join(' ')}
    >
      {/* Sheen sweeps across on hover only; it never animates on its own. */}
      {!busy && !done && (
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      )}

      <span className="relative flex items-center justify-center gap-2">
        {done ? (
          <>
            <CheckIcon />
            {doneLabel}
          </>
        ) : busy ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            {busyLabel}
          </>
        ) : (
          idleLabel
        )}
      </span>
    </button>
  );
}
