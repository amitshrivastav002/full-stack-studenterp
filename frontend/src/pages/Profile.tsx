import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { me } from '../api/endpoints';
import { useAsync, errorMessage } from '../lib/useAsync';
import {
  Alert, Button, Card, Field, Input, PageHeader, Spinner,
} from '../components/ui';
import { titleCase } from '../lib/format';

/** Profile and password self-service. The same page serves every role. */
export default function Profile() {
  const profile = useAsync(() => me.profile(), []);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');

    if (newPassword !== confirmPassword) {
      setError('The new password and its confirmation do not match.');
      return;
    }

    setBusy(true);
    try {
      const result = await me.changePassword({ currentPassword, newPassword });
      setNotice(result.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (profile.loading) return <Spinner />;

  const details: Array<[string, string | number | undefined]> = profile.data
    ? [
      ['Full name', profile.data.fullName],
      ['Email', profile.data.email],
      ['Role', titleCase(profile.data.role)],
      ['Enrollment number', profile.data.enrollmentNumber],
      ['Employee ID', profile.data.employeeId],
      ['Designation', profile.data.designation],
      ['Department', profile.data.departmentName],
      ['Course', profile.data.courseName],
      ['Semester', profile.data.semester],
      ['Section', profile.data.section],
      ['Mobile', profile.data.mobileNumber],
    ].filter(([, value]) => value !== undefined && value !== null && value !== '') as Array<
      [string, string | number | undefined]
    >
    : [];

  return (
    <>
      <PageHeader
        title="My profile"
        subtitle="Your account details and password."
      />

      {profile.error && <Alert>{profile.error}</Alert>}

      <div className="grid gap-6 lg:grid-cols-2">
        <PhotoCard
          fullName={profile.data?.fullName ?? ''}
          hasPhoto={Boolean(profile.data?.photoUrl)}
          onUploaded={profile.reload}
        />

        <Card title="Account details">
          <dl className="grid gap-4 sm:grid-cols-2">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {label}
                </dt>
                <dd className="mt-1 text-sm text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card
          title="Change password"
          description="Choose something you do not use anywhere else."
        >
          <form onSubmit={handleChangePassword} className="space-y-4">
            {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}
            {notice && (
              <Alert tone="success" onDismiss={() => setNotice('')}>{notice}</Alert>
            )}

            <Field label="Current password" required>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </Field>

            <Field label="New password" required hint="At least 8 characters.">
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </Field>

            <Field label="Confirm new password" required>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </Field>

            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Update password'}
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}

/**
 * Profile photo self-service. The image is fetched as a blob because the
 * endpoint is authenticated and an <img src> cannot send the bearer token.
 */
function PhotoCard({ fullName, hasPhoto, onUploaded }: {
  fullName: string;
  hasPhoto: boolean;
  onUploaded: () => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // Bumped after an upload so the effect refetches even though hasPhoto is
  // already true and would not otherwise change.
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!hasPhoto) {
      setSrc(null);
      return;
    }

    let cancelled = false;
    let created: string | null = null;

    me.photoObjectUrl()
      .then((url) => {
        created = url;
        if (cancelled) {
          if (url) URL.revokeObjectURL(url);
          return;
        }
        setSrc(url);
      })
      .catch(() => { if (!cancelled) setSrc(null); });

    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [hasPhoto, version]);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Lets the same file be picked again after a failed attempt.
    event.target.value = '';
    if (!file) return;

    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      setError('Choose a JPG or PNG image.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await me.uploadPhoto(file);
      setVersion((n) => n + 1);
      onUploaded();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <Card
      title="Profile photo"
      description="A JPG or PNG. Replacing it takes effect straight away."
    >
      {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}

      <div className="flex items-center gap-5">
        {src ? (
          <img
            src={src}
            alt={fullName ? `${fullName}'s profile photo` : 'Profile photo'}
            className="h-24 w-24 rounded-full object-cover ring-1 ring-slate-200"
          />
        ) : (
          <div
            aria-hidden
            className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-xl font-semibold text-slate-400 ring-1 ring-slate-200"
          >
            {initials || '—'}
          </div>
        )}

        <div>
          <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50">
            <input
              type="file"
              accept="image/jpeg,image/png"
              className="sr-only"
              onChange={handleFile}
              disabled={busy}
            />
            {busy ? 'Uploading…' : src ? 'Change photo' : 'Upload photo'}
          </label>
          <p className="mt-2 text-xs text-slate-500">
            Only you and the administration office can see this.
          </p>
        </div>
      </div>
    </Card>
  );
}
