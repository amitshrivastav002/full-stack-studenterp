import { useState } from 'react';
import type { FormEvent } from 'react';
import { studentAssignments } from '../../api/endpoints';
import type { AssignmentResponse } from '../../api/types';
import { useAsync, errorMessage } from '../../lib/useAsync';
import {
  Alert, Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader,
  Spinner, StatCard, Table, Td, Textarea,
} from '../../components/ui';
import { date, dateTime, titleCase } from '../../lib/format';

export default function StudentAssignments() {
  const list = useAsync(() => studentAssignments.list(), []);

  const [submitting, setSubmitting] = useState<AssignmentResponse | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const rows = list.data ?? [];
  const pending = rows.filter((row) => !row.mySubmission && !row.overdue);
  const graded = rows.filter((row) => row.mySubmission?.status === 'GRADED');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!submitting || !file) return;
    setError('');
    setBusy(true);
    try {
      await studentAssignments.submit(submitting.id, file, remarks || undefined);
      setNotice('Submitted. Your faculty can see it now.');
      setSubmitting(null);
      setFile(null);
      setRemarks('');
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
        subtitle="Work set for your class, and what you have handed in."
      />

      {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}
      {notice && <Alert tone="success" onDismiss={() => setNotice('')}>{notice}</Alert>}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Assignments set" value={rows.length} />
        <StatCard
          label="Still to hand in"
          value={pending.length}
          tone={pending.length > 0 ? 'warning' : 'positive'}
        />
        <StatCard label="Marked" value={graded.length} />
      </div>

      <Card className="mt-6" title="All assignments">
        {list.loading ? <Spinner /> : list.error ? (
          <Alert>{list.error}</Alert>
        ) : rows.length === 0 ? (
          <EmptyState
            title="Nothing set yet"
            hint="Assignments your faculty publish will show up here."
          />
        ) : (
          <Table head={['Title', 'Subject', 'Due', 'My submission', 'Marks', '']}>
            {rows.map((row) => {
              const mine = row.mySubmission;
              return (
                <tr key={row.id}>
                  <Td>
                    <span className="font-medium text-slate-900">{row.title}</span>
                    {row.description && (
                      <span className="mt-0.5 block max-w-md text-xs text-slate-400">
                        {row.description}
                      </span>
                    )}
                  </Td>
                  <Td>
                    <span className="text-slate-900">{row.subjectName}</span>
                    <span className="block text-xs text-slate-400">{row.facultyName}</span>
                  </Td>
                  <Td className="whitespace-nowrap text-xs">
                    {date(row.dueDate)}
                    {row.overdue && !mine && <Badge tone="rose">Overdue</Badge>}
                  </Td>
                  <Td>
                    {mine ? (
                      <>
                        <button
                          type="button"
                          className="text-sm font-medium text-brand-600 hover:underline"
                          onClick={() =>
                            studentAssignments.downloadSubmission(mine.id, mine.fileName)}
                        >
                          {mine.fileName}
                        </button>
                        <span className="mt-0.5 block text-xs text-slate-400">
                          {dateTime(mine.submittedAt)} · {titleCase(mine.status)}
                        </span>
                      </>
                    ) : (
                      <Badge tone="slate">Not submitted</Badge>
                    )}
                  </Td>
                  <Td className="tabular-nums">
                    {mine?.marksObtained != null
                      ? `${mine.marksObtained} / ${row.maxMarks}`
                      : `— / ${row.maxMarks}`}
                    {mine?.feedback && (
                      <span className="mt-0.5 block max-w-xs text-xs text-slate-400">
                        {mine.feedback}
                      </span>
                    )}
                  </Td>
                  <Td className="text-right">
                    {mine?.status === 'GRADED' ? (
                      <Badge tone="green">Marked</Badge>
                    ) : (
                      <Button variant="ghost" onClick={() => {
                        setSubmitting(row);
                        setFile(null);
                        setRemarks(mine?.remarks ?? '');
                        setError('');
                      }}>
                        {mine ? 'Replace' : 'Submit'}
                      </Button>
                    )}
                  </Td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>

      <Modal
        open={submitting !== null}
        title={submitting ? `Submit — ${submitting.title}` : 'Submit'}
        onClose={() => setSubmitting(null)}
      >
        <form onSubmit={submit} className="space-y-4">
          {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}

          {submitting?.overdue && (
            <Alert tone="info">
              The due date has passed, so this will be recorded as a late submission.
            </Alert>
          )}

          <Field label="File" required hint="Up to 5 MB.">
            <Input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
            />
          </Field>

          <Field label="Remarks">
            <Textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              maxLength={1000}
            />
          </Field>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setSubmitting(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !file}>
              {busy ? 'Uploading…' : 'Submit'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
