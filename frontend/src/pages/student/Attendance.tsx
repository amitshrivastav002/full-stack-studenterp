import { useState } from 'react';
import { studentPortal } from '../../api/endpoints';
import { useAsync } from '../../lib/useAsync';
import {
  Alert, Badge, Card, EmptyState, PageHeader, Spinner, StatCard, Table, Td,
} from '../../components/ui';
import { PdfButton } from '../../components/PdfButton';
import { useStudentId } from './useStudentId';

export default function StudentAttendance() {
  const { studentId, loading: idLoading, error: idError } = useStudentId();
  const [pdfError, setPdfError] = useState('');

  const { data, loading, error } = useAsync(
    () => studentPortal.attendance(studentId!),
    [studentId],
    studentId !== null,
  );

  if (idLoading) return <Spinner />;
  if (idError) return <><PageHeader title="Attendance" /><Alert>{idError}</Alert></>;

  const rows = data ?? [];
  const totals = rows.reduce(
    (acc, row) => ({
      total: acc.total + row.totalClasses,
      present: acc.present + row.presentClasses,
    }),
    { total: 0, present: 0 },
  );
  const overall = totals.total ? (totals.present / totals.total) * 100 : null;

  return (
    <>
      <PageHeader
        title="Attendance"
        subtitle="Your attendance record for every subject you are enrolled in."
      />

      {error && <Alert>{error}</Alert>}
      {pdfError && <Alert onDismiss={() => setPdfError('')}>{pdfError}</Alert>}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Overall attendance"
          value={overall === null ? '—' : `${overall.toFixed(1)}%`}
          tone={overall !== null && overall < 75 ? 'danger' : 'positive'}
        />
        <StatCard
          label="Classes attended"
          value={`${totals.present} / ${totals.total}`}
        />
        <StatCard
          label="Subjects below threshold"
          value={rows.filter((r) => r.lowAttendance).length}
          tone={rows.some((r) => r.lowAttendance) ? 'warning' : 'positive'}
        />
      </div>

      <Card
        title="Subject-wise breakdown"
        actions={
          <PdfButton
            disabled={rows.length === 0}
            onError={setPdfError}
            options={() => ({
              filename: 'attendance-report',
              title: 'Attendance report',
              subtitle: 'Subject-wise attendance for the current academic year',
              meta: [
                ['Overall', overall === null ? '—' : `${overall.toFixed(1)}%`],
                ['Classes attended', `${totals.present} / ${totals.total}`],
                ['Subjects', String(rows.length)],
                ['Below threshold', String(rows.filter((r) => r.lowAttendance).length)],
              ],
              head: ['Subject', 'Code', 'Total', 'Present', 'Absent', 'Late', 'Excused', '%'],
              rows: rows.map((row) => [
                row.subjectName,
                row.subjectCode,
                row.totalClasses,
                row.presentClasses,
                row.absentClasses,
                row.lateClasses,
                row.excusedClasses,
                `${row.attendancePercentage.toFixed(1)}%`,
              ]),
            })}
          />
        }
      >
        {loading ? <Spinner /> : rows.length === 0 ? (
          <EmptyState
            title="No attendance recorded"
            hint="Attendance appears here once your faculty starts marking it."
          />
        ) : (
          <Table head={[
            'Subject', 'Total', 'Present', 'Absent', 'Late', 'Excused', 'Percentage',
          ]}>
            {rows.map((row) => (
              <tr key={row.subjectId}>
                <Td>
                  <span className="font-medium text-slate-900">{row.subjectName}</span>
                  <span className="block text-xs text-slate-400">{row.subjectCode}</span>
                </Td>
                <Td className="tabular-nums">{row.totalClasses}</Td>
                <Td className="tabular-nums text-emerald-600">{row.presentClasses}</Td>
                <Td className="tabular-nums text-rose-600">{row.absentClasses}</Td>
                <Td className="tabular-nums text-amber-600">{row.lateClasses}</Td>
                <Td className="tabular-nums">{row.excusedClasses}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={row.lowAttendance ? 'h-full bg-rose-500' : 'h-full bg-emerald-500'}
                        style={{ width: `${Math.min(row.attendancePercentage, 100)}%` }}
                      />
                    </div>
                    <Badge tone={row.lowAttendance ? 'rose' : 'green'}>
                      {row.attendancePercentage.toFixed(1)}%
                    </Badge>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
