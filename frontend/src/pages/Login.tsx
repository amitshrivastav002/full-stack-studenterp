import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { HOME_FOR_ROLE, useAuth } from '../context/AuthContext';
import {
  AuthScene, BrandMark, FloatingInput, FormAlert, GoogleButton, PasswordToggle,
  Stagger, SubmitButton, prefersReducedMotion,
} from '../components/auth';

type Phase = 'idle' | 'busy' | 'success';

export default function Login() {
  const { session, login, loginWithGoogle } = useAuth();
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

  async function handleGoogleCredential(idToken: string) {
    if (phase !== 'idle') return;
    setError('');
    setNote('');
    setPhase('busy');
    try {
      const account = await loginWithGoogle(idToken);
      setPhase('success');
      const home = HOME_FOR_ROLE[account.role];
      if (prefersReducedMotion()) navigate(home, { replace: true });
      else window.setTimeout(() => navigate(home, { replace: true }), 900);
    } catch (err) {
      setPhase('idle');
      reject(err instanceof ApiError
        ? (err.message || 'Unable to sign in with Google.')
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

        <GoogleButton onCredential={handleGoogleCredential} />
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

