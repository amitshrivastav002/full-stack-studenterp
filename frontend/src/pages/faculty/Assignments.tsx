import { useState } from 'react';
import type { FormEvent } from 'react';
import { facultyAssignments, facultyPortal } from '../../api/endpoints';
import type {
  AssignmentRequest, AssignmentResponse, AssignmentSubmissionResponse,
} from '../../api/types';
import { useAsync, errorMessage } from '../../lib/useAsync';
import {
  Alert, Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader,
  Select, Spinner, StatCard, Table, Td, Textarea,
} from '../../components/ui';
import { date, dateTime, titleCase, today } from '../../lib/format';

const EMPTY: AssignmentRequest = {
  facultySubjectId: 0,
  title: '',
  description: '',
  dueDate: today(),
  maxMarks: 20,
};

export default function FacultyAssignments() {
  const list = useAsync(() => facultyAssignments.list(), []);
  const subjects = useAsync(() => facultyPortal.mySubjects(), []);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AssignmentResponse | null>(null);
  const [form, setForm] = useState<AssignmentRequest>(EMPTY);

  const [viewing, setViewing] = useState<AssignmentResponse | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmissionResponse[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  const [grading, setGrading] = useState<AssignmentSubmissionResponse | null>(null);
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const awaitingGrading = (list.data ?? []).reduce(
    (sum, row) => sum + ((row.submissionCount ?? 0) - (row.gradedCount ?? 0)), 0,
  );

  function startCreate() {
    setEditing(null);
    setForm({ ...EMPTY, facultySubjectId: subjects.data?.[0]?.id ?? 0 });
    setError('');
    setOpen(true);
  }

  function startEdit(row: AssignmentResponse) {
    setEditing(row);
    setForm({
      facultySubjectId: row.facultySubjectId,
      title: row.title,
      description: row.description ?? '',
      dueDate: row.dueDate,
      maxMarks: row.maxMarks,
    });
    setError('');
    setOpen(true);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (editing) {
        await facultyAssignments.update(editing.id, form);
        setNotice('Assignment updated.');
      } else {
        await facultyAssignments.create(form);
        setNotice('Assignment published to the class.');
      }
      setOpen(false);
      list.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: AssignmentResponse) {
    if (!window.confirm(`Remove "${row.title}"?`)) return;
    try {
      const result = await facultyAssignments.remove(row.id);
      setNotice(result.message);
      list.reload();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function openSubmissions(row: AssignmentResponse) {
    setViewing(row);
    setLoadingSubmissions(true);
    setError('');
    try {
      setSubmissions(await facultyAssignments.submissions(row.id));
    } catch (err) {
      setError(errorMessage(err));
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  }

  async function saveGrade(event: FormEvent) {
    event.preventDefault();
    if (!grading) return;
    setError('');
    setBusy(true);
    try {
      await facultyAssignments.grade(grading.id, {
        marksObtained: Number(marks),
        feedback: feedback || undefined,
      });
      setNotice('Marks saved.');
      setGrading(null);
      if (viewing) await openSubmissions(viewing);
      list.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Assignments"
        subtitle="Set work for your classes and mark what comes in."
        actions={
          <Button onClick={startCreate} disabled={(subjects.data ?? []).length === 0}>
            New assignment
          </Button>
        }
      />

      {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}
      {notice && <Alert tone="success" onDismiss={() => setNotice('')}>{notice}</Alert>}

      {!subjects.loading && (subjects.data ?? []).length === 0 && (
        <Alert tone="info">
          No subjects are allocated to you yet, so there is nothing to set work against.
          An administrator allocates subjects on the Subject Allocation screen.
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Assignments set" value={list.data?.length ?? '—'} />
        <StatCard
          label="Submissions received"
          value={(list.data ?? []).reduce((sum, row) => sum + (row.submissionCount ?? 0), 0)}
        />
        <StatCard
          label="Awaiting marking"
          value={awaitingGrading}
          tone={awaitingGrading > 0 ? 'warning' : 'positive'}
        />
      </div>

      <Card className="mt-6" title="My assignments">
        {list.loading ? <Spinner /> : list.error ? (
          <Alert>{list.error}</Alert>
        ) : (list.data ?? []).length === 0 ? (
          <EmptyState title="No assignments yet" hint="Set the first piece of work." />
        ) : (
          <Table head={['Title', 'Subject', 'Class', 'Due', 'Marks', 'Submissions', '']}>
            {list.data!.map((row) => (
              <tr key={row.id}>
                <Td>
                  <span className="font-medium text-slate-900">{row.title}</span>
                  {row.description && (
                    <span className="mt-0.5 block max-w-md truncate text-xs text-slate-400">
                      {row.description}
                    </span>
                  )}
                </Td>
                <Td>
                  <span className="text-slate-900">{row.subjectName}</span>
                  <span className="block text-xs text-slate-400">{row.subjectCode}</span>
                </Td>
                <Td className="whitespace-nowrap text-xs">
                  Sem {row.semester} · {row.section}
                </Td>
                <Td className="whitespace-nowrap text-xs">
                  {date(row.dueDate)}
                  {row.overdue && <Badge tone="slate">Closed</Badge>}
                </Td>
                <Td className="tabular-nums">{row.maxMarks}</Td>
                <Td className="tabular-nums">
                  <Badge tone={(row.submissionCount ?? 0) === (row.gradedCount ?? 0) ? 'green' : 'amber'}>
                    {row.gradedCount ?? 0} / {row.submissionCount ?? 0} marked
                  </Badge>
                </Td>
                <Td className="whitespace-nowrap text-right">
                  <Button variant="ghost" onClick={() => openSubmissions(row)}>Submissions</Button>
                  <Button variant="ghost" onClick={() => startEdit(row)}>Edit</Button>
                  <Button variant="ghost" onClick={() => remove(row)}>Remove</Button>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal
        open={open}
        title={editing ? 'Edit assignment' : 'New assignment'}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={save} className="space-y-4">
          {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}

          <Field label="Subject allocation" required>
            <Select
              value={form.facultySubjectId || ''}
              onChange={(e) =>
                setForm({ ...form, facultySubjectId: Number(e.target.value) })}
              required
            >
              <option value="">Select a class…</option>
              {(subjects.data ?? []).map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.subjectName} · Sem {subject.semester} · {subject.section}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Title" required>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              maxLength={200}
              required
            />
          </Field>

          <Field label="Description">
            <Textarea
              rows={4}
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={4000}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Due date" required>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                required
              />
            </Field>
            <Field label="Maximum marks" required>
              <Input
                type="number"
                min={1}
                max={1000}
                step="0.5"
                value={form.maxMarks}
                onChange={(e) => setForm({ ...form, maxMarks: Number(e.target.value) })}
                required
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Publish'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={viewing !== null}
        wide
        title={viewing ? `Submissions — ${viewing.title}` : 'Submissions'}
        onClose={() => setViewing(null)}
      >
        {loadingSubmissions ? <Spinner /> : submissions.length === 0 ? (
          <EmptyState title="Nothing handed in yet" />
        ) : (
          <Table head={['Student', 'File', 'Submitted', 'Status', 'Marks', '']}>
            {submissions.map((row) => (
              <tr key={row.id}>
                <Td>
                  <span className="font-medium text-slate-900">{row.studentName}</span>
                  <span className="block text-xs text-slate-400">{row.enrollmentNumber}</span>
                </Td>
                <Td>
                  <button
                    type="button"
                    className="text-sm font-medium text-brand-600 hover:underline"
                    onClick={() =>
                      facultyAssignments.downloadSubmission(row.id, row.fileName)}
                  >
                    {row.fileName}
                  </button>
                </Td>
                <Td className="whitespace-nowrap text-xs">{dateTime(row.submittedAt)}</Td>
                <Td>
                  <Badge tone={
                    row.status === 'GRADED' ? 'green' : row.status === 'LATE' ? 'rose' : 'blue'
                  }>
                    {titleCase(row.status)}
                  </Badge>
                </Td>
                <Td className="tabular-nums">
                  {row.marksObtained != null ? `${row.marksObtained} / ${row.maxMarks}` : '—'}
                </Td>
                <Td className="text-right">
                  <Button variant="ghost" onClick={() => {
                    setGrading(row);
                    setMarks(row.marksObtained != null ? String(row.marksObtained) : '');
                    setFeedback(row.feedback ?? '');
                  }}>
                    {row.status === 'GRADED' ? 'Re-mark' : 'Mark'}
                  </Button>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Modal>

      <Modal
        open={grading !== null}
        title={grading ? `Mark ${grading.studentName}` : 'Mark submission'}
        onClose={() => setGrading(null)}
      >
        <form onSubmit={saveGrade} className="space-y-4">
          {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}

          <Field label={`Marks out of ${grading?.maxMarks ?? ''}`} required>
            <Input
              type="number"
              min={0}
              max={grading?.maxMarks}
              step="0.5"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              required
            />
          </Field>

          <Field label="Feedback">
            <Textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              maxLength={1000}
            />
          </Field>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setGrading(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save marks'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
