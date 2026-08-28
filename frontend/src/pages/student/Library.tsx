import { useState } from 'react';
import { studentLibrary } from '../../api/endpoints';
import { useAsync } from '../../lib/useAsync';
import {
  Alert, Badge, Card, EmptyState, Input, PageHeader, Spinner, StatCard, Table, Td,
} from '../../components/ui';
import { date, money } from '../../lib/format';

export default function StudentLibrary() {
  const myBooks = useAsync(() => studentLibrary.myBooks(), []);
  const [keyword, setKeyword] = useState('');
  const catalogue = useAsync(() => studentLibrary.catalogue(keyword || undefined), [keyword]);

  const held = (myBooks.data ?? []).filter((row) => row.status === 'ISSUED');
  const overdue = held.filter((row) => row.overdue);
  const fines = (myBooks.data ?? []).reduce(
    (sum, row) => sum + Number(row.fineAmount ?? 0), 0,
  );

  return (
    <>
      <PageHeader
        title="Library"
        subtitle="What you are holding, and what the library stocks."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Books with me" value={held.length} />
        <StatCard
          label="Overdue"
          value={overdue.length}
          tone={overdue.length > 0 ? 'danger' : 'positive'}
        />
        <StatCard
          label="Fines"
          value={money(fines)}
          tone={fines > 0 ? 'warning' : 'positive'}
          hint="Across all loans"
        />
      </div>

      <Card className="mt-6" title="My loans" description="Current and past, newest first.">
        {myBooks.loading ? <Spinner /> : myBooks.error ? (
          <Alert>{myBooks.error}</Alert>
        ) : (myBooks.data ?? []).length === 0 ? (
          <EmptyState title="You have not borrowed anything yet" />
        ) : (
          <Table head={['Book', 'Issued', 'Due', 'Returned', 'Status', 'Fine']}>
            {myBooks.data!.map((row) => (
              <tr key={row.id}>
                <Td>
                  <span className="font-medium text-slate-900">{row.bookTitle}</span>
                  <span className="block text-xs text-slate-400">{row.author}</span>
                </Td>
                <Td className="whitespace-nowrap text-xs">{date(row.issuedOn)}</Td>
                <Td className="whitespace-nowrap text-xs">{date(row.dueDate)}</Td>
                <Td className="whitespace-nowrap text-xs">
                  {row.returnedOn ? date(row.returnedOn) : '—'}
                </Td>
                <Td>
                  {row.status === 'RETURNED'
                    ? <Badge tone="slate">Returned</Badge>
                    : row.overdue
                      ? <Badge tone="rose">Overdue by {row.daysOverdue}d</Badge>
                      : <Badge tone="green">With me</Badge>}
                </Td>
                <Td className="tabular-nums">{money(row.fineAmount)}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

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
        {catalogue.loading ? <Spinner /> : catalogue.error ? (
          <Alert>{catalogue.error}</Alert>
        ) : (catalogue.data ?? []).length === 0 ? (
          <EmptyState title="No books match that search" />
        ) : (
          <Table head={['Title', 'Author', 'Category', 'Shelf', 'Available']}>
            {catalogue.data!.map((book) => (
              <tr key={book.id}>
                <Td className="font-medium text-slate-900">{book.title}</Td>
                <Td className="text-xs">{book.author}</Td>
                <Td className="text-xs">{book.category || '—'}</Td>
                <Td className="text-xs">{book.shelfLocation || '—'}</Td>
                <Td>
                  <Badge tone={book.availableCopies > 0 ? 'green' : 'rose'}>
                    {book.availableCopies > 0
                      ? `${book.availableCopies} available`
                      : 'All on loan'}
                  </Badge>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
