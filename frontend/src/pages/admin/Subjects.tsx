import { useState } from 'react';
import type { FormEvent } from 'react';
import { subjects as subjectsApi } from '../../api/endpoints';
import { useAsync, errorMessage } from '../../lib/useAsync';
import { useLookups } from '../../lib/useLookups';
import {
  Alert, Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader,
  Select, Spinner, Table, Td,
} from '../../components/ui';
import type { SubjectRequest, SubjectResponse } from '../../api/types';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function AdminSubjects() {
  const { departments, courses, loading: lookupsLoading } = useLookups();

  const [courseId, setCourseId] = useState(0);
  const [semester, setSemester] = useState(1);

  const list = useAsync(
    () => subjectsApi.list(courseId, semester),
    [courseId, semester],
    courseId > 0,
  );

  const [editing, setEditing] = useState<SubjectResponse | null>(null);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function remove(subject: SubjectResponse) {
    if (!window.confirm(`Delete ${subject.subjectCode} — ${subject.subjectName}?`)) return;
    setError('');
    try {
      await subjectsApi.remove(subject.id);
      setNotice('Subject deleted.');
      list.reload();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Subjects"
        subtitle="Subjects are scoped to a course and semester."
        actions={
          <Button onClick={() => setCreating(true)} disabled={courses.length === 0}>
            Add subject
          </Button>
        }
      />

      {notice && <Alert tone="success" onDismiss={() => setNotice('')}>{notice}</Alert>}
      {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}

      <Card>
        <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Course" required>
            <Select
              value={courseId}
              onChange={(e) => setCourseId(Number(e.target.value))}
              disabled={lookupsLoading}
            >
              <option value={0} disabled>Select a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.courseName}</option>
              ))}
            </Select>
          </Field>

          <Field label="Semester" required>
            <Select value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
              {SEMESTERS.map((n) => <option key={n} value={n}>{n}</option>)}
            </Select>
          </Field>
        </div>

        {courseId === 0 ? (
          <EmptyState
            title="Choose a course"
            hint="Subjects are listed per course and semester."
          />
        ) : list.loading ? <Spinner /> : list.error ? (
          <Alert>{list.error}</Alert>
        ) : (list.data ?? []).length === 0 ? (
          <EmptyState
            title="No subjects for this selection"
            hint="Add a subject for this course and semester."
          />
        ) : (
          <Table head={['Code', 'Subject', 'Credits', 'Department', 'Status', 'Actions']}>
            {list.data!.map((subject) => (
              <tr key={subject.id}>
                <Td className="whitespace-nowrap font-mono text-xs">{subject.subjectCode}</Td>
                <Td className="font-medium text-slate-900">{subject.subjectName}</Td>
                <Td className="tabular-nums">{subject.credits ?? '—'}</Td>
                <Td>{subject.departmentName}</Td>
                <Td>
                  <Badge tone={subject.active ? 'green' : 'slate'}>
                    {subject.active ? 'Active' : 'Inactive'}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      className="px-2 py-1 text-xs"
                      onClick={() => setEditing(subject)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      className="px-2 py-1 text-xs"
                      onClick={() => remove(subject)}
                    >
                      Delete
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {(creating || editing !== null) && <SubjectModal
        subject={editing}
        departments={departments}
        courses={courses}
        defaults={{ courseId, semester }}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSaved={(message) => { setNotice(message); list.reload(); }}
      />}
    </>
  );
}

function SubjectModal({ subject, departments, courses, defaults, onClose, onSaved }: {
  subject: SubjectResponse | null;
  departments: Array<{ id?: number; departmentName: string }>;
  courses: Array<{ id?: number; courseName: string }>;
  defaults: { courseId: number; semester: number };
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  // Mounted fresh each time the modal opens, so plain initial state is enough.
  const [form, setForm] = useState<SubjectRequest>(() => (subject ? {
    subjectCode: subject.subjectCode,
    subjectName: subject.subjectName,
    semester: subject.semester,
    credits: subject.credits ?? 3,
    departmentId: subject.departmentId,
    courseId: subject.courseId,
  } : {
    subjectCode: '', subjectName: '', semester: defaults.semester,
    credits: 3, departmentId: 0, courseId: defaults.courseId,
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function set<K extends keyof SubjectRequest>(key: K, value: SubjectRequest[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setFieldErrors({});
    try {
      if (subject) {
        await subjectsApi.update(subject.id, form);
        onSaved('Subject updated.');
      } else {
        await subjectsApi.create(form);
        onSaved('Subject created.');
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
      title={subject ? `Edit ${subject.subjectCode}` : 'Add subject'}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Subject code" required error={fieldErrors.subjectCode}>
            <Input
              value={form.subjectCode}
              onChange={(e) => set('subjectCode', e.target.value)}
              placeholder="CS301"
              required
            />
          </Field>
          <Field label="Credits" error={fieldErrors.credits}>
            <Input
              type="number"
              min={1}
              value={form.credits ?? ''}
              onChange={(e) => set('credits', Number(e.target.value))}
            />
          </Field>
        </div>

        <Field label="Subject name" required error={fieldErrors.subjectName}>
          <Input
            value={form.subjectName}
            onChange={(e) => set('subjectName', e.target.value)}
            placeholder="Database Management Systems"
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>

        <Field label="Semester" required error={fieldErrors.semester}>
          <Select
            value={form.semester}
            onChange={(e) => set('semester', Number(e.target.value))}
          >
            {SEMESTERS.map((n) => <option key={n} value={n}>{n}</option>)}
          </Select>
        </Field>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving…' : subject ? 'Save changes' : 'Create subject'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
