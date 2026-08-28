import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { auth as authApi } from '../api/endpoints';
import { HOME_FOR_ROLE, useAuth } from '../context/AuthContext';
import { errorMessage } from '../lib/useAsync';
import {
  AuthScene, BrandMark, CheckIcon, FloatingInput, FormAlert, PasswordToggle,
  Stagger, SubmitButton, prefersReducedMotion,
} from '../components/auth';

type Fields = { fullName?: string; email?: string; password?: string; confirm?: string };

export default function Register() {
  const { session } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Fields>({});
  const [shaking, setShaking] = useState(false);

  if (session) return <Navigate to={HOME_FOR_ROLE[session.role]} replace />;

  function reject(message: string, fields: Fields = {}) {
    setError(message);
    setFieldErrors(fields);
    if (!prefersReducedMotion()) setShaking(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy || created) return;

    setError('');
    setFieldErrors({});

    const next: Fields = {};
    if (!fullName.trim()) next.fullName = 'Enter your full name.';
    if (!email.trim()) next.email = 'Enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'That does not look like an email address.';
    // Mirrors the server's @Size(min = 8) so the round trip is not needed to
    // find out the password is too short.
    if (password.length < 8) next.password = 'Use at least 8 characters.';
    if (confirm !== password) next.confirm = 'The two passwords do not match.';

    if (Object.keys(next).length > 0) {
      reject('Check the highlighted fields and try again.', next);
      return;
    }

    setBusy(true);
    try {
      await authApi.signup({ fullName, email, password });
      setCreated(true);
    } catch (err) {
      reject(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <AuthScene>
        <Stagger step={0}><BrandMark /></Stagger>

        <Stagger step={1}>
          <div className="mt-8 flex flex-col items-center text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30">
              <CheckIcon />
            </span>
            <h1 className="mt-5 text-[1.6rem] font-semibold tracking-tight text-white">
              Account created
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              You can sign in as <span className="text-slate-200">{email}</span>.
            </p>
          </div>
        </Stagger>

        {/* Said up front rather than discovered as a wall of errors: a
            self-registered login has no student record behind it yet. */}
        <Stagger step={2}>
          <div className="mt-6 rounded-xl border border-sky-400/25 bg-sky-500/10 px-4 py-3 text-sm text-sky-200">
            Your account still needs to be linked to your student record by the
            administration office. Until it is, attendance, fees and results will
            have nothing to show.
          </div>
        </Stagger>

        <Stagger step={3}>
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="group relative mt-6 h-[3.25rem] w-full overflow-hidden rounded-2xl bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600 text-[0.95rem] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(55,95,245,.9)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_-10px_rgba(92,133,252,.95)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0f26]"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <span className="relative">Continue to sign in</span>
          </button>
        </Stagger>
      </AuthScene>
    );
  }

  return (
    <AuthScene shaking={shaking} onShakeEnd={() => setShaking(false)}>
      <Stagger step={0}><BrandMark /></Stagger>

      <Stagger step={1}>
        <h1 className="mt-7 text-[1.75rem] font-semibold tracking-tight text-white">
          Create your account
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Sign up to access the student portal.
        </p>
      </Stagger>

      <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-4">
        {error && <FormAlert tone="error">{error}</FormAlert>}

        <Stagger step={2}>
          <FloatingInput
            id="fullName"
            label="Full name"
            type="text"
            value={fullName}
            onChange={setFullName}
            autoComplete="name"
            disabled={busy}
            error={fieldErrors.fullName}
          />
        </Stagger>

        <Stagger step={3}>
          <FloatingInput
            id="email"
            label="Email address"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            disabled={busy}
            error={fieldErrors.email}
          />
        </Stagger>

        <Stagger step={4}>
          <FloatingInput
            id="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            disabled={busy}
            error={fieldErrors.password}
            hint={fieldErrors.password ? undefined : 'At least 8 characters.'}
            trailing={
              <PasswordToggle
                shown={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
              />
            }
          />
        </Stagger>

        <Stagger step={5}>
          <FloatingInput
            id="confirm"
            label="Confirm password"
            type={showPassword ? 'text' : 'password'}
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            disabled={busy}
            error={fieldErrors.confirm}
          />
        </Stagger>

        <Stagger step={6}>
          <SubmitButton
            busy={busy}
            done={false}
            idleLabel="Create account"
            busyLabel="Creating account…"
            doneLabel="Account created"
          />
        </Stagger>
      </form>

      <Stagger step={7}>
        <p className="mt-6 border-t border-white/10 pt-5 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="rounded font-medium text-brand-300 transition hover:text-brand-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            Sign in
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-slate-500">
          Sign-up creates a student account. Staff logins are issued by the
          administration office.
        </p>
      </Stagger>
    </AuthScene>
  );
}
