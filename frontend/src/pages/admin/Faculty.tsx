import { useState } from 'react';
import type { FormEvent } from 'react';
import { faculty as facultyApi } from '../../api/endpoints';
import { useAsync, errorMessage } from '../../lib/useAsync';
import { useLookups } from '../../lib/useLookups';
import {
  Alert, Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader,
  Select, Spinner, Table, Td,
} from '../../components/ui';
import type { FacultyRequest, FacultyResponse } from '../../api/types';
import { date, fullName } from '../../lib/format';

const EMPTY: FacultyRequest = {
  employeeId: '', firstName: '', lastName: '', email: '', mobileNumber: '',
  dateOfBirth: '', gender: 'Male', designation: '', qualification: '',
  joiningDate: '', address: '', city: '', state: '', pincode: '',
  departmentId: 0,
};

export default function AdminFaculty() {
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const listed = useAsync(
    () => facultyApi.list({ page, size: 10, sortBy: 'id', sortDir: 'asc' }),
    [page],
    activeSearch === '',
  );
  const searched = useAsync(
    () => facultyApi.search(activeSearch),
    [activeSearch],
    activeSearch !== '',
  );

  const [editing, setEditing] = useState<FacultyResponse | null>(null);
  const [creating, setCreating] = useState(false);
  const [accountFor, setAccountFor] = useState<FacultyResponse | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const rows = activeSearch ? (searched.data ?? []) : (listed.data?.content ?? []);
  const loading = activeSearch ? searched.loading : listed.loading;
  const listError = activeSearch ? searched.error : listed.error;

  function refresh() {
    if (activeSearch) searched.reload();
    else listed.reload();
  }

  async function remove(member: FacultyResponse) {
    if (!window.confirm(
      `Delete ${fullName(member.firstName, member.lastName)} (${member.employeeId})?`,
    )) return;

    setError('');
    try {
      await facultyApi.remove(member.id);
      setNotice('Faculty deleted.');
      refresh();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Faculty"
        subtitle="Staff records and their portal login accounts."
        actions={<Button onClick={() => setCreating(true)}>Add faculty</Button>}
      />

      {notice && <Alert tone="success" onDismiss={() => setNotice('')}>{notice}</Alert>}
      {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}
      {listError && <Alert>{listError}</Alert>}

      <Card>
        <form
          className="mb-4 flex flex-wrap items-end gap-3"
          onSubmit={(e) => { e.preventDefault(); setActiveSearch(keyword.trim()); }}
        >
          <div className="w-full sm:w-72">
            <Field label="Search">
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Name, employee ID or email"
              />
            </Field>
          </div>
          <Button type="submit" variant="secondary">Search</Button>
          {activeSearch && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setKeyword(''); setActiveSearch(''); setPage(0); }}
            >
              Clear
            </Button>
          )}
        </form>

        {loading ? <Spinner /> : rows.length === 0 ? (
          <EmptyState
            title={activeSearch ? 'No faculty matched' : 'No faculty yet'}
            hint={activeSearch ? 'Try a different keyword.' : 'Add your first staff record.'}
          />
        ) : (
          <>
            <Table head={[
              'Employee ID', 'Name', 'Contact', 'Department', 'Designation', 'Status', 'Actions',
            ]}>
              {rows.map((member) => (
                <tr key={member.id}>
                  <Td className="whitespace-nowrap font-mono text-xs">{member.employeeId}</Td>
                  <Td>
                    <span className="font-medium text-slate-900">
                      {fullName(member.firstName, member.lastName)}
                    </span>
                    <span className="block text-xs text-slate-400">
                      Joined {date(member.joiningDate)}
                    </span>
                  </Td>
                  <Td>
                    <span className="block text-xs">{member.email}</span>
                    <span className="block text-xs text-slate-400">{member.mobileNumber}</span>
                  </Td>
                  <Td>{member.departmentName}</Td>
                  <Td>
                    <span className="block text-xs">{member.designation}</span>
                    <span className="block text-xs text-slate-400">
                      {member.qualification || '—'}
                    </span>
                  </Td>
                  <Td>
                    <Badge tone={member.active ? 'green' : 'slate'}>
                      {member.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        variant="secondary"
                        className="px-2 py-1 text-xs"
                        onClick={() => setEditing(member)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        className="px-2 py-1 text-xs"
                        onClick={() => setAccountFor(member)}
                      >
                        Login
                      </Button>
                      <Button
                        variant="danger"
                        className="px-2 py-1 text-xs"
                        onClick={() => remove(member)}
                      >
                        Delete
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>

            {!activeSearch && listed.data && listed.data.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <p className="text-sm text-slate-500">
                  Page {listed.data.number + 1} of {listed.data.totalPages} ·{' '}
                  {listed.data.totalElements} record(s)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    disabled={listed.data.first}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={listed.data.last}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {(creating || editing !== null) && <FacultyModal
        member={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSaved={(message) => { setNotice(message); refresh(); }}
      />}

      {accountFor && <AccountModal
        member={accountFor}
        onClose={() => setAccountFor(null)}
        onSaved={(message) => setNotice(message)}
      />}
    </>
  );
}

function FacultyModal({ member, onClose, onSaved }: {
  member: FacultyResponse | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const { departments, loading: lookupsLoading } = useLookups();
  // Mounted fresh each time the modal opens, so plain initial state is enough.
  const [form, setForm] = useState<FacultyRequest>(() => (member ? {
      employeeId: member.employeeId,
      firstName: member.firstName,
      lastName: member.lastName ?? '',
      email: member.email,
      mobileNumber: member.mobileNumber,
      dateOfBirth: member.dateOfBirth ?? '',
      gender: member.gender ?? 'Male',
      designation: member.designation,
      qualification: member.qualification ?? '',
      joiningDate: member.joiningDate ?? '',
      address: member.address ?? '',
      city: member.city ?? '',
      state: member.state ?? '',
      pincode: member.pincode ?? '',
      departmentId: member.departmentId,
    } : EMPTY));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function set<K extends keyof FacultyRequest>(key: K, value: FacultyRequest[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setFieldErrors({});

    const payload: FacultyRequest = {
      ...form,
      dateOfBirth: form.dateOfBirth || undefined,
      joiningDate: form.joiningDate || undefined,
      pincode: form.pincode || undefined,
    };

    try {
      if (member) {
        await facultyApi.update(member.id, payload);
        onSaved('Faculty updated.');
      } else {
        await facultyApi.create(payload);
        onSaved('Faculty created.');
      }
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      if (err && typeof err === 'object' && 'fieldErrors' in err) {
        setFieldErrors((err as { fieldErrors: Record<string, string> }).fieldErrors);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      wide
      title={member ? `Edit ${member.employeeId}` : 'Add faculty'}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}
        {lookupsLoading && <Alert tone="info">Loading departments…</Alert>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Employee ID" required error={fieldErrors.employeeId}>
            <Input
              value={form.employeeId}
              onChange={(e) => set('employeeId', e.target.value)}
              required
            />
          </Field>
          <Field label="First name" required error={fieldErrors.firstName}>
            <Input
              value={form.firstName}
              onChange={(e) => set('firstName', e.target.value)}
              required
            />
          </Field>
          <Field label="Last name" error={fieldErrors.lastName}>
            <Input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
          </Field>

          <Field label="Email" required error={fieldErrors.email}>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              required
            />
          </Field>
          <Field label="Mobile" required error={fieldErrors.mobileNumber} hint="10 digits">
            <Input
              value={form.mobileNumber}
              onChange={(e) => set('mobileNumber', e.target.value)}
              pattern="[0-9]{10}"
              required
            />
          </Field>
          <Field label="Designation" required error={fieldErrors.designation}>
            <Input
              value={form.designation}
              onChange={(e) => set('designation', e.target.value)}
              placeholder="Assistant Professor"
              required
            />
          </Field>

          <Field label="Department" required error={fieldErrors.departmentId}>
            <Select
              value={form.departmentId}
              onChange={(e) => set('departmentId', Number(e.target.value))}
              required
            >
              <option value={0} disabled>Select department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.departmentName}</option>
              ))}
            </Select>
          </Field>
          <Field label="Qualification" error={fieldErrors.qualification}>
            <Input
              value={form.qualification}
              onChange={(e) => set('qualification', e.target.value)}
              placeholder="Ph.D."
            />
          </Field>
          <Field label="Gender" error={fieldErrors.gender}>
            <Select value={form.gender} onChange={(e) => set('gender', e.target.value)}>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </Select>
          </Field>

          <Field label="Date of birth" error={fieldErrors.dateOfBirth}>
            <Input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => set('dateOfBirth', e.target.value)}
            />
          </Field>
          <Field label="Joining date" error={fieldErrors.joiningDate}>
            <Input
              type="date"
              value={form.joiningDate}
              onChange={(e) => set('joiningDate', e.target.value)}
            />
          </Field>
          <Field label="Pincode" error={fieldErrors.pincode} hint="6 digits">
            <Input
              value={form.pincode}
              onChange={(e) => set('pincode', e.target.value)}
              pattern="[0-9]{6}"
            />
          </Field>

          <Field label="City" error={fieldErrors.city}>
            <Input value={form.city} onChange={(e) => set('city', e.target.value)} />
          </Field>
          <Field label="State" error={fieldErrors.state}>
            <Input value={form.state} onChange={(e) => set('state', e.target.value)} />
          </Field>
          <Field label="Address" error={fieldErrors.address}>
            <Input value={form.address} onChange={(e) => set('address', e.target.value)} />
          </Field>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving…' : member ? 'Save changes' : 'Create faculty'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function AccountModal({ member, onClose, onSaved }: {
  member: FacultyResponse | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [email, setEmail] = useState(member?.email ?? '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!member) return;

    setBusy(true);
    setError('');
    try {
      await facultyApi.createAccount({ facultyId: member.id, email, password });
      onSaved(`Login created for ${email}.`);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      title="Create portal login"
      onClose={onClose}
    >
      {member && (
        <form onSubmit={submit} className="space-y-4">
          {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}

          <p className="text-sm text-slate-500">
            Issues a FACULTY account for{' '}
            <span className="font-medium text-slate-900">
              {fullName(member.firstName, member.lastName)}
            </span>{' '}
            ({member.employeeId}) and links it to this record.
          </p>

          <Field label="Login email" required>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>

          <Field label="Password" required hint="At least 8 characters.">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </Field>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Create login'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
