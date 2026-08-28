import { useState } from 'react';
import type { FormEvent } from 'react';
import { documents as documentsApi, students as studentsApi } from '../../api/endpoints';
import { useAsync, errorMessage } from '../../lib/useAsync';
import { useLookups } from '../../lib/useLookups';
import {
  Alert, Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader,
  Select, Spinner, Table, Td,
} from '../../components/ui';
import { DOCUMENT_TYPES } from '../../api/types';
import type { DocumentType, StudentRequest, StudentResponse } from '../../api/types';
import { date, fullName, titleCase } from '../../lib/format';

const EMPTY: StudentRequest = {
  enrollmentNumber: '', firstName: '', lastName: '', email: '', mobileNumber: '',
  dateOfBirth: '', gender: 'Male', bloodGroup: '', address: '', city: '',
  state: '', pincode: '', guardianName: '', guardianMobile: '',
  semester: 1, section: '', departmentId: 0, courseId: 0,
};

export default function AdminStudents() {
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const listed = useAsync(
    () => studentsApi.list({ page, size: 10, sortBy: 'id', sortDir: 'asc' }),
    [page],
    activeSearch === '',
  );
  const searched = useAsync(
    () => studentsApi.search(activeSearch),
    [activeSearch],
    activeSearch !== '',
  );

  const [editing, setEditing] = useState<StudentResponse | null>(null);
  const [creating, setCreating] = useState(false);
  const [docsFor, setDocsFor] = useState<StudentResponse | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const rows = activeSearch ? (searched.data ?? []) : (listed.data?.content ?? []);
  const loading = activeSearch ? searched.loading : listed.loading;
  const listError = activeSearch ? searched.error : listed.error;

  function refresh() {
    if (activeSearch) searched.reload();
    else listed.reload();
  }

  async function remove(student: StudentResponse) {
    if (!window.confirm(
      `Deactivate ${fullName(student.firstName, student.lastName)} (${student.enrollmentNumber})?`,
    )) return;

    setError('');
    try {
      await studentsApi.remove(student.id);
      setNotice('Student deleted.');
      refresh();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function uploadPhoto(student: StudentResponse, file: File) {
    setError('');
    try {
      await studentsApi.uploadPhoto(student.id, file);
      setNotice('Photo uploaded.');
      refresh();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Students"
        subtitle="Enrolment records, photos and supporting documents."
        actions={<Button onClick={() => setCreating(true)}>Add student</Button>}
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
                placeholder="Name, enrollment number or email"
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
            title={activeSearch ? 'No students matched' : 'No students yet'}
            hint={activeSearch ? 'Try a different keyword.' : 'Add your first student record.'}
          />
        ) : (
          <>
            <Table head={[
              'Enrollment', 'Name', 'Contact', 'Course', 'Sem/Sec', 'Status', 'Actions',
            ]}>
              {rows.map((student) => (
                <tr key={student.id}>
                  <Td className="whitespace-nowrap font-mono text-xs">
                    {student.enrollmentNumber}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      {student.photoUrl ? (
                        <img
                          src={student.photoUrl}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-500">
                          {student.firstName[0]}
                        </span>
                      )}
                      <div>
                        <span className="font-medium text-slate-900">
                          {fullName(student.firstName, student.lastName)}
                        </span>
                        <span className="block text-xs text-slate-400">
                          {student.gender} · {date(student.dateOfBirth)}
                        </span>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <span className="block text-xs">{student.email}</span>
                    <span className="block text-xs text-slate-400">{student.mobileNumber}</span>
                  </Td>
                  <Td>
                    <span className="block text-xs">{student.courseName}</span>
                    <span className="block text-xs text-slate-400">{student.departmentName}</span>
                  </Td>
                  <Td className="whitespace-nowrap">
                    {student.semester}{student.section ? ` / ${student.section}` : ''}
                  </Td>
                  <Td>
                    <Badge tone={student.active ? 'green' : 'slate'}>
                      {student.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        variant="secondary"
                        className="px-2 py-1 text-xs"
                        onClick={() => setEditing(student)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        className="px-2 py-1 text-xs"
                        onClick={() => setDocsFor(student)}
                      >
                        Documents
                      </Button>
                      <label className="inline-flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                        Photo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadPhoto(student, file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <Button
                        variant="danger"
                        className="px-2 py-1 text-xs"
                        onClick={() => remove(student)}
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
                  {listed.data.totalElements} student(s)
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

      {(creating || editing !== null) && <StudentModal
        student={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSaved={(message) => { setNotice(message); refresh(); }}
      />}

      <DocumentsModal
        student={docsFor}
        onClose={() => setDocsFor(null)}
      />
    </>
  );
}

function StudentModal({ student, onClose, onSaved }: {
  student: StudentResponse | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const { departments, courses, loading: lookupsLoading } = useLookups();
  // Mounted fresh each time the modal opens, so plain initial state is enough.
  const [form, setForm] = useState<StudentRequest>(() => (student ? {
      enrollmentNumber: student.enrollmentNumber,
      firstName: student.firstName,
      lastName: student.lastName ?? '',
      email: student.email,
      mobileNumber: student.mobileNumber,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      bloodGroup: student.bloodGroup ?? '',
      address: student.address ?? '',
      city: student.city ?? '',
      state: student.state ?? '',
      pincode: student.pincode ?? '',
      guardianName: student.guardianName ?? '',
      guardianMobile: student.guardianMobile ?? '',
      semester: student.semester,
      section: student.section ?? '',
      // Null for a student who has not been placed on a course yet; 0 is what
      // the selects render as their disabled "Select..." placeholder.
      departmentId: student.departmentId ?? 0,
      courseId: student.courseId ?? 0,
    } : EMPTY));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function set<K extends keyof StudentRequest>(key: K, value: StudentRequest[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setFieldErrors({});

    // The backend rejects blank optional strings on pattern-validated fields.
    const payload: StudentRequest = {
      ...form,
      pincode: form.pincode || undefined,
      guardianMobile: form.guardianMobile || undefined,
    };

    try {
      if (student) {
        await studentsApi.update(student.id, payload);
        onSaved('Student updated.');
      } else {
        await studentsApi.create(payload);
        onSaved('Student created.');
      }
      onClose();
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
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
      title={student ? `Edit ${student.enrollmentNumber}` : 'Add student'}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}
        {lookupsLoading && <Alert tone="info">Loading departments and courses…</Alert>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Enrollment number" required error={fieldErrors.enrollmentNumber}>
            <Input
              value={form.enrollmentNumber}
              onChange={(e) => set('enrollmentNumber', e.target.value)}
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
          <Field label="Date of birth" required error={fieldErrors.dateOfBirth}>
            <Input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => set('dateOfBirth', e.target.value)}
              required
            />
          </Field>

          <Field label="Gender" required error={fieldErrors.gender}>
            <Select value={form.gender} onChange={(e) => set('gender', e.target.value)}>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </Select>
          </Field>
          <Field label="Blood group" error={fieldErrors.bloodGroup}>
            <Input
              value={form.bloodGroup}
              onChange={(e) => set('bloodGroup', e.target.value)}
              placeholder="O+"
            />
          </Field>
          <Field label="Semester" required error={fieldErrors.semester}>
            <Select
              value={form.semester}
              onChange={(e) => set('semester', Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </Select>
          </Field>

          <Field label="Section" error={fieldErrors.section}>
            <Input
              value={form.section}
              onChange={(e) => set('section', e.target.value)}
              placeholder="A"
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
          <Field label="Course" required error={fieldErrors.courseId}>
            <Select
              value={form.courseId}
              onChange={(e) => set('courseId', Number(e.target.value))}
              required
            >
              <option value={0} disabled>Select course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.courseName}</option>
              ))}
            </Select>
          </Field>

          <Field label="Guardian name" error={fieldErrors.guardianName}>
            <Input
              value={form.guardianName}
              onChange={(e) => set('guardianName', e.target.value)}
            />
          </Field>
          <Field label="Guardian mobile" error={fieldErrors.guardianMobile} hint="10 digits">
            <Input
              value={form.guardianMobile}
              onChange={(e) => set('guardianMobile', e.target.value)}
              pattern="[0-9]{10}"
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
            {busy ? 'Saving…' : student ? 'Save changes' : 'Create student'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DocumentsModal({ student, onClose }: {
  student: StudentResponse | null; onClose: () => void;
}) {
  const { data, loading, error, reload } = useAsync(
    () => documentsApi.list(student!.id),
    [student?.id],
    student !== null,
  );

  const [type, setType] = useState<DocumentType>('AADHAAR');
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState('');

  async function upload(file: File) {
    if (!student) return;
    setBusy(true);
    setUploadError('');
    try {
      await documentsApi.upload(student.id, type, file);
      reload();
    } catch (err) {
      setUploadError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(documentId: number) {
    if (!student || !window.confirm('Delete this document?')) return;
    setUploadError('');
    try {
      await documentsApi.remove(student.id, documentId);
      reload();
    } catch (err) {
      setUploadError(errorMessage(err));
    }
  }

  return (
    <Modal
      open={student !== null}
      wide
      title={student ? `Documents — ${student.enrollmentNumber}` : 'Documents'}
      onClose={onClose}
    >
      {student && (
        <div className="space-y-4">
          {uploadError && <Alert onDismiss={() => setUploadError('')}>{uploadError}</Alert>}

          <div className="flex flex-wrap items-end gap-3 rounded-lg bg-slate-50 p-4">
            <div className="w-56">
              <Field label="Document type">
                <Select
                  value={type}
                  onChange={(e) => setType(e.target.value as DocumentType)}
                >
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t} value={t}>{titleCase(t)}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <label className="inline-flex cursor-pointer items-center rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700">
              {busy ? 'Uploading…' : 'Choose file'}
              <input
                type="file"
                className="hidden"
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) upload(file);
                  e.target.value = '';
                }}
              />
            </label>
            <p className="text-xs text-slate-500">Maximum 5 MB per file.</p>
          </div>

          {error && <Alert>{error}</Alert>}

          {loading ? <Spinner /> : (data ?? []).length === 0 ? (
            <EmptyState title="No documents uploaded" />
          ) : (
            <Table head={['Type', 'File name', 'Size', 'Actions']}>
              {data!.map((doc) => (
                <tr key={doc.id}>
                  <Td><Badge tone="blue">{titleCase(doc.documentType)}</Badge></Td>
                  <Td className="font-medium text-slate-900">{doc.originalFileName}</Td>
                  <Td className="tabular-nums">{(doc.fileSize / 1024).toFixed(0)} KB</Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        className="px-2 py-1 text-xs"
                        onClick={() => documentsApi.download(
                          student.id, doc.id, doc.originalFileName,
                        )}
                      >
                        Download
                      </Button>
                      <Button
                        variant="danger"
                        className="px-2 py-1 text-xs"
                        onClick={() => remove(doc.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </div>
      )}
    </Modal>
  );
}
