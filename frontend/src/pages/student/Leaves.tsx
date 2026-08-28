import { useState } from 'react';
import type { FormEvent } from 'react';
import { studentPortal } from '../../api/endpoints';
import { useAsync, errorMessage } from '../../lib/useAsync';
import {
  Alert, Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader,
  Spinner, Table, Td, Textarea,
} from '../../components/ui';
import { date, dateTime, titleCase, today } from '../../lib/format';

export default function StudentLeaves() {
  const { data, loading, error, reload } = useAsync(() => studentPortal.leaves(), []);

  const [open, setOpen] = useState(false);
  const [fromDate, setFromDate] = useState(today());
  const [toDate, setToDate] = useState(today());
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

  function resetForm() {
    setFromDate(today());
    setToDate(today());
    setReason('');
    setFormError('');
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError('');

    if (toDate < fromDate) {
      setFormError('The end date cannot be before the start date.');
      return;
    }

    setBusy(true);
    try {
      await studentPortal.applyLeave({ fromDate, toDate, reason });
      setOpen(false);
      resetForm();
      setNotice('Leave application submitted.');
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
        title="Leave"
        subtitle="Apply for leave and track the status of your applications."
        actions={
          <Button onClick={() => { resetForm(); setOpen(true); }}>Apply for leave</Button>
        }
      />

      {error && <Alert>{error}</Alert>}
      {notice && <Alert tone="success" onDismiss={() => setNotice('')}>{notice}</Alert>}

      <Card title="My applications">
        {loading ? <Spinner /> : leaves.length === 0 ? (
          <EmptyState
            title="No leave applications"
            hint="Use the button above to submit your first request."
          />
        ) : (
          <Table head={['Applied', 'From', 'To', 'Reason', 'Status', 'Reviewer']}>
            {leaves.map((leave) => (
              <tr key={leave.id}>
                <Td className="whitespace-nowrap">{dateTime(leave.appliedAt)}</Td>
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
                </Td>
                <Td>
                  {leave.reviewerEmail ? (
                    <>
                      <span className="block text-xs text-slate-600">{leave.reviewerEmail}</span>
                      {leave.reviewerComment && (
                        <span className="block text-xs text-slate-400">{leave.reviewerComment}</span>
                      )}
                    </>
                  ) : <span className="text-slate-400">Awaiting review</span>}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal open={open} title="Apply for leave" onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="space-y-4">
          {formError && <Alert onDismiss={() => setFormError('')}>{formError}</Alert>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="From" required>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                required
              />
            </Field>
            <Field label="To" required>
              <Input
                type="date"
                value={toDate}
                min={fromDate}
                onChange={(e) => setToDate(e.target.value)}
                required
              />
            </Field>
          </div>

          <Field label="Reason" required hint="Up to 1000 characters.">
            <Textarea
              rows={4}
              value={reason}
              maxLength={1000}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you need leave…"
              required
            />
          </Field>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Submitting…' : 'Submit application'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
