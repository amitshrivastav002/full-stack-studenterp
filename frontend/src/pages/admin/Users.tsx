import { useState } from 'react';
import type { FormEvent } from 'react';
import { auth as authApi } from '../../api/endpoints';
import { ROLES } from '../../api/types';
import type { Role } from '../../api/types';
import { errorMessage } from '../../lib/useAsync';
import {
  Alert, Button, Card, Field, Input, PageHeader, Select,
} from '../../components/ui';
import { titleCase } from '../../lib/format';

/**
 * Creates portal logins. Student and faculty logins are normally created along
 * with their records; this screen exists mainly for additional administrators.
 */
export default function AdminUsers() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('ADMIN');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);

    try {
      const result = await authApi.register({ fullName, email, password, role });
      setNotice(`${result.message} — ${email} can sign in now.`);
      setFullName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Portal accounts"
        subtitle="Create a login for the portal."
      />

      <Card
        title="New account"
        description="Only administrators can create accounts; there is no public sign-up."
        className="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}
          {notice && <Alert tone="success" onDismiss={() => setNotice('')}>{notice}</Alert>}

          <Field label="Full name" required>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </Field>

          <Field label="Email" required>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@college.edu"
              required
            />
          </Field>

          <Field label="Temporary password" required hint="At least 6 characters.">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              autoComplete="new-password"
              required
            />
          </Field>

          <Field
            label="Role"
            required
            hint="A student or faculty login must also be linked to their record."
          >
            <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{titleCase(r)}</option>
              ))}
            </Select>
          </Field>

          <Button type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create account'}
          </Button>
        </form>
      </Card>
    </>
  );
}
