import { useState } from 'react';
import type { FormEvent } from 'react';
import { library } from '../../api/endpoints';
import type { BookIssueRequest, BookRequest, BookResponse } from '../../api/types';
import { useAsync, errorMessage } from '../../lib/useAsync';
import { useStudentOptions } from '../../lib/useStudentOptions';
import {
  Alert, Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader,
  Select, Spinner, StatCard, Table, Td,
} from '../../components/ui';
import { date, money, today } from '../../lib/format';

const EMPTY_BOOK: BookRequest = {
  isbn: '',
  title: '',
  author: '',
  publisher: '',
  category: '',
  shelfLocation: '',
  totalCopies: 1,
};

/** Two weeks from today, the usual loan period. */
function defaultDueDate(): string {
  const due = new Date();
  due.setDate(due.getDate() + 14);
  return due.toISOString().slice(0, 10);
}

export default function AdminLibrary() {
  const [keyword, setKeyword] = useState('');
  const books = useAsync(() => library.books(keyword || undefined), [keyword]);
  const issues = useAsync(() => library.issues(), []);
  const studentOptions = useStudentOptions();

  const [bookOpen, setBookOpen] = useState(false);
  const [editing, setEditing] = useState<BookResponse | null>(null);
  const [bookForm, setBookForm] = useState<BookRequest>(EMPTY_BOOK);

  const [issueOpen, setIssueOpen] = useState(false);
  const [issueForm, setIssueForm] = useState<BookIssueRequest>({
    bookId: 0, studentId: 0, dueDate: defaultDueDate(), remarks: '',
  });

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const onLoan = (issues.data ?? []).filter((row) => row.status === 'ISSUED');
  const overdue = onLoan.filter((row) => row.overdue);

  function startCreateBook() {
    setEditing(null);
    setBookForm(EMPTY_BOOK);
    setError('');
    setBookOpen(true);
  }

  function startEditBook(book: BookResponse) {
    setEditing(book);
    setBookForm({
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      publisher: book.publisher ?? '',
      category: book.category ?? '',
      shelfLocation: book.shelfLocation ?? '',
      totalCopies: book.totalCopies,
    });
    setError('');
    setBookOpen(true);
  }

  async function saveBook(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (editing) {
        await library.updateBook(editing.id, bookForm);
        setNotice('Book updated.');
      } else {
        await library.createBook(bookForm);
        setNotice('Book added to the catalogue.');
      }
      setBookOpen(false);
      books.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function removeBook(book: BookResponse) {
    if (!window.confirm(`Remove "${book.title}" from the catalogue?`)) return;
    try {
      const result = await library.removeBook(book.id);
      setNotice(result.message);
      books.reload();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function issueBook(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await library.issue(issueForm);
      setNotice('Book issued.');
      setIssueOpen(false);
      books.reload();
      issues.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function returnBook(issueId: number) {
    try {
      const result = await library.returnBook(issueId);
      setNotice(
        Number(result.fineAmount ?? 0) > 0
          ? `Returned. A fine of ${money(result.fineAmount)} is due.`
          : 'Returned with no fine.',
      );
      books.reload();
      issues.reload();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Library"
        subtitle="Catalogue, issues and returns."
        actions={
          <>
            <Button variant="secondary" onClick={() => {
              setIssueForm({
                bookId: 0, studentId: 0, dueDate: defaultDueDate(), remarks: '',
              });
              setError('');
              setIssueOpen(true);
            }}>
              Issue a book
            </Button>
            <Button onClick={startCreateBook}>Add book</Button>
          </>
        }
      />

      {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}
      {notice && <Alert tone="success" onDismiss={() => setNotice('')}>{notice}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Titles" value={books.data?.length ?? '—'} />
        <StatCard
          label="Copies available"
          value={(books.data ?? []).reduce((sum, book) => sum + book.availableCopies, 0)}
        />
        <StatCard label="On loan" value={onLoan.length} />
        <StatCard
          label="Overdue"
          value={overdue.length}
          tone={overdue.length > 0 ? 'danger' : 'positive'}
        />
      </div>

      <Card
        className="mt-6"
        title="Catalogue"
        actions={
          <Input
            placeholder="Search title, author, ISBN…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-64"
          />
        }
      >
        {books.loading ? <Spinner /> : books.error ? (
          <Alert>{books.error}</Alert>
        ) : (books.data ?? []).length === 0 ? (
          <EmptyState title="No books found" hint="Add a title to get started." />
        ) : (
          <Table head={['ISBN', 'Title', 'Author', 'Category', 'Shelf', 'Available', '']}>
            {books.data!.map((book) => (
              <tr key={book.id}>
                <Td className="whitespace-nowrap font-mono text-xs">{book.isbn}</Td>
                <Td className="font-medium text-slate-900">{book.title}</Td>
                <Td className="text-xs">{book.author}</Td>
                <Td className="text-xs">{book.category || '—'}</Td>
                <Td className="text-xs">{book.shelfLocation || '—'}</Td>
                <Td className="tabular-nums">
                  <Badge tone={book.availableCopies > 0 ? 'green' : 'rose'}>
                    {book.availableCopies} / {book.totalCopies}
                  </Badge>
                </Td>
                <Td className="whitespace-nowrap text-right">
                  <Button variant="ghost" onClick={() => startEditBook(book)}>Edit</Button>
                  <Button variant="ghost" onClick={() => removeBook(book)}>Remove</Button>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card className="mt-6" title="Issue register" description="Newest first.">
        {issues.loading ? <Spinner /> : issues.error ? (
          <Alert>{issues.error}</Alert>
        ) : (issues.data ?? []).length === 0 ? (
          <EmptyState title="Nothing issued yet" />
        ) : (
          <Table head={['Book', 'Student', 'Issued', 'Due', 'Status', 'Fine', '']}>
            {issues.data!.map((row) => (
              <tr key={row.id}>
                <Td>
                  <span className="font-medium text-slate-900">{row.bookTitle}</span>
                  <span className="block font-mono text-xs text-slate-400">{row.isbn}</span>
                </Td>
                <Td>
                  <span className="text-slate-900">{row.studentName}</span>
                  <span className="block text-xs text-slate-400">{row.enrollmentNumber}</span>
                </Td>
                <Td className="whitespace-nowrap text-xs">{date(row.issuedOn)}</Td>
                <Td className="whitespace-nowrap text-xs">{date(row.dueDate)}</Td>
                <Td>
                  {row.status === 'RETURNED'
                    ? <Badge tone="slate">Returned</Badge>
                    : row.overdue
                      ? <Badge tone="rose">Overdue by {row.daysOverdue}d</Badge>
                      : <Badge tone="green">On loan</Badge>}
                </Td>
                <Td className="tabular-nums">{money(row.fineAmount)}</Td>
                <Td className="text-right">
                  {row.status === 'ISSUED' && (
                    <Button variant="ghost" onClick={() => returnBook(row.id)}>
                      Mark returned
                    </Button>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal
        open={bookOpen}
        title={editing ? 'Edit book' : 'Add book'}
        onClose={() => setBookOpen(false)}
      >
        <form onSubmit={saveBook} className="space-y-4">
          {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="ISBN" required>
              <Input
                value={bookForm.isbn}
                onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                required
              />
            </Field>
            <Field label="Total copies" required>
              <Input
                type="number"
                min={1}
                value={bookForm.totalCopies}
                onChange={(e) =>
                  setBookForm({ ...bookForm, totalCopies: Number(e.target.value) })}
                required
              />
            </Field>
          </div>

          <Field label="Title" required>
            <Input
              value={bookForm.title}
              onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
              required
            />
          </Field>

          <Field label="Author" required>
            <Input
              value={bookForm.author}
              onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Publisher">
              <Input
                value={bookForm.publisher ?? ''}
                onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })}
              />
            </Field>
            <Field label="Category">
              <Input
                value={bookForm.category ?? ''}
                onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
              />
            </Field>
            <Field label="Shelf">
              <Input
                value={bookForm.shelfLocation ?? ''}
                onChange={(e) => setBookForm({ ...bookForm, shelfLocation: e.target.value })}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setBookOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Add book'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={issueOpen} title="Issue a book" onClose={() => setIssueOpen(false)}>
        <form onSubmit={issueBook} className="space-y-4">
          {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}

          <Field label="Book" required>
            <Select
              value={issueForm.bookId || ''}
              onChange={(e) => setIssueForm({ ...issueForm, bookId: Number(e.target.value) })}
              required
            >
              <option value="">Select a book…</option>
              {(books.data ?? [])
                .filter((book) => book.availableCopies > 0)
                .map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title} ({book.availableCopies} available)
                  </option>
                ))}
            </Select>
          </Field>

          <Field label="Student" required error={studentOptions.error || undefined}>
            <Select
              value={issueForm.studentId || ''}
              onChange={(e) =>
                setIssueForm({ ...issueForm, studentId: Number(e.target.value) })}
              required
            >
              <option value="">Select a student…</option>
              {studentOptions.options.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </Select>
          </Field>

          <Field label="Due date" required>
            <Input
              type="date"
              min={today()}
              value={issueForm.dueDate}
              onChange={(e) => setIssueForm({ ...issueForm, dueDate: e.target.value })}
              required
            />
          </Field>

          <Field label="Remarks">
            <Input
              value={issueForm.remarks ?? ''}
              onChange={(e) => setIssueForm({ ...issueForm, remarks: e.target.value })}
            />
          </Field>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setIssueOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Issuing…' : 'Issue book'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
