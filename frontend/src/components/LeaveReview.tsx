import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAsync, errorMessage } from '../lib/useAsync';
import type { LeaveDecisionRequest, LeaveStatus, StudentLeaveResponse } from '../api/types';
import {
  Alert, Badge, Button, Card, EmptyState, Field, Modal, PageHeader, Select,
  Spinner, Table, Td, Textarea,
} from './ui';
import { date, dateTime, titleCase } from '../lib/format';

const FILTERS: Array<{ value: '' | LeaveStatus; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export function LeaveReview({ title, subtitle, fetchLeaves, decide }: {
  title: string;
  subtitle: string;
  fetchLeaves: (status?: LeaveStatus) => Promise<StudentLeaveResponse[]>;
  decide: (leaveId: number, body: LeaveDecisionRequest) => Promise<StudentLeaveResponse>;
}) {
  const [filter, setFilter] = useState<'' | LeaveStatus>('PENDING');

  const { data, loading, error, reload } = useAsync(
    () => fetchLeaves(filter || undefined),
    [filter],
  );

  const [target, setTarget] = useState<StudentLeaveResponse | null>(null);
  const [decision, setDecision] = useState<LeaveStatus>('APPROVED');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

  function openReview(leave: StudentLeaveResponse, initial: LeaveStatus) {
    setTarget(leave);
    setDecision(initial);
    setComment(leave.reviewerComment ?? '');
    setFormError('');
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!target) return;

    setBusy(true);
    setFormError('');
    try {
      await decide(target.id, {
        status: decision,
        reviewerComment: comment || undefined,
      });
      setNotice(`Leave ${decision.toLowerCase()} for ${target.studentName}.`);
      setTarget(null);
      reload();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const leaves = data ?? [];

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <div className="w-44">
            <Field label="Filter">
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value as '' | LeaveStatus)}
              >
                {FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </Field>
          </div>
        }
      />

      {error && <Alert>{error}</Alert>}
      {notice && <Alert tone="success" onDismiss={() => setNotice('')}>{notice}</Alert>}

      <Card
        title="Applications"
        description={leaves.length ? `${leaves.length} application(s)` : undefined}
      >
        {loading ? <Spinner /> : leaves.length === 0 ? (
          <EmptyState
            title="No leave applications"
            hint={filter ? 'Try a different status filter.' : undefined}
          />
        ) : (
          <Table head={[
            'Student', 'Applied', 'From', 'To', 'Reason', 'Status', 'Action',
          ]}>
            {leaves.map((leave) => (
              <tr key={leave.id}>
                <Td>
                  <span className="font-medium text-slate-900">{leave.studentName}</span>
                  <span className="block text-xs text-slate-400">{leave.enrollmentNumber}</span>
                </Td>
                <Td className="whitespace-nowrap text-xs">{dateTime(leave.appliedAt)}</Td>
                <Td className="whitespace-nowrap">{date(leave.fromDate)}</Td>
                <Td className="whitespace-nowrap">{date(leave.toDate)}</Td>
                <Td className="max-w-xs">
                  <span className="block truncate" title={leave.reason}>{leave.reason}</span>
                </Td>
                <Td>
                  <Badge tone={
                    leave.status === 'APPROVED' ? 'green'
                      : leave.status === 'REJECTED' ? 'rose' : 'amber'
                  }>
                    {titleCase(leave.status)}
                  </Badge>
                  {leave.reviewerEmail && (
                    <span className="mt-1 block text-xs text-slate-400">
                      by {leave.reviewerEmail}
                    </span>
                  )}
                </Td>
                <Td>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      className="px-2 py-1 text-xs"
                      onClick={() => openReview(leave, 'APPROVED')}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="secondary"
                      className="px-2 py-1 text-xs"
                      onClick={() => openReview(leave, 'REJECTED')}
                    >
                      Reject
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal
        open={target !== null}
        title={`Review leave — ${target?.studentName ?? ''}`}
        onClose={() => setTarget(null)}
      >
        {target && (
          <form onSubmit={submit} className="space-y-4">
            {formError && <Alert onDismiss={() => setFormError('')}>{formError}</Alert>}

            <div className="rounded-lg bg-slate-50 p-4 text-sm">
              <p className="text-slate-500">
                {date(target.fromDate)} → {date(target.toDate)}
              </p>
              <p className="mt-2 text-slate-800">{target.reason}</p>
            </div>

            <Field label="Decision" required>
              <Select
                value={decision}
                onChange={(e) => setDecision(e.target.value as LeaveStatus)}
              >
                <option value="APPROVED">Approve</option>
                <option value="REJECTED">Reject</option>
                <option value="PENDING">Keep pending</option>
              </Select>
            </Field>

            <Field label="Comment" hint="Optional, up to 1000 characters.">
              <Textarea
                rows={3}
                value={comment}
                maxLength={1000}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a note for the student…"
              />
            </Field>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? 'Saving…' : 'Submit decision'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
