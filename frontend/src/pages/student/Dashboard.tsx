import { Link } from 'react-router-dom';
import { dashboards, studentPortal } from '../../api/endpoints';
import { useAsync } from '../../lib/useAsync';
import { NoticeBoard } from '../../components/NoticeBoard';
import {
  Alert, Badge, Card, EmptyState, PageHeader, Spinner, StatCard, Table, Td,
} from '../../components/ui';
import { currentAcademicYear, date, money, time, titleCase } from '../../lib/format';

export default function StudentDashboard() {
  const fees = useAsync(() => studentPortal.feeDashboard(), []);
  const studentId = fees.data?.studentId ?? null;

  const attendance = useAsync(
    () => studentPortal.attendance(studentId!),
    [studentId],
    studentId !== null,
  );
  const results = useAsync(() => studentPortal.results(), []);

  const year = currentAcademicYear();
  const timetable = useAsync(() => studentPortal.timetable(year), [year]);
  const stats = useAsync(() => dashboards.student(year), [year]);

  if (fees.loading) return <Spinner />;

  if (fees.error) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <Alert>{fees.error}</Alert>
        <p className="text-sm text-slate-500">
          A student record matching your login email must exist before the
          portal can load your data.
        </p>
      </>
    );
  }

  const summary = attendance.data ?? [];
  const overall = summary.length
    ? summary.reduce((sum, s) => sum + s.attendancePercentage, 0) / summary.length
    : null;
  const lowSubjects = summary.filter((s) => s.lowAttendance);
  const latestResult = results.data?.[0] ?? null;

  const todayName = new Date()
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toUpperCase();
  const todayClasses = (timetable.data ?? [])
    .filter((entry) => entry.day === todayName)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <>
      <PageHeader
        title={`Welcome, ${fees.data?.studentName ?? 'student'}`}
        subtitle={`Enrollment ${fees.data?.enrollmentNumber ?? '—'} · ${year}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Fees due"
          value={money(fees.data?.dueAmount)}
          hint={`Paid ${money(fees.data?.paidAmount)} of ${money(fees.data?.totalFee)}`}
          tone={Number(fees.data?.dueAmount ?? 0) > 0 ? 'danger' : 'positive'}
        />
        <StatCard
          label="Overall attendance"
          value={overall === null ? '—' : `${overall.toFixed(1)}%`}
          hint={`${summary.length} subject${summary.length === 1 ? '' : 's'} tracked`}
          tone={overall !== null && overall < 75 ? 'warning' : 'positive'}
        />
        <StatCard
          label="Low attendance"
          value={lowSubjects.length}
          hint={lowSubjects.length ? 'Subjects below the threshold' : 'All subjects on track'}
          tone={lowSubjects.length ? 'danger' : 'positive'}
        />
        <StatCard
          label="Latest result"
          value={latestResult ? `${Number(latestResult.percentage).toFixed(1)}%` : '—'}
          hint={latestResult ? `${latestResult.examName} · Grade ${latestResult.grade}` : 'No results published'}
          tone={latestResult?.result === 'PASS' ? 'positive' : 'default'}
        />
        <StatCard
          label="Assignments to hand in"
          value={stats.data?.assignmentsDue ?? '—'}
          tone={(stats.data?.assignmentsDue ?? 0) > 0 ? 'warning' : 'positive'}
          hint="Still open and not yet submitted"
        />
        <StatCard
          label="Library books"
          value={stats.data?.booksHeld ?? '—'}
          hint="Currently with you"
        />
        <StatCard
          label="Hostel"
          value={stats.data?.hostelRoom ?? 'Not allocated'}
        />
        <StatCard
          label="Transport"
          value={stats.data?.transportRoute ?? 'Not assigned'}
        />
      </div>

      <NoticeBoard
        className="mt-6"
        title="Latest notices"
        notices={stats.data?.latestNotices ?? null}
        loading={stats.loading}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card
          title="Today's classes"
          description={titleCase(todayName)}
          actions={<Link to="/student/timetable" className="text-sm font-medium text-brand-600 hover:underline">Full timetable</Link>}
        >
          {timetable.loading ? <Spinner /> : todayClasses.length === 0 ? (
            <EmptyState title="No classes scheduled today" />
          ) : (
            <Table head={['Time', 'Subject', 'Faculty', 'Room']}>
              {todayClasses.map((entry) => (
                <tr key={entry.id}>
                  <Td className="whitespace-nowrap tabular-nums">
                    {time(entry.startTime)}–{time(entry.endTime)}
                  </Td>
                  <Td>
                    <span className="font-medium text-slate-900">{entry.subjectName}</span>
                    <span className="block text-xs text-slate-400">{entry.subjectCode}</span>
                  </Td>
                  <Td>{entry.facultyName}</Td>
                  <Td>{entry.room}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card
          title="Fee breakdown"
          actions={<Link to="/student/fees" className="text-sm font-medium text-brand-600 hover:underline">Details</Link>}
        >
          {(fees.data?.fees.length ?? 0) === 0 ? (
            <EmptyState title="No fees assigned yet" />
          ) : (
            <Table head={['Type', 'Total', 'Due', 'Status']}>
              {fees.data!.fees.map((fee) => (
                <tr key={fee.id}>
                  <Td className="font-medium text-slate-900">{titleCase(fee.feeType)}</Td>
                  <Td className="tabular-nums">{money(fee.totalAmount)}</Td>
                  <Td className="tabular-nums">{money(fee.dueAmount)}</Td>
                  <Td>
                    <Badge tone={
                      fee.status === 'PAID' ? 'green'
                        : fee.status === 'PARTIAL' ? 'amber' : 'rose'
                    }>
                      {titleCase(fee.status)}
                    </Badge>
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card
          title="Attendance by subject"
          actions={<Link to="/student/attendance" className="text-sm font-medium text-brand-600 hover:underline">Details</Link>}
        >
          {attendance.loading ? <Spinner /> : summary.length === 0 ? (
            <EmptyState title="No attendance recorded yet" />
          ) : (
            <Table head={['Subject', 'Present', 'Percentage']}>
              {summary.map((row) => (
                <tr key={row.subjectId}>
                  <Td className="font-medium text-slate-900">{row.subjectName}</Td>
                  <Td className="tabular-nums">{row.presentClasses}/{row.totalClasses}</Td>
                  <Td>
                    <Badge tone={row.lowAttendance ? 'rose' : 'green'}>
                      {row.attendancePercentage.toFixed(1)}%
                    </Badge>
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card
          title="Recent results"
          actions={<Link to="/student/results" className="text-sm font-medium text-brand-600 hover:underline">All results</Link>}
        >
          {results.loading ? <Spinner /> : (results.data?.length ?? 0) === 0 ? (
            <EmptyState title="No results published yet" />
          ) : (
            <Table head={['Exam', 'Marks', 'Grade', 'Result']}>
              {results.data!.slice(0, 5).map((row) => (
                <tr key={row.examId}>
                  <Td>
                    <span className="font-medium text-slate-900">{row.examName}</span>
                    <span className="block text-xs text-slate-400">{row.academicYear}</span>
                  </Td>
                  <Td className="tabular-nums">
                    {Number(row.obtainedMarks)}/{Number(row.totalMarks)}
                  </Td>
                  <Td>{row.grade}</Td>
                  <Td>
                    <Badge tone={row.result === 'PASS' ? 'green' : 'rose'}>{row.result}</Badge>
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>

      {fees.data && (
        <p className="mt-6 text-xs text-slate-400">
          Fee records last synced {date(new Date().toISOString())}.
        </p>
      )}
    </>
  );
}
