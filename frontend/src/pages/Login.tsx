import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { HOME_FOR_ROLE, useAuth } from '../context/AuthContext';
import {
  AuthScene, BrandMark, FloatingInput, FormAlert, PasswordToggle,
  Stagger, SubmitButton, prefersReducedMotion,
} from '../components/auth';

type Phase = 'idle' | 'busy' | 'success';

export default function Login() {
  const { session, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [shaking, setShaking] = useState(false);
  const [note, setNote] = useState('');

  // The success state needs to stay on screen for a beat, so the redirect that
  // normally fires the moment a session exists is held back until it is done.
  if (session && phase !== 'success') {
    return <Navigate to={HOME_FOR_ROLE[session.role]} replace />;
  }

  function reject(message: string, fields: typeof fieldErrors = {}) {
    setError(message);
    setFieldErrors(fields);
    // Skipped under reduced motion, where the animation never ends and so would
    // never clear itself.
    if (!prefersReducedMotion()) setShaking(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (phase !== 'idle') return;

    setError('');
    setNote('');
    setFieldErrors({});

    const next: typeof fieldErrors = {};
    if (!email.trim()) next.email = 'Enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'That does not look like an email address.';
    if (!password) next.password = 'Enter your password.';

    if (Object.keys(next).length > 0) {
      reject('Check the highlighted fields and try again.', next);
      return;
    }

    setPhase('busy');
    try {
      const account = await login({ email, password }, remember);
      setPhase('success');

      const home = HOME_FOR_ROLE[account.role];
      if (prefersReducedMotion()) navigate(home, { replace: true });
      else window.setTimeout(() => navigate(home, { replace: true }), 900);
    } catch (err) {
      setPhase('idle');
      reject(err instanceof ApiError
        ? (err.message || 'Invalid email or password.')
        : 'Unable to reach the server. Is the backend running on port 8080?');
    }
  }

  const busy = phase === 'busy';
  const done = phase === 'success';

  return (
    <AuthScene shaking={shaking} onShakeEnd={() => setShaking(false)}>
      <Stagger step={0}><BrandMark /></Stagger>

      <Stagger step={1}>
        <h1 className="mt-7 text-[1.75rem] font-semibold tracking-tight text-white">
          Welcome back
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Sign in to continue to your account.
        </p>
      </Stagger>

      <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-4">
        {error && <FormAlert tone="error">{error}</FormAlert>}
        {note && <FormAlert tone="info">{note}</FormAlert>}

        <Stagger step={2}>
          <FloatingInput
            id="email"
            label="Email address"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="username"
            disabled={busy || done}
            error={fieldErrors.email}
          />
        </Stagger>

        <Stagger step={3}>
          <FloatingInput
            id="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            disabled={busy || done}
            error={fieldErrors.password}
            trailing={
              <PasswordToggle
                shown={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
              />
            }
          />
        </Stagger>

        <Stagger step={4}>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
            <label className="inline-flex cursor-pointer select-none items-center gap-2.5 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                // accent-color, not text-*: a native checkbox ignores Tailwind's
                // text colour without the forms plugin and falls back to the OS
                // accent, which renders red here.
                className="h-4 w-4 cursor-pointer rounded accent-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              />
              Remember me
            </label>

            <button
              type="button"
              onClick={() => {
                setError('');
                setNote('Password resets are handled by the administration office — contact them to have yours reissued.');
              }}
              className="rounded text-sm font-medium text-brand-300 transition hover:text-brand-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              Forgot password?
            </button>
          </div>
        </Stagger>

        <Stagger step={5}>
          <SubmitButton
            busy={busy}
            done={done}
            idleLabel="Sign in"
            busyLabel="Signing in…"
            doneLabel="Signed in"
          />
        </Stagger>
      </form>

      <Stagger step={6}>
        <div className="my-6 flex items-center gap-4">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-xs font-medium uppercase tracking-widest text-slate-500">
            or
          </span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SocialButton label="Google" icon={<GoogleIcon />} />
          <SocialButton label="Apple" icon={<AppleIcon />} />
        </div>
        {/* Stated plainly rather than left to a dead button: this ERP
            authenticates against institution-issued accounts only. */}
        <p className="mt-3 text-center text-xs text-slate-500">
          Social sign-in is not enabled for institution accounts.
        </p>
      </Stagger>

      <Stagger step={7}>
        <p className="mt-6 border-t border-white/10 pt-5 text-center text-sm text-slate-400">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="rounded font-medium text-brand-300 transition hover:text-brand-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            Sign up
          </Link>
        </p>
      </Stagger>
    </AuthScene>
  );
}

/**
 * Rendered because the design calls for it, but disabled: this deployment has no
 * OAuth provider, and a button that looks live and silently does nothing is
 * worse than one that says so.
 */
function SocialButton({ label, icon }: { label: string; icon: ReactNode }) {
  return (
    <button
      type="button"
      disabled
      title={`${label} sign-in is not available for institution accounts`}
      className="flex h-12 cursor-not-allowed items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-medium text-slate-400 opacity-60"
    >
      {icon}
      {label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
      <path fill="currentColor" d="M21.35 11.1H12v2.98h5.35a4.6 4.6 0 0 1-1.99 3.02v2.5h3.22c1.88-1.73 2.96-4.29 2.96-7.32 0-.7-.06-1.37-.19-2.02Z" />
      <path fill="currentColor" d="M12 22c2.7 0 4.96-.9 6.61-2.4l-3.22-2.5c-.9.6-2.05.95-3.39.95-2.6 0-4.8-1.76-5.59-4.12H3.08v2.59A10 10 0 0 0 12 22Z" opacity=".75" />
      <path fill="currentColor" d="M6.41 13.93a5.99 5.99 0 0 1 0-3.85V7.49H3.08a10 10 0 0 0 0 9.02l3.33-2.58Z" opacity=".55" />
      <path fill="currentColor" d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.85-2.85C16.95 2.99 14.7 2 12 2a10 10 0 0 0-8.92 5.49l3.33 2.59C7.2 7.74 9.4 5.98 12 5.98Z" opacity=".9" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.36 12.78c-.02-2.2 1.8-3.26 1.88-3.31-1.02-1.5-2.61-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.75-.78-2.87-.76-1.48.02-2.84.86-3.6 2.18-1.53 2.66-.39 6.6 1.1 8.76.73 1.06 1.6 2.25 2.74 2.2 1.1-.04 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.08 2.65-2.14.84-1.23 1.18-2.42 1.2-2.48-.03-.01-2.3-.88-2.32-3.5ZM14.2 6.3c.6-.74 1.01-1.76.9-2.78-.87.04-1.93.58-2.56 1.31-.56.65-1.05 1.7-.92 2.7.97.08 1.97-.49 2.58-1.23Z" />
    </svg>
  );
}
