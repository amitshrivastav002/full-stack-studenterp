import { Link } from 'react-router-dom';
import { dashboards, facultyPortal } from '../../api/endpoints';
import { useAsync } from '../../lib/useAsync';
import { NoticeBoard } from '../../components/NoticeBoard';
import {
  Alert, Badge, Card, EmptyState, PageHeader, Spinner, StatCard, Table, Td,
} from '../../components/ui';
import { currentAcademicYear, date, time, titleCase } from '../../lib/format';

export default function FacultyDashboard() {
  const profile = useAsync(() => facultyPortal.me(), []);
  const subjects = useAsync(() => facultyPortal.mySubjects(), []);
  const pending = useAsync(() => facultyPortal.leaves('PENDING'), []);

  const year = currentAcademicYear();
  const timetable = useAsync(() => facultyPortal.timetable(year), [year]);
  const stats = useAsync(() => dashboards.faculty(year), [year]);

  const todayName = new Date()
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toUpperCase();
  const todayClasses = (timetable.data ?? [])
    .filter((entry) => entry.day === todayName)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (profile.loading) return <Spinner />;

  return (
    <>
      <PageHeader
        title={profile.data
          ? `Welcome, ${profile.data.firstName}`
          : 'Faculty dashboard'}
        subtitle={profile.data
          ? `${profile.data.designation} · ${profile.data.departmentName}`
          : undefined}
      />

      {profile.error && (
        <Alert>
          {profile.error} — your login must be linked to a faculty record by an
          administrator before this portal can load.
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Subjects allocated" value={subjects.data?.length ?? '—'} />
        <StatCard label="Classes today" value={todayClasses.length} />
        <StatCard
          label="Weekly periods"
          value={timetable.data?.length ?? '—'}
          hint={year}
        />
        <StatCard
          label="Pending leave requests"
          value={pending.data?.length ?? '—'}
          tone={(pending.data?.length ?? 0) > 0 ? 'warning' : 'positive'}
        />
        <StatCard
          label="Assignments set"
          value={stats.data?.assignmentsSet ?? '—'}
        />
        <StatCard
          label="Awaiting marking"
          value={stats.data?.submissionsAwaitingGrading ?? '—'}
          tone={(stats.data?.submissionsAwaitingGrading ?? 0) > 0 ? 'warning' : 'positive'}
          hint="Submissions handed in but not yet marked"
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
          actions={
            <Link to="/faculty/timetable" className="text-sm font-medium text-brand-600 hover:underline">
              Full timetable
            </Link>
          }
        >
          {timetable.loading ? <Spinner /> : todayClasses.length === 0 ? (
            <EmptyState title="No classes scheduled today" />
          ) : (
            <Table head={['Time', 'Subject', 'Class', 'Room']}>
              {todayClasses.map((entry) => (
                <tr key={entry.id}>
                  <Td className="whitespace-nowrap tabular-nums">
                    {time(entry.startTime)}–{time(entry.endTime)}
                  </Td>
                  <Td>
                    <span className="font-medium text-slate-900">{entry.subjectName}</span>
                    <span className="block text-xs text-slate-400">{entry.subjectCode}</span>
                  </Td>
                  <Td className="whitespace-nowrap">
                    Sem {entry.semester} · {entry.section}
                  </Td>
                  <Td>{entry.room}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card
          title="My subjects"
          description="Allocations you can mark attendance against."
          actions={
            <Link to="/faculty/attendance" className="text-sm font-medium text-brand-600 hover:underline">
              Mark attendance
            </Link>
          }
        >
          {subjects.loading ? <Spinner /> : subjects.error ? (
            <Alert>{subjects.error}</Alert>
          ) : (subjects.data ?? []).length === 0 ? (
            <EmptyState
              title="No subjects allocated"
              hint="An administrator assigns subjects to you."
            />
          ) : (
            <Table head={['Subject', 'Semester', 'Section', 'Year']}>
              {subjects.data!.map((s) => (
                <tr key={s.id}>
                  <Td>
                    <span className="font-medium text-slate-900">{s.subjectName}</span>
                    <span className="block text-xs text-slate-400">{s.subjectCode}</span>
                  </Td>
                  <Td className="tabular-nums">{s.semester}</Td>
                  <Td>{s.section}</Td>
                  <Td>{s.academicYear}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card
          title="Pending leave requests"
          actions={
            <Link to="/faculty/leaves" className="text-sm font-medium text-brand-600 hover:underline">
              Review all
            </Link>
          }
          className="lg:col-span-2"
        >
          {pending.loading ? <Spinner /> : pending.error ? (
            <Alert>{pending.error}</Alert>
          ) : (pending.data ?? []).length === 0 ? (
            <EmptyState title="Nothing awaiting your review" />
          ) : (
            <Table head={['Student', 'From', 'To', 'Reason', 'Status']}>
              {pending.data!.slice(0, 6).map((leave) => (
                <tr key={leave.id}>
                  <Td>
                    <span className="font-medium text-slate-900">{leave.studentName}</span>
                    <span className="block text-xs text-slate-400">{leave.enrollmentNumber}</span>
                  </Td>
                  <Td className="whitespace-nowrap">{date(leave.fromDate)}</Td>
                  <Td className="whitespace-nowrap">{date(leave.toDate)}</Td>
                  <Td className="max-w-sm">
                    <span className="block truncate" title={leave.reason}>{leave.reason}</span>
                  </Td>
                  <Td><Badge tone="amber">{titleCase(leave.status)}</Badge></Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>

      {profile.data && (
        <Card className="mt-6" title="My profile">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Employee ID', profile.data.employeeId],
              ['Email', profile.data.email],
              ['Mobile', profile.data.mobileNumber],
              ['Department', profile.data.departmentName],
              ['Designation', profile.data.designation],
              ['Qualification', profile.data.qualification || '—'],
              ['Joined', date(profile.data.joiningDate)],
              ['Status', profile.data.active ? 'Active' : 'Inactive'],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {label}
                </dt>
                <dd className="mt-1 text-sm text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}
    </>
  );
}
