import { useState } from 'react';
import type { FormEvent } from 'react';
import { notices as noticesApi } from '../../api/endpoints';
import { NOTICE_AUDIENCES } from '../../api/types';
import type { NoticeRequest, NoticeResponse } from '../../api/types';
import { useAsync, errorMessage } from '../../lib/useAsync';
import {
  Alert, Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader,
  Select, Spinner, Table, Td, Textarea,
} from '../../components/ui';
import { date, titleCase, today } from '../../lib/format';

const EMPTY: NoticeRequest = {
  title: '',
  content: '',
  audience: 'ALL',
  publishDate: today(),
  expiryDate: '',
  pinned: false,
};

export default function AdminNotices() {
  const list = useAsync(() => noticesApi.list(), []);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NoticeResponse | null>(null);
  const [form, setForm] = useState<NoticeRequest>(EMPTY);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  function startCreate() {
    setEditing(null);
    setForm(EMPTY);
    setError('');
    setOpen(true);
  }

  function startEdit(row: NoticeResponse) {
    setEditing(row);
    setForm({
      title: row.title,
      content: row.content,
      audience: row.audience,
      publishDate: row.publishDate,
      expiryDate: row.expiryDate ?? '',
      pinned: row.pinned,
    });
    setError('');
    setOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);

    // The backend treats an absent expiry as "never expires".
    const body: NoticeRequest = { ...form, expiryDate: form.expiryDate || null };

    try {
      if (editing) {
        await noticesApi.update(editing.id, body);
        setNotice('Notice updated.');
      } else {
        await noticesApi.create(body);
        setNotice('Notice published.');
      }
      setOpen(false);
      list.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(row: NoticeResponse) {
    if (!window.confirm(`Remove the notice "${row.title}"?`)) return;
    try {
      const result = await noticesApi.remove(row.id);
      setNotice(result.message);
      list.reload();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Notices"
        subtitle="Publish announcements to students, faculty or everyone."
        actions={<Button onClick={startCreate}>New notice</Button>}
      />

      {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}
      {notice && <Alert tone="success" onDismiss={() => setNotice('')}>{notice}</Alert>}

      <Card title="Published notices">
        {list.loading ? <Spinner /> : list.error ? (
          <Alert>{list.error}</Alert>
        ) : (list.data ?? []).length === 0 ? (
          <EmptyState title="No notices yet" hint="Publish your first announcement." />
        ) : (
          <Table head={['Title', 'Audience', 'Published', 'Expires', '']}>
            {list.data!.map((row) => (
              <tr key={row.id}>
                <Td>
                  <span className="flex items-center gap-2 font-medium text-slate-900">
                    {row.title}
                    {row.pinned && <Badge tone="amber">Pinned</Badge>}
                  </span>
                  <span className="mt-0.5 block max-w-xl truncate text-xs text-slate-400">
                    {row.content}
                  </span>
                </Td>
                <Td><Badge tone="blue">{titleCase(row.audience)}</Badge></Td>
                <Td className="whitespace-nowrap text-xs">{date(row.publishDate)}</Td>
                <Td className="whitespace-nowrap text-xs">
                  {row.expiryDate ? date(row.expiryDate) : 'Never'}
                </Td>
                <Td className="whitespace-nowrap text-right">
                  <Button variant="ghost" onClick={() => startEdit(row)}>Edit</Button>
                  <Button variant="ghost" onClick={() => handleDelete(row)}>Remove</Button>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal
        open={open}
        title={editing ? 'Edit notice' : 'New notice'}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}

          <Field label="Title" required>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              maxLength={200}
              required
            />
          </Field>

          <Field label="Content" required>
            <Textarea
              rows={5}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              maxLength={4000}
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Audience" required>
              <Select
                value={form.audience}
                onChange={(e) =>
                  setForm({ ...form, audience: e.target.value as NoticeRequest['audience'] })}
              >
                {NOTICE_AUDIENCES.map((audience) => (
                  <option key={audience} value={audience}>{titleCase(audience)}</option>
                ))}
              </Select>
            </Field>

            <Field label="Publish date" required>
              <Input
                type="date"
                value={form.publishDate}
                onChange={(e) => setForm({ ...form, publishDate: e.target.value })}
                required
              />
            </Field>

            <Field label="Expiry date" hint="Leave blank to keep it up indefinitely.">
              <Input
                type="date"
                value={form.expiryDate ?? ''}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              />
            </Field>

            <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300"
              />
              Pin to the top of the board
            </label>
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
    </>
  );
}
