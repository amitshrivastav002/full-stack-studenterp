import { useState } from 'react';
import { studentPortal } from '../../api/endpoints';
import { useAsync } from '../../lib/useAsync';
import {
  Alert, Badge, Card, EmptyState, PageHeader, Spinner, Table, Td,
} from '../../components/ui';
import { PdfButton } from '../../components/PdfButton';
import type { TablePdfOptions } from '../../lib/pdf';
import type { StudentExamResultResponse } from '../../api/types';

export default function StudentResults() {
  const { data, loading, error } = useAsync(() => studentPortal.results(), []);
  const [pdfError, setPdfError] = useState('');

  return (
    <>
      <PageHeader
        title="Examination results"
        subtitle="Published marks for every exam you have appeared in."
      />

      {error && <Alert>{error}</Alert>}
      {pdfError && <Alert onDismiss={() => setPdfError('')}>{pdfError}</Alert>}

      {loading ? <Spinner /> : (data ?? []).length === 0 ? (
        <EmptyState
          title="No results published"
          hint="Results appear here once the examination office publishes them."
        />
      ) : (
        <div className="space-y-6">
          {data!.map((result) => (
            <Card
              key={result.examId}
              title={result.examName}
              description={`${result.academicYear} · ${result.enrollmentNumber}`}
              actions={
                <div className="flex items-center gap-2">
                  <Badge tone="blue">Grade {result.grade}</Badge>
                  <Badge tone={result.result === 'PASS' ? 'green' : 'rose'}>
                    {result.result}
                  </Badge>
                  <PdfButton
                    options={() => marksheetPdf(result)}
                    onError={setPdfError}
                  />
                </div>
              }
            >
              <div className="mb-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Marks obtained
                  </p>
                  <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">
                    {Number(result.obtainedMarks)} / {Number(result.totalMarks)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Percentage
                  </p>
                  <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">
                    {Number(result.percentage).toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Subjects
                  </p>
                  <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">
                    {result.marks.length}
                  </p>
                </div>
              </div>

              <Table head={['Subject', 'Max', 'Pass mark', 'Obtained', 'Status']}>
                {result.marks.map((mark) => (
                  <tr key={mark.id}>
                    <Td className="font-medium text-slate-900">{mark.subjectName}</Td>
                    <Td className="tabular-nums">{Number(mark.maxMarks)}</Td>
                    <Td className="tabular-nums">{Number(mark.passMarks)}</Td>
                    <Td className="tabular-nums font-medium">{Number(mark.marksObtained)}</Td>
                    <Td>
                      <Badge tone={mark.passed ? 'green' : 'rose'}>
                        {mark.passed ? 'Pass' : 'Fail'}
                      </Badge>
                    </Td>
                  </tr>
                ))}
              </Table>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

/** Describes the marksheet the browser renders - no server round trip. */
function marksheetPdf(result: StudentExamResultResponse): TablePdfOptions {
  return {
    filename: `marksheet-${result.enrollmentNumber}-${result.examName}`
      .replace(/\s+/g, '-').toLowerCase(),
    title: 'Statement of marks',
    subtitle: `${result.examName} · ${result.academicYear}`,
    meta: [
      ['Student', result.studentName],
      ['Enrollment no.', result.enrollmentNumber],
      ['Marks obtained', `${Number(result.obtainedMarks)} / ${Number(result.totalMarks)}`],
      ['Percentage', `${Number(result.percentage).toFixed(2)}%`],
      ['Grade', result.grade],
      ['Result', result.result],
    ],
    head: ['Subject', 'Max', 'Pass mark', 'Obtained', 'Status'],
    rows: result.marks.map((mark) => [
      mark.subjectName,
      Number(mark.maxMarks),
      Number(mark.passMarks),
      Number(mark.marksObtained),
      mark.passed ? 'Pass' : 'Fail',
    ]),
    note: 'Generated from the student portal. Not a substitute for the marksheet '
      + 'issued by the examination office.',
  };
}
